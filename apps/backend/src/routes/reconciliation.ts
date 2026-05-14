/**
 * reconciliation.ts — Sub-CMD-7 Wave 2: Reconciliation API
 *
 * GET  /api/v1/reconciliation             — รายงาน stuck settlements + recent runs (Admin)
 * POST /api/v1/reconciliation/run         — manual trigger worker
 * PATCH /api/v1/reconciliation/:id/resolve — manual resolve settlement ค้าง
 *
 * Auth: Bearer JWT required
 * Security Rule #5: resolve action → audit log (ใน DAL)
 * R3 Mitigation: idempotency check ใน worker
 * Error format: { detail: "..." } (Django-style)
 *
 * Sub-CMD-7: 360813ec7277815aa5e4ceddcb899269
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { verifyAccessToken } from '../lib/jwt'
import { runReconciliationWorker } from '../lib/reconciliation-worker'
import {
  getReconciliationReport,
  manualResolveSettlement,
  mapRunToDto,
  mapStuckSettlementToDto,
} from '../dal/reconciliation'

export const reconciliationRouter = new OpenAPIHono()

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

const err = (detail: string) => ({ detail })

// ── Shared Zod schemas ────────────────────────────────────────────────────────
const ReconciliationRunSchema = z.object({
  id: z.string(),
  triggeredBy: z.string().nullable(),
  status: z.enum(['running', 'completed', 'failed']),
  stuckCount: z.number(),
  resolvedCount: z.number(),
  failedCount: z.number(),
  detail: z.string().nullable(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
})

const StuckSettlementSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  weeerUserId: z.string(),
  amountThb: z.string(),
  status: z.enum(['pending', 'processing']),
  bankAdapter: z.string(),
  bankRef: z.string().nullable(),
  initiatedBy: z.string(),
  stuckMinutes: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const ReconciliationReportSchema = z.object({
  stuckSettlements: z.array(StuckSettlementSchema),
  recentRuns: z.array(ReconciliationRunSchema),
  lastRunAt: z.string().nullable(),
})

const SettlementSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  weeerUserId: z.string(),
  amountThb: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  bankAdapter: z.string(),
  bankRef: z.string().nullable(),
  initiatedBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// ── GET / — reconciliation report ─────────────────────────────────────────────
const getReportRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Reconciliation'],
  summary: 'Get reconciliation report: stuck settlements + recent runs (Admin)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Reconciliation report with stuck settlements and recent run history',
      content: { 'application/json': { schema: ReconciliationReportSchema } },
    },
    401: { description: 'Unauthorized' },
  },
})

reconciliationRouter.openapi(getReportRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  // TODO D-3: restrict to admin role
  const report = await getReconciliationReport()
  return c.json(report, 200)
})

// ── POST /run — manual trigger ────────────────────────────────────────────────
const triggerRunRoute = createRoute({
  method: 'post',
  path: '/run',
  tags: ['Reconciliation'],
  summary: 'Manually trigger reconciliation worker (Admin)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Worker triggered — returns run summary',
      content: {
        'application/json': {
          schema: z.object({
            runId: z.string(),
            stuckCount: z.number(),
            resolvedCount: z.number(),
            failedCount: z.number(),
          }),
        },
      },
    },
    202: {
      description: 'Reconciliation already running — skipped (idempotency)',
      content: {
        'application/json': {
          schema: z.object({ detail: z.string() }),
        },
      },
    },
    401: { description: 'Unauthorized' },
  },
})

reconciliationRouter.openapi(triggerRunRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  // R3: idempotency — runReconciliationWorker returns null if already running
  const result = await runReconciliationWorker(user.userId)
  if (!result) {
    return c.json({ detail: 'Reconciliation is already running. Please try again later.' }, 202)
  }

  return c.json(result, 200)
})

// ── PATCH /:id/resolve — manual resolve ──────────────────────────────────────
const resolveRoute = createRoute({
  method: 'patch',
  path: '/:id/resolve',
  tags: ['Reconciliation'],
  summary: 'Manually resolve a stuck settlement (Admin)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            resolution: z.enum(['completed', 'failed']),
            reason: z.string().min(1).max(500),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Settlement resolved — returns updated settlement',
      content: { 'application/json': { schema: SettlementSchema } },
    },
    400: { description: 'Settlement not in a resolvable state' },
    401: { description: 'Unauthorized' },
    404: { description: 'Settlement not found' },
  },
})

reconciliationRouter.openapi(resolveRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const { resolution, reason } = c.req.valid('json')

  const updated = await manualResolveSettlement(id, resolution, reason, user.userId)
  if (!updated) {
    // manualResolveSettlement returns null for not-found OR not-resolvable
    return c.json(err('Settlement not found or not in a resolvable state (pending/processing required).'), 404)
  }

  return c.json(
    {
      id: updated.id,
      serviceId: updated.serviceId,
      weeerUserId: updated.weeerUserId,
      amountThb: String(updated.amountThb),
      status: updated.status as 'pending' | 'processing' | 'completed' | 'failed',
      bankAdapter: updated.bankAdapter,
      bankRef: updated.bankRef ?? null,
      initiatedBy: updated.initiatedBy,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
    200,
  )
})
