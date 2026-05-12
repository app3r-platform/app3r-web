// ── WeeeR API Fetch Client — D-2 ──────────────────────────────────────────────
// apiFetch — fetch wrapper พร้อม Authorization header อัตโนมัติ
// Pattern: WeeeU api-client.ts (ตาม contract ที่ P3 กำหนด)
// TODO: REMOVE dev token bypass BEFORE PROD

import { getDevTestToken } from "./dev-auth";

/** Base URL ของ backend API — กำหนดผ่าน NEXT_PUBLIC_API_BASE_URL */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * apiFetch — drop-in fetch wrapper ที่แนบ Authorization header อัตโนมัติ
 *
 * Dev mode  : ขอ test JWT จาก backend (TD-04)
 * Prod mode : ใช้ token จาก localStorage (real auth — Phase D)
 *
 * หมายเหตุ: ถ้า body เป็น FormData จะไม่ set Content-Type
 * (browser จะ set เองพร้อม boundary)
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  // TODO: REMOVE BEFORE PROD — dev auth bypass
  let token: string | null = null;
  if (process.env.NODE_ENV === "development") {
    try {
      token = await getDevTestToken();
    } catch {
      // dev token fetch ล้มเหลว — ดำเนินการต่อโดยไม่มี token
    }
  } else {
    token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
  }

  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    // ไม่ set Content-Type ถ้าเป็น FormData — browser จัดการเอง
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    // caller headers override ทั้งหมดข้างต้น
    ...(options.headers as Record<string, string>),
  };

  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

// ── Helper: แปลง Response เป็น Result<T> ────────────────────────────────────

export async function apiGet<T>(path: string): Promise<import("@app3r/dal").Result<T>> {
  try {
    const res = await apiFetch(path);
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${res.statusText}`, code: String(res.status) };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

export async function apiPost<T>(path: string, body: unknown): Promise<import("@app3r/dal").Result<T>> {
  try {
    const res = await apiFetch(path, { method: "POST", body: JSON.stringify(body) });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${res.statusText}`, code: String(res.status) };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

export async function apiPatch<T>(path: string, body: unknown): Promise<import("@app3r/dal").Result<T>> {
  try {
    const res = await apiFetch(path, { method: "PATCH", body: JSON.stringify(body) });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${res.statusText}`, code: String(res.status) };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}
