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
 * ✅ B2 (STEP 2/2 · HUB Gen89 · Advisor ruling 38d813ec-7277-8145): platform revenue account =
 *    seeded platform-revenue user 'cash' wallet (pool · STEP 1 migration 0047). fee-leg credited via
 *    getPlatformRevenueUserId (idemKey 'escrow-fee:{holdId}') → CF1 fee-leak CLOSED.
 *    pct=0 (A1 locked) → fee=0 → fee-leg skipped → conservation exact (เดิม) · pct>0 → fee → pool (no leak).
 */
import { and, eq } from 'drizzle-orm'
import { escrowHolds, pointLedger, pointRoundingLog, adminConfig } from '../db/schema'
import { debitGold, creditGold, roundD75, type Tx } from './point-service'
import { getPlatformRevenueUserId } from './platform-account'

const PLATFORM_FEE_KEY = 'platform_fee_percent'

/**
 * อ่าน platform fee % จาก admin_config — default 0 (A1 LOCKED จน Resell-real · G5 wire path)
 * W3b hardening: clamp [0,100] — กัน fee% > 100 (fee > total → net ติดลบ = mint Gold)
 */
export async function getPlatformFeePercent(tx: Tx): Promise<number> {
  const clamp = (n: number) => Math.min(Math.max(n, 0), 100)
  const [cfg] = await tx.select().from(adminConfig).where(eq(adminConfig.key, PLATFORM_FEE_KEY)).limit(1)
  const v = cfg?.value as unknown
  if (typeof v === 'number') return clamp(v)
  if (v && typeof v === 'object' && typeof (v as { percent?: unknown }).percent === 'number') {
    return clamp((v as { percent: number }).percent)
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
  // B2 (STEP 2 · CF1 close): credit fee-leg → platform revenue pool.
  //   fee>0 only (pct=0 → fee=0 → skip → conservation เดิม exact · ไม่เรียก resolver ตอน A1)
  //   idemKey 'escrow-fee:{holdId}' distinct จาก 'escrow-release' → release retry ไม่ double-credit fee
  if (fee > 0) {
    await creditGold(tx, {
      userId: await getPlatformRevenueUserId(tx),
      amount: fee,
      reference: `escrow:${hold.id}`,
      idempotencyKey: `escrow-fee:${hold.id}`,
      type: 'earn',
      metadata: { escrow: true, phase: 'fee', pct },
    })
  }
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
 * splitEscrow (W3b · F2 · dispute resolution 'split') — แบ่งเงิน escrow buyer/seller.
 *   no schema (reuse escrow_holds state='released' terminal + point_ledger 2 credit).
 *   conservation: buyerRefund + sellerCredit + fee = total (D75 · mirror releaseEscrow).
 *   fee = seller-bound (Q1) จาก sellerShare เท่านั้น · A1 pct=0 → fee=0.
 *   GUARDS: (a) null-guard (re-fire safe) · (b) skip leg ≤0 (creditGold ไม่ guard 0/negative)
 *           (c) sellerShare integer + 0≤share≤total (remainder→buyer · conservation)
 *           (d) B2: platformFeeAmount set + fee leg → platform wallet (pre-A1/CF1 pct=0→fee=0 · wire-ready)
 */
export async function splitEscrow(
  tx: Tx,
  transactionRef: string,
  sellerShare: number,
): Promise<{ holdId: string; buyerRefund: number; sellerCredit: number; fee: number } | null> {
  const hold = await findLockedHold(tx, transactionRef)
  if (!hold) return null // (a) re-fire safe (state≠locked → null → no-op)
  const total = hold.totalAmount
  const share = Math.round(sellerShare) // (c) integer
  if (share < 0 || share > total) {
    throw new Error(`INVALID_SPLIT_SHARE: ${share} not in [0, ${total}]`)
  }
  // fee = seller-bound (Q1) จาก sellerShare · pct จาก snapshot@lock · A1 pct=0 → fee=0
  const snap = (hold.feeConfigSnapshot ?? {}) as { platform_fee_percent?: number }
  const pct = typeof snap.platform_fee_percent === 'number' ? snap.platform_fee_percent : 0
  const rawFee = share * (pct / 100)
  const fee = roundD75(rawFee) // D75
  const sellerCredit = share - fee
  const buyerRefund = total - share // remainder → buyer · conservation: buyerRefund+sellerCredit+fee = total
  // (d) platformFeeAmount set (B2 wire-ready · fee leg → platform wallet เมื่อ B2 seed · pct=0→fee=0 ตอนนี้)
  await tx
    .update(escrowHolds)
    .set({ state: 'released', platformFeeAmount: fee, updatedAt: new Date() })
    .where(eq(escrowHolds.id, hold.id))
  // (b) skip leg ≤0 — กัน creditGold phantom 0-row / negative
  if (buyerRefund > 0) {
    await creditGold(tx, {
      userId: hold.payerUserId,
      amount: buyerRefund,
      reference: `escrow:${hold.id}`,
      idempotencyKey: `escrow-split-buyer:${hold.id}`,
      type: 'refund',
      metadata: { escrow: true, phase: 'split', side: 'buyer' },
    })
  }
  if (sellerCredit > 0) {
    await creditGold(tx, {
      userId: hold.recipientUserId,
      amount: sellerCredit,
      reference: `escrow:${hold.id}`,
      idempotencyKey: `escrow-split-seller:${hold.id}`,
      type: 'earn',
      metadata: { escrow: true, phase: 'split', side: 'seller', fee, pct },
    })
  }
  // (d) B2 (STEP 2 · CF1 close): credit fee-leg → platform revenue pool (seller-bound fee · Q1).
  //     fee>0 only (pct=0 → fee=0 → skip → conservation exact) · idemKey 'escrow-fee:{holdId}'
  //     distinct จาก 'escrow-split-seller' → split retry ไม่ double-credit fee (mirror releaseEscrow)
  if (fee > 0) {
    await creditGold(tx, {
      userId: await getPlatformRevenueUserId(tx),
      amount: fee,
      reference: `escrow:${hold.id}`,
      idempotencyKey: `escrow-fee:${hold.id}`,
      type: 'earn',
      metadata: { escrow: true, phase: 'fee', pct },
    })
  }
  // D75 audit (เฉพาะมี fee จริง — mirror releaseEscrow)
  if (rawFee !== 0) {
    const [led] = await tx
      .select({ id: pointLedger.id })
      .from(pointLedger)
      .where(eq(pointLedger.idempotencyKey, `escrow-split-seller:${hold.id}`))
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
        formula: `Math.round(${share} * ${pct} / 100)`,
      })
    }
  }
  return { holdId: hold.id, buyerRefund, sellerCredit, fee }
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
  // idempotent re-fire guard (W3a): ถ้าเคย refund แล้ว (credit key มีอยู่) → no-op
  //   กัน double-credit + UNIQUE(idempotency_key,point_type) violation เมื่อยิงซ้ำ
  const [already] = await tx
    .select({ id: pointLedger.id })
    .from(pointLedger)
    .where(
      and(eq(pointLedger.idempotencyKey, `offer_fee-refund:offer:${offerId}`), eq(pointLedger.direction, 'credit')),
    )
    .limit(1)
  if (already) return 0
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
