/**
 * parts.ts โ€” NOTE-SUB4: WeeeR parts inventory + order (escrow) routes
 *
 * GET    /api/v1/parts/inventory       โ€” list WeeeR's inventory
 * POST   /api/v1/parts/inventory       โ€” create item
 * PATCH  /api/v1/parts/inventory/:id   โ€” update item
 * DELETE /api/v1/parts/inventory/:id   โ€” delete item
 * POST   /api/v1/parts/order           โ€” create order + hold escrow
 * POST   /api/v1/parts/order/:id/confirm โ€” release escrow
 * POST   /api/v1/parts/order/:id/refund  โ€” refund escrow
 *
 * escrow_ledger_id: @needs-point-review โ€” เธฃเธญ Point chat consultation
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { db } from '../db/client'
import { partsInventory, partsOrders } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { verifyAccessToken } from '../lib/jwt'

export const partsRouter = new OpenAPIHono()

async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

// โ”€โ”€ GET /inventory โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const listInventoryRoute = createRoute({
  method: 'get',
  path: '/inventory',
  tags: ['Parts'],
  summary: 'List WeeeR parts inventory (NOTE-SUB4)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Inventory items',
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(z.object({
              id: z.string(),
              name: z.string(),
              sku: z.string().nullable(),
              unitPriceThb: z.string(),
              stockQuantity: z.number(),
              unit: z.string(),
              category: z.string().nullable(),
            })),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
  },
})

partsRouter.openapi(listInventoryRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const rows = await db
    .select()
    .from(partsInventory)
    .where(eq(partsInventory.ownerId, user.userId))

  return c.json({
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      sku: r.sku,
      unitPriceThb: r.unitPriceThb,
      stockQuantity: r.stockQuantity,
      unit: r.unit,
      category: r.category,
    })),
  }, 200)
})

// โ”€โ”€ POST /inventory โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const createInventoryRoute = createRoute({
  method: 'post',
  path: '/inventory',
  tags: ['Parts'],
  summary: 'Create parts inventory item (NOTE-SUB4)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1),
            description: z.string().optional(),
            sku: z.string().optional(),
            unitPriceThb: z.number().positive(),
            stockQuantity: z.number().int().min(0).default(0),
            unit: z.string().default('piece'),
            category: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Item created',
      content: { 'application/json': { schema: z.object({ id: z.string() }) } },
    },
    401: { description: 'Unauthorized' },
  },
})

partsRouter.openapi(createInventoryRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const body = c.req.valid('json')
  const [item] = await db
    .insert(partsInventory)
    .values({
      ownerId: user.userId,
      name: body.name,
      description: body.description ?? null,
      sku: body.sku ?? null,
      unitPriceThb: String(body.unitPriceThb),
      stockQuantity: body.stockQuantity,
      unit: body.unit,
      category: body.category ?? null,
    })
    .returning({ id: partsInventory.id })

  return c.json({ id: item.id }, 201)
})

// โ”€โ”€ PATCH /inventory/:id โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const updateInventoryRoute = createRoute({
  method: 'patch',
  path: '/inventory/:id',
  tags: ['Parts'],
  summary: 'Update parts inventory item (NOTE-SUB4)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().optional(),
            unitPriceThb: z.number().positive().optional(),
            stockQuantity: z.number().int().min(0).optional(),
            category: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Updated' },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
})

partsRouter.openapi(updateInventoryRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const updateData: Partial<typeof partsInventory.$inferInsert> = { updatedAt: new Date() }
  if (body.name !== undefined) updateData.name = body.name
  if (body.unitPriceThb !== undefined) updateData.unitPriceThb = String(body.unitPriceThb)
  if (body.stockQuantity !== undefined) updateData.stockQuantity = body.stockQuantity
  if (body.category !== undefined) updateData.category = body.category

  const [updated] = await db
    .update(partsInventory)
    .set(updateData)
    .where(and(eq(partsInventory.id, id), eq(partsInventory.ownerId, user.userId)))
    .returning({ id: partsInventory.id })

  if (!updated) return c.json({ error: { code: 'NOT_FOUND', message: 'Item not found' } }, 404)
  return c.json({ success: true }, 200)
})

// โ”€โ”€ DELETE /inventory/:id โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const deleteInventoryRoute = createRoute({
  method: 'delete',
  path: '/inventory/:id',
  tags: ['Parts'],
  summary: 'Delete parts inventory item (NOTE-SUB4)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: 'Deleted' },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
})

partsRouter.openapi(deleteInventoryRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const { id } = c.req.valid('param')
  const [deleted] = await db
    .delete(partsInventory)
    .where(and(eq(partsInventory.id, id), eq(partsInventory.ownerId, user.userId)))
    .returning({ id: partsInventory.id })

  if (!deleted) return c.json({ error: { code: 'NOT_FOUND', message: 'Item not found' } }, 404)
  return c.json({ success: true }, 200)
})

// โ”€โ”€ POST /order โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const createOrderRoute = createRoute({
  method: 'post',
  path: '/order',
  tags: ['Parts'],
  summary: 'Create parts order + hold escrow (NOTE-SUB4, @needs-point-review)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            partId: z.string().uuid(),
            quantity: z.number().int().positive(),
            serviceId: z.string().uuid().optional(),
            idempotencyKey: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Order created + escrow held',
      content: { 'application/json': { schema: z.object({ id: z.string(), status: z.string() }) } },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Part not found' },
    409: { description: 'Duplicate order (idempotency)' },
  },
})

partsRouter.openapi(createOrderRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const body = c.req.valid('json')

  // Fetch part price
  const [part] = await db.select().from(partsInventory).where(eq(partsInventory.id, body.partId))
  if (!part) return c.json({ error: { code: 'NOT_FOUND', message: 'Part not found' } }, 404)

  const unitPrice = parseFloat(String(part.unitPriceThb))
  const total = unitPrice * body.quantity

  // @needs-point-review: escrow hold logic (debit point_ledger)
  // TODO: consult Point chat before implementing escrow

  const [order] = await db
    .insert(partsOrders)
    .values({
      partId: body.partId,
      buyerId: user.userId,
      serviceId: body.serviceId ?? null,
      quantity: body.quantity,
      unitPriceThb: String(unitPrice),
      totalThb: String(total),
      status: 'pending',
      idempotencyKey: body.idempotencyKey,
    })
    .onConflictDoNothing()
    .returning({ id: partsOrders.id, status: partsOrders.status })

  if (!order) return c.json({ error: { code: 'CONFLICT', message: 'Duplicate order' } }, 409)
  return c.json({ id: order.id, status: order.status }, 201)
})

// โ”€โ”€ POST /order/:id/confirm โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const confirmOrderRoute = createRoute({
  method: 'post',
  path: '/order/:id/confirm',
  tags: ['Parts'],
  summary: 'Confirm order โ’ release escrow to WeeeR (NOTE-SUB4, @needs-point-review)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: 'Order confirmed, escrow released' },
    401: { description: 'Unauthorized' },
    404: { description: 'Order not found' },
  },
})

partsRouter.openapi(confirmOrderRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const { id } = c.req.valid('param')
  // @needs-point-review: credit WeeeR point_ledger (escrow release)
  const [updated] = await db
    .update(partsOrders)
    .set({ status: 'confirmed', updatedAt: new Date() })
    .where(and(eq(partsOrders.id, id), eq(partsOrders.buyerId, user.userId)))
    .returning({ id: partsOrders.id })

  if (!updated) return c.json({ error: { code: 'NOT_FOUND', message: 'Order not found' } }, 404)
  return c.json({ success: true, status: 'confirmed' }, 200)
})

// โ”€โ”€ POST /order/:id/refund โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const refundOrderRoute = createRoute({
  method: 'post',
  path: '/order/:id/refund',
  tags: ['Parts'],
  summary: 'Refund order โ’ return escrow to buyer (NOTE-SUB4, @needs-point-review)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: 'Order refunded' },
    401: { description: 'Unauthorized' },
    404: { description: 'Order not found' },
  },
})

partsRouter.openapi(refundOrderRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

  const { id } = c.req.valid('param')
  // @needs-point-review: credit buyer point_ledger (escrow refund)
  const [updated] = await db
    .update(partsOrders)
    .set({ status: 'refunded', updatedAt: new Date() })
    .where(and(eq(partsOrders.id, id), eq(partsOrders.buyerId, user.userId)))  // SECURITY-FIX: buyerId check (was missing — any user could refund any order)
    .returning({ id: partsOrders.id })

  if (!updated) return c.json({ error: { code: 'NOT_FOUND', message: 'Order not found' } }, 404)
  return c.json({ success: true, status: 'refunded' }, 200)
})

