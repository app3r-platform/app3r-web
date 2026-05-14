// ─── apiAdapter — DAL (D84) Phase D-2: Real API calls ────────────────────────
// Wire WeeeU frontend ↔ Backend endpoints
// Feature Flag: ตั้ง NEXT_PUBLIC_USE_API_* = true ใน .env.local เพื่อเปิดใช้

import type { IDataAccessLayer, Result, User } from "@app3r/shared/dal";
import type {
  IAuthDAL,
  IServiceProgressDAL,
  IWeeeuApplianceDAL,
  IWeeeuRepairRequestDAL,
  IWeeeuDAL,
  IUploadDAL,
  IPushDAL,
  IPaymentDAL,
  ILocationDAL,
  UploadPresignResult,
  UploadFinalizeResult,
  PaymentIntentResult,
  PaymentStatus,
  GeocodeResult,
  SavedLocation,
} from "@app3r/shared/dal/weeeu";
import type { ServiceProgress } from "@/lib/types/service-progress";

// ─── NotImplementedError — ใช้สำหรับ backward compatibility + future stubs ────

class NotImplementedError extends Error {
  constructor(method: string) {
    super(`[apiAdapter] ${method} → ยังไม่ implement`);
    this.name = "NotImplementedError";
  }
}

// ─── Base URL (proxy ผ่าน Next.js rewrites → http://localhost:8000) ───────────

const API_BASE = "/api/v1";
const TOKEN_KEY = "access_token";

// ─── parseJson helper — แปลง Response เป็น Result<T> ─────────────────────────

async function parseJson<T>(res: Response): Promise<Result<T>> {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.message ?? j?.error ?? msg;
    } catch { /* ignore parse error */ }
    return { ok: false, error: msg, code: String(res.status) };
  }
  try {
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, error: "ไม่สามารถแปลงข้อมูลจาก server ได้" };
  }
}

// ─── authHeader — แนบ Authorization header ───────────────────────────────────

function authHeader(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

// ─── Auth API (D-2: real calls to /api/v1/auth/*) ─────────────────────────────

const authApi: IAuthDAL = {
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
    // sync stub — ใช้ authApiAsync.me() สำหรับข้อมูลจริง (D-2 async pattern)
    const token = authApi.getToken();
    if (!token) return { ok: false, error: "ไม่ได้เข้าสู่ระบบ", code: "UNAUTHENTICATED" };
    // คืน USE_ASYNC_ME error เพื่อบังคับให้ component ใช้ authApiAsync.me() แทน
    return { ok: false, error: "ใช้ authApiAsync.me() สำหรับข้อมูล user จริง", code: "USE_ASYNC_ME" };
  },
};

/** Auth async helpers — ใช้สำหรับ form submission (signup/signin/logout/me) */
export const authApiAsync = {
  async signup(body: { name: string; phone: string; password: string }): Promise<Result<{ token: string; user: User }>> {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return parseJson(res);
  },

  async signin(body: { phone: string; password: string }): Promise<Result<{ token: string; user: User }>> {
    const res = await fetch(`${API_BASE}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await parseJson<{ token: string; user: User }>(res);
    if (result.ok) authApi.setToken(result.data.token);
    return result;
  },

  async refresh(): Promise<Result<{ token: string }>> {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: authHeader(),
    });
    const result = await parseJson<{ token: string }>(res);
    if (result.ok) authApi.setToken(result.data.token);
    return result;
  },

  async logout(): Promise<Result<void>> {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: authHeader(),
    });
    authApi.clearToken();
    return parseJson(res);
  },

  async me(): Promise<Result<User>> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: authHeader(),
    });
    return parseJson(res);
  },
};

// ─── Service Progress API stub (async) ────────────────────────────────────────
// sync methods ใน IServiceProgressDAL คืน USE_HOOK error → ใช้ async version

const USE_HOOK = { ok: false as const, error: "ใช้ useServiceProgress hook แทน", code: "USE_HOOK" };

const serviceProgressApiStub: IServiceProgressDAL<ServiceProgress> = {
  getAll() { return USE_HOOK; },
  getById() { return USE_HOOK; },
  upsert() { return USE_HOOK; },
  submitReview() { return USE_HOOK; },
};

/** serviceProgress async helpers — ใช้ใน hook/server action */
export const serviceProgressApiAsync = {
  async getAll(): Promise<Result<ServiceProgress[]>> {
    const res = await fetch(`${API_BASE}/service-progress`, { headers: authHeader() });
    return parseJson(res);
  },
  async getById(jobId: string): Promise<Result<ServiceProgress>> {
    const res = await fetch(`${API_BASE}/service-progress/${jobId}`, { headers: authHeader() });
    return parseJson(res);
  },
  async submitReview(jobId: string, rating: number, comment: string): Promise<Result<ServiceProgress>> {
    const res = await fetch(`${API_BASE}/service-progress/${jobId}/review`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({ rating, comment }),
    });
    return parseJson(res);
  },
};

// ─── Upload API (D87) ─────────────────────────────────────────────────────────

const uploadApi: IUploadDAL = {
  async presign(params): Promise<Result<UploadPresignResult>> {
    const res = await fetch(`${API_BASE}/files/presign`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(params),
    });
    return parseJson(res);
  },

  async finalize(uploadId: string): Promise<Result<UploadFinalizeResult>> {
    const res = await fetch(`${API_BASE}/files/finalize`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({ uploadId }),
    });
    return parseJson(res);
  },

  async getScanStatus(fileId: string): Promise<Result<{ status: 'pending' | 'clean' | 'infected' }>> {
    const res = await fetch(`${API_BASE}/files/${fileId}/scan-status`, {
      headers: authHeader(),
    });
    return parseJson(res);
  },
};

// ─── Push API (D88) ───────────────────────────────────────────────────────────

const pushApi: IPushDAL = {
  async subscribe(params): Promise<Result<{ subscriptionId: string }>> {
    const res = await fetch(`${API_BASE}/push/subscribe`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(params),
    });
    return parseJson(res);
  },

  async unsubscribe(subscriptionId: string): Promise<Result<void>> {
    const res = await fetch(`${API_BASE}/push/unsubscribe`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({ subscriptionId }),
    });
    return parseJson(res);
  },
};

// ─── Payment API (D89 — customer only, no withdrawal) ────────────────────────

const paymentApi: IPaymentDAL = {
  async createIntent(params): Promise<Result<PaymentIntentResult>> {
    const res = await fetch(`${API_BASE}/payment/intent`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({ ...params, currency: params.currency ?? "THB" }),
    });
    return parseJson(res);
  },

  async getStatus(intentId: string): Promise<Result<PaymentStatus>> {
    const res = await fetch(`${API_BASE}/payment/intent/${intentId}/status`, {
      headers: authHeader(),
    });
    return parseJson(res);
  },
};

// ─── Location API (D90) ───────────────────────────────────────────────────────

const locationApi: ILocationDAL = {
  async geocode(placeId: string): Promise<Result<GeocodeResult>> {
    const res = await fetch(`${API_BASE}/location/geocode?placeId=${encodeURIComponent(placeId)}`, {
      headers: authHeader(),
    });
    return parseJson(res);
  },

  async save(params): Promise<Result<SavedLocation>> {
    const res = await fetch(`${API_BASE}/location`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(params),
    });
    return parseJson(res);
  },

  async list(): Promise<Result<SavedLocation[]>> {
    const res = await fetch(`${API_BASE}/location`, { headers: authHeader() });
    return parseJson(res);
  },
};

// ─── ApiAdapter (รวมทุก module) ───────────────────────────────────────────────

class ApiAdapter implements IDataAccessLayer, IWeeeuDAL {
  readonly adapterName = "apiAdapter";

  readonly auth = authApi;
  readonly serviceProgress = serviceProgressApiStub;
  readonly appliances: IWeeeuApplianceDAL = {
    list() { return USE_HOOK; },
    get() { return USE_HOOK; },
  };
  readonly repairRequests: IWeeeuRepairRequestDAL = {
    list() { return USE_HOOK; },
    get() { return USE_HOOK; },
  };
  readonly upload = uploadApi;
  readonly push = pushApi;
  readonly payment = paymentApi;
  readonly location = locationApi;

  isAvailable(): boolean {
    // ตรวจสอบ backend ด้วย health check (async) ใน production
    return true;
  }
}

export const apiAdapter = new ApiAdapter();
export { NotImplementedError };
export type { ApiAdapter };
