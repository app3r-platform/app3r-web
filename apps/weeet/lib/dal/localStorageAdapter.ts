/**
 * apps/weeet/lib/dal/localStorageAdapter.ts
 * Phase D-2 — localStorage adapter + fallback stubs for new modules
 */

import type {
  WeeeTDAL, JobAssignRecord, JobProgressRecord, TechnicianRecord, Result,
  WalletBalance, WalletTransaction, UploadedFile, PushSubscriptionStatus,
  LiveLocationUpdate, PushSubscriptionData,
} from "./types";
import {
  loadProgress,
  saveProgress,
  advanceSubStage as syncAdvanceSubStage,
} from "../utils/service-progress-sync";
import type { ProgressStep } from "../types/service-progress";

function ok<T>(data: T): Result<T> { return { ok: true, data }; }
function err<T>(error: string): Result<T> { return { ok: false, error }; }

const jobAssignAdapter = {
  async getAssignedJobs(technicianId: string): Promise<Result<JobAssignRecord[]>> {
    try {
      const all = loadProgress();
      const records: JobAssignRecord[] = all
        .filter((j) => j.technicianId === technicianId)
        .map((j) => ({
          jobId: j.jobId, technicianId: j.technicianId ?? technicianId,
          status: j.currentStage, scheduledAt: j.scheduledAt,
          customerName: j.customerName, applianceName: j.applianceName,
          serviceType: j.serviceType,
        }));
      return ok(records);
    } catch (e) { return err(String(e)); }
  },
  async updateJobStatus(jobId: string, status: string): Promise<Result<void>> {
    try {
      const all = loadProgress();
      const updated = all.map((j) =>
        j.jobId === jobId ? { ...j, currentStage: status as never, updatedAt: new Date().toISOString() } : j
      );
      saveProgress(updated);
      return ok(undefined);
    } catch (e) { return err(String(e)); }
  },
};

const jobStatusAdapter = {
  async getJobProgress(jobId: string): Promise<Result<JobProgressRecord | null>> {
    try {
      const all = loadProgress();
      const job = all.find((j) => j.jobId === jobId);
      if (!job) return ok(null);
      return ok({ jobId: job.jobId, currentStage: job.currentStage, currentSubStage: job.currentSubStage, updatedAt: job.updatedAt });
    } catch (e) { return err(String(e)); }
  },
  async advanceSubStage(jobId: string, subStage: string, step: unknown): Promise<Result<void>> {
    try {
      syncAdvanceSubStage(jobId, subStage, step as ProgressStep, undefined);
      return ok(undefined);
    } catch (e) { return err(String(e)); }
  },
  async markCompleted(jobId: string, step: unknown): Promise<Result<void>> {
    try {
      syncAdvanceSubStage(jobId, "", step as ProgressStep, "completed");
      return ok(undefined);
    } catch (e) { return err(String(e)); }
  },
};

const technicianAdapter = {
  async getProfile(technicianId: string): Promise<Result<TechnicianRecord | null>> {
    if (technicianId === "tech-001") {
      return ok({ id: "tech-001", name: "สมชาย มั่นคง", phone: "081-234-5678", shopId: "shop-001", shopName: "FixPro Service", specialties: ["แอร์", "เครื่องซักผ้า", "ตู้เย็น"] });
    }
    return ok(null);
  },
  async updateProfile(technicianId: string, data: Partial<TechnicianRecord>): Promise<Result<void>> {
    void technicianId; void data;
    return ok(undefined);
  },
};

const warrantyAdapter = {
  async getWarranty(jobId: string) { void jobId; return ok(null); },
};

// Phase D-2 new module stubs
const paymentAdapter = {
  async getWalletBalance(): Promise<Result<WalletBalance>> {
    return ok({ available: 0, pending: 0, currency: "THB", updatedAt: new Date().toISOString() });
  },
  async getTransactions(_limit?: number): Promise<Result<WalletTransaction[]>> {
    return ok([] as WalletTransaction[]);
  },
};

const uploadAdapter = {
  async uploadServicePhoto(_jobId: string, file: File, _caption?: string): Promise<Result<UploadedFile>> {
    await new Promise((r) => setTimeout(r, 600));
    const seed = Math.floor(Math.random() * 1000);
    return ok({ fileId: `mock-photo-${Date.now()}`, url: `https://picsum.photos/seed/${seed}/600/400`, mimeType: file.type || "image/jpeg", sizeBytes: file.size, uploadedAt: new Date().toISOString() });
  },
  async uploadReceipt(_jobId: string, file: File): Promise<Result<UploadedFile>> {
    await new Promise((r) => setTimeout(r, 400));
    return ok({ fileId: `mock-receipt-${Date.now()}`, url: `https://picsum.photos/seed/${Date.now()}/400/600`, mimeType: file.type || "image/jpeg", sizeBytes: file.size, uploadedAt: new Date().toISOString() });
  },
};

const PUSH_KEY = "weeet_push_subscribed";
const pushAdapter = {
  async subscribePush(_subscription: PushSubscriptionData): Promise<Result<void>> {
    if (typeof window !== "undefined") localStorage.setItem(PUSH_KEY, "true");
    return ok(undefined);
  },
  async unsubscribePush(): Promise<Result<void>> {
    if (typeof window !== "undefined") localStorage.removeItem(PUSH_KEY);
    return ok(undefined);
  },
  async getSubscriptionStatus(): Promise<Result<PushSubscriptionStatus>> {
    const isSubscribed = typeof window !== "undefined" && localStorage.getItem(PUSH_KEY) === "true";
    return ok({ isSubscribed });
  },
};

const liveLocationAdapter = {
  async emitLocation(_update: LiveLocationUpdate): Promise<Result<void>> { return ok(undefined); },
  async saveConsentStatus(technicianId: string, consented: boolean): Promise<Result<void>> {
    if (typeof window !== "undefined") localStorage.setItem(`weeet_location_consent_${technicianId}`, String(consented));
    return ok(undefined);
  },
  async getConsentStatus(technicianId: string): Promise<Result<boolean>> {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`weeet_location_consent_${technicianId}`);
      return ok(stored === "true");
    }
    return ok(false);
  },
};

export const localStorageAdapter: WeeeTDAL = {
  jobAssign: jobAssignAdapter,
  jobStatus: jobStatusAdapter,
  technician: technicianAdapter,
  warranty: warrantyAdapter,
  payment: paymentAdapter,
  upload: uploadAdapter,
  push: pushAdapter,
  liveLocation: liveLocationAdapter,
};
