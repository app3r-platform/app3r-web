// ─── localStorageAdapter — DAL (D84) Phase C localStorage implementation ──────
// Wraps Phase C mock logic (service-progress-sync.ts + api-client.ts auth)
// ห้ามลบ logic Phase C — ยังต้อง work ตอน feature flag OFF
"use client";

import type { IDataAccessLayer, Result, Paginated, User } from "@app3r/shared/dal";
import type {
  IAuthDAL,
  IServiceProgressDAL,
  IWeeeuApplianceDAL,
  IWeeeuRepairRequestDAL,
  IWeeeuDAL,
  WeeeuAppliance,
  WeeeuRepairRequest,
} from "@app3r/shared/dal/weeeu";
import type { ServiceProgress } from "@/lib/types/service-progress";
import {
  getServiceProgress,
  setServiceProgress,
  getJobProgress,
  upsertJobProgress,
  submitReview as syncSubmitReview,
} from "@/lib/utils/service-progress-sync";

// ─── Auth (การยืนยันตัวตน) ────────────────────────────────────────────────────

const TOKEN_KEY = "access_token";
const DEV_TOKEN = "dev-jwt-weeeu-mock";

const authAdapter: IAuthDAL = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
  },
  getCurrentUser(): Result<User> {
    // Phase C: mock user — Phase D-2 จะ swap ไป API
    const token = authAdapter.getToken();
    if (!token) return { ok: false, error: "ไม่ได้เข้าสู่ระบบ", code: "UNAUTHENTICATED" };
    return {
      ok: true,
      data: {
        id: "u-001",
        role: "weeeu",
        name: "สมชาย ใจดี",
        phone: "081-234-5678",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    };
  },
};

// ─── Service Progress (ติดตามความคืบหน้างานซ่อม) ─────────────────────────────

const serviceProgressAdapter: IServiceProgressDAL<ServiceProgress> = {
  getAll(): Result<ServiceProgress[]> {
    try {
      return { ok: true, data: getServiceProgress() };
    } catch (e) {
      return { ok: false, error: "ไม่สามารถอ่านข้อมูลงานซ่อมได้" };
    }
  },

  getById(jobId: string): Result<ServiceProgress> {
    const job = getJobProgress(jobId);
    if (!job) return { ok: false, error: `ไม่พบงานซ่อม jobId=${jobId}`, code: "NOT_FOUND" };
    return { ok: true, data: job };
  },

  upsert(job: ServiceProgress): Result<ServiceProgress> {
    try {
      upsertJobProgress(job);
      return { ok: true, data: { ...job, updatedAt: new Date().toISOString() } };
    } catch (e) {
      return { ok: false, error: "บันทึกข้อมูลไม่สำเร็จ" };
    }
  },

  submitReview(
    jobId: string,
    rating: 1 | 2 | 3 | 4 | 5,
    comment: string,
  ): Result<ServiceProgress> {
    const ok = syncSubmitReview(jobId, rating, comment);
    if (!ok) return { ok: false, error: "ส่งรีวิวไม่สำเร็จ — ต้องอยู่ใน stage completed ก่อน" };
    const updated = getJobProgress(jobId);
    if (!updated) return { ok: false, error: "ไม่พบข้อมูลหลังส่งรีวิว" };
    return { ok: true, data: updated };
  },
};

// ─── Appliances (เครื่องใช้ไฟฟ้า) — Phase C mock ──────────────────────────────

const appliancesAdapter: IWeeeuApplianceDAL = {
  list(): Result<Paginated<WeeeuAppliance>> {
    // Phase C: mock empty — Phase D-2 จะดึงจาก API จริง
    return {
      ok: true,
      data: { items: [], total: 0, page: 1, pageSize: 20, hasNext: false },
    };
  },
  get(id: string): Result<WeeeuAppliance> {
    return { ok: false, error: `Appliance ${id} not found (Phase C mock)`, code: "NOT_FOUND" };
  },
};

// ─── Repair Requests (การแจ้งซ่อม) — Phase C mock ────────────────────────────

const repairRequestsAdapter: IWeeeuRepairRequestDAL = {
  list(): Result<Paginated<WeeeuRepairRequest>> {
    return {
      ok: true,
      data: { items: [], total: 0, page: 1, pageSize: 20, hasNext: false },
    };
  },
  get(id: string): Result<WeeeuRepairRequest> {
    return { ok: false, error: `RepairRequest ${id} not found (Phase C mock)`, code: "NOT_FOUND" };
  },
};

// ─── LocalStorageAdapter (รวมทุก module) ─────────────────────────────────────

class LocalStorageAdapter implements IDataAccessLayer, IWeeeuDAL {
  readonly adapterName = "localStorageAdapter";

  readonly auth = authAdapter;
  readonly serviceProgress = serviceProgressAdapter;
  readonly appliances = appliancesAdapter;
  readonly repairRequests = repairRequestsAdapter;

  isAvailable(): boolean {
    return typeof window !== "undefined";
  }
}

export const localStorageAdapter = new LocalStorageAdapter();
export type { LocalStorageAdapter };
