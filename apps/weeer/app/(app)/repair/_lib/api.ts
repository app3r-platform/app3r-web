import type { RepairJob, RepairAnnouncement, RepairDashboard, WalkInJob, WalkInQueue, PickupJob, PickupQueue, WeeeTStaff, ParcelJob, ParcelQueue } from "./types";
// TODO: REMOVE BEFORE PROD — dev auth bypass
import { getDevTestToken } from "../../../../lib/dev-auth";

const BASE = "/api/v1";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // TODO: REMOVE BEFORE PROD — dev auth bypass
  const token =
    process.env.NODE_ENV === "development"
      ? await getDevTestToken()
      : null; // production จะใช้ token จริงจาก auth-context

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

  // ── Walk-in ────────────────────────────────────────────────────────────────

  getWalkInQueue: () =>
    apiFetch<WalkInQueue>("/repair/walk-in/queue"),

  getWalkIn: (id: string) =>
    apiFetch<WalkInJob>(`/repair/walk-in/${id}`),

  receiveWalkIn: (id: string, body: {
    customer_name: string;
    customer_phone: string;
    appliance_name: string;
    problem_description: string;
    intake_files?: string[];
  }) =>
    apiFetch<WalkInJob>(`/repair/walk-in/${id}/receive`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  inspectWalkIn: (id: string, body: {
    diagnosis_notes: string;
    estimated_price: number;
    parts_added?: { name: string; qty: number; price: number }[];
  }) =>
    apiFetch<WalkInJob>(`/repair/walk-in/${id}/inspect`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  startWalkIn: (id: string) =>
    apiFetch<WalkInJob>(`/repair/walk-in/${id}/start`, { method: "POST", body: JSON.stringify({}) }),

  readyWalkIn: (id: string) =>
    apiFetch<WalkInJob>(`/repair/walk-in/${id}/ready`, { method: "POST", body: JSON.stringify({}) }),

  getStorageFee: (id: string) =>
    apiFetch<{ fee_accrued: number; days: number; rate: number }>(`/repair/walk-in/${id}/storage-fee`),

  abandonWalkIn: (id: string, body: {
    grace_days: 7 | 14 | 30;
    action: "scrap" | "disposal";
    notes?: string;
  }) =>
    apiFetch<WalkInJob>(`/repair/walk-in/${id}/abandon`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // ── Pickup ─────────────────────────────────────────────────────────────────

  getPickupQueue: () =>
    apiFetch<PickupQueue>("/repair/shops/me/pickup-queue"),

  getPickupJob: (id: string) =>
    apiFetch<PickupJob>(`/repair/jobs/${id}`),

  getAvailableStaff: () =>
    apiFetch<WeeeTStaff[]>("/repair/shops/me/available-staff"),

  dispatchPickup: (id: string, body: {
    tech_id: string;
    scheduled_pickup_time: string;
  }) =>
    apiFetch<PickupJob>(`/repair/jobs/${id}/dispatch`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  trackPickup: (id: string) =>
    apiFetch<{ job: PickupJob; timeline: { status: string; timestamp: string; note?: string }[] }>(
      `/repair/jobs/${id}/track`
    ),

  intakePickup: (id: string, body: {
    condition_notes: string;
    intake_photos?: string[];
  }) =>
    apiFetch<PickupJob>(`/repair/jobs/${id}/intake`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  diagnosePickup: (id: string, body: {
    diagnosis_notes: string;
    parts: { name: string; qty: number; price: number }[];
    total_cost: number;
  }) =>
    apiFetch<PickupJob>(`/repair/jobs/${id}/diagnose`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  dispatchDelivery: (id: string, body: {
    tech_id: string;
    scheduled_delivery_time: string;
  }) =>
    apiFetch<PickupJob>(`/repair/jobs/${id}/dispatch-delivery`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // ── Parcel ─────────────────────────────────────────────────────────────────

  getParcelQueue: () =>
    apiFetch<ParcelQueue>("/repair/shops/me/parcel-queue"),

  getParcelJob: (id: string) =>
    apiFetch<ParcelJob>(`/repair/jobs/${id}`),

  confirmShippingDetails: (id: string, body: {
    shop_address: string;
    courier: string;
    cost_split: "customer" | "shop" | "split";
    notes?: string;
  }) =>
    apiFetch<ParcelJob>(`/repair/jobs/${id}/parcel/shipping-details`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  receiveParcel: (id: string, body: {
    receive_photos?: string[];
    inbound_tracking?: string;
    condition_notes?: string;
  }) =>
    apiFetch<ParcelJob>(`/repair/jobs/${id}/parcel/receive`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  inspectParcel: (id: string, body: {
    condition_notes: string;
    inspect_photos?: string[];
    estimated_price?: number;
    parts_added?: { name: string; qty: number; price: number }[];
  }) =>
    apiFetch<ParcelJob>(`/repair/jobs/${id}/parcel/inspect`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  dispatchParcelTech: (id: string, body: { tech_id: string }) =>
    apiFetch<ParcelJob>(`/repair/jobs/${id}/parcel/dispatch-tech`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  shipBack: (id: string, body: {
    return_tracking: string;
    post_photos?: string[];
    packing_photos?: string[];
  }) =>
    apiFetch<ParcelJob>(`/repair/jobs/${id}/parcel/ship-back`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
