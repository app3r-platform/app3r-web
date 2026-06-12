// ── WeeeR API Fetch Client — RC1 (shared mock-runtime) ───────────────────────
// Mock-First Runtime Standard (CMD #115-Z · Admin pilot pattern)
//   - data layer (apiGet/apiPost/apiPatch) → shared createMockFirstApi
//   - 401 จริง → UNAUTHORIZED (caller redirect) · 404/500/network → BACKEND_UNAVAILABLE (fallback mock)
//   - apiFetch (raw Response) คงไว้ให้ module APIs (parts/services/settlement) + mock-mode guard
// TODO: REMOVE dev token bypass BEFORE PROD

import { getDevTestToken } from "./dev-auth";
import {
  createMockFirstApi,
  ERR_BACKEND_UNAVAILABLE,
  ERR_UNAUTHORIZED,
} from "@app3r/shared/src/mock-runtime";

/** Base URL ของ backend API — กำหนดผ่าน NEXT_PUBLIC_API_BASE_URL (path ของ caller รวม /api/v1 แล้ว) */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * MOCK_MODE — inline env ใน app chunk (config injection · CMD #115-AH)
 * ⚠️ ต้องอ่าน process.env ตรงนี้ (app code) ไม่ใช่ผ่าน shared isMockMode() —
 *    Next.js inline literal เฉพาะใน chunk ที่อ่าน env เอง · ข้าม package boundary = false (BUG-3)
 */
const MOCK_MODE = process.env.NEXT_PUBLIC_DEV_NAV === "true";

/** getApiBase — base URL สำหรับ component ที่ fetch backend ตรง (เช่น shared NearMeFilter) */
export function getApiBase(): string {
  return API_BASE;
}

// re-export ERR_* ให้หน้าเพจ catch ได้ตรง (เทียบ message)
export { ERR_BACKEND_UNAVAILABLE, ERR_UNAUTHORIZED };

/**
 * resolveToken — token provider (ต้องไม่ throw)
 *   Dev  : ขอ test JWT (getDevTestToken — มี fallback bypass ภายใน · .catch → null กันพัง)
 *   Prod : อ่านจาก localStorage (real auth — Phase D)
 */
function resolveToken(): Promise<string | null> | string | null {
  if (process.env.NODE_ENV === "development") {
    return getDevTestToken().catch(() => null);
  }
  return typeof window !== "undefined"
    ? localStorage.getItem("access_token")
    : null;
}

// ── shared mock-first data layer ───────────────────────────────────────────────
// base = API_BASE ('' ปกติ) เพราะ path ที่ caller ส่งรวม '/api/v1' อยู่แล้ว
// (caveat CMD: WeeeR ใช้ full path ไม่ใช่ prefix แยก → ส่ง base ว่าง ไม่ใช่ default '/api/v1')
const mockFirst = createMockFirstApi({
  base: API_BASE,
  getToken: resolveToken,
  mockMode: MOCK_MODE,
});

/**
 * apiFetch — raw Response wrapper (module APIs: parts/services/settlement ใช้)
 *
 * Dev  : ขอ test JWT · Prod : token จาก localStorage
 * Mock mode (NEXT_PUBLIC_DEV_NAV) → throw BACKEND_UNAVAILABLE ทันที (ไม่ยิง backend = ไม่มี 500)
 * FormData → ไม่ set Content-Type (browser จัดการ boundary เอง)
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  // mock mode: ห้ามยิง backend → caller (module API) จะ throw ต่อ → หน้า fallback mock
  //   MOCK_MODE = inline env ใน app chunk (ไม่ผ่าน shared isMockMode = กัน BUG-3)
  if (MOCK_MODE) {
    throw new Error(ERR_BACKEND_UNAVAILABLE);
  }

  // token fetch ต้องไม่ throw (resolveToken กลืน error แล้ว)
  const token = await resolveToken();

  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers as Record<string, string>),
  };

  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

// ── Helper: แปลงเป็น Result<T> ผ่าน shared mock-first ─────────────────────────
// 401 → code "401" (caller redirect /login) · อื่นๆ (BACKEND_UNAVAILABLE) → ok:false (fallback mock)

function toResult<T>(
  run: () => Promise<T>,
): Promise<import("@app3r/dal").Result<T>> {
  return run().then(
    (data) => ({ ok: true as const, data }),
    (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Network error";
      if (msg === ERR_UNAUTHORIZED) {
        return { ok: false as const, error: msg, code: "401" };
      }
      return { ok: false as const, error: msg };
    },
  );
}

export function apiGet<T>(path: string): Promise<import("@app3r/dal").Result<T>> {
  return toResult(() => mockFirst.get<T>(path));
}

export function apiPost<T>(path: string, body: unknown): Promise<import("@app3r/dal").Result<T>> {
  return toResult(() => mockFirst.post<T>(path, body));
}

export function apiPatch<T>(path: string, body: unknown): Promise<import("@app3r/dal").Result<T>> {
  return toResult(() => mockFirst.patch<T>(path, body));
}
