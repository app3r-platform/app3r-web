/**
 * services.ts โ€” D90 NOTE-D90-1: services stub CRUD
 *
 * POST /api/v1/services           โ€” create service
 * GET  /api/v1/services/:id       โ€” get service
 * PATCH /api/v1/services/:id/status โ€” update status
 * GET  /api/v1/services?owner_id=&status=&type= โ€” list services
 *
 * D-3 เธเธฐเน€เธเธดเนเธก: title, description, point_amount, deadline + offers/parts/milestones
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { db } from '../db/client'
import { services } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { verifyAccessToken } from '../lib/jwt'

export const servicesRouter = new OpenAPIHono()

async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

const ServiceSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  serviceType: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// โ”€โ”€ POST / โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const createServiceRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Services'],
  summary: 'Create service (stub D90 NOTE-D90-1)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            serviceType: z.enum(['repair', 'maintain', 'resell', 'scrap']),
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
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const { serviceType } = c.req.valid('json')
  const [service] = await db
    .insert(services)
    .values({ ownerId: user.userId, serviceType, status: 'draft' })
    .returning()

  return c.json({
    id: service.id, ownerId: service.ownerId, serviceType: service.serviceType,
    status: service.status, createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  }, 201)
})

// โ”€โ”€ GET /:id โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const getServiceRoute = createRoute({
  method: 'get',
  path: '/:id',
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
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const { id } = c.req.valid('param')
  const [service] = await db.select().from(services).where(eq(services.id, id))
  if (!service) return c.json({ error: { code: 'NOT_FOUND', message: 'Service not found' } }, 404)

  return c.json({
    id: service.id, ownerId: service.ownerId, serviceType: service.serviceType,
    status: service.status, createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  }, 200)
})

// โ”€โ”€ PATCH /:id/status โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const updateStatusRoute = createRoute({
  method: 'patch',
  path: '/:id/status',
  tags: ['Services'],
  summary: 'Update service status',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.enum(['draft', 'published', 'in_progress', 'completed', 'cancelled']),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Status updated' },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
})

servicesRouter.openapi(updateStatusRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const { id } = c.req.valid('param')
  const { status } = c.req.valid('json')

  const [updated] = await db
    .update(services)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(services.id, id), eq(services.ownerId, user.userId)))
    .returning({ id: services.id })

  if (!updated) return c.json({ error: { code: 'NOT_FOUND', message: 'Service not found' } }, 404)
  return c.json({ success: true }, 200)
})

// โ”€โ”€ GET / (list) โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
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
    }),
  },
  responses: {
    200: {
      description: 'Service list',
      content: { 'application/json': { schema: z.object({ items: z.array(ServiceSchema) }) } },
    },
    401: { description: 'Unauthorized' },
  },
})

servicesRouter.openapi(listServicesRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const { owner_id, status, type } = c.req.valid('query')

  const conditions = []
  if (owner_id) conditions.push(eq(services.ownerId, owner_id))
  if (status) conditions.push(eq(services.status, status))
  if (type) conditions.push(eq(services.serviceType, type))

  const rows = await db
    .select()
    .from(services)
    .where(conditions.length ? and(...conditions) : undefined)

  return c.json({
    items: rows.map((s) => ({
      id: s.id, ownerId: s.ownerId, serviceType: s.serviceType,
      status: s.status, createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  }, 200)
})

