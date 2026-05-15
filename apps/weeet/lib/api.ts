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

// Service types that WeeeT technicians handle (walk_in excluded — shop handles in-store)
export const WEEET_SERVICE_TYPES = ["on_site", "pickup", "parcel"] as const;

// --- Repair API ---
export const repairApi = {
  listMyJobs: () =>
    apiFetch<RepairJob[]>(`${API_BASE}/repair/jobs/weeet/?service_type=on_site&service_type=pickup&service_type=parcel`),
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

// --- Parcel API (Phase C-1.4) ---
export const parcelApi = {
  inProgress: (id: string, fd: FormData) =>
    apiFetch<RepairJob>(`${API_BASE}/jobs/${id}/parcel/in-progress`, { method: "POST", body: fd }),
  tested: (id: string, fd: FormData) =>
    apiFetch<RepairJob>(`${API_BASE}/jobs/${id}/parcel/tested`, { method: "POST", body: fd }),
};

// --- Pickup API (Phase C-1.3) ---
export const pickupApi = {
  listPickupJobs: () =>
    apiFetch<RepairJob[]>(`${API_BASE}/jobs/me?service_type=pickup`),
  enRoutePickup: (id: string, body: { gps_location: { lat: number; lng: number } }) =>
    apiFetch<RepairJob>(`${API_BASE}/jobs/${id}/pickup/en-route`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  arrivedPickup: (id: string, fd: FormData) =>
    apiFetch<RepairJob>(`${API_BASE}/jobs/${id}/pickup/arrived`, { method: "POST", body: fd }),
  pickupReceipt: (id: string, fd: FormData) =>
    apiFetch<RepairJob>(`${API_BASE}/jobs/${id}/pickup/receipt`, { method: "POST", body: fd }),
  atShop: (id: string) =>
    apiFetch<RepairJob>(`${API_BASE}/jobs/${id}/pickup/at-shop`, { method: "POST" }),
  enRouteDelivery: (id: string, body: { gps_location: { lat: number; lng: number } }) =>
    apiFetch<RepairJob>(`${API_BASE}/jobs/${id}/delivery/en-route`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deliveryReceipt: (id: string, fd: FormData) =>
    apiFetch<RepairJob>(`${API_BASE}/jobs/${id}/delivery/receipt`, { method: "POST", body: fd }),
  deliveryComplete: (id: string) =>
    apiFetch<RepairJob>(`${API_BASE}/jobs/${id}/delivery/complete`, { method: "POST" }),
};

// --- Parts API (Phase C-2.2) ---
import type { MaintainJob, Part, PartsOrderDto, PartsOrderDetailDto, PartsOrderListDto } from "./types";

export const partsApi = {
  list: () => apiFetch<Part[]>(`${API_BASE}/parts/`),
  get: (id: string) => apiFetch<Part>(`${API_BASE}/parts/${id}/`),
};

// --- Maintain API (Phase C-2.1) ---

export const maintainApi = {
  listMyJobs: () =>
    apiFetch<MaintainJob[]>(`${API_BASE}/maintain/jobs/weeet/`),
  getJob: (id: string) =>
    apiFetch<MaintainJob>(`${API_BASE}/maintain/jobs/${id}/`),
  depart: (id: string, body: { departure_location: { lat: number; lng: number } }) =>
    apiFetch<MaintainJob>(`${API_BASE}/maintain/jobs/${id}/depart/`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  arrive: (id: string, fd: FormData) =>
    apiFetch<MaintainJob>(`${API_BASE}/maintain/jobs/${id}/arrive/`, { method: "POST", body: fd }),
  inProgress: (id: string, fd: FormData) =>
    apiFetch<MaintainJob>(`${API_BASE}/maintain/jobs/${id}/in-progress/`, { method: "POST", body: fd }),
  complete: (id: string, fd: FormData) =>
    apiFetch<MaintainJob>(`${API_BASE}/maintain/jobs/${id}/complete/`, { method: "POST", body: fd }),
  usePart: (id: string, body: { part_name: string; qty: number }) =>
    apiFetch<MaintainJob>(`${API_BASE}/maintain/jobs/${id}/use-part/`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// --- Parts B2B Orders API (Sub-8 Wave 3) ---
// WeeeT = Buyer role เท่านั้น (ห้าม seller actions)
export const partsOrdersApi = {
  /** POST /api/v1/parts/orders/ — สร้างคำสั่งซื้อ */
  createOrder: (body: { partId: string; quantity: number; serviceId?: string; idempotencyKey: string }) =>
    apiFetch<PartsOrderDto>(`${API_BASE}/parts/orders/`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** GET /api/v1/parts/orders/:id/ — ดูรายละเอียดออเดอร์ + audit trail */
  getOrder: (id: string) =>
    apiFetch<PartsOrderDetailDto>(`${API_BASE}/parts/orders/${id}/`),

  /** PATCH /api/v1/parts/orders/:id/close/ — buyer ยืนยันรับของ */
  closeOrder: (id: string) =>
    apiFetch<PartsOrderDto>(`${API_BASE}/parts/orders/${id}/close/`, { method: "PATCH" }),

  /** POST /api/v1/parts/orders/:id/dispute/ — buyer แจ้งข้อพิพาท */
  disputeOrder: (id: string, reason: string) =>
    apiFetch<PartsOrderDto>(`${API_BASE}/parts/orders/${id}/dispute/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  /** POST /api/v1/parts/orders/:id/rate/ — buyer ให้คะแนน seller (หลัง close) */
  rateOrder: (id: string, score: number, comment?: string) =>
    apiFetch<PartsOrderDto>(`${API_BASE}/parts/orders/${id}/rate/`, {
      method: "POST",
      body: JSON.stringify({ score, ...(comment ? { comment } : {}) }),
    }),

  /** GET /api/v1/parts/orders/ — list buyer's orders (Sub-9) */
  listMyOrders: (params?: { status?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.limit != null) qs.set("limit", String(params.limit));
    if (params?.offset != null) qs.set("offset", String(params.offset));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<PartsOrderListDto>(`${API_BASE}/parts/orders/${query}`);
  },
};
