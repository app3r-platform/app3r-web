/**
 * resell-funding.ts — D2 Resell Slice · Wave 2 (Advisor ruling 1A · R4)
 *
 * Funding window (1A): seller เลือก offer → listing=offer_selected + offer.funding_deadline = now+24h.
 *   เงินยังไม่ล็อก (lock@buyer_confirmed). buyer ต้องยืนยัน+เติม Gold ภายใน 24h.
 *
 * R4 timeout: buyer ไม่ยืนยันใน 24h → auto-revert:
 *   - listing offer_selected → receiving_offers (เปิดรับ offer ใหม่ · ไม่มีเงินล็อก = ไม่ refund escrow)
 *   - offer selected → rejected (faultParty=buyer → offer_fee FORFEIT · ไม่คืน · ruling 5)
 *
 * เรียกโดย cron/ops job (ยังไม่ผูก endpoint ใน W2 · ส่ง now เข้ามาเพื่อ test ได้).
 */
import { and, eq, lt, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { offers, listingMeta, resellFulfillment, escrowHolds, resellDisputes } from '../db/schema'
import { transitionListingState } from './listing-state'

// W3c (R7): inspection window 72h (ค่าคงที่ · ตรง deliver endpoint) · W3c (no-ship): SLA 7d นับจาก lock@buyer_confirmed
const NO_SHIP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

/** auto-revert funding window ที่หมดอายุ (R4) — คืน list ของ offerId ที่ถูก revert */
export async function revertExpiredFundingWindows(now: Date): Promise<{ reverted: string[] }> {
  const rows = await db
    .select({ offerId: offers.id, listingId: offers.listingMetaId })
    .from(offers)
    .innerJoin(listingMeta, eq(listingMeta.listingId, offers.listingMetaId))
    .where(
      and(
        eq(offers.status, 'selected'),
        lt(offers.fundingDeadline, now),
        eq(listingMeta.state, 'offer_selected'),
      ),
    )

  const reverted: string[] = []
  for (const r of rows) {
    try {
      // Point finding: atomic — transition + offer→rejected ใน txn เดียว (กัน crash ระหว่าง = forfeit-reversal inconsistency)
      // ไม่มีเงินล็อก (lock@buyer_confirmed) → ไม่ refund escrow · faultParty=buyer → offer_fee forfeit
      await db.transaction(async (tx) => {
        await transitionListingState(
          { listingId: r.listingId, to: 'receiving_offers', actorUserId: 'system', actorRole: 'system', faultParty: 'buyer' },
          tx,
        )
        await tx.update(offers).set({ status: 'rejected', updatedAt: new Date() }).where(eq(offers.id, r.offerId))
      })
      reverted.push(r.offerId)
    } catch (err) {
      // per-row isolation: 1 row ล้ม ไม่ล้มทั้ง batch
      console.error(`[ResellTimeout] R4 revert failed for offer ${r.offerId}:`, err)
    }
  }
  return { reverted }
}

/**
 * R7 auto-complete (W3c · cron · server-time) — inspection_period ที่ inspectionDeadline (72h) หมด
 *   → auto-complete → releaseEscrow (buyer ไม่ตรวจ/ไม่ dispute = ยอมรับ) · faultParty=none · actor=system.
 *   idempotent: หลัง completed (terminal) ไม่ match inspection_period → ไม่ re-fire · releaseEscrow no-op ถ้า hold released.
 */
export async function autoCompleteExpiredInspections(now: Date): Promise<{ completed: string[] }> {
  const rows = await db
    .select({ listingId: resellFulfillment.listingId })
    .from(resellFulfillment)
    .innerJoin(listingMeta, eq(listingMeta.listingId, resellFulfillment.listingId))
    .where(and(eq(listingMeta.state, 'inspection_period'), lt(resellFulfillment.inspectionDeadline, now)))
  const completed: string[] = []
  for (const r of rows) {
    try {
      // transitionListingState atomic (own txn) → completed → releaseEscrow · per-row isolation
      await transitionListingState({
        listingId: r.listingId,
        to: 'completed',
        actorUserId: 'system',
        actorRole: 'system',
        faultParty: 'none',
      })
      completed.push(r.listingId)
    } catch (err) {
      console.error(`[ResellTimeout] R7 auto-complete failed for ${r.listingId}:`, err)
    }
  }
  return { completed }
}

/**
 * No-ship SLA auto-dispute (W3c · cron · server-time · flag b) — buyer_confirmed ที่ seller ยังไม่ ship
 *   เกิน 7d (นับจาก escrow lock@buyer_confirmed = escrow_holds.createdAt) → auto-raise dispute(not_shipped)
 *   → disputed (faultParty=seller disposition · admin-resolve buyer-win = refund + offer_fee). raisedBy = selected buyer.
 *   idempotent: skip ถ้ามี dispute เปิดแล้ว · หลัง disputed (≠buyer_confirmed) ไม่ re-fire.
 */
export async function autoDisputeNoShip(now: Date): Promise<{ disputed: string[] }> {
  const cutoff = new Date(now.getTime() - NO_SHIP_WINDOW_MS)
  const rows = await db
    .select({ listingId: listingMeta.listingId })
    .from(listingMeta)
    .innerJoin(
      escrowHolds,
      and(eq(escrowHolds.transactionRef, listingMeta.listingId), eq(escrowHolds.state, 'locked')),
    )
    .where(and(eq(listingMeta.state, 'buyer_confirmed'), lt(escrowHolds.createdAt, cutoff)))
  const disputed: string[] = []
  for (const r of rows) {
    try {
      const [sel] = await db
        .select({ buyerId: offers.buyerId })
        .from(offers)
        .where(and(eq(offers.listingMetaId, r.listingId), eq(offers.status, 'selected')))
        .limit(1)
      if (!sel) continue
      const [open] = await db
        .select({ id: resellDisputes.id })
        .from(resellDisputes)
        .where(and(eq(resellDisputes.listingId, r.listingId), inArray(resellDisputes.status, ['open', 'under_review'])))
        .limit(1)
      if (open) continue
      await db.transaction(async (tx) => {
        await tx.insert(resellDisputes).values({
          listingId: r.listingId,
          raisedByUserId: sel.buyerId,
          disputeType: 'not_shipped',
          reason: 'auto: seller no-ship SLA exceeded',
          status: 'open',
        })
        await transitionListingState(
          { listingId: r.listingId, to: 'disputed', actorUserId: 'system', actorRole: 'system', faultParty: 'seller' },
          tx,
        )
      })
      disputed.push(r.listingId)
    } catch (err) {
      console.error(`[ResellTimeout] no-ship auto-dispute failed for ${r.listingId}:`, err)
    }
  }
  return { disputed }
}
