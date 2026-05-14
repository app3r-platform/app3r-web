/**
 * services.ts — Sub-CMD-4 Wave 2: Services Table Full Expand
 *
 * POST   /api/v1/services/           — สร้าง service (draft)
 * GET    /api/v1/services/           — list services (filter: owner_id, status, type)
 * GET    /api/v1/services/:id/       — get service by ID
 * PATCH  /api/v1/services/:id/       — update fields (title, description, pointAmount, deadline)
 * PATCH  /api/v1/services/:id/status/ — update status only
 * DELETE /api/v1/services/:id/       — delete (owner only)
 *
 * Auth: Bearer JWT required on all endpoints
 * Error format: { detail: "..." } (Django-style, matches FE apiFetch)
 *
 * Sub-CMD-4: 360813ec-7277-818d-b672-e5e3446e1d20
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { verifyAccessToken } from '../lib/jwt'
import {
  createService,
  getServiceById,
  updateService,
  updateServiceStatus,
  deleteService,
  listServices,
} from '../dal/services'

export const servicesRouter = new OpenAPIHono()

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

const err = (detail: string) => ({ detail })

// ── Shared schema (Sub-CMD-4: includes new fields) ────────────────────────────
const ServiceSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  serviceType: z.string(),
  status: z.string(),
  // Sub-CMD-4: new fields
  title: z.string().nullable(),
  description: z.string().nullable(),
  pointAmount: z.string().nullable(),
  deadline: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const SERVICE_TYPES = ['repair', 'maintain', 'resell', 'scrap'] as const
const SERVICE_STATUSES = ['draft', 'published', 'in_progress', 'completed', 'cancelled'] as const

// ── POST / — สร้าง service ────────────────────────────────────────────────────
const createServiceRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Services'],
  summary: 'Create service (Sub-CMD-4 — includes title, description, pointAmount, deadline)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            serviceType: z.enum(SERVICE_TYPES),
            title: z.string().min(1).max(200).optional(),
            description: z.string().max(2000).optional(),
            pointAmount: z.number().positive().optional(),
            deadline: z.string().datetime().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: 'Service created', content: { 'application/json': { schema: ServiceSchema } } },
    401: { description: 'Unauthorized' },
  },
})

servicesRouter.openapi(createServiceRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const body = c.req.valid('json')
  const dto = await createService(user.userId, body)
  return c.json(dto, 201)
})

// ── GET / — list services ─────────────────────────────────────────────────────
const listServicesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Services'],
  summary: 'List services (filter: owner_id, status, type)',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      owner_id: z.string().uuid().optional(),
      status: z.string().optional(),
      type: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      offset: z.coerce.number().int().min(0).default(0),
    }),
  },
  responses: {
    200: {
      description: 'Service list with total count',
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(ServiceSchema),
            total: z.number(),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
  },
})

servicesRouter.openapi(listServicesRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { owner_id, status, type, limit, offset } = c.req.valid('query')
  const result = await listServices({
    ownerId: owner_id,
    status,
    serviceType: type,
    limit,
    offset,
  })
  return c.json(result, 200)
})

// ── GET /:id/ — get service by ID ─────────────────────────────────────────────
const getServiceRoute = createRoute({
  method: 'get',
  path: '/:id/',
  tags: ['Services'],
  summary: 'Get service by ID',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: 'Service', content: { 'application/json': { schema: ServiceSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
})

servicesRouter.openapi(getServiceRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const dto = await getServiceById(id)
  if (!dto) return c.json(err('Service not found.'), 404)

  return c.json(dto, 200)
})

// ── PATCH /:id/ — update fields ────────────────────────────────────────────────
const updateServiceRoute = createRoute({
  method: 'patch',
  path: '/:id/',
  tags: ['Services'],
  summary: 'Update service fields (title, description, pointAmount, deadline)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().min(1).max(200).optional(),
            description: z.string().max(2000).optional(),
            pointAmount: z.number().positive().optional(),
            deadline: z.string().datetime().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Service updated', content: { 'application/json': { schema: ServiceSchema } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden — not your service' },
    404: { description: 'Not found' },
  },
})

servicesRouter.openapi(updateServiceRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  // Check service exists first
  const existing = await getServiceById(id)
  if (!existing) return c.json(err('Service not found.'), 404)
  if (existing.ownerId !== user.userId) return c.json(err('Access denied.'), 403)

  const dto = await updateService(id, user.userId, body)
  return c.json(dto!, 200)
})

// ── PATCH /:id/status/ — update status ────────────────────────────────────────
const updateStatusRoute = createRoute({
  method: 'patch',
  path: '/:id/status/',
  tags: ['Services'],
  summary: 'Update service status',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.enum(SERVICE_STATUSES),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Status updated', content: { 'application/json': { schema: z.object({ success: z.boolean() }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found or not your service' },
  },
})

servicesRouter.openapi(updateStatusRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const { status } = c.req.valid('json')

  const ok = await updateServiceStatus(id, user.userId, status)
  if (!ok) return c.json(err('Service not found.'), 404)

  return c.json({ success: true }, 200)
})

// ── DELETE /:id/ — delete service ─────────────────────────────────────────────
const deleteServiceRoute = createRoute({
  method: 'delete',
  path: '/:id/',
  tags: ['Services'],
  summary: 'Delete service (owner only)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: 'Deleted', content: { 'application/json': { schema: z.object({ success: z.boolean() }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found or not your service' },
  },
})

servicesRouter.openapi(deleteServiceRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const ok = await deleteService(id, user.userId)
  if (!ok) return c.json(err('Service not found.'), 404)

  return c.json({ success: true }, 200)
})
