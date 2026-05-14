/**
 * settlements.ts — Sub-CMD-6 Wave 2: Settlement API
 *
 * POST /api/v1/settlements/        — สร้าง settlement + initiate bank transfer
 * GET  /api/v1/settlements/:id/    — get settlement + audit log
 * GET  /api/v1/settlements/        — list (WeeeR sees own, Admin sees all)
 *
 * Auth: Bearer JWT required
 * Security Rule #5: ทุก settlement มี audit trail
 * Error format: { detail: "..." } (Django-style)
 *
 * Sub-CMD-6: 360813ec72778187a1b4f38a11cb8539
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { verifyAccessToken } from '../lib/jwt'
import {
  createSettlement,
  getSettlementById,
  listSettlements,
} from '../dal/settlements'

export const settlementsRouter = new OpenAPIHono()

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

const err = (detail: string) => ({ detail })

// ── Shared Zod schemas ────────────────────────────────────────────────────────
const SETTLEMENT_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const
const BANK_ADAPTERS = ['mock', 'scb', 'kbank'] as const
const AUDIT_ACTIONS = ['created', 'status_changed', 'bank_response', 'error'] as const

const AuditLogSchema = z.object({
  id: z.string(),
  settlementId: z.string(),
  action: z.enum(AUDIT_ACTIONS),
  actorId: z.string().nullable(),
  oldStatus: z.string().nullable(),
  newStatus: z.string().nullable(),
  detail: z.string().nullable(),
  createdAt: z.string(),
})

const SettlementSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  weeerUserId: z.string(),
  amountThb: z.string(),
  status: z.enum(SETTLEMENT_STATUSES),
  bankAdapter: z.enum(BANK_ADAPTERS),
  bankRef: z.string().nullable(),
  initiatedBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const SettlementDetailSchema = SettlementSchema.extend({
  auditLog: z.array(AuditLogSchema),
})

// ── POST / — create settlement ────────────────────────────────────────────────
const createSettlementRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Settlements'],
  summary: 'Create settlement + initiate bank transfer (admin/system)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            serviceId: z.string().uuid(),
            weeerUserId: z.string().uuid(),
            amountThb: z.number().positive(),
            weeerBankAccount: z.string().min(10).max(20),
            weeerBankName: z.string().min(1).max(100),
            bankAdapter: z.enum(BANK_ADAPTERS).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Settlement created + bank transfer initiated (audit log included)',
      content: { 'application/json': { schema: SettlementDetailSchema } },
    },
    401: { description: 'Unauthorized' },
  },
})

settlementsRouter.openapi(createSettlementRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  // TODO D-3: restrict to admin role (user.role === 'admin')
  const body = c.req.valid('json')
  const dto = await createSettlement(user.userId, body)

  // Return with audit log (fetch full detail)
  const detail = await getSettlementById(dto.id)
  return c.json(detail!, 201)
})

// ── GET /:id/ — get settlement detail ─────────────────────────────────────────
const getSettlementRoute = createRoute({
  method: 'get',
  path: '/:id/',
  tags: ['Settlements'],
  summary: 'Get settlement by ID (includes audit log)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Settlement detail with full audit trail',
      content: { 'application/json': { schema: SettlementDetailSchema } },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Settlement not found' },
  },
})

settlementsRouter.openapi(getSettlementRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const detail = await getSettlementById(id)
  if (!detail) return c.json(err('Settlement not found.'), 404)

  return c.json(detail, 200)
})

// ── GET / — list settlements ──────────────────────────────────────────────────
const listSettlementsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Settlements'],
  summary: 'List settlements (WeeeR sees own, Admin sees all)',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      weeer_user_id: z.string().uuid().optional(),
      status: z.enum(SETTLEMENT_STATUSES).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      offset: z.coerce.number().int().min(0).default(0),
    }),
  },
  responses: {
    200: {
      description: 'Settlement list with total count',
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(SettlementSchema),
            total: z.number(),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
  },
})

settlementsRouter.openapi(listSettlementsRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { weeer_user_id, status, limit, offset } = c.req.valid('query')

  // TODO D-3: admin sees all, WeeeR sees own (user.role check)
  // For now: filter by weeer_user_id if provided, else show caller's own
  const result = await listSettlements({
    weeerUserId: weeer_user_id ?? user.userId,
    status,
    limit,
    offset,
  })

  return c.json(result, 200)
})
