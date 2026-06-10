import { getToken } from "./auth";
// TODO: REMOVE BEFORE PROD — TD-04 dev auth bypass
import { getDevTestToken } from "./dev-auth";

const BASE = "/api/v1";

// TODO: REMOVE BEFORE PROD — mock-first runtime flag (TD-06)
// ในเฟสก่อนมี backend จริง: NEXT_PUBLIC_DEV_NAV=true → ทุกหน้าต้องเปิดได้โดยไม่มี backend
const MOCK_MODE = process.env.NEXT_PUBLIC_DEV_NAV === "true";

/**
 * Error message ที่ใช้สื่อสารกับ caller (หน้าเพจ) ว่าควร fallback ไป mock data
 * - BACKEND_UNAVAILABLE → backend ไม่พร้อม (network/404/500) → หน้าเพจแสดง mock
 * - UNAUTHORIZED        → 401 จริงเท่านั้น → หน้าเพจ redirect ไป /login ได้
 */
export const ERR_BACKEND_UNAVAILABLE = "BACKEND_UNAVAILABLE";
export const ERR_UNAUTHORIZED = "UNAUTHORIZED";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // RC1 (CMD #115-V) — Mock-First data layer
  // mock mode: ❌ ห้ามยิง backend / getDevTestToken (ไม่มี backend = ไม่มี 500)
  //            โยน BACKEND_UNAVAILABLE ทันที → หน้าเพจ catch → แสดง mock data
  if (MOCK_MODE) {
    throw new Error(ERR_BACKEND_UNAVAILABLE);
  }

  // TODO: REMOVE BEFORE PROD — use dev test token in development mode
  // mock-first: token fetch ต้องไม่ throw — ล้มเหลว = ไม่มี token แล้วไปต่อ
  let token: string | null = null;
  if (process.env.NODE_ENV === "development") {
    token = await getDevTestToken().catch(() => null);
  } else {
    token = getToken();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers });
  } catch {
    // network ล่ม / ไม่มี backend → ให้ caller fallback mock (❌ ไม่ throw 500)
    throw new Error(ERR_BACKEND_UNAVAILABLE);
  }

  if (!res.ok) {
    // RC2 — redirect ไป login เฉพาะ 401 จริงเท่านั้น
    if (res.status === 401) throw new Error(ERR_UNAUTHORIZED);
    // 404/500/อื่นๆ = backend ไม่พร้อม → fallback mock (ไม่เด้ง login)
    const err = await res.json().catch(() => ({ detail: ERR_BACKEND_UNAVAILABLE }));
    throw new Error(err.detail ?? ERR_BACKEND_UNAVAILABLE);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get:   <T>(path: string)                  => request<T>(path),
  post:  <T>(path: string, body: unknown)   => request<T>(path, { method: "POST",  body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown)  => request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  put:   <T>(path: string, body: unknown)   => request<T>(path, { method: "PUT",   body: JSON.stringify(body) }),
};
