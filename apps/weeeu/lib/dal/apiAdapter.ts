// ─── apiAdapter — DAL (D84) API stub สำหรับ Phase D-2 ────────────────────────
// D-1 scope: ทุก method throw NotImplementedError — ยังไม่ wire API จริง
// Phase D-2 จะ implement method ทีละ module ตามลำดับ

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

/** NotImplementedError — ขว้างออกมาเมื่อ feature ยังไม่ implement (Phase D-2 scope) */
class NotImplementedError extends Error {
  constructor(method: string) {
    super(`[apiAdapter] ${method} → D-2 scope — ยังไม่ implement`);
    this.name = "NotImplementedError";
  }
}

// ─── Auth API stub ────────────────────────────────────────────────────────────

const authApiStub: IAuthDAL = {
  getToken(): string | null {
    throw new NotImplementedError("auth.getToken");
  },
  setToken(_token: string): void {
    throw new NotImplementedError("auth.setToken");
  },
  clearToken(): void {
    throw new NotImplementedError("auth.clearToken");
  },
  getCurrentUser(): Result<User> {
    throw new NotImplementedError("auth.getCurrentUser");
  },
};

// ─── Service Progress API stub ─────────────────────────────────────────────────

const serviceProgressApiStub: IServiceProgressDAL<ServiceProgress> = {
  getAll(): Result<ServiceProgress[]> {
    throw new NotImplementedError("serviceProgress.getAll");
  },
  getById(_jobId: string): Result<ServiceProgress> {
    throw new NotImplementedError("serviceProgress.getById");
  },
  upsert(_job: ServiceProgress): Result<ServiceProgress> {
    throw new NotImplementedError("serviceProgress.upsert");
  },
  submitReview(
    _jobId: string,
    _rating: 1 | 2 | 3 | 4 | 5,
    _comment: string,
  ): Result<ServiceProgress> {
    throw new NotImplementedError("serviceProgress.submitReview");
  },
};

// ─── Appliances API stub ───────────────────────────────────────────────────────

const appliancesApiStub: IWeeeuApplianceDAL = {
  list(): Result<Paginated<WeeeuAppliance>> {
    throw new NotImplementedError("appliances.list");
  },
  get(_id: string): Result<WeeeuAppliance> {
    throw new NotImplementedError("appliances.get");
  },
};

// ─── Repair Requests API stub ──────────────────────────────────────────────────

const repairRequestsApiStub: IWeeeuRepairRequestDAL = {
  list(): Result<Paginated<WeeeuRepairRequest>> {
    throw new NotImplementedError("repairRequests.list");
  },
  get(_id: string): Result<WeeeuRepairRequest> {
    throw new NotImplementedError("repairRequests.get");
  },
};

// ─── ApiAdapter (รวมทุก stub) ──────────────────────────────────────────────────

class ApiAdapter implements IDataAccessLayer, IWeeeuDAL {
  readonly adapterName = "apiAdapter";

  readonly auth = authApiStub;
  readonly serviceProgress = serviceProgressApiStub;
  readonly appliances = appliancesApiStub;
  readonly repairRequests = repairRequestsApiStub;

  isAvailable(): boolean {
    // Phase D-2: จะ ping backend health endpoint
    return false; // ยังไม่ implement
  }
}

export const apiAdapter = new ApiAdapter();
export { NotImplementedError };
export type { ApiAdapter };
