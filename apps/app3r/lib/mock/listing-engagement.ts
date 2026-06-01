// ============================================================
// lib/mock/listing-engagement.ts — MOCKUP-only engagement metrics
// Deterministic counters (view/offer/remaining-days) derived from a
// listing id so each detail page shows stable numbers without a real DB.
// NOT a shared-schema type — local mock view-model only.
// ============================================================

/** Engagement counters shown on detail pages (mock). */
export interface ListingEngagement {
  /** ยอดเข้าชม (view count) */
  viewCount: number;
  /** จำนวนข้อเสนอที่ยื่นเข้ามา (offer count) */
  offerCount: number;
  /** วันที่เหลือก่อนปิดประกาศ (remaining days) */
  remainingDays: number;
}

/** Simple deterministic hash from an id string. */
function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Deterministic mock engagement counters for a listing/job id.
 * @param id listing or job id (เช่น 'r001', 'rs-12')
 * @param baseViews optional ค่าฐาน viewCount จริงจาก mock (ถ้ามี) — ใช้แทน derived
 */
export function getMockEngagement(id: string, baseViews?: number): ListingEngagement {
  const seed = seedFromId(id);
  const viewCount = baseViews ?? 40 + (seed % 460); // 40..499
  const offerCount = seed % 7; // 0..6 — 0 = ยังไม่มีข้อเสนอ
  const remainingDays = 1 + (seed % 14); // 1..14 วัน
  return { viewCount, offerCount, remainingDays };
}
