/**
 * apps/weeet/lib/dal/types.ts
 * Phase D-2 — WeeeT DAL types (in-app mirror)
 * Mirror ของ packages/shared/dal/weeet.types.ts — define inline เพื่อให้ build ผ่าน
 */

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type UserId = string;
export type JobId = string;

export interface JobAssignRecord {
  jobId: JobId;
  technicianId: UserId;
  status: string;
  scheduledAt?: string;
  customerName?: string;
  applianceName?: string;
  serviceType?: string;
  // Sub-4 Wave 2: Services table expand fields
  title?: string;        // ชื่อ service
  description?: string;  // รายละเอียดงาน
  pointAmount?: number;  // มูลค่างาน (points)
  deadline?: string;     // กำหนดเสร็จงาน (ISO timestamptz)
}

export interface JobProgressRecord {
  jobId: string;
  currentStage: string;
  currentSubStage?: string;
  updatedAt: string;
}

export interface TechnicianRecord {
  id: UserId;
  name: string;
  phone: string;
  shopId: string;
  shopName?: string;
  specialties?: string[];
  homeBaseLat?: number;
  homeBaseLng?: number;
  serviceRadiusKm?: number;
}

export interface WarrantyRecord {
  jobId: JobId;
  expiresAt: string;
  terms: string;
}

export interface WalletBalance {
  available: number;
  pending: number;
  currency: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  jobId?: JobId;
  createdAt: string;
}

export interface UploadedFile {
  fileId: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  technicianId: UserId;
}

export interface PushSubscriptionStatus {
  isSubscribed: boolean;
  endpoint?: string;
}

export interface LiveLocationUpdate {
  serviceId: JobId;
  lat: number;
  lng: number;
  timestamp: string;
  accuracy?: number;
}

export interface JobAssignDAL {
  getAssignedJobs(technicianId: UserId): Promise<Result<JobAssignRecord[]>>;
  updateJobStatus(jobId: JobId, status: string): Promise<Result<void>>;
}

export interface JobStatusDAL {
  getJobProgress(jobId: JobId): Promise<Result<JobProgressRecord | null>>;
  advanceSubStage(jobId: JobId, subStage: string, step: unknown): Promise<Result<void>>;
  markCompleted(jobId: JobId, step: unknown): Promise<Result<void>>;
}

export interface TechnicianDAL {
  getProfile(technicianId: UserId): Promise<Result<TechnicianRecord | null>>;
  updateProfile(technicianId: UserId, data: Partial<TechnicianRecord>): Promise<Result<void>>;
}

export interface WarrantyDAL {
  getWarranty(jobId: JobId): Promise<Result<WarrantyRecord | null>>;
}

export interface PaymentDAL {
  getWalletBalance(): Promise<Result<WalletBalance>>;
  getTransactions(limit?: number): Promise<Result<WalletTransaction[]>>;
}

export interface UploadDAL {
  uploadServicePhoto(jobId: JobId, file: File, caption?: string): Promise<Result<UploadedFile>>;
  uploadReceipt(jobId: JobId, file: File): Promise<Result<UploadedFile>>;
}

export interface PushDAL {
  subscribePush(subscription: PushSubscriptionData): Promise<Result<void>>;
  unsubscribePush(): Promise<Result<void>>;
  getSubscriptionStatus(): Promise<Result<PushSubscriptionStatus>>;
}

// ─── Sub-5 Wave 2: Service Progress Tracker (D79) ──────────────────────────
// Mirror ของ Backend types/service-progress.ts (Lesson #34: ไม่ import ข้ามแอป)
// Source-of-truth: apps/backend/src/types/service-progress.ts
// เมื่อ Backend merge แล้ว จะอัพเดต import path (TODO: Sub-5)

// Mirror ของ Backend ServiceProgressStatus (Backend Sub-5 ยังไม่ merge)
// TODO: Sub-5 — เมื่อ Backend merge → อาจ refactor ให้ import จาก shared package
export type ServiceProgressStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled';

export interface ServiceProgressRecord {
  id: string;
  serviceId: string;
  status: ServiceProgressStatus;
  progressPercent: number;   // 0–100
  note: string | null;
  photoR2Key: string | null; // R2 key (ไม่ใช่ full URL)
  updatedBy: string;
  createdAt: string;         // ISO-8601
}

export interface CreateProgressInput {
  serviceId: string;
  status: ServiceProgressStatus;
  progressPercent: number;
  note?: string;
  photoFile?: File;          // WeeeT อัพโหลดก่อน → ได้ R2 key
}

export interface UpdateProgressInput {
  status?: ServiceProgressStatus;
  progressPercent?: number;
  note?: string;
  photoFile?: File | null;   // null = ลบ photo, undefined = ไม่เปลี่ยน
}

export interface ServiceProgressDAL {
  /** GET /service-progress/:serviceId — รายการ progress entries */
  getProgress(serviceId: string): Promise<Result<ServiceProgressRecord[]>>;
  /** POST /service-progress — สร้าง entry ใหม่ (พร้อม upload photo ถ้ามี) */
  createProgress(input: CreateProgressInput): Promise<Result<ServiceProgressRecord>>;
  /** PATCH /service-progress/:id — อัพเดต entry (พร้อม upload photo ถ้ามี) */
  updateProgress(progressId: string, input: UpdateProgressInput): Promise<Result<ServiceProgressRecord>>;
}

/** @needs-backend-sync Backend Sub-CMD-P1: POST /api/location/live */
export interface LiveLocationDAL {
  emitLocation(update: LiveLocationUpdate): Promise<Result<void>>;
  saveConsentStatus(technicianId: UserId, consented: boolean): Promise<Result<void>>;
  getConsentStatus(technicianId: UserId): Promise<Result<boolean>>;
}

export interface WeeeTDAL {
  jobAssign: JobAssignDAL;
  jobStatus: JobStatusDAL;
  technician: TechnicianDAL;
  warranty: WarrantyDAL;
  payment: PaymentDAL;
  upload: UploadDAL;
  push: PushDAL;
  liveLocation: LiveLocationDAL;
  serviceProgress: ServiceProgressDAL; // Sub-5 Wave 2
}
