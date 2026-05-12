/**
 * apps/weeet/lib/dal/localStorageAdapter.ts
 * Phase D-1 — localStorage adapter สำหรับ WeeeT
 * ห่อ (wrap) Phase C service-progress-sync + mock data
 * Phase D-2: แทนที่ด้วย apiAdapter จริง
 */

import type { WeeeTDAL, JobAssignRecord, JobProgressRecord, TechnicianRecord, Result } from "./types";
import {
  loadProgress,
  saveProgress,
  advanceSubStage as syncAdvanceSubStage,
} from "../utils/service-progress-sync";
import type { ProgressStep } from "../types/service-progress";

// ---- helpers ----
function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}
function err<T>(error: string): Result<T> {
  return { ok: false, error };
}

// ---- JobAssign adapter ----
const jobAssignAdapter = {
  async getAssignedJobs(technicianId: string): Promise<Result<JobAssignRecord[]>> {
    try {
      const all = loadProgress();
      const records: JobAssignRecord[] = all
        .filter((j) => j.technicianId === technicianId)
        .map((j) => ({
          jobId: j.jobId,
          technicianId: j.technicianId ?? technicianId,
          status: j.currentStage,
          scheduledAt: j.scheduledAt,
          customerName: j.customerName,
          applianceName: j.applianceName,
          serviceType: j.serviceType,
        }));
      return ok(records);
    } catch (e) {
      return err(String(e));
    }
  },

  async updateJobStatus(jobId: string, status: string): Promise<Result<void>> {
    try {
      const all = loadProgress();
      const updated = all.map((j) =>
        j.jobId === jobId
          ? { ...j, currentStage: status as never, updatedAt: new Date().toISOString() }
          : j
      );
      saveProgress(updated);
      return ok(undefined);
    } catch (e) {
      return err(String(e));
    }
  },
};

// ---- JobStatus adapter ----
const jobStatusAdapter = {
  async getJobProgress(jobId: string): Promise<Result<JobProgressRecord | null>> {
    try {
      const all = loadProgress();
      const job = all.find((j) => j.jobId === jobId);
      if (!job) return ok(null);
      return ok({
        jobId: job.jobId,
        currentStage: job.currentStage,
        currentSubStage: job.currentSubStage,
        updatedAt: job.updatedAt,
      });
    } catch (e) {
      return err(String(e));
    }
  },

  async advanceSubStage(
    jobId: string,
    subStage: string,
    step: unknown
  ): Promise<Result<void>> {
    try {
      syncAdvanceSubStage(jobId, subStage, step as ProgressStep, undefined);
      return ok(undefined);
    } catch (e) {
      return err(String(e));
    }
  },

  async markCompleted(jobId: string, step: unknown): Promise<Result<void>> {
    try {
      syncAdvanceSubStage(jobId, "", step as ProgressStep, "completed");
      return ok(undefined);
    } catch (e) {
      return err(String(e));
    }
  },
};

// ---- Technician adapter (mock — Phase C profile data) ----
const technicianAdapter = {
  async getProfile(technicianId: string): Promise<Result<TechnicianRecord | null>> {
    // Phase C mock data — Phase D-2: fetch from API
    if (technicianId === "tech-001") {
      return ok({
        id: "tech-001",
        name: "สมชาย มั่นคง",
        phone: "081-234-5678",
        shopId: "shop-001",
        shopName: "FixPro Service",
        specialties: ["แอร์", "เครื่องซักผ้า", "ตู้เย็น"],
      });
    }
    return ok(null);
  },

  async updateProfile(
    technicianId: string,
    data: Partial<TechnicianRecord>
  ): Promise<Result<void>> {
    // Phase D-2: PUT /api/v1/technicians/{id}/profile
    void technicianId;
    void data;
    return ok(undefined); // no-op in localStorage mode
  },
};

// ---- Warranty adapter (stub — ไม่มีใน Phase C) ----
const warrantyAdapter = {
  async getWarranty(jobId: string) {
    void jobId;
    return ok(null); // Phase D-2: fetch from API
  },
};

// ---- Combined localStorage adapter ----
export const localStorageAdapter: WeeeTDAL = {
  jobAssign: jobAssignAdapter,
  jobStatus: jobStatusAdapter,
  technician: technicianAdapter,
  warranty: warrantyAdapter,
};
