/**
 * listing-state.ts — W-Round-1 Wave 1.2 [3]: D83 state machine + point lock (Escrow)
 *
 * D83 listing state (listing_meta.state):
 *   draft → published → has_offer → matched → completed
 *                                      └→ (ก่อน completed) cancelled
 *
 * Point lock (Escrow — D2 W2 · ruling 1A/G2 · escrow_holds single source):
 *   - offer_selected  : matched (funding window 24h) — ❌ ยังไม่ล็อกเงิน (route set offer.funding_deadline)
 *   - buyer_confirmed : LOCK เต็มจำนวน (lockEscrow → escrow_holds + debit buyer · reference='escrow:{holdId}')
 *   - completed       : RELEASE (releaseEscrow → credit recipient NET = total − platform_fee · D75)
 *   - cancelled       : REFUND คืนผู้ซื้อ (refundEscrow) เฉพาะ state ที่ล็อกเงินแล้ว (buyer_confirmed+)
 *   - receiving_offers: R4 auto-revert (funding window หมดอายุ · ไม่มีเงินล็อก)
 *
 * กฎ: ห้ามเปลี่ยน state ตรง — ผ่าน transitionListingState() เสมอ + audit ทุกครั้ง (2A: actorRole/faultParty/badRecord)
 */
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { listingMeta, adminConfigAudit, LISTING_STATES } from '../db/schema'
import type { ListingState } from '../db/schema'
import { type Tx } from './point-service'
import { lockEscrow, releaseEscrow, refundEscrow, getPlatformFeePercent } from './escrow-service'

// allowed transitions — D59 canonical (Ruling 1B) · single source of truth
const TRANSITIONS: Record<ListingState, ListingState[]> = {
  draft: ['announced', 'cancelled'],
  announced: ['receiving_offers', 'cancelled'],
  receiving_offers: ['offer_selected', 'cancelled'],
  offer_selected: ['buyer_confirmed', 'receiving_offers', 'cancelled', 'disputed'], // receiving_offers = R4 funding-window timeout
  buyer_confirmed: ['in_progress', 'cancelled', 'disputed'],
  in_progress: ['delivered', 'disputed', 'cancelled'],
  delivered: ['inspection_period', 'disputed'],
  inspection_period: ['completed', 'disputed'],
  completed: [], // terminal
  cancelled: [], // terminal
  disputed: ['completed', 'cancelled'], // admin resolves
}

// D2 W2 (1A): states ที่เงินถูกล็อกแล้ว → cancel = refund ผู้ซื้อ. เงินล็อก@buyer_confirmed (ไม่ใช่ offer_selected)
const ESCROW_LOCKED: ReadonlySet<ListingState> = new Set([
  'buyer_confirmed',
  'in_progress',
  'delivered',
  'inspection_period',
])

export function canTransition(from: ListingState, to: ListingState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * S1 (W2.1 · B1): transition นี้มี escrow side-effect (เคลื่อนเงิน) หรือไม่
 *   buyer_confirmed = lock · completed = release · cancelled-จาก-locked = refund
 * generic transition route ต้อง BLOCK อันที่ true → บังคับผ่าน guarded endpoint
 * (confirm-funding / receipt / cancel) ที่ derive payer/amount จาก selected offer (กัน Gold theft).
 */
export function isEscrowMutatingTransition(from: ListingState, to: ListingState): boolean {
  if (to === 'buyer_confirmed') return true // lock
  if (to === 'completed') return true // release
  if (to === 'cancelled' && ESCROW_LOCKED.has(from)) return true // refund
  return false
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
  /** ผู้ซื้อ (payer) — จำเป็นเมื่อ to=buyer_confirmed (ผู้ถูก lock escrow) */
  buyerUserId?: string
  /** จำนวน Gold ที่ lock (เต็มมูลค่า) — จำเป็นเมื่อ to=buyer_confirmed */
  pointAmount?: number
  /** 2A: บทบาทผู้กระทำ (seller|buyer|admin|system) — บันทึก audit */
  actorRole?: string
  /** 2A: ฝ่ายผิดเมื่อ cancel/revert (seller|buyer|mutual|none) — บันทึก audit + bad_record */
  faultParty?: 'seller' | 'buyer' | 'mutual' | 'none'
}

/**
 * เปลี่ยน state ของ listing แบบ atomic + escrow side-effect + audit (D2 W2)
 * - ตรวจ transition ถูกต้อง (ไม่งั้น throw StateTransitionError)
 * - buyer_confirmed → lockEscrow (escrow_holds + debit buyer)
 * - completed       → releaseEscrow (credit recipient net − fee · D75)
 * - cancelled       → refundEscrow (ถ้า from ∈ locked states)
 */
export async function transitionListingState(args: TransitionArgs, externalTx?: Tx) {
  const run = async (tx: Tx) => {
    const [listing] = await tx
      .select()
      .from(listingMeta)
      .where(eq(listingMeta.listingId, args.listingId))
      .for('update')
    if (!listing) throw new Error('LISTING_NOT_FOUND')

    const from = listing.state as ListingState
    if (!canTransition(from, args.to)) throw new StateTransitionError(from, args.to)

    // ── escrow side-effects (D2 W2 · ruling 1A/G2 · escrow_holds single source · D75) ──
    // buyer_confirmed → LOCK เต็มจำนวน · completed → RELEASE (−fee) · cancel จาก locked state → REFUND
    if (args.to === 'buyer_confirmed') {
      if (!args.buyerUserId || args.pointAmount == null) {
        throw new Error('BUYER_CONFIRMED_REQUIRES_BUYER_AND_AMOUNT')
      }
      const feePercent = await getPlatformFeePercent(tx)
      await lockEscrow(tx, {
        transactionRef: args.listingId,
        payerUserId: args.buyerUserId,
        recipientUserId: listing.ownerId,
        totalAmount: Math.round(args.pointAmount),
        feePercentSnapshot: feePercent,
      })
    } else if (args.to === 'completed') {
      // release escrow → recipient NET (total − platform_fee · D75) · fee จาก snapshot@lock
      await releaseEscrow(tx, args.listingId)
    } else if (args.to === 'cancelled' && ESCROW_LOCKED.has(from)) {
      // refund คืน payer เต็มจำนวน (เฉพาะ state ที่ล็อกเงินไว้แล้ว)
      await refundEscrow(tx, args.listingId)
    }

    // ── apply state ──────────────────────────────────────────────────────────────
    const [updated] = await tx
      .update(listingMeta)
      .set({ state: args.to, updatedAt: new Date() })
      .where(eq(listingMeta.listingId, args.listingId))
      .returning()

    // ── audit (reuse admin_config_audit · 2A: actorRole/faultParty/badRecord ใน metadata) ────
    // bad_record = cancel จาก from-state ≥ receiving_offers (มีคู่สัญญาแล้ว · ruling 2A)
    const badRecord =
      args.to === 'cancelled' &&
      LISTING_STATES.indexOf(from) >= LISTING_STATES.indexOf('receiving_offers')
    await tx.insert(adminConfigAudit).values({
      configKey: `listing_state:${args.listingId}`,
      oldValue: { state: from },
      newValue: {
        state: args.to,
        ...(args.actorRole ? { actorRole: args.actorRole } : {}),
        ...(args.faultParty ? { faultParty: args.faultParty } : {}),
        ...(args.to === 'cancelled' ? { badRecord } : {}),
      },
      changedBy: args.actorUserId,
    })

    return updated
  }
  // S2 (W2.1): รองรับ compose ใน txn ภายนอก (atomic กับ select-offer) — ไม่ส่ง externalTx = เปิด txn เอง
  return externalTx ? run(externalTx) : db.transaction(run)
}
