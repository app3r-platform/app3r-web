// ── lib/mock-data/weeer-profile.ts — WeeeR Shop Profile Mock ──────────────────
// Sub-1 D5: ประเภทบริการที่ WeeeR ลงทะเบียนรับ (สำหรับ default filter)
// TODO: ดึงจาก real Backend profile endpoint เมื่อพร้อม

import type { ServiceTypeId } from '../types/listings-jobs';

export interface WeeeRProfile {
  shopId: string;
  shopName: string;
  email: string;
  /** ประเภทบริการที่ร้านลงทะเบียนรับ — ใช้กรอง listings default */
  registeredServiceTypes: ServiceTypeId[];
}

/**
 * Mock WeeeR session profile
 * TODO: connect real Backend endpoint when auth/profile API ready
 */
export const MOCK_WEEER_PROFILE: WeeeRProfile = {
  shopId: 'shop-weeer-001',
  shopName: 'บริษัท ช่างเย็น จำกัด',
  email: 'company@example.com',
  registeredServiceTypes: [1, 2], // on-site + รับ-ส่ง
};

/** ตรวจ mock session — WeeeR เข้าสู่ระบบอยู่เสมอใน dev
 * TODO: replace with real session check (Protocol ข้อ 5 — server-side) */
export function getMockWeeeRSession(): WeeeRProfile | null {
  // TODO: connect real Backend endpoint when sensitive fields added to DB schema
  // ใน production จะตรวจ JWT / session cookie บน server
  return MOCK_WEEER_PROFILE;
}
