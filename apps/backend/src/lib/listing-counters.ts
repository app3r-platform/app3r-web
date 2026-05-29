/**
 * listing-counters.ts — W-Round-1 Wave 1.2 [4] / GR-8: view & offer count + visibility
 *
 * GR-8:
 *   - view: unique ต่อ (listing, user|ip, วัน) → insert listing_views (dedupe ผ่าน partial
 *     unique idx) → ถ้า insert สำเร็จ (แถวใหม่) ค่อย increment view_count
 *   - offer: offer_count raw (increment ตรง)
 *   - matched แล้ว → ซ่อนจำนวน (view/offer) จากคนนอก (เห็นเฉพาะเจ้าของ/ผู้เกี่ยวข้อง)
 */
import { and, eq, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { listingMeta, listingViews } from '../db/schema'
import type { ListingMeta } from '../db/schema'

export interface ViewerIdentity {
  userId?: string | null
  ip?: string | null
}

/**
 * บันทึก view (dedupe ราย user/ip ต่อวัน) → increment view_count เฉพาะเมื่อเป็น view ใหม่
 * คืน true ถ้านับเพิ่ม (view ใหม่ของวันนั้น), false ถ้าซ้ำ
 */
export async function recordView(listingId: string, viewer: ViewerIdentity): Promise<boolean> {
  if (!viewer.userId && !viewer.ip) return false
  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(listingViews)
      .values({
        listingId,
        viewerUserId: viewer.userId ?? null,
        viewerIp: viewer.userId ? null : (viewer.ip ?? null),
      })
      .onConflictDoNothing()
      .returning({ id: listingViews.id })

    if (inserted.length === 0) return false // ซ้ำ (dedupe) — ไม่ increment

    await tx
      .update(listingMeta)
      .set({ viewCount: sql`${listingMeta.viewCount} + 1`, updatedAt: new Date() })
      .where(eq(listingMeta.listingId, listingId))
    return true
  })
}

/** increment offer_count (raw) + auto draft→published→has_offer ไม่ทำที่นี่ (แยก state machine) */
export async function incrementOfferCount(listingId: string): Promise<number> {
  const [row] = await db
    .update(listingMeta)
    .set({ offerCount: sql`${listingMeta.offerCount} + 1`, updatedAt: new Date() })
    .where(eq(listingMeta.listingId, listingId))
    .returning({ offerCount: listingMeta.offerCount })
  return row?.offerCount ?? 0
}

export interface PublicCounters {
  viewCount: number
  /** null = ซ่อน (matched + ผู้ชมเป็นคนนอก) */
  offerCount: number | null
}

/**
 * GR-8 visibility: matched แล้ว → ซ่อน offer_count จากคนนอก
 * @param isInsider เจ้าของ listing / admin / ผู้เกี่ยวข้อง (เห็นจำนวนเสมอ)
 */
// D59: เมื่อเลือก offer แล้ว (offer_selected เป็นต้นไป) ซ่อน offer_count จากคนนอก (GR-8)
const OFFER_HIDDEN_STATES: ReadonlySet<string> = new Set([
  'offer_selected',
  'buyer_confirmed',
  'in_progress',
  'delivered',
  'inspection_period',
])

export function publicCounters(listing: Pick<ListingMeta, 'state' | 'viewCount' | 'offerCount'>, isInsider: boolean): PublicCounters {
  const hideOffer = OFFER_HIDDEN_STATES.has(listing.state) && !isInsider
  return {
    viewCount: listing.viewCount,
    offerCount: hideOffer ? null : listing.offerCount,
  }
}

/** helper: ผู้ชมเป็น insider ไหม (เจ้าของ หรือ admin) */
export function isListingInsider(
  listing: Pick<ListingMeta, 'ownerId'>,
  viewer: { userId?: string | null; role?: string | null },
): boolean {
  if (!viewer.userId) return false
  if (viewer.role === 'admin' || viewer.role === 'super_admin') return true
  return listing.ownerId === viewer.userId
}
