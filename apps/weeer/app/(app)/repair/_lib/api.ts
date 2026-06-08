import type { RepairJob, RepairAnnouncement, RepairDashboard, WalkInJob, WalkInQueue, PickupJob, PickupQueue, WeeeTStaff, ParcelJob, ParcelQueue } from "./types";
import type { ScrapJob } from "../../scrap/_lib/types";
// RC-1: Mock fallback data (dev/offline)
import {
  MOCK_REPAIR_DASHBOARD,
  MOCK_REPAIR_JOBS,
  MOCK_REPAIR_ANNOUNCEMENTS,
  MOCK_WALKIN_QUEUE,
  MOCK_PICKUP_QUEUE,
  MOCK_WEEET_STAFF,
  MOCK_PARCEL_QUEUE,
} from "./mock";
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
  getDashboard: async () => {
    try { return await apiFetch<RepairDashboard>("/repair/dashboard"); }
    catch (err) { console.warn("[mock fallback] repair.getDashboard", err); return MOCK_REPAIR_DASHBOARD; }
  },

  getJobs: async (params?: { status?: string }) => {
    const qs = new URLSearchParams({ service_type: "on_site", ...(params ?? {}) });
    try { return await apiFetch<RepairJob[]>(`/repair/jobs?${qs}`); }
    catch (err) { console.warn("[mock fallback] repair.getJobs", err); return MOCK_REPAIR_JOBS; }
  },

  getJob: async (id: string) => {
    try { return await apiFetch<RepairJob>(`/repair/jobs/${id}`); }
    catch (err) { console.warn("[mock fallback] repair.getJob", err); return MOCK_REPAIR_JOBS.find(j => j.id === id) ?? MOCK_REPAIR_JOBS[0]; }
  },

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

  getAnnouncements: async () => {
    const qs = new URLSearchParams({ service_type: "on_site", unmatched: "true" });
    try { return await apiFetch<RepairAnnouncement[]>(`/repair/announcements?${qs}`); }
    catch (err) { console.warn("[mock fallback] repair.getAnnouncements", err); return MOCK_REPAIR_ANNOUNCEMENTS; }
  },

  getAnnouncement: async (id: string) => {
    try { return await apiFetch<RepairAnnouncement>(`/repair/announcements/${id}`); }
    catch (err) { console.warn("[mock fallback] repair.getAnnouncement", err); return MOCK_REPAIR_ANNOUNCEMENTS.find(a => a.id === id) ?? MOCK_REPAIR_ANNOUNCEMENTS[0]; }
  },

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

  getWalkInQueue: async () => {
    try { return await apiFetch<WalkInQueue>("/repair/walk-in/queue"); }
    catch (err) { console.warn("[mock fallback] repair.getWalkInQueue", err); return MOCK_WALKIN_QUEUE; }
  },

  getWalkIn: async (id: string) => {
    try { return await apiFetch<WalkInJob>(`/repair/walk-in/${id}`); }
    catch (err) { console.warn("[mock fallback] repair.getWalkIn", err); return MOCK_WALKIN_QUEUE.items.find(w => w.id === id) ?? MOCK_WALKIN_QUEUE.items[0]; }
  },

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

  getStorageFee: async (id: string) => {
    try { return await apiFetch<{ fee_accrued: number; days: number; rate: number }>(`/repair/walk-in/${id}/storage-fee`); }
    catch (err) { console.warn("[mock fallback] repair.getStorageFee", err); return { fee_accrued: 0, days: 0, rate: 5 }; }
  },

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

  getPickupQueue: async () => {
    try { return await apiFetch<PickupQueue>("/repair/shops/me/pickup-queue"); }
    catch (err) { console.warn("[mock fallback] repair.getPickupQueue", err); return MOCK_PICKUP_QUEUE; }
  },

  getPickupJob: async (id: string) => {
    try { return await apiFetch<PickupJob>(`/repair/jobs/${id}`); }
    catch (err) { console.warn("[mock fallback] repair.getPickupJob", err); return MOCK_PICKUP_QUEUE.items.find(p => p.id === id) ?? MOCK_PICKUP_QUEUE.items[0]; }
  },

  getAvailableStaff: async () => {
    try { return await apiFetch<WeeeTStaff[]>("/repair/shops/me/available-staff"); }
    catch (err) { console.warn("[mock fallback] repair.getAvailableStaff", err); return MOCK_WEEET_STAFF; }
  },

  dispatchPickup: (id: string, body: {
    tech_id: string;
    scheduled_pickup_time: string;
  }) =>
    apiFetch<PickupJob>(`/repair/jobs/${id}/dispatch`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  trackPickup: async (id: string) => {
    try { return await apiFetch<{ job: PickupJob; timeline: { status: string; timestamp: string; note?: string }[] }>(`/repair/jobs/${id}/track`); }
    catch (err) {
      console.warn("[mock fallback] repair.trackPickup", err);
      const job = MOCK_PICKUP_QUEUE.items.find(p => p.id === id) ?? MOCK_PICKUP_QUEUE.items[0];
      return { job, timeline: [{ status: job.status, timestamp: job.created_at, note: "mock fallback" }] };
    }
  },

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

  getParcelQueue: async () => {
    try { return await apiFetch<ParcelQueue>("/repair/shops/me/parcel-queue"); }
    catch (err) { console.warn("[mock fallback] repair.getParcelQueue", err); return MOCK_PARCEL_QUEUE; }
  },

  getParcelJob: async (id: string) => {
    try { return await apiFetch<ParcelJob>(`/repair/jobs/${id}`); }
    catch (err) { console.warn("[mock fallback] repair.getParcelJob", err); return MOCK_PARCEL_QUEUE.items.find(p => p.id === id) ?? MOCK_PARCEL_QUEUE.items[0]; }
  },

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

  // ── D64: Create RepairJob from ScrapJob (Phase C-3.3) ─────────────────────
  // source: { type: "purchased_scrap", refId: scrapJob.id } — set automatically
  createFromScrap(scrapJob: ScrapJob, formData: {
    appliance_name: string;
    weeet_id: string;
    scheduled_at: string;
    original_price: number;
    decision_notes?: string;
  }): Promise<RepairJob> {
    return apiFetch<RepairJob>("/repair/jobs", {
      method: "POST",
      body: JSON.stringify({
        appliance_name: formData.appliance_name,
        weeet_id: formData.weeet_id,
        scheduled_at: formData.scheduled_at,
        original_price: formData.original_price,
        decision_notes: formData.decision_notes,
        service_type: "on_site",
        customer_name: "WeeeR Internal",
        customer_address: "",
        source: {
          type: "purchased_scrap",
          refId: scrapJob.id,
        },
      }),
    });
  },
};
