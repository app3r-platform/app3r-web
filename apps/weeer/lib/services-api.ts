// ── services-api.ts — Sub-CMD-4 Wave 2: Services Table Full Expand ────────────
// WeeeR service record adapter — /api/v1/services/ (Backend Sub-CMD-4)
//
// NOTE: @app3r/dal ยังไม่ export IServiceDAL (รอ Backend PR merge)
// → ใช้ local types + standalone module — Sub-CMD-4 decision
//
// Fields ใหม่ (ALTER ADD COLUMN):
//   title        — ชื่อ service แสดงใน card/list
//   description  — รายละเอียดงาน
//   pointAmount  — มูลค่างาน (numeric string จาก API)
//   deadline     — กำหนดเสร็จ (ISO datetime)

import { apiFetch } from "./api-client";

// ── Types ──────────────────────────────────────────────────────────────────────

export type ServiceType = "repair" | "maintain" | "resell" | "scrap";
export type ServiceStatus = "draft" | "published" | "in_progress" | "completed" | "cancelled";

/** Service record — ตรงกับ Backend ServiceSchema (Sub-CMD-4) */
export interface ServiceRecord {
  id: string;
  ownerId: string;
  serviceType: ServiceType;
  status: ServiceStatus;
  // Sub-CMD-4: new fields
  title: string | null;
  description: string | null;
  pointAmount: string | null;   // numeric(12,2) → string จาก JSON
  deadline: string | null;       // ISO datetime
  createdAt: string;
  updatedAt: string;
}

export interface ServiceListResult {
  items: ServiceRecord[];
  total: number;
}

/** Payload สำหรับสร้าง/แก้ไข service */
export interface ServiceUpsertPayload {
  serviceType?: ServiceType;
  title?: string;
  description?: string;
  pointAmount?: number;   // FE ส่ง number → API เก็บเป็น numeric
  deadline?: string;      // ISO datetime string
}

// ── Display helpers ────────────────────────────────────────────────────────────

export const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  repair:   "ซ่อมอุปกรณ์",
  maintain: "ล้างบำรุงรักษา",
  resell:   "ขายต่อ",
  scrap:    "ซากเครื่อง",
};

export const SERVICE_STATUS_LABEL: Record<ServiceStatus, string> = {
  draft:       "ร่าง",
  published:   "เผยแพร่",
  in_progress: "กำลังดำเนินการ",
  completed:   "เสร็จสิ้น",
  cancelled:   "ยกเลิก",
};

export const SERVICE_STATUS_COLOR: Record<ServiceStatus, string> = {
  draft:       "bg-gray-100 text-gray-600",
  published:   "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed:   "bg-emerald-100 text-emerald-700",
  cancelled:   "bg-red-100 text-red-600",
};

// ── API functions ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/services/ — สร้าง service record (draft)
 */
export async function createService(payload: {
  serviceType: ServiceType;
  title?: string;
  description?: string;
  pointAmount?: number;
  deadline?: string;
}): Promise<ServiceRecord> {
  const res = await apiFetch("/api/v1/services/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail ?? `สร้าง service ล้มเหลว (HTTP ${res.status})`);
  }
  return res.json() as Promise<ServiceRecord>;
}

/**
 * GET /api/v1/services/ — list services (filter ตาม status, type, pagination)
 */
export async function listServices(params?: {
  status?: ServiceStatus;
  type?: ServiceType;
  limit?: number;
  offset?: number;
}): Promise<ServiceListResult> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.type)   qs.set("type",   params.type);
  if (params?.limit != null)  qs.set("limit",  String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));

  const url = `/api/v1/services/${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await apiFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail ?? `โหลด services ล้มเหลว (HTTP ${res.status})`);
  }
  return res.json() as Promise<ServiceListResult>;
}

/**
 * GET /api/v1/services/:id/ — get service by ID
 */
export async function getService(id: string): Promise<ServiceRecord> {
  const res = await apiFetch(`/api/v1/services/${encodeURIComponent(id)}/`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail ?? `ไม่พบ service (HTTP ${res.status})`);
  }
  return res.json() as Promise<ServiceRecord>;
}

/**
 * PATCH /api/v1/services/:id/ — อัพเดต fields (title, description, pointAmount, deadline)
 */
export async function updateService(
  id: string,
  payload: ServiceUpsertPayload,
): Promise<ServiceRecord> {
  const res = await apiFetch(`/api/v1/services/${encodeURIComponent(id)}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail ?? `อัพเดต service ล้มเหลว (HTTP ${res.status})`);
  }
  return res.json() as Promise<ServiceRecord>;
}

/**
 * PATCH /api/v1/services/:id/status/ — อัพเดต status เท่านั้น
 */
export async function updateServiceStatus(
  id: string,
  status: ServiceStatus,
): Promise<ServiceRecord> {
  const res = await apiFetch(`/api/v1/services/${encodeURIComponent(id)}/status/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail ?? `อัพเดต status ล้มเหลว (HTTP ${res.status})`);
  }
  return res.json() as Promise<ServiceRecord>;
}

/**
 * DELETE /api/v1/services/:id/ — ลบ service (owner เท่านั้น)
 */
export async function deleteService(id: string): Promise<void> {
  const res = await apiFetch(`/api/v1/services/${encodeURIComponent(id)}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail ?? `ลบ service ล้มเหลว (HTTP ${res.status})`);
  }
}
