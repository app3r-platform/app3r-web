import type { RepairJob, DiagnosePayload } from "./types";

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

export const repairApi = {
  listMyJobs: () => apiFetch<RepairJob[]>("/api/repair/jobs/weeet/"),
  getJob: (id: string) => apiFetch<RepairJob>(`/api/repair/jobs/${id}/`),
  depart: (id: string, body: { departure_location: { lat: number; lng: number } }) =>
    apiFetch<RepairJob>(`/api/repair/jobs/${id}/depart/`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  arrive: (id: string, fd: FormData) =>
    apiFetch<RepairJob>(`/api/repair/jobs/${id}/arrive/`, { method: "POST", body: fd }),
  preInspect: (id: string, fd: FormData) =>
    apiFetch<RepairJob>(`/api/repair/jobs/${id}/pre-inspect/`, { method: "POST", body: fd }),
  diagnose: (id: string, body: DiagnosePayload) =>
    apiFetch<RepairJob>(`/api/repair/jobs/${id}/diagnose/`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  postRepair: (id: string, fd: FormData) =>
    apiFetch<RepairJob>(`/api/repair/jobs/${id}/post-repair/`, { method: "POST", body: fd }),
  complete: (id: string) =>
    apiFetch<RepairJob>(`/api/repair/jobs/${id}/complete/`, { method: "POST" }),
};
