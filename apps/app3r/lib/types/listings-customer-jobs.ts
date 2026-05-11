// ============================================================
// lib/types/listings-customer-jobs.ts — Tier1/Tier2 job projections
// Phase C-4.1b: Repair + Maintain auth-gated listings
// ============================================================

export type ServiceTypeId = 1 | 2 | 3 | 4;

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

// Tier 1 — public projection (headline only, no sensitive data)
export interface PublicJobProjection {
  id: string;
  title: string;
  applianceType: ApplianceType;
  area: string;           // province only (no full address)
  serviceType: ServiceTypeId;
  postedAt: string;
  status: JobStatus;
  jobType: 'repair' | 'maintain';
  ownerId: string;        // for owner detection
}

// Tier 2 — authenticated projection (WeeeR full detail)
export interface AuthenticatedJobProjection extends PublicJobProjection {
  problemDescription: string;
  photos: string[];       // Lorem Picsum URLs
  estimatedBudget: number;
  feePreview: number;     // D75 rounded: 5% of estimatedBudget
  // Phase D: real customer name/phone — mock only shows placeholder
  customerName: string;  // 'รอยืนยัน (Phase D)' for mock
  customerPhone: string; // '0xx-xxx-xxxx (Phase D)' for mock
}
