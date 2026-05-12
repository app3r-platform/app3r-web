/**
 * apps/weeet/lib/dal/types.ts
 * Phase D-1 — WeeeT DAL types (in-app copy)
 * Mirror ของ packages/shared/dal/weeet.types.ts — define inline เพื่อให้ build ผ่าน
 * TODO D-2: เปลี่ยนเป็น re-export จาก @app3r/shared/dal เมื่อ P3 index.ts merged
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
}

export interface WarrantyRecord {
  jobId: JobId;
  expiresAt: string;
  terms: string;
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

export interface WeeeTDAL {
  jobAssign: JobAssignDAL;
  jobStatus: JobStatusDAL;
  technician: TechnicianDAL;
  warranty: WarrantyDAL;
}
