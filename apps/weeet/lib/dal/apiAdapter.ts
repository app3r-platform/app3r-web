/**
 * apps/weeet/lib/dal/apiAdapter.ts
 * Phase D-2 — WeeeT API adapter (implement จริง)
 * @needs-backend-sync markers = รอ Backend Sub-CMD-P1
 */

import type {
  WeeeTDAL, Result, JobAssignRecord, JobProgressRecord, TechnicianRecord,
  WarrantyRecord, WalletBalance, WalletTransaction, UploadedFile,
  PushSubscriptionData, PushSubscriptionStatus, LiveLocationUpdate,
} from "./types";
import { NotImplementedError } from "./errors";

const API_BASE = "/api/v1";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...((options?.headers as Record<string, string>) ?? {}),
  };
  if (typeof window !== "undefined") {
    try {
      const session = sessionStorage.getItem("weeet_auth");
      if (session) {
        const parsed = JSON.parse(session) as { token?: string };
        if (parsed.token) headers["Authorization"] = `Bearer ${parsed.token}`;
      }
    } catch { /* no token */ }
  }
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function apiCall<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

const jobAssignApi = {
  async getAssignedJobs(technicianId: string): Promise<Result<JobAssignRecord[]>> {
    return apiCall(async () => {
      // Sub-4 Wave 2: includes new services table fields (title, description, point_amount, deadline)
      const raw = await apiFetch<{
        id: string; technician_id: string; status: string;
        scheduled_at?: string; customer_name?: string;
        appliance_name?: string; service_type?: string;
        // New fields from Sub-4 services table expand
        title?: string; description?: string;
        point_amount?: number; deadline?: string;
      }[]>(
        `${API_BASE}/repair/jobs/weeet/?technician_id=${technicianId}`
      );
      return raw.map((j) => ({
        jobId: j.id, technicianId: j.technician_id ?? technicianId,
        status: j.status, scheduledAt: j.scheduled_at,
        customerName: j.customer_name, applianceName: j.appliance_name,
        serviceType: j.service_type,
        // Sub-4 new fields
        title: j.title, description: j.description,
        pointAmount: j.point_amount, deadline: j.deadline,
      }));
    });
  },
  async updateJobStatus(jobId: string, status: string): Promise<Result<void>> {
    return apiCall(async () => {
      await apiFetch(`${API_BASE}/repair/jobs/${jobId}/status/`, { method: "POST", body: JSON.stringify({ status }) });
    });
  },
};

const jobStatusApi = {
  async getJobProgress(jobId: string): Promise<Result<JobProgressRecord | null>> {
    return apiCall(async () => {
      const raw = await apiFetch<{ job_id: string; current_stage: string; current_sub_stage?: string; updated_at: string } | null>(
        `${API_BASE}/jobs/${jobId}/progress/`
      );
      if (!raw) return null;
      return { jobId: raw.job_id, currentStage: raw.current_stage, currentSubStage: raw.current_sub_stage, updatedAt: raw.updated_at };
    });
  },
  async advanceSubStage(jobId: string, subStage: string, step: unknown): Promise<Result<void>> {
    return apiCall(async () => {
      await apiFetch(`${API_BASE}/jobs/${jobId}/advance-stage/`, { method: "POST", body: JSON.stringify({ sub_stage: subStage, step }) });
    });
  },
  async markCompleted(jobId: string, step: unknown): Promise<Result<void>> {
    return apiCall(async () => {
      await apiFetch(`${API_BASE}/repair/jobs/${jobId}/complete/`, { method: "POST", body: JSON.stringify({ step }) });
    });
  },
};

const technicianApi = {
  async getProfile(technicianId: string): Promise<Result<TechnicianRecord | null>> {
    return apiCall(async () => {
      const raw = await apiFetch<{ id: string; name: string; phone: string; shop_id: string; shop_name?: string; specialties?: string[]; home_base_lat?: number; home_base_lng?: number; service_radius_km?: number } | null>(
        `${API_BASE}/technicians/${technicianId}/profile`
      );
      if (!raw) return null;
      return { id: raw.id, name: raw.name, phone: raw.phone, shopId: raw.shop_id, shopName: raw.shop_name, specialties: raw.specialties, homeBaseLat: raw.home_base_lat, homeBaseLng: raw.home_base_lng, serviceRadiusKm: raw.service_radius_km };
    });
  },
  async updateProfile(technicianId: string, data: Partial<TechnicianRecord>): Promise<Result<void>> {
    return apiCall(async () => {
      await apiFetch(`${API_BASE}/technicians/${technicianId}/profile`, {
        method: "PUT",
        body: JSON.stringify({ name: data.name, phone: data.phone, shop_id: data.shopId, shop_name: data.shopName, specialties: data.specialties, home_base_lat: data.homeBaseLat, home_base_lng: data.homeBaseLng, service_radius_km: data.serviceRadiusKm }),
      });
    });
  },
};

const warrantyApi = {
  async getWarranty(jobId: string): Promise<Result<WarrantyRecord | null>> {
    return apiCall(async () => {
      const raw = await apiFetch<{ job_id: string; expires_at: string; terms: string } | null>(`${API_BASE}/jobs/${jobId}/warranty`);
      if (!raw) return null;
      return { jobId: raw.job_id, expiresAt: raw.expires_at, terms: raw.terms };
    });
  },
};

// @needs-backend-sync: GET /api/v1/wallets/me/balance|transactions
const paymentApi = {
  async getWalletBalance(): Promise<Result<WalletBalance>> {
    return apiCall(async () => {
      const raw = await apiFetch<{ available: number; pending: number; currency: string; updated_at: string }>(`${API_BASE}/wallets/me/balance`);
      return { available: raw.available, pending: raw.pending, currency: raw.currency, updatedAt: raw.updated_at };
    });
  },
  async getTransactions(limit = 20): Promise<Result<WalletTransaction[]>> {
    return apiCall(async () => {
      const raw = await apiFetch<{ id: string; type: "credit" | "debit"; amount: number; description: string; job_id?: string; created_at: string }[]>(
        `${API_BASE}/wallets/me/transactions?limit=${limit}`
      );
      return raw.map((t) => ({ id: t.id, type: t.type, amount: t.amount, description: t.description, jobId: t.job_id, createdAt: t.created_at }));
    });
  },
};

const uploadApi = {
  async uploadServicePhoto(jobId: string, file: File, caption?: string): Promise<Result<UploadedFile>> {
    return apiCall(async () => {
      const fd = new FormData();
      fd.append("file", file);
      if (caption) fd.append("caption", caption);
      const raw = await apiFetch<{ file_id: string; url: string; mime_type: string; size_bytes: number; uploaded_at: string }>(`${API_BASE}/jobs/${jobId}/photos`, { method: "POST", body: fd });
      return { fileId: raw.file_id, url: raw.url, mimeType: raw.mime_type, sizeBytes: raw.size_bytes, uploadedAt: raw.uploaded_at };
    });
  },
  async uploadReceipt(jobId: string, file: File): Promise<Result<UploadedFile>> {
    return apiCall(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const raw = await apiFetch<{ file_id: string; url: string; mime_type: string; size_bytes: number; uploaded_at: string }>(`${API_BASE}/jobs/${jobId}/receipts`, { method: "POST", body: fd });
      return { fileId: raw.file_id, url: raw.url, mimeType: raw.mime_type, sizeBytes: raw.size_bytes, uploadedAt: raw.uploaded_at };
    });
  },
};

// @needs-backend-sync: POST /api/v1/notifications/push/subscribe|unsubscribe|status
const pushApi = {
  async subscribePush(subscription: PushSubscriptionData): Promise<Result<void>> {
    return apiCall(async () => {
      await apiFetch(`${API_BASE}/notifications/push/subscribe`, { method: "POST", body: JSON.stringify(subscription) });
    });
  },
  async unsubscribePush(): Promise<Result<void>> {
    return apiCall(async () => {
      await apiFetch(`${API_BASE}/notifications/push/unsubscribe`, { method: "POST" });
    });
  },
  async getSubscriptionStatus(): Promise<Result<PushSubscriptionStatus>> {
    return apiCall(async () => {
      const raw = await apiFetch<{ is_subscribed: boolean; endpoint?: string }>(`${API_BASE}/notifications/push/status`);
      return { isSubscribed: raw.is_subscribed, endpoint: raw.endpoint };
    });
  },
};

// @needs-backend-sync: POST /api/v1/location/live → broadcast via WebSocket to WeeeU
const liveLocationApi = {
  async emitLocation(update: LiveLocationUpdate): Promise<Result<void>> {
    return apiCall(async () => {
      await apiFetch(`${API_BASE}/location/live`, {
        method: "POST",
        body: JSON.stringify({ service_id: update.serviceId, lat: update.lat, lng: update.lng, timestamp: update.timestamp, accuracy: update.accuracy }),
      });
    });
  },
  async saveConsentStatus(technicianId: string, consented: boolean): Promise<Result<void>> {
    return apiCall(async () => {
      if (typeof window !== "undefined") {
        localStorage.setItem(`weeet_location_consent_${technicianId}`, String(consented));
      }
      await apiFetch(`${API_BASE}/technicians/${technicianId}/location-consent`, { method: "POST", body: JSON.stringify({ consented }) });
    });
  },
  async getConsentStatus(technicianId: string): Promise<Result<boolean>> {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(`weeet_location_consent_${technicianId}`);
        if (stored !== null) return { ok: true, data: stored === "true" };
      }
      const raw = await apiFetch<{ consented: boolean }>(`${API_BASE}/technicians/${technicianId}/location-consent`);
      return { ok: true, data: raw.consented };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
};

export const apiAdapter: WeeeTDAL = {
  jobAssign: jobAssignApi,
  jobStatus: jobStatusApi,
  technician: technicianApi,
  warranty: warrantyApi,
  payment: paymentApi,
  upload: uploadApi,
  push: pushApi,
  liveLocation: liveLocationApi,
};

export { NotImplementedError };
