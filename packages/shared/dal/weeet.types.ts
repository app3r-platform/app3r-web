/**
 * packages/shared/dal/weeet.types.ts
 * Phase D-1 — WeeeT-specific DAL (Data Access Layer) types
 * File owner: App3R-WeeeT (ห้ามแก้ไขโดย P3/P4)
 *
 * TODO D-2: เมื่อ P3 push index.ts แล้ว ให้ import shared primitives จาก '.'
 *   import type { IDataAccessLayer, User, Role, Result } from '.'
 * ตอนนี้ใช้ inline definitions เพื่อให้ build ผ่าน (parallel-safe ก่อน HUB merge)
 */

// ---- Shared primitives (inline ชั่วคราว — P3 จะเป็นเจ้าของ canonical copy) ----
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type UserId = string;
export type JobId = string;

// ---- WeeeT module-specific DAL interfaces ----

/** JobAssignDAL — งานที่มอบหมายให้ช่าง */
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

/** JobStatusDAL — สถานะ progress (ความคืบหน้า) ของงาน */
export interface JobStatusDAL {
  getJobProgress(jobId: JobId): Promise<Result<JobProgressRecord | null>>;
  advanceSubStage(
    jobId: JobId,
    subStage: string,
    step: unknown
  ): Promise<Result<void>>;
  markCompleted(jobId: JobId, step: unknown): Promise<Result<void>>;
}

export interface JobProgressRecord {
  jobId: string;
  currentStage: string;
  currentSubStage?: string;
  updatedAt: string;
}

/** TechnicianDAL — ข้อมูลช่าง */
export interface TechnicianDAL {
  getProfile(technicianId: UserId): Promise<Result<TechnicianRecord | null>>;
  updateProfile(
    technicianId: UserId,
    data: Partial<TechnicianRecord>
  ): Promise<Result<void>>;
}

export interface TechnicianRecord {
  id: UserId;
  name: string;
  phone: string;
  shopId: string;
  shopName?: string;
  specialties?: string[];
}

/** WarrantyDAL — ข้อมูลการรับประกัน */
export interface WarrantyDAL {
  getWarranty(jobId: JobId): Promise<Result<WarrantyRecord | null>>;
}

export interface WarrantyRecord {
  jobId: JobId;
  expiresAt: string;
  terms: string;
}

/** WeeeTDAL — รวม interface ทั้งหมดของ WeeeT */
export interface WeeeTDAL {
  jobAssign: JobAssignDAL;
  jobStatus: JobStatusDAL;
  technician: TechnicianDAL;
  warranty: WarrantyDAL;
}
