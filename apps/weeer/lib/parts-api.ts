// ── parts-api.ts — Sub-CMD-8 Wave 3: Parts B2B Marketplace ──────────────────
// Types aligned กับ Backend PartSchema + PartsOrderDto (apps/backend/src/types/parts-b2b.ts)
// SOURCE-OF-TRUTH: Backend Sub-CMD-8 type exports (Lesson #34)
//
// WeeeR ทำหน้าที่ได้ 2 บทบาท:
//   Seller — เพิ่ม/แก้ไข/ลบอะไหล่ใน inventory ตัวเอง
//   Buyer  — ค้นหา / ดูรายละเอียด / สั่งซื้ออะไหล่จาก seller อื่น
//
// API routes:
//   Seller: GET/POST /api/v1/parts/  |  GET/PATCH/DELETE /api/v1/parts/:id/
//   Buyer:  POST /api/v1/parts/orders/  |  PATCH /close/ + /fulfill/

import { apiFetch } from "./api-client";

// ── Types (aligned กับ Backend PartSchema) ────────────────────────────────────

export type PartCondition = "new" | "used" | "refurbished";

/** Part inventory item — ตรงกับ Backend PartSchema */
export interface Part {
  id: string;
  shopId: string;           // Backend ownerId → shopId
  name: string;
  sku: string | null;
  category: string | null;
  unit: string;
  condition: PartCondition;
  stockQty: number;
  reservedQty: number;
  unitPrice: number;        // number (not string) — Backend ส่ง number
  imageUrl: string | null;
  createdAt: string;        // ISO-8601
  updatedAt: string;        // ISO-8601
}

/** Dashboard stats — Backend GET /api/v1/parts/dashboard/ */
export interface PartsDashboard {
  total_skus: number;
  total_stock_value: number;
  low_stock: Part[];
  recent_movements: StockMovement[];
}

/** Stock movement (scaffold — no DB table yet) */
export interface StockMovement {
  id: string;
  partId: string;
  type: "STOCK_IN" | "STOCK_OUT" | "STOCK_ADJUSTMENT";
  qty: number;
  reason: string;
  refId: string | null;
  note: string | null;
  performedBy: string;
  performedAt: string;
  balanceAfter: number;
}

/** Create part payload — ตรงกับ Backend POST /api/v1/parts/ body */
export interface CreatePartPayload {
  name: string;
  description?: string;
  sku?: string;
  unitPrice: number;        // positive number
  stockQty?: number;        // default 0
  unit?: string;            // default 'piece'
  category?: string;
  condition?: PartCondition;
}

/** Update part payload — ตรงกับ Backend PATCH /api/v1/parts/:id/ body */
export interface UpdatePartPayload {
  name?: string;
  unitPrice?: number;
  stockQty?: number;
  category?: string;
  condition?: PartCondition;
}

// ── Order types (aligned กับ Backend parts-b2b.ts) ───────────────────────────

export type PartsOrderStatus =
  | "pending"
  | "held"
  | "fulfilled"
  | "closed"
  | "disputed"
  | "resolved"
  | "refunded"
  | "cancelled";

export type PartsOrderEventType =
  | "created"
  | "held"
  | "fulfilled"
  | "closed"
  | "disputed"
  | "resolved_buyer"
  | "resolved_seller"
  | "refunded"
  | "rated"
  | "cancelled";

/** PartsOrderDto — ตรงกับ Backend OrderSchema */
export interface PartsOrderDto {
  id: string;
  partId: string;
  buyerId: string;
  serviceId: string | null;
  quantity: number;
  unitPriceThb: string;     // numeric → string (JSON safe)
  totalThb: string;
  status: PartsOrderStatus;
  fulfillmentNote: string | null;
  trackingNumber: string | null;
  fulfilledAt: string | null;
  closedAt: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartsOrderEventDto {
  id: string;
  orderId: string;
  eventType: PartsOrderEventType;
  actorId: string | null;
  oldStatus: string | null;
  newStatus: string | null;
  detail: string | null;
  createdAt: string;
}

export interface PartsDisputeDto {
  id: string;
  orderId: string;
  raisedBy: string;
  reason: string;
  status: string;
  resolution: string | null;
  resolvedBy: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface PartsRatingDto {
  id: string;
  orderId: string;
  ratedBy: string;
  sellerId: string;
  score: number;    // 1–5
  comment: string | null;
  createdAt: string;
}

/** Order detail — includes events + dispute + rating */
export interface PartsOrderDetailDto extends PartsOrderDto {
  events: PartsOrderEventDto[];
  dispute: PartsDisputeDto | null;
  rating: PartsRatingDto | null;
}

/** Create order payload */
export interface CreatePartsOrderPayload {
  partId: string;
  quantity: number;
  serviceId?: string;
  idempotencyKey: string;
}

// ── Display helpers ────────────────────────────────────────────────────────────

export const CONDITION_LABEL: Record<PartCondition, string> = {
  new:         "ใหม่",
  used:        "มือสอง",
  refurbished: "ซ่อมแล้ว",
};

export const CONDITION_COLOR: Record<PartCondition, string> = {
  new:         "bg-green-100 text-green-700",
  used:        "bg-gray-100 text-gray-600",
  refurbished: "bg-blue-100 text-blue-700",
};

export const ORDER_STATUS_LABEL: Record<PartsOrderStatus, string> = {
  pending:   "รอชำระ",
  held:      "ถือ Escrow",
  fulfilled: "ส่งของแล้ว",
  closed:    "รับของแล้ว",
  disputed:  "มีข้อพิพาท",
  resolved:  "แก้ไขแล้ว",
  refunded:  "คืนเงินแล้ว",
  cancelled: "ยกเลิก",
};

export const ORDER_STATUS_COLOR: Record<PartsOrderStatus, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  held:      "bg-blue-100 text-blue-700",
  fulfilled: "bg-indigo-100 text-indigo-700",
  closed:    "bg-green-100 text-green-700",
  disputed:  "bg-red-100 text-red-700",
  resolved:  "bg-purple-100 text-purple-700",
  refunded:  "bg-orange-100 text-orange-700",
  cancelled: "bg-gray-100 text-gray-500",
};

// ── Seller API functions ───────────────────────────────────────────────────────

/**
 * GET /api/v1/parts/ — list own inventory (seller)
 */
export async function listMyParts(params?: {
  category?: string;
  search?: string;
}): Promise<Part[]> {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.search)   qs.set("search", params.search);

  const url = `/api/v1/parts/${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await apiFetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(data.detail ?? `โหลดรายการอะไหล่ล้มเหลว (HTTP ${res.status})`);
  }
  return res.json() as Promise<Part[]>;
}

/**
 * POST /api/v1/parts/ — create new part (seller)
 */
export async function createPart(payload: CreatePartPayload): Promise<Part> {
  const res = await apiFetch("/api/v1/parts/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(data.detail ?? `สร้างรายการอะไหล่ล้มเหลว (HTTP ${res.status})`);
  }
  return res.json() as Promise<Part>;
}

/**
 * GET /api/v1/parts/:id/ — get single part
 */
export async function getPart(id: string): Promise<Part> {
  const res = await apiFetch(`/api/v1/parts/${encodeURIComponent(id)}/`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(data.detail ?? `ไม่พบอะไหล่ (HTTP ${res.status})`);
  }
  return res.json() as Promise<Part>;
}

/**
 * PATCH /api/v1/parts/:id/ — update part (seller)
 */
export async function updatePart(id: string, payload: UpdatePartPayload): Promise<Part> {
  const res = await apiFetch(`/api/v1/parts/${encodeURIComponent(id)}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(data.detail ?? `อัพเดตอะไหล่ล้มเหลว (HTTP ${res.status})`);
  }
  return res.json() as Promise<Part>;
}

/**
 * DELETE /api/v1/parts/:id/ — delete part (seller)
 */
export async function deletePart(id: string): Promise<void> {
  const res = await apiFetch(`/api/v1/parts/${encodeURIComponent(id)}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(data.detail ?? `ลบอะไหล่ล้มเหลว (HTTP ${res.status})`);
  }
}

/**
 * GET /api/v1/parts/dashboard/ — seller dashboard stats
 */
export async function getPartsDashboard(): Promise<PartsDashboard> {
  const res = await apiFetch("/api/v1/parts/dashboard/");
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(data.detail ?? `โหลด dashboard ล้มเหลว (HTTP ${res.status})`);
  }
  return res.json() as Promise<PartsDashboard>;
}

// ── Buyer API functions ────────────────────────────────────────────────────────

/**
 * POST /api/v1/parts/orders/ — create B2B parts order + escrow hold
 */
export async function createPartsOrder(
  payload: CreatePartsOrderPayload,
): Promise<PartsOrderDto> {
  const res = await apiFetch("/api/v1/parts/orders/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(data.detail ?? `สั่งซื้ออะไหล่ล้มเหลว (HTTP ${res.status})`);
  }
  return res.json() as Promise<PartsOrderDto>;
}

/**
 * GET /api/v1/parts/orders/:id/ — get order detail (buyer / seller)
 */
export async function getPartsOrderDetail(id: string): Promise<PartsOrderDetailDto> {
  const res = await apiFetch(`/api/v1/parts/orders/${encodeURIComponent(id)}/`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(data.detail ?? `ไม่พบคำสั่งซื้อ (HTTP ${res.status})`);
  }
  return res.json() as Promise<PartsOrderDetailDto>;
}

/**
 * PATCH /api/v1/parts/orders/:id/fulfill/ — seller ยืนยันส่งของ
 */
export async function fulfillPartsOrder(
  id: string,
  input?: { fulfillmentNote?: string; trackingNumber?: string },
): Promise<PartsOrderDto> {
  const res = await apiFetch(`/api/v1/parts/orders/${encodeURIComponent(id)}/fulfill/`, {
    method: "PATCH",
    body: JSON.stringify(input ?? {}),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(data.detail ?? `ยืนยันส่งของล้มเหลว (HTTP ${res.status})`);
  }
  return res.json() as Promise<PartsOrderDto>;
}

/**
 * PATCH /api/v1/parts/orders/:id/close/ — buyer ยืนยันรับของ + escrow release
 */
export async function closePartsOrder(id: string): Promise<PartsOrderDto> {
  const res = await apiFetch(`/api/v1/parts/orders/${encodeURIComponent(id)}/close/`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(data.detail ?? `ยืนยันรับของล้มเหลว (HTTP ${res.status})`);
  }
  return res.json() as Promise<PartsOrderDto>;
}
