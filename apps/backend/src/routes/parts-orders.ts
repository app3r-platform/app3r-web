/**
 * parts-orders.ts — Sub-CMD-8 Wave 3: Parts B2B Order API
 *
 * POST   /api/v1/parts/orders/                    — สร้าง B2B order + escrow hold
 * GET    /api/v1/parts/orders/:id/                — ดูสถานะ + audit trail
 * PATCH  /api/v1/parts/orders/:id/fulfill/        — seller ยืนยันส่งของ
 * PATCH  /api/v1/parts/orders/:id/close/          — buyer ยืนยันรับของ
 * POST   /api/v1/parts/orders/:id/dispute/        — buyer แจ้งปัญหา
 * PATCH  /api/v1/parts/orders/:id/dispute/resolve/ — admin แก้ไขข้อพิพาท (R3)
 * POST   /api/v1/parts/orders/:id/rate/           — buyer ให้คะแนน seller
 *
 * Auth: Bearer JWT required (role checks TODO D-4)
 * Security Rule #5: audit event ทุก transition (ใน DAL)
 * Error format: { detail: "..." } (Django-style)
 *
 * Sub-CMD-8: 360813ec727781f7a53be9f267a7cea1
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { verifyAccessToken } from '../lib/jwt'
import {
  createPartsOrder,
  getPartsOrderDetail,
  fulfillPartsOrder,
  closePartsOrder,
  raiseDispute,
  resolveDispute,
  rateOrder,
} from '../dal/parts-b2b'

export const partsOrdersRouter = new OpenAPIHono()

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

const err = (detail: string) => ({ detail })

// ── Shared Zod schemas ────────────────────────────────────────────────────────
const OrderEventSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  eventType: z.enum(['created', 'held', 'fulfilled', 'closed', 'disputed',
    'resolved_buyer', 'resolved_seller', 'refunded', 'rated', 'cancelled']),
  actorId: z.string().nullable(),
  oldStatus: z.string().nullable(),
  newStatus: z.string().nullable(),
  detail: z.string().nullable(),
  createdAt: z.string(),
})

const DisputeSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  raisedBy: z.string(),
  reason: z.string(),
  status: z.enum(['open', 'admin_reviewing', 'resolved_buyer', 'resolved_seller', 'withdrawn']),
  resolution: z.string().nullable(),
  resolvedBy: z.string().nullable(),
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
})

const RatingSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  ratedBy: z.string(),
  sellerId: z.string(),
  score: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  createdAt: z.string(),
})

const OrderSchema = z.object({
  id: z.string(),
  partId: z.string(),
  buyerId: z.string(),
  serviceId: z.string().nullable(),
  quantity: z.number(),
  unitPriceThb: z.string(),
  totalThb: z.string(),
  status: z.enum(['pending', 'held', 'fulfilled', 'closed', 'disputed', 'resolved', 'refunded', 'cancelled']),
  fulfillmentNote: z.string().nullable(),
  trackingNumber: z.string().nullable(),
  fulfilledAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  idempotencyKey: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const OrderDetailSchema = OrderSchema.extend({
  events: z.array(OrderEventSchema),
  dispute: DisputeSchema.nullable(),
  rating: RatingSchema.nullable(),
})

// ── POST / — create B2B order ─────────────────────────────────────────────────
const createOrderRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Parts B2B'],
  summary: 'Create B2B parts order + escrow hold (Sub-CMD-8)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            partId: z.string().uuid(),
            quantity: z.number().int().positive(),
            serviceId: z.string().uuid().optional(),
            idempotencyKey: z.string().min(1).max(100),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Order created + escrow held',
      content: { 'application/json': { schema: OrderSchema } },
    },
    400: { description: 'Insufficient stock' },
    401: { description: 'Unauthorized' },
    404: { description: 'Part not found' },
    409: { description: 'Duplicate idempotency key' },
  },
})

partsOrdersRouter.openapi(createOrderRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const body = c.req.valid('json')
  const order = await createPartsOrder(user.userId, body)

  if (order === null) {
    return c.json(err('Part not found, insufficient stock, or duplicate idempotency key.'), 400)
  }

  return c.json(order, 201)
})

// ── GET /:id/ — get order detail ──────────────────────────────────────────────
const getOrderRoute = createRoute({
  method: 'get',
  path: '/:id/',
  tags: ['Parts B2B'],
  summary: 'Get B2B parts order detail with audit trail',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Order detail with events, dispute, rating',
      content: { 'application/json': { schema: OrderDetailSchema } },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Order not found' },
  },
})

partsOrdersRouter.openapi(getOrderRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const detail = await getPartsOrderDetail(id)
  if (!detail) return c.json(err('Order not found.'), 404)

  return c.json(detail, 200)
})

// ── PATCH /:id/fulfill/ — seller fulfills ────────────────────────────────────
const fulfillRoute = createRoute({
  method: 'patch',
  path: '/:id/fulfill/',
  tags: ['Parts B2B'],
  summary: 'Seller confirms shipment (order → fulfilled)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            fulfillmentNote: z.string().max(500).optional(),
            trackingNumber: z.string().max(100).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Order fulfilled',
      content: { 'application/json': { schema: OrderSchema } },
    },
    400: { description: 'Order not in fulfillable state (held required)' },
    401: { description: 'Unauthorized' },
    403: { description: 'Not the seller of this part' },
    404: { description: 'Order not found' },
  },
})

partsOrdersRouter.openapi(fulfillRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const updated = await fulfillPartsOrder(id, user.userId, body)
  if (!updated) return c.json(err('Order not found, not in held status, or you are not the seller.'), 400)

  return c.json(updated, 200)
})

// ── PATCH /:id/close/ — buyer closes ─────────────────────────────────────────
const closeRoute = createRoute({
  method: 'patch',
  path: '/:id/close/',
  tags: ['Parts B2B'],
  summary: 'Buyer confirms receipt (order → closed)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Order closed',
      content: { 'application/json': { schema: OrderSchema } },
    },
    400: { description: 'Order not in closable state (fulfilled required)' },
    401: { description: 'Unauthorized' },
    404: { description: 'Order not found' },
  },
})

partsOrdersRouter.openapi(closeRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const updated = await closePartsOrder(id, user.userId)
  if (!updated) return c.json(err('Order not found, not in fulfilled status, or you are not the buyer.'), 400)

  return c.json(updated, 200)
})

// ── POST /:id/dispute/ — raise dispute ───────────────────────────────────────
const disputeRoute = createRoute({
  method: 'post',
  path: '/:id/dispute/',
  tags: ['Parts B2B'],
  summary: 'Buyer raises dispute (order → disputed)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({ reason: z.string().min(10).max(1000) }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Dispute raised',
      content: { 'application/json': { schema: DisputeSchema } },
    },
    400: { description: 'Order not in disputable state (held/fulfilled required)' },
    401: { description: 'Unauthorized' },
    404: { description: 'Order not found' },
  },
})

partsOrdersRouter.openapi(disputeRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const { reason } = c.req.valid('json')

  const dispute = await raiseDispute(id, user.userId, reason)
  if (!dispute) return c.json(err('Order not found, not in a disputable state, or you are not the buyer.'), 400)

  return c.json(dispute, 201)
})

// ── PATCH /:id/dispute/resolve/ — admin resolves ─────────────────────────────
const resolveDisputeRoute = createRoute({
  method: 'patch',
  path: '/:id/dispute/resolve/',
  tags: ['Parts B2B'],
  summary: 'Admin resolves dispute (R3 Mitigation — Admin override)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            resolution: z.enum(['resolved_buyer', 'resolved_seller']),
            note: z.string().min(10).max(1000),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Dispute resolved',
      content: { 'application/json': { schema: DisputeSchema } },
    },
    400: { description: 'No open dispute for this order' },
    401: { description: 'Unauthorized' },
    404: { description: 'Order not found' },
  },
})

partsOrdersRouter.openapi(resolveDisputeRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)
  // TODO D-4: restrict to admin role (user.role === 'admin')

  const { id } = c.req.valid('param')
  const { resolution, note } = c.req.valid('json')

  const resolved = await resolveDispute(id, user.userId, resolution, note)
  if (!resolved) return c.json(err('No open dispute found for this order.'), 400)

  return c.json(resolved, 200)
})

// ── POST /:id/rate/ — buyer rates seller ─────────────────────────────────────
const rateRoute = createRoute({
  method: 'post',
  path: '/:id/rate/',
  tags: ['Parts B2B'],
  summary: 'Buyer rates seller after order closed (1–5 stars)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            score: z.number().int().min(1).max(5),
            comment: z.string().max(500).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Rating submitted',
      content: { 'application/json': { schema: RatingSchema } },
    },
    400: { description: 'Order not closed or already rated' },
    401: { description: 'Unauthorized' },
    404: { description: 'Order not found' },
  },
})

partsOrdersRouter.openapi(rateRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const { score, comment } = c.req.valid('json')

  const rating = await rateOrder(id, user.userId, score, comment)
  if (!rating) return c.json(err('Order not found, not closed, or already rated.'), 400)

  return c.json(rating, 201)
})
