import type { MaintainJob, MaintainOfferPayload, WithdrawReason } from "./types";
// RC-1: Mock fallback data (dev/offline)
import { MOCK_MAINTAIN_JOBS, MOCK_MAINTAIN_QUEUE } from "./mock";
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
  getQueue: async () => {
    try { return await apiFetch<MaintainJob[]>("/maintain/jobs/queue/"); }
    catch (err) { console.warn("[mock fallback] maintain.getQueue", err); return MOCK_MAINTAIN_QUEUE; }
  },

  // GET /maintain/jobs/shop/ — jobs accepted by this shop
  getShopJobs: async (params?: { status?: string }) => {
    const qs = params?.status ? `?status=${params.status}` : "";
    try { return await apiFetch<MaintainJob[]>(`/maintain/jobs/shop/${qs}`); }
    catch (err) { console.warn("[mock fallback] maintain.getShopJobs", err); return MOCK_MAINTAIN_JOBS; }
  },

  // GET /maintain/jobs/{id}/
  getJob: async (id: string) => {
    try { return await apiFetch<MaintainJob>(`/maintain/jobs/${id}/`); }
    catch (err) { console.warn("[mock fallback] maintain.getJob", err); return MOCK_MAINTAIN_JOBS.find(j => j.id === id) ?? MOCK_MAINTAIN_JOBS[0]; }
  },

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

  // POST /maintain/jobs/{id}/offer/   body: MaintainOfferPayload  (ขั้น 2.1)
  submitOffer: (id: string, payload: MaintainOfferPayload) =>
    apiFetch<MaintainJob>(`/maintain/jobs/${id}/offer/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // POST /maintain/jobs/{id}/withdraw/  body: { reason, evidence? }  (M6)
  withdrawJob: (id: string, reason: WithdrawReason, evidence?: string) =>
    apiFetch<MaintainJob>(`/maintain/jobs/${id}/withdraw/`, {
      method: "POST",
      body: JSON.stringify({ reason, ...(evidence ? { evidence } : {}) }),
    }),

  // POST /maintain/jobs/{id}/no-show/  (M7 — confirm no-show + trigger settle)
  confirmNoShow: (id: string) =>
    apiFetch<MaintainJob>(`/maintain/jobs/${id}/no-show/`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  // POST /maintain/jobs/{id}/termination-response/  body: { decision }  (M9)
  respondToTermination: (id: string, decision: "continue" | "terminate") =>
    apiFetch<MaintainJob>(`/maintain/jobs/${id}/termination-response/`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    }),

  // POST /maintain/jobs/{id}/settle-after-risk/  (M4 — confirm settle ค่าบริการ post-risk termination)
  confirmRiskSettle: (id: string) =>
    apiFetch<MaintainJob>(`/maintain/jobs/${id}/settle-after-risk/`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
};
