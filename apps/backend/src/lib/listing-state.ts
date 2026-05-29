/**
 * listing-state.ts — W-Round-1 Wave 1.2 [3]: D83 state machine + point lock (Escrow)
 *
 * D83 listing state (listing_meta.state):
 *   draft → published → has_offer → matched → completed
 *                                      └→ (ก่อน completed) cancelled
 *
 * Point lock (Escrow — point-economy.md):
 *   - matched   : hold Gold Point เต็มจำนวน (debit ผู้ซื้อ → escrow)
 *   - completed : release ให้เจ้าของ/ผู้ขาย (credit)
 *   - cancelled : refund คืนผู้ซื้อ (credit กลับ)
 *
 * กฎ: ห้ามเปลี่ยน state ตรง — ผ่าน transitionListingState() เสมอ + audit ทุกครั้ง
 */
import { eq, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { listingMeta, adminConfigAudit } from '../db/schema'
import type { ListingState } from '../db/schema'
import { debitGold, creditGold, type Tx } from './point-service'

// allowed transitions (forward + cancel) — single source of truth
const TRANSITIONS: Record<ListingState, ListingState[]> = {
  draft: ['published', 'cancelled'],
  published: ['has_offer', 'cancelled'],
  has_offer: ['matched', 'cancelled'],
  matched: ['completed', 'cancelled'],
  completed: [], // terminal
  cancelled: [], // terminal
}

export function canTransition(from: ListingState, to: ListingState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

export class StateTransitionError extends Error {
  constructor(public from: ListingState, public to: ListingState) {
    super(`INVALID_TRANSITION: ${from} → ${to}`)
    this.name = 'StateTransitionError'
  }
}

export interface TransitionArgs {
  listingId: string
  to: ListingState
  actorUserId: string
  /** ผู้ซื้อ/ผู้ชนะ offer — จำเป็นเมื่อ to=matched (ผู้ถูก hold point) */
  buyerUserId?: string
  /** จำนวน Gold Point ที่ lock (เต็มมูลค่างาน) — จำเป็นเมื่อ to=matched */
  pointAmount?: number
}

/**
 * เปลี่ยน state ของ listing แบบ atomic + point lock + audit
 * - ตรวจ transition ถูกต้อง (ไม่งั้น throw StateTransitionError)
 * - matched   → debitGold(buyer) hold
 * - completed → creditGold(owner) release
 * - cancelled → ถ้า prev=matched → refund buyer
 */
export async function transitionListingState(args: TransitionArgs) {
  return db.transaction(async (tx: Tx) => {
    const [listing] = await tx
      .select()
      .from(listingMeta)
      .where(eq(listingMeta.listingId, args.listingId))
      .for('update')
    if (!listing) throw new Error('LISTING_NOT_FOUND')

    const from = listing.state as ListingState
    if (!canTransition(from, args.to)) throw new StateTransitionError(from, args.to)

    // ── point lock side-effects ────────────────────────────────────────────────
    if (args.to === 'matched') {
      if (!args.buyerUserId || args.pointAmount == null) {
        throw new Error('MATCHED_REQUIRES_BUYER_AND_AMOUNT')
      }
      await debitGold(tx, {
        userId: args.buyerUserId,
        amount: Math.round(args.pointAmount),
        reference: `listing:${args.listingId}`,
        idempotencyKey: `escrow-hold:${args.listingId}`,
        type: 'spend',
        metadata: { escrow: true, phase: 'hold' },
      })
    } else if (args.to === 'completed') {
      // release escrow → owner (ผู้รับงาน/ผู้ขาย)
      if (args.pointAmount != null) {
        await creditGold(tx, {
          userId: listing.ownerId,
          amount: Math.round(args.pointAmount),
          reference: `listing:${args.listingId}`,
          idempotencyKey: `escrow-release:${args.listingId}`,
          type: 'earn',
          metadata: { escrow: true, phase: 'release' },
        })
      }
    } else if (args.to === 'cancelled' && from === 'matched') {
      // refund คืนผู้ซื้อ
      if (args.buyerUserId && args.pointAmount != null) {
        await creditGold(tx, {
          userId: args.buyerUserId,
          amount: Math.round(args.pointAmount),
          reference: `listing:${args.listingId}`,
          idempotencyKey: `escrow-refund:${args.listingId}`,
          type: 'refund',
          metadata: { escrow: true, phase: 'refund' },
        })
      }
    }

    // ── apply state ──────────────────────────────────────────────────────────────
    const [updated] = await tx
      .update(listingMeta)
      .set({ state: args.to, updatedAt: new Date() })
      .where(eq(listingMeta.listingId, args.listingId))
      .returning()

    // ── audit (reuse admin_config_audit append-only log สำหรับ state change) ────
    await tx.insert(adminConfigAudit).values({
      configKey: `listing_state:${args.listingId}`,
      oldValue: { state: from },
      newValue: { state: args.to },
      changedBy: args.actorUserId,
    })

    return updated
  })
}
