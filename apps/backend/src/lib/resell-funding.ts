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
import { and, eq, lt } from 'drizzle-orm'
import { db } from '../db/client'
import { offers, listingMeta } from '../db/schema'
import { transitionListingState } from './listing-state'

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
    // ไม่มีเงินล็อก (lock@buyer_confirmed) → ไม่ refund escrow · faultParty=buyer → offer_fee forfeit
    await transitionListingState({
      listingId: r.listingId,
      to: 'receiving_offers',
      actorUserId: 'system',
      actorRole: 'system',
      faultParty: 'buyer',
    })
    await db.update(offers).set({ status: 'rejected', updatedAt: new Date() }).where(eq(offers.id, r.offerId))
    reverted.push(r.offerId)
  }
  return { reverted }
}
