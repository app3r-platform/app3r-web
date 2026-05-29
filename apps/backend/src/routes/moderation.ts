/**
 * moderation.ts — W-Round-1 Wave 1.2 [5] / D82: hybrid moderation queue + audit
 *
 * Mounted at: /api/v1/admin/moderation (admin/super_admin only)
 *
 *   GET  /api/v1/admin/moderation              → queue (filter ?status=pending)
 *   POST /api/v1/admin/moderation              → submit content (auto policy: text=auto_approved / media=pending)
 *   POST /api/v1/admin/moderation/{qid}/approve→ approve + audit
 *   POST /api/v1/admin/moderation/{qid}/reject → reject + audit
 *
 * D82 policy: text → auto_approved · image|video → pending · ทุก action → audit log
 * Decision: D82 (hybrid moderation)
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { db } from '../db/client'
import {
  moderationQueue,
  moderationAuditLog,
  MODERATION_CONTENT_TYPES,
  MODERATION_MEDIA_TYPES,
} from '../db/schema'
import { verifyAccessToken } from '../lib/jwt'

export const moderationRouter = new OpenAPIHono()

async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}
const unauthorized = (c: { json: (b: unknown, s: 401) => Response }) =>
  c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)
const forbidden = (c: { json: (b: unknown, s: 403) => Response }) =>
  c.json({ error: { code: 'FORBIDDEN', message: 'Admin only' } }, 403)
const isAdminRole = (role?: string) => role === 'admin' || role === 'super_admin'

// ── POST / — submit content into moderation (auto policy) ─────────────────────
const submitRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Moderation'],
  summary: 'Submit content to moderation (D82 hybrid: text=auto_approved / media=pending)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            contentType: z.enum(MODERATION_CONTENT_TYPES),
            contentRefId: z.string().uuid(),
            listingId: z.string().uuid().optional(),
            mediaType: z.enum(MODERATION_MEDIA_TYPES).default('text'),
          }),
        },
      },
    },
  },
  responses: { 201: { description: 'Submitted' }, 401: { description: 'Unauthorized' } },
})

moderationRouter.openapi(submitRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { contentType, contentRefId, listingId, mediaType } = c.req.valid('json')

  // D82: text → auto_approved ; image|video → pending
  const status = mediaType === 'text' ? 'auto_approved' : 'pending'
  const action = mediaType === 'text' ? 'auto_approve' : 'submit'

  const [row] = await db
    .insert(moderationQueue)
    .values({
      contentType,
      contentRefId,
      listingId: listingId ?? null,
      submitterUserId: user.userId,
      mediaType,
      status,
    })
    .returning()
  await db.insert(moderationAuditLog).values({ queueId: row.id, action, actorUserId: user.userId })
  return c.json({ id: row.id, status: row.status }, 201)
})

// ── GET / — admin queue ───────────────────────────────────────────────────────
const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Moderation'],
  summary: 'List moderation queue (admin) — filter ?status=',
  security: [{ bearerAuth: [] }],
  request: { query: z.object({ status: z.string().optional() }) },
  responses: {
    200: { description: 'Queue' },
    401: { description: 'Unauthorized' },
    403: { description: 'Admin only' },
  },
})

moderationRouter.openapi(listRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  if (!isAdminRole(user.role)) return forbidden(c)
  const { status } = c.req.valid('query')
  const base = db.select().from(moderationQueue).$dynamic()
  const rows = status
    ? await base.where(eq(moderationQueue.status, status)).orderBy(desc(moderationQueue.createdAt))
    : await base.orderBy(desc(moderationQueue.createdAt))
  return c.json(
    {
      items: rows.map((r) => ({
        id: r.id,
        contentType: r.contentType,
        contentRefId: r.contentRefId,
        listingId: r.listingId,
        mediaType: r.mediaType,
        status: r.status,
        reason: r.reason,
        createdAt: r.createdAt.toISOString(),
      })),
    },
    200,
  )
})

// ── shared review logic ───────────────────────────────────────────────────────
async function applyDecision(qid: string, decision: 'approved' | 'rejected', actorUserId: string, reason?: string) {
  const [updated] = await db
    .update(moderationQueue)
    .set({ status: decision, reason: reason ?? null, reviewedBy: actorUserId, reviewedAt: new Date() })
    .where(eq(moderationQueue.id, qid))
    .returning()
  if (!updated) return null
  await db.insert(moderationAuditLog).values({
    queueId: qid,
    action: decision === 'approved' ? 'approve' : 'reject',
    actorUserId,
    note: reason ?? null,
  })
  return updated
}

const approveRoute = createRoute({
  method: 'post',
  path: '/{qid}/approve',
  tags: ['Moderation'],
  summary: 'Approve queued content + audit (D82)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ qid: z.string().uuid() }),
    body: { content: { 'application/json': { schema: z.object({ reason: z.string().optional() }) } }, required: false },
  },
  responses: {
    200: { description: 'Approved' },
    401: { description: 'Unauthorized' },
    403: { description: 'Admin only' },
    404: { description: 'Not found' },
  },
})

const rejectRoute = createRoute({
  method: 'post',
  path: '/{qid}/reject',
  tags: ['Moderation'],
  summary: 'Reject queued content + audit (D82)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ qid: z.string().uuid() }),
    body: { content: { 'application/json': { schema: z.object({ reason: z.string().optional() }) } }, required: false },
  },
  responses: {
    200: { description: 'Rejected' },
    401: { description: 'Unauthorized' },
    403: { description: 'Admin only' },
    404: { description: 'Not found' },
  },
})

moderationRouter.openapi(approveRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  if (!isAdminRole(user.role)) return forbidden(c)
  const { qid } = c.req.valid('param')
  const { reason } = c.req.valid('json') ?? {}
  const updated = await applyDecision(qid, 'approved', user.userId, reason)
  if (!updated) return c.json({ error: { code: 'NOT_FOUND', message: 'Queue item not found' } }, 404)
  return c.json({ id: updated.id, status: updated.status }, 200)
})

moderationRouter.openapi(rejectRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  if (!isAdminRole(user.role)) return forbidden(c)
  const { qid } = c.req.valid('param')
  const { reason } = c.req.valid('json') ?? {}
  const updated = await applyDecision(qid, 'rejected', user.userId, reason)
  if (!updated) return c.json({ error: { code: 'NOT_FOUND', message: 'Queue item not found' } }, 404)
  return c.json({ id: updated.id, status: updated.status }, 200)
})
