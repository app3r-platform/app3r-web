import type { RepairJob, DiagnosePayload } from "./types";
import { getDevTestToken } from "./dev-auth"; // TODO: REMOVE BEFORE PROD

export const API_BASE = "/api/v1";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  // TODO: REMOVE BEFORE PROD — dev auth bypass
  let token: string | null = null;
  if (process.env.NODE_ENV === "development") {
    try {
      token = await getDevTestToken();
    } catch {
      // Dev token unavailable — proceed without token
    }
  }
  // Production: token จะมาจาก real auth (future phase)

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
