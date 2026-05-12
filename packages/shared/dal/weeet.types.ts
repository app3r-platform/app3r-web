/**
 * packages/shared/dal/weeet.types.ts
 * Phase D-2 — WeeeT-specific DAL (Data Access Layer) types
 * File owner: App3R-WeeeT (ห้ามแก้ไขโดย P3/P4)
 */

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type UserId = string;
export type JobId = string;

export interface JobAssignDAL {
  getAssignedJobs(technicianId: UserId): Promise<Result<JobAssignRecord[]>>;
  updateJobStatus(jobId: JobId, status: string): Promise<Result<void>>;
}

export interface JobAssignRecord {
  jobId: JobId;
  technicianId: UserId;
  status: string;
  scheduledAt?: string;
  customerName?: string;
  applianceName?: string;
  serviceType?: string;
}

export interface JobStatusDAL {
  getJobProgress(jobId: JobId): Promise<Result<JobProgressRecord | null>>;
  advanceSubStage(jobId: JobId, subStage: string, step: unknown): Promise<Result<void>>;
  markCompleted(jobId: JobId, step: unknown): Promise<Result<void>>;
}

export interface JobProgressRecord {
  jobId: string;
  currentStage: string;
  currentSubStage?: string;
  updatedAt: string;
}

export interface TechnicianDAL {
  getProfile(technicianId: UserId): Promise<Result<TechnicianRecord | null>>;
  updateProfile(technicianId: UserId, data: Partial<TechnicianRecord>): Promise<Result<void>>;
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

export interface WarrantyDAL {
  getWarranty(jobId: JobId): Promise<Result<WarrantyRecord | null>>;
}

export interface WarrantyRecord {
  jobId: JobId;
  expiresAt: string;
  terms: string;
}

// Phase D-2 new modules

export interface PaymentDAL {
  getWalletBalance(): Promise<Result<WalletBalance>>;
  getTransactions(limit?: number): Promise<Result<WalletTransaction[]>>;
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

export interface UploadDAL {
  uploadServicePhoto(jobId: JobId, file: File, caption?: string): Promise<Result<UploadedFile>>;
  uploadReceipt(jobId: JobId, file: File): Promise<Result<UploadedFile>>;
}

export interface UploadedFile {
  fileId: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface PushDAL {
  subscribePush(subscription: PushSubscriptionData): Promise<Result<void>>;
  unsubscribePush(): Promise<Result<void>>;
  getSubscriptionStatus(): Promise<Result<PushSubscriptionStatus>>;
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

/** @needs-backend-sync Backend Sub-CMD-P1: POST /api/location/live + WebSocket broadcast */
export interface LiveLocationDAL {
  emitLocation(update: LiveLocationUpdate): Promise<Result<void>>;
  saveConsentStatus(technicianId: UserId, consented: boolean): Promise<Result<void>>;
  getConsentStatus(technicianId: UserId): Promise<Result<boolean>>;
}

export interface LiveLocationUpdate {
  serviceId: JobId;
  lat: number;
  lng: number;
  timestamp: string;
  accuracy?: number;
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
}
