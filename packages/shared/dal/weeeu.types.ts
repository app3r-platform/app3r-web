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

// ─── Upload DAL (D87 — อัพโหลดไฟล์ผ่าน presigned URL) ────────────────────────

export interface UploadPresignResult {
  uploadId: string;
  presignedUrl: string;
}

export interface UploadFinalizeResult {
  fileId: string;
  signedGetUrl: string;
  scanStatus: 'pending' | 'clean' | 'infected';
}

export interface IUploadDAL {
  /** ขอ presigned URL สำหรับอัพโหลดไฟล์ไปยัง R2 (cloud storage) */
  presign(params: {
    filename: string;
    contentType: string;
    sizeBytes: number;
    context?: string;
  }): Promise<Result<UploadPresignResult>>;
  /** แจ้ง backend ว่าอัพโหลดเสร็จแล้ว → trigger scan (ตรวจสอบไวรัส) */
  finalize(uploadId: string): Promise<Result<UploadFinalizeResult>>;
  /** ตรวจสอบสถานะการ scan ไวรัส */
  getScanStatus(fileId: string): Promise<Result<{ status: 'pending' | 'clean' | 'infected' }>>;
}

// ─── Push DAL (D88 — Web Push Notification / FCM) ────────────────────────────

export interface IPushDAL {
  /** ส่ง FCM token ไป backend เพื่อ register การแจ้งเตือน (push notification) */
  subscribe(params: {
    token: string;
    platform: 'web' | 'ios' | 'android';
  }): Promise<Result<{ subscriptionId: string }>>;
  /** ยกเลิกการแจ้งเตือน */
  unsubscribe(subscriptionId: string): Promise<Result<void>>;
}

// ─── Payment DAL (D89 — 2C2P Payment Gateway) ────────────────────────────────
// NOTE-D89-2: WeeeU = customer เท่านั้น — ไม่มี withdrawal UI

export interface PaymentIntentResult {
  intentId: string;
  checkoutUrl: string;
}

export interface PaymentStatus {
  intentId: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  paidAt?: string;
  amount: number;
  currency: string;
}

export interface IPaymentDAL {
  /** สร้าง Payment Intent และรับ checkout URL สำหรับ redirect ไป 2C2P */
  createIntent(params: {
    serviceId: string;
    amount: number;
    currency?: string;
    description?: string;
  }): Promise<Result<PaymentIntentResult>>;
  /** ตรวจสอบสถานะการชำระเงิน */
  getStatus(intentId: string): Promise<Result<PaymentStatus>>;
}

// ─── Location DAL (D90 — Google Places + Geocode + Saved Locations) ───────────

export interface GeocodeResult {
  placeId: string;
  formattedAddress: string;
  lat: number;
  lng: number;
}

export interface SavedLocation {
  id: string;
  userId: string;
  label?: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  createdAt: string;
}

export interface ILocationDAL {
  /** แปลง placeId เป็นพิกัด (lat/lng) ผ่าน Geocoding API */
  geocode(placeId: string): Promise<Result<GeocodeResult>>;
  /** บันทึกสถานที่ที่เลือก */
  save(params: {
    lat: number;
    lng: number;
    formattedAddress: string;
    label?: string;
  }): Promise<Result<SavedLocation>>;
  /** ดึงรายการสถานที่ที่บันทึกไว้ */
  list(): Promise<Result<SavedLocation[]>>;
}

// ─── WeeeU DAL (รวม modules ทั้งหมด) ─────────────────────────────────────────

export interface IWeeeuDAL {
  auth: IAuthDAL;
  serviceProgress: IServiceProgressDAL;
  appliances: IWeeeuApplianceDAL;
  repairRequests: IWeeeuRepairRequestDAL;
  upload: IUploadDAL;
  push: IPushDAL;
  payment: IPaymentDAL;
  location: ILocationDAL;
}
