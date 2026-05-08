import type { RepairJob, DiagnosePayload } from "./types";

export const API_BASE = "/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem("weeet_auth");
    if (stored) return JSON.parse(stored).token ?? null;
  } catch {}
  return null;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const isFormData = options?.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...((options?.headers as Record<string, string>) ?? {}),
  };
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

// --- Dev token (TD-04) ---
export interface DevTokenPayload {
  user_id: string;
  role: "weeet";
  phone: string;
  shop_id: string;
  weeer_id?: string;
}

export interface DevTokenResponse {
  access_token: string;
  token_type: string;
}

export async function getDevToken(payload: DevTokenPayload): Promise<string> {
  const res = await fetch(`${API_BASE}/_dev/get-test-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`dev-token: ${res.status}`);
  const data: DevTokenResponse = await res.json();
  return data.access_token;
}

// --- Repair API ---
export const repairApi = {
  listMyJobs: () =>
    apiFetch<RepairJob[]>(`${API_BASE}/repair/jobs/weeet/`),
  getJob: (id: string) =>
    apiFetch<RepairJob>(`${API_BASE}/repair/jobs/${id}/`),
  depart: (id: string, body: { departure_location: { lat: number; lng: number } }) =>
    apiFetch<RepairJob>(`${API_BASE}/repair/jobs/${id}/depart/`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  arrive: (id: string, fd: FormData) =>
    apiFetch<RepairJob>(`${API_BASE}/repair/jobs/${id}/arrive/`, { method: "POST", body: fd }),
  preInspect: (id: string, fd: FormData) =>
    apiFetch<RepairJob>(`${API_BASE}/repair/jobs/${id}/pre-inspect/`, { method: "POST", body: fd }),
  diagnose: (id: string, body: DiagnosePayload) =>
    apiFetch<RepairJob>(`${API_BASE}/repair/jobs/${id}/diagnose/`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  postRepair: (id: string, fd: FormData) =>
    apiFetch<RepairJob>(`${API_BASE}/repair/jobs/${id}/post-repair/`, { method: "POST", body: fd }),
  complete: (id: string) =>
    apiFetch<RepairJob>(`${API_BASE}/repair/jobs/${id}/complete/`, { method: "POST" }),
};
