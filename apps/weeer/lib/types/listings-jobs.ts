// ── lib/types/listings-jobs.ts — WeeeR local type definitions ─────────────────
// Sub-1 D4+D5 (Phase D-4)
// Mirror from apps/app3r/lib/types/listings-customer-jobs.ts
// ห้าม import จาก apps/app3r/ โดยตรง (Lesson #33 — cross-chat/cross-app)
// TODO: unify types ใน shared package เมื่อ monorepo เตรียมพร้อม

export type ServiceTypeId = 1 | 2 | 3 | 4;

export const SERVICE_TYPE_LABEL: Record<ServiceTypeId, string> = {
  1: 'on-site (ช่างออกบ้าน)',
  2: 'รับ-ส่ง',
  3: 'นำมาที่ร้าน',
  4: 'ส่งพัสดุ',
};

export const SERVICE_TYPE_SHORT: Record<ServiceTypeId, string> = {
  1: 'on-site',
  2: 'รับ-ส่ง',
  3: 'walk-in',
  4: 'พัสดุ',
};

export type ApplianceType =
  | 'แอร์'
  | 'ตู้เย็น'
  | 'เครื่องซักผ้า'
  | 'ทีวี'
  | 'เครื่องล้างจาน'
  | 'เครื่องปิ้งขนมปัง'
  | 'ไมโครเวฟ'
  | 'พัดลม'
  | 'เครื่องดูดฝุ่น'
  | 'หม้อหุงข้าว';

export type JobStatus = 'ANNOUNCED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/** Tier 2 — full projection ที่ WeeeR เห็น รวม sensitive fields */
export interface WeeeRJobListing {
  id: string;
  jobType: 'repair' | 'maintain';
  title: string;
  applianceType: ApplianceType;
  area: string;
  serviceType: ServiceTypeId;
  postedAt: string;
  status: JobStatus;
  ownerId: string;
  // ── Sensitive fields (Phase D — mock เท่านั้น) ──
  problemDescription: string;
  photos: string[];
  estimatedBudget: number;
  feePreview: number;          // 5% of estimatedBudget
  customerName: string;        // 'รอยืนยัน (Phase D)' for now
  customerPhone: string;       // '0xx-xxx-xxxx (Phase D)' for now
  featured?: boolean;
}
