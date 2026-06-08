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

/** อำเภอ stub pool (MOCKUP-only) — ใช้ derive อำเภอแบบ deterministic จาก id.
 *  RC-E fix: ใช้เขตกรุงเทพ (multi-province listings ส่วนใหญ่อยู่ในกรุงเทพ)
 *  เดิม: Ubon Ratchathani districts (วารินชำราบ/พิบูลมังสาหาร/...) → ไม่ตรงกับ province */
const MOCK_DISTRICTS = [
  'ลาดพร้าว',
  'บางรัก',
  'วัฒนา',
  'มีนบุรี',
  'สาทร',
  'บางเขน',
  'บึงกุ่ม',
  'ห้วยขวาง',
] as const;

/**
 * Deterministic mock อำเภอ (district) สำหรับการ์ด — MOCKUP-only.
 * เลือกจาก pool คงที่ตาม id เพื่อให้แต่ละประกาศแสดงอำเภอเดิมเสมอ.
 * @param id listing/job id
 */
export function getMockDistrict(id: string): string {
  return MOCK_DISTRICTS[seedFromId(id) % MOCK_DISTRICTS.length];
}

/** ตำบล/แขวง stub pool (MOCKUP-only) — Advisor: การ์ดต้องลงลึกระดับตำบล ไม่ใช่อำเภอ.
 *  RC-E fix: ใช้แขวงกรุงเทพ — เดิม: Ubon Ratchathani tambons (แสนสุข/ขามใหญ่/...) */
const MOCK_TAMBONS = [
  'ลาดพร้าว',
  'บางรัก',
  'คลองเตย',
  'ห้วยขวาง',
  'บางกอกน้อย',
  'บึงกุ่ม',
  'จตุจักร',
  'มีนบุรี',
] as const;

/**
 * Deterministic mock ตำบล/แขวง (sub-district) สำหรับการ์ด — MOCKUP-only.
 * ใช้ seed ต่าง (id + '#t') กัน collide กับ getMockDistrict เพื่อให้ตำบล/อำเภอไม่ซ้ำ pattern.
 * @param id listing/job id
 */
export function getMockTambon(id: string): string {
  return MOCK_TAMBONS[seedFromId(id + '#t') % MOCK_TAMBONS.length];
}
