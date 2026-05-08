import type { MaintainJob } from "./types";
// TODO: REMOVE BEFORE PROD — dev auth bypass
import { getDevTestToken } from "../../../../lib/dev-auth";

const BASE = "/api/v1";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // TODO: REMOVE BEFORE PROD — dev auth bypass
  const token =
    process.env.NODE_ENV === "development"
      ? await getDevTestToken()
      : null;

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const maintainApi = {
  // GET /maintain/jobs/queue/ — pending jobs in radius
  getQueue: () =>
    apiFetch<MaintainJob[]>("/maintain/jobs/queue/"),

  // GET /maintain/jobs/shop/ — jobs accepted by this shop
  getShopJobs: (params?: { status?: string }) => {
    const qs = params?.status ? `?status=${params.status}` : "";
    return apiFetch<MaintainJob[]>(`/maintain/jobs/shop/${qs}`);
  },

  // GET /maintain/jobs/{id}/
  getJob: (id: string) =>
    apiFetch<MaintainJob>(`/maintain/jobs/${id}/`),

  // POST /maintain/jobs/{id}/accept/
  acceptJob: (id: string) =>
    apiFetch<MaintainJob>(`/maintain/jobs/${id}/accept/`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  // POST /maintain/jobs/{id}/assign/   body: { technicianId }
  assignTechnician: (id: string, technicianId: string) =>
    apiFetch<MaintainJob>(`/maintain/jobs/${id}/assign/`, {
      method: "POST",
      body: JSON.stringify({ technicianId }),
    }),
};
