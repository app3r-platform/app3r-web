import type { RepairJob, RepairAnnouncement, RepairDashboard } from "./types";

const BASE = "/api/v1";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const repairApi = {
  getDashboard: () =>
    apiFetch<RepairDashboard>("/repair/dashboard"),

  getJobs: (params?: { status?: string }) => {
    const qs = new URLSearchParams({ service_type: "on_site", ...(params ?? {}) });
    return apiFetch<RepairJob[]>(`/repair/jobs?${qs}`);
  },

  getJob: (id: string) =>
    apiFetch<RepairJob>(`/repair/jobs/${id}`),

  approveProposal: (id: string, body: {
    action: "approve" | "reject" | "request_info";
    branch?: string;
    adjusted_price?: number;
    notes?: string;
  }) =>
    apiFetch<RepairJob>(`/repair/jobs/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  openDispute: (id: string, body: { reason: string; evidence_notes?: string }) =>
    apiFetch<{ dispute_id: string }>(`/repair/jobs/${id}/dispute`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getAnnouncements: () => {
    const qs = new URLSearchParams({ service_type: "on_site", unmatched: "true" });
    return apiFetch<RepairAnnouncement[]>(`/repair/announcements?${qs}`);
  },

  getAnnouncement: (id: string) =>
    apiFetch<RepairAnnouncement>(`/repair/announcements/${id}`),

  submitOffer: (announcementId: string, body: {
    price: number;
    includes: string;
    has_deposit: boolean;
    deposit_amount?: number;
    deposit_policy_unrepairable?: "free" | "forfeit" | "refund";
    inspection_fee: number;
    weeet_id: string;
    notes?: string;
  }) =>
    apiFetch<{ offer_id: string }>(`/repair/announcements/${announcementId}/offers`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
