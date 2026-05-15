/**
 * types/parts-b2b.ts — Sub-CMD-8 Wave 3: Parts Marketplace B2B types
 *
 * ★ SOURCE-OF-TRUTH (Lesson #34 / memory #26)
 *   WeeeR + WeeeT chats import จาก Backend เท่านั้น
 *
 * B2B Order flow:
 *   buyer สั่งซื้อ (pending) → escrow held (held)
 *   → seller ส่งของ (fulfilled) → buyer ยืนยัน (closed) → [rated]
 *   ↘ dispute (disputed) → admin resolve (resolved) → [refunded]
 */

// ── Enum strings ──────────────────────────────────────────────────────────────
export type PartsOrderStatus =
  | 'pending'
  | 'held'
  | 'fulfilled'
  | 'closed'
  | 'disputed'
  | 'resolved'
  | 'refunded'
  | 'cancelled'

export type PartsOrderEventType =
  | 'created'
  | 'held'
  | 'fulfilled'
  | 'closed'
  | 'disputed'
  | 'resolved_buyer'
  | 'resolved_seller'
  | 'refunded'
  | 'rated'
  | 'cancelled'

export type PartsDisputeStatus =
  | 'open'
  | 'admin_reviewing'
  | 'resolved_buyer'
  | 'resolved_seller'
  | 'withdrawn'

// ── Order Event DTO (audit trail) ─────────────────────────────────────────────
export interface PartsOrderEventDto {
  id: string
  orderId: string
  eventType: PartsOrderEventType
  actorId: string | null     // null = system
  oldStatus: string | null
  newStatus: string | null
  detail: string | null      // JSON metadata
  createdAt: string          // ISO-8601
}

// ── Parts Order DTO (B2B extended) ────────────────────────────────────────────
export interface PartsOrderDto {
  id: string
  partId: string
  buyerId: string
  serviceId: string | null
  quantity: number
  unitPriceThb: string       // numeric → string (JSON safe)
  totalThb: string
  status: PartsOrderStatus
  fulfillmentNote: string | null
  trackingNumber: string | null
  fulfilledAt: string | null // ISO-8601
  closedAt: string | null    // ISO-8601
  idempotencyKey: string
  createdAt: string
  updatedAt: string
}

// ── Parts Order Detail (with audit trail) ────────────────────────────────────
export interface PartsOrderDetailDto extends PartsOrderDto {
  events: PartsOrderEventDto[]
  dispute: PartsDisputeDto | null
  rating: PartsRatingDto | null
}

// ── Dispute DTO ───────────────────────────────────────────────────────────────
export interface PartsDisputeDto {
  id: string
  orderId: string
  raisedBy: string
  reason: string
  status: PartsDisputeStatus
  resolution: string | null
  resolvedBy: string | null
  createdAt: string
  resolvedAt: string | null
}

// ── Rating DTO ────────────────────────────────────────────────────────────────
export interface PartsRatingDto {
  id: string
  orderId: string
  ratedBy: string
  sellerId: string
  score: number              // 1–5
  comment: string | null
  createdAt: string
}

// ── Order List (GET /orders/) ─────────────────────────────────────────────────
export interface PartsOrderListDto {
  items: PartsOrderDto[]
  total: number
  limit: number
  offset: number
}

// ── Create Order Input (POST /orders) ────────────────────────────────────────
export interface CreatePartsOrderInput {
  partId: string
  quantity: number
  serviceId?: string
  idempotencyKey: string
}

// ── Fulfill Input (PATCH /orders/:id/fulfill) ────────────────────────────────
export interface FulfillOrderInput {
  fulfillmentNote?: string
  trackingNumber?: string
}

// ── Dispute Input (POST /orders/:id/dispute) ─────────────────────────────────
export interface CreateDisputeInput {
  reason: string
}

// ── Resolve Dispute Input (PATCH /orders/:id/dispute/resolve) ─────────────────
export interface ResolveDisputeInput {
  resolution: 'resolved_buyer' | 'resolved_seller'
  note: string
}

// ── Rate Input (POST /orders/:id/rate) ───────────────────────────────────────
export interface RateOrderInput {
  score: number    // 1–5
  comment?: string
}
