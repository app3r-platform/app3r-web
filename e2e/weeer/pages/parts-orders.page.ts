/**
 * e2e/weeer/pages/parts-orders.page.ts — WeeeR Parts B2B Page Object Model
 *
 * Page Object สำหรับ Parts B2B Order API endpoints
 * ใช้กับ Sub-CMD-9 WeeeR E2E tests
 *
 * Security Rule #5: ทุก action ผ่าน Bearer token เสมอ
 */
import type { APIRequestContext } from '@playwright/test'
import { authGet, authPost, authPatch } from '../../shared/auth'

// ── Types ──────────────────────────────────────────────────────────────────────
export interface CreatePartPayload {
  name: string
  unitPrice: number
  stockQty?: number
  sku?: string
  category?: string
  condition?: 'new' | 'used' | 'refurbished'
  unit?: string
}

export interface CreateOrderPayload {
  partId: string
  quantity: number
  idempotencyKey: string
  serviceId?: string
}

// ── Page Object ────────────────────────────────────────────────────────────────
export class PartsOrdersPage {
  constructor(private api: APIRequestContext) {}

  // ── Seller: Part Inventory ──────────────────────────────────────────────────

  /** POST /api/v1/parts/ — create part listing */
  async createPart(token: string, payload: CreatePartPayload) {
    return authPost(this.api, '/api/v1/parts/', token, payload)
  }

  /** GET /api/v1/parts/ — list own parts */
  async listMyParts(token: string, params?: Record<string, string>) {
    return authGet(this.api, '/api/v1/parts/', token, params)
  }

  /** GET /api/v1/parts/:id/ — get single part */
  async getPart(token: string, partId: string) {
    return authGet(this.api, `/api/v1/parts/${partId}/`, token)
  }

  // ── Buyer: Orders ───────────────────────────────────────────────────────────

  /** POST /api/v1/parts/orders/ — create B2B order + escrow hold */
  async createOrder(token: string, payload: CreateOrderPayload) {
    return authPost(this.api, '/api/v1/parts/orders/', token, payload)
  }

  /** GET /api/v1/parts/orders/ — list orders */
  async listOrders(token: string, params?: Record<string, string>) {
    return authGet(this.api, '/api/v1/parts/orders/', token, params)
  }

  /** GET /api/v1/parts/orders/:id/ — get order detail */
  async getOrderDetail(token: string, orderId: string) {
    return authGet(this.api, `/api/v1/parts/orders/${orderId}/`, token)
  }

  /** PATCH /api/v1/parts/orders/:id/fulfill/ — seller ยืนยันส่งของ */
  async fulfillOrder(
    token: string,
    orderId: string,
    payload: { fulfillmentNote?: string; trackingNumber?: string } = {},
  ) {
    return authPatch(this.api, `/api/v1/parts/orders/${orderId}/fulfill/`, token, payload)
  }

  /** PATCH /api/v1/parts/orders/:id/close/ — buyer ยืนยันรับของ */
  async closeOrder(token: string, orderId: string) {
    return authPatch(this.api, `/api/v1/parts/orders/${orderId}/close/`, token, {})
  }

  /** POST /api/v1/parts/orders/:id/dispute/ — buyer แจ้งปัญหา */
  async raiseDispute(token: string, orderId: string, reason: string) {
    return authPost(this.api, `/api/v1/parts/orders/${orderId}/dispute/`, token, { reason })
  }

  /** POST /api/v1/parts/orders/:id/rate/ — buyer ให้คะแนน */
  async rateOrder(token: string, orderId: string, score: number, comment?: string) {
    return authPost(this.api, `/api/v1/parts/orders/${orderId}/rate/`, token, {
      score,
      ...(comment ? { comment } : {}),
    })
  }
}
