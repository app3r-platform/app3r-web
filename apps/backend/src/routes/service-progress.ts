/**
 * service-progress.ts — Sub-CMD-5 Wave 2: Service Progress Tracker API
 *
 * GET  /api/v1/service-progress/:serviceId/ — timeline (WeeeU read)
 * POST /api/v1/service-progress/            — create entry (WeeeT write)
 * PATCH /api/v1/service-progress/:id/       — update entry (WeeeT write)
 *
 * WS Broadcast: progress:updated → services.owner_id (customer WeeeU)
 * Polling fallback: FE poll GET every 3s if WS not connected
 *
 * Auth: Bearer JWT required
 * Error format: { detail: "..." } (Django-style — matches FE apiFetch)
 *
 * Sub-CMD-5: 360813ec-7277-8157-bc00-c47bc62b256e
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { verifyAccessToken } from '../lib/jwt'
import { wsRegistry, createWsEvent } from '../lib/websocket'
import {
  getServiceTimeline,
  getProgressById,
  createProgressEntry,
  updateProgressEntry,
  getServiceOwnerId,
} from '../dal/service-progress'

export const serviceProgressRouter = new OpenAPIHono()

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

const err = (detail: string) => ({ detail })

// ── Shared Zod schema ─────────────────────────────────────────────────────────
const PROGRESS_STATUSES = [
  'pending', 'accepted', 'in_progress', 'paused', 'completed', 'cancelled',
] as const

const ServiceProgressSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  status: z.enum(PROGRESS_STATUSES),
  progressPercent: z.number().int().min(0).max(100),
  note: z.string().nullable(),
  photoR2Key: z.string().nullable(),
  updatedBy: z.string(),
  createdAt: z.string(),
})

const TimelineSchema = z.object({
  serviceId: z.string(),
  entries: z.array(ServiceProgressSchema),
  latestStatus: z.enum(PROGRESS_STATUSES).nullable(),
  latestPercent: z.number().int().min(0).max(100),
})

// ── Helper: broadcast progress:updated via WS ─────────────────────────────────
async function broadcastProgress(serviceId: string, progress: z.infer<typeof ServiceProgressSchema>) {
  const ownerId = await getServiceOwnerId(serviceId)
  if (ownerId) {
    wsRegistry.emit(ownerId, createWsEvent('progress:updated', { serviceId, progress }))
  }
}

// ── GET /:serviceId/ — timeline ────────────────────────────────────────────────
const getTimelineRoute = createRoute({
  method: 'get',
  path: '/:serviceId/',
  tags: ['Service Progress'],
  summary: 'Get service progress timeline (WeeeU customer view)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ serviceId: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Progress timeline (entries ASC by created_at)',
      content: { 'application/json': { schema: TimelineSchema } },
    },
    401: { description: 'Unauthorized' },
  },
})

serviceProgressRouter.openapi(getTimelineRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { serviceId } = c.req.valid('param')
  const timeline = await getServiceTimeline(serviceId)
  return c.json(timeline, 200)
})

// ── POST / — create progress entry ────────────────────────────────────────────
const createProgressRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Service Progress'],
  summary: 'Create progress entry + broadcast WS (WeeeT write)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            serviceId: z.string().uuid(),
            status: z.enum(PROGRESS_STATUSES),
            progressPercent: z.number().int().min(0).max(100),
            note: z.string().max(1000).optional(),
            photoR2Key: z.string().optional(),  // R2 key จาก POST /files/finalize
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Progress entry created + WS broadcast sent',
      content: { 'application/json': { schema: ServiceProgressSchema } },
    },
    401: { description: 'Unauthorized' },
  },
})

serviceProgressRouter.openapi(createProgressRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const body = c.req.valid('json')
  const dto = await createProgressEntry(user.userId, body)

  // WS broadcast → service owner (WeeeU customer)
  await broadcastProgress(dto.serviceId, dto)

  return c.json(dto, 201)
})

// ── PATCH /:id/ — update progress entry ───────────────────────────────────────
const updateProgressRoute = createRoute({
  method: 'patch',
  path: '/:id/',
  tags: ['Service Progress'],
  summary: 'Update progress entry + broadcast WS (WeeeT write)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.enum(PROGRESS_STATUSES).optional(),
            progressPercent: z.number().int().min(0).max(100).optional(),
            note: z.string().max(1000).optional(),
            photoR2Key: z.string().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Progress updated + WS broadcast sent',
      content: { 'application/json': { schema: ServiceProgressSchema } },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Progress entry not found' },
  },
})

serviceProgressRouter.openapi(updateProgressRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  // Verify exists
  const existing = await getProgressById(id)
  if (!existing) return c.json(err('Progress entry not found.'), 404)

  const dto = await updateProgressEntry(id, user.userId, body)
  if (!dto) return c.json(err('Progress entry not found.'), 404)

  // WS broadcast → service owner (WeeeU customer)
  await broadcastProgress(dto.serviceId, dto)

  return c.json(dto, 200)
})
