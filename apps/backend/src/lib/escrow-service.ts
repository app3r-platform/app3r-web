/**
 * escrow-service.ts — D2 Resell Slice · Wave 2 (Advisor ruling G2 / 1A / G5)
 *
 * escrow_holds = SINGLE SOURCE ของ Gold ที่ถูกล็อก (R1c full-lock · D83 supersede D004 two-phase).
 *   lock@buyer_confirmed → escrow_holds(locked)  + debit payer      (reference='escrow:{holdId}')
 *   release@completed    → escrow_holds(released) + credit recipient NET (total − platform_fee)
 *   refund@cancelled     → escrow_holds(refunded) + credit payer     (full total)
 *   platform_fee@release = D75 round(total × pct) · pct จาก feeConfigSnapshot@lock
 *                          (G5 wire path · A1 LOCKED จน Resell-real → config ว่าง → pct=0)
 *
 * Conservation: payer debit total @lock → recipient credit (total−fee) + platform fee = total @release.
 * ⚠️ platform revenue account = OPEN decision (derive §6 G · ยังไม่ถูกนิยาม).
 *    ตอนนี้ pct=0 → fee=0 → recipient ได้ total เต็ม → conservation ครบ.
 *    ★ ก่อน A1 unlock (pct>0): ต้องนิยาม revenue account + credit ส่วน fee ไม่งั้น fee จะหายจาก ledger.
 */
import { and, eq } from 'drizzle-orm'
import { escrowHolds, pointLedger, pointRoundingLog, adminConfig } from '../db/schema'
import { debitGold, creditGold, roundD75, type Tx } from './point-service'

const PLATFORM_FEE_KEY = 'platform_fee_percent'

/** อ่าน platform fee % จาก admin_config — default 0 (A1 LOCKED จน Resell-real · G5 wire path) */
export async function getPlatformFeePercent(tx: Tx): Promise<number> {
  const [cfg] = await tx.select().from(adminConfig).where(eq(adminConfig.key, PLATFORM_FEE_KEY)).limit(1)
  const v = cfg?.value as unknown
  if (typeof v === 'number' && v >= 0) return v
  if (v && typeof v === 'object' && typeof (v as { percent?: unknown }).percent === 'number') {
    const p = (v as { percent: number }).percent
    return p >= 0 ? p : 0
  }
  return 0
}

interface LockArgs {
  transactionRef: string // listing_meta.listing_id (resell)
  payerUserId: string // buyer
  recipientUserId: string // seller/owner
  totalAmount: number // integer (D75 ปัดมาก่อน)
  feePercentSnapshot: number // snapshot @matched (G2)
}

/** lock@buyer_confirmed: create escrow_holds(locked) + debit payer (reference='escrow:{holdId}') */
export async function lockEscrow(tx: Tx, args: LockArgs): Promise<string> {
  const [hold] = await tx
    .insert(escrowHolds)
    .values({
      transactionRef: args.transactionRef,
      payerUserId: args.payerUserId,
      recipientUserId: args.recipientUserId,
      pointType: 'cash',
      totalAmount: args.totalAmount,
      state: 'locked',
      platformFeeAmount: 0,
      feeConfigSnapshot: { platform_fee_percent: args.feePercentSnapshot },
    })
    .returning({ id: escrowHolds.id })
  const holdId = hold!.id
  await debitGold(tx, {
    userId: args.payerUserId,
    amount: args.totalAmount,
    reference: `escrow:${holdId}`,
    idempotencyKey: `escrow-lock:${holdId}`,
    type: 'spend',
    metadata: { escrow: true, phase: 'lock', transactionRef: args.transactionRef },
  })
  return holdId
}

/** หา locked hold (1 active ต่อ transaction) · FOR UPDATE */
async function findLockedHold(tx: Tx, transactionRef: string) {
  const [hold] = await tx
    .select()
    .from(escrowHolds)
    .where(and(eq(escrowHolds.transactionRef, transactionRef), eq(escrowHolds.state, 'locked')))
    .for('update')
  return hold ?? null
}

/**
 * release@completed: escrow_holds(released) + credit recipient NET (total − fee · D75).
 * pct จาก feeConfigSnapshot@lock. คืน null ถ้าไม่มี locked hold (no-op).
 */
export async function releaseEscrow(
  tx: Tx,
  transactionRef: string,
): Promise<{ holdId: string; net: number; fee: number } | null> {
  const hold = await findLockedHold(tx, transactionRef)
  if (!hold) return null
  const snap = (hold.feeConfigSnapshot ?? {}) as { platform_fee_percent?: number }
  const pct = typeof snap.platform_fee_percent === 'number' ? snap.platform_fee_percent : 0
  const rawFee = hold.totalAmount * (pct / 100)
  const fee = roundD75(rawFee) // D75
  const net = hold.totalAmount - fee
  await tx
    .update(escrowHolds)
    .set({ state: 'released', platformFeeAmount: fee, updatedAt: new Date() })
    .where(eq(escrowHolds.id, hold.id))
  await creditGold(tx, {
    userId: hold.recipientUserId,
    amount: net,
    reference: `escrow:${hold.id}`,
    idempotencyKey: `escrow-release:${hold.id}`,
    type: 'earn',
    metadata: { escrow: true, phase: 'release', fee, pct },
  })
  // D75 audit (point_rounding_log) — เฉพาะเมื่อมีการคำนวณ fee จริง (A1 locked → pct=0 → skip)
  if (rawFee !== 0) {
    const [led] = await tx
      .select({ id: pointLedger.id })
      .from(pointLedger)
      .where(eq(pointLedger.idempotencyKey, `escrow-release:${hold.id}`))
      .limit(1)
    if (led) {
      await tx.insert(pointRoundingLog).values({
        originalValue: String(rawFee),
        roundedValue: fee,
        delta: String(fee - rawFee),
        direction: fee >= rawFee ? 'up' : 'down',
        ledgerId: led.id,
        feeType: 'platform_fee',
        app: 'weeer',
        formula: `Math.round(${hold.totalAmount} * ${pct} / 100)`,
      })
    }
  }
  return { holdId: hold.id, net, fee }
}

/** refund@cancelled: escrow_holds(refunded) + credit payer (full total). null ถ้าไม่มี locked hold. */
export async function refundEscrow(
  tx: Tx,
  transactionRef: string,
): Promise<{ holdId: string; amount: number } | null> {
  const hold = await findLockedHold(tx, transactionRef)
  if (!hold) return null
  await tx
    .update(escrowHolds)
    .set({ state: 'refunded', updatedAt: new Date() })
    .where(eq(escrowHolds.id, hold.id))
  await creditGold(tx, {
    userId: hold.payerUserId,
    amount: hold.totalAmount,
    reference: `escrow:${hold.id}`,
    idempotencyKey: `escrow-refund:${hold.id}`,
    type: 'refund',
    metadata: { escrow: true, phase: 'refund' },
  })
  return { holdId: hold.id, amount: hold.totalAmount }
}

/**
 * offer_fee refund (ruling 5 · faultParty≠buyer) — คืน fee เดิมจาก ledger.
 * no-op ถ้า fee=0 หรือไม่พบ (A1 locked → offer_fee config=0). idempotent ด้วย unique key.
 */
export async function refundOfferFee(tx: Tx, offerId: string, buyerId: string): Promise<number> {
  const [orig] = await tx
    .select({ amount: pointLedger.amount })
    .from(pointLedger)
    .where(and(eq(pointLedger.idempotencyKey, `offer_fee:offer:${offerId}`), eq(pointLedger.direction, 'debit')))
    .limit(1)
  const amount = orig?.amount ?? 0
  if (amount <= 0) return 0
  await creditGold(tx, {
    userId: buyerId,
    amount,
    reference: `offer:${offerId}`,
    idempotencyKey: `offer_fee-refund:offer:${offerId}`,
    type: 'refund',
    metadata: { fee: 'offer_fee', phase: 'refund' },
  })
  return amount
}
