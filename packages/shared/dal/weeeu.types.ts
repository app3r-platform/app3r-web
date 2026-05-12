// ─── WeeeU DAL Module Types — D84 (per-app verbatim) ─────────────────────────
// เจ้าของ: App3R-WeeeU (Sub-CMD-P3)
// ห้ามแก้: weeer.types.ts / weeet.types.ts
// NOTE: ไม่ import จาก apps/ — ห้าม circular dependency (การอ้างอิงวนซ้ำ)

import type { Result, Paginated, User } from './index';

// ─── Auth DAL (การยืนยันตัวตน) ───────────────────────────────────────────────

export interface IAuthDAL {
  /** อ่าน access token (โทเค็นการยืนยันตัวตน) จาก storage */
  getToken(): string | null;
  /** บันทึก access token */
  setToken(token: string): void;
  /** ลบ access token (logout/ออกจากระบบ) */
  clearToken(): void;
  /** อ่านข้อมูล user ปัจจุบัน */
  getCurrentUser(): Result<User>;
}

// ─── Service Progress DAL (ติดตามความคืบหน้างานซ่อม) ─────────────────────────
// ใช้ generic T เพื่อหลีกเลี่ยง circular import จาก apps/

export interface IServiceProgressDAL<T = unknown> {
  /** ดึงรายการงานซ่อมทั้งหมด */
  getAll(): Result<T[]>;
  /** ดึงงานซ่อมตาม jobId */
  getById(jobId: string): Result<T>;
  /** บันทึก/อัพเดต ServiceProgress (upsert) */
  upsert(job: T): Result<T>;
  /** ส่งรีวิว (เฉพาะ stage = completed → reviewed) — WeeeU authority เท่านั้น */
  submitReview(
    jobId: string,
    rating: 1 | 2 | 3 | 4 | 5,
    comment: string,
  ): Result<T>;
}

// ─── Appliance DAL (เครื่องใช้ไฟฟ้าของ WeeeU user) ──────────────────────────

export interface WeeeuAppliance {
  id: string;
  ownerId: string;
  name: string;
  brand: string;
  model: string;
  serialNumber?: string;
  purchasedAt?: string;
  createdAt: string;
}

export interface IWeeeuApplianceDAL {
  /** ดึงรายการเครื่องใช้ไฟฟ้าทั้งหมดของ user */
  list(): Result<Paginated<WeeeuAppliance>>;
  /** ดึงเครื่องใช้ไฟฟ้าตาม id */
  get(id: string): Result<WeeeuAppliance>;
}

// ─── Repair Request DAL (การแจ้งซ่อม) ────────────────────────────────────────

export interface WeeeuRepairRequest {
  id: string;
  customerId: string;
  applianceId?: string;
  description: string;
  status: string;
  serviceType: 'on_site' | 'pickup' | 'walk_in' | 'parcel';
  createdAt: string;
  updatedAt: string;
}

export interface IWeeeuRepairRequestDAL {
  /** ดึงรายการแจ้งซ่อมทั้งหมดของ user */
  list(params?: { status?: string }): Result<Paginated<WeeeuRepairRequest>>;
  /** ดึงการแจ้งซ่อมตาม id */
  get(id: string): Result<WeeeuRepairRequest>;
}

// ─── WeeeU DAL (รวม modules ทั้งหมด) ─────────────────────────────────────────

export interface IWeeeuDAL {
  auth: IAuthDAL;
  serviceProgress: IServiceProgressDAL;
  appliances: IWeeeuApplianceDAL;
  repairRequests: IWeeeuRepairRequestDAL;
}
