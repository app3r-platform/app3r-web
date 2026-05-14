/**
 * parts.ts — NOTE-SUB4: WeeeR parts inventory + order (escrow) routes
 *
 * CRIT-002 FIX (Sub-CMD-1.1 Wave 1): Aligned API paths + response shapes + error format
 *   to match WeeeR FE (apps/weeer/app/(app)/parts/_lib/api.ts)
 *
 * Paths now match FE expectations (trailing-slash compatible):
 *   GET    /api/v1/parts/              — list inventory (was /inventory)
 *   POST   /api/v1/parts/              — create item (was /inventory)
 *   GET    /api/v1/parts/:id/          — get single item (NEW)
 *   PATCH  /api/v1/parts/:id/          — update item (was /inventory/:id)
 *   DELETE /api/v1/parts/:id/          — delete item (was /inventory/:id)
 *   POST   /api/v1/parts/:id/stock-in/ — stock in (NEW)
 *   POST   /api/v1/parts/:id/stock-adjust/ — stock adjust (NEW)
 *   GET    /api/v1/parts/movements/    — list movements (scaffold — no DB table yet)
 *   GET    /api/v1/parts/movements/:id/ — single movement (scaffold)
 *   GET    /api/v1/parts/reservations/ — list reservations (scaffold)
 *   GET    /api/v1/parts/dashboard/    — aggregate stats
 *
 * Error format: {detail: "..."} (matches FE apiFetch err.detail parsing)
 * Response shape: Part interface from FE types.ts (unitPrice: number, stockQty, etc.)
 *
 * NOTE-SUB4: escrow order routes kept (POST /order, /order/:id/confirm, /order/:id/refund)
 * escrow_ledger_id: @needs-point-review — รอ Point chat consultation
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { db } from '../db/client'
import { partsInventory, partsOrders } from '../db/schema'
import { eq, and, sql, ilike, or } from 'drizzle-orm'
import { verifyAccessToken } from '../lib/jwt'

export const partsRouter = new OpenAPIHono()

// ── Auth helper ──────────────────────────────────────────────────────────────
async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

// ── Shared response shape — matches FE Part interface ───────────────────────
const PartSchema = z.object({
  id: z.string(),
  shopId: z.string(),
  name: z.string(),
  sku: z.string().nullable(),
  category: z.string().nullable(),
  unit: z.string(),
  condition: z.enum(['new', 'used', 'refurbished']),
  stockQty: z.number(),
  reservedQty: z.number(),
  unitPrice: z.number(),
  imageUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const StockMovementSchema = z.object({
  id: z.string(),
  partId: z.string(),
  type: z.enum(['STOCK_IN', 'STOCK_OUT', 'STOCK_ADJUSTMENT']),
  qty: z.number(),
  reason: z.string(),
  refId: z.string().nullable(),
  note: z.string().nullable(),
  performedBy: z.string(),
  performedAt: z.string(),
  balanceAfter: z.number(),
})

// Helper: map DB row → Part response
function mapPart(row: typeof partsInventory.$inferSelect): z.infer<typeof PartSchema> {
  return {
    id: row.id,
    shopId: row.ownerId,
    name: row.name,
    sku: row.sku ?? null,
    category: row.category ?? null,
    unit: row.unit,
    condition: 'used', // no condition column in DB yet — default 'used'
    stockQty: row.stockQuantity,
    reservedQty: 0,    // no reservations tracking yet
    unitPrice: parseFloat(String(row.unitPriceThb)),
    imageUrl: null,    // imageR2Key is internal key — presign if needed separately
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

// Helper: Django-style error (matches FE apiFetch `err.detail` parsing)
const err = (detail: string) => ({ detail })

// ── GET / — list inventory ───────────────────────────────────────────────────
const listPartsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Parts'],
  summary: 'List WeeeR parts inventory (CRIT-002 fix — was /inventory)',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      category: z.string().optional(),
      condition: z.string().optional(),
      search: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Parts list',
      content: { 'application/json': { schema: z.array(PartSchema) } },
    },
    401: { description: 'Unauthorized' },
  },
})

partsRouter.openapi(listPartsRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { category, search } = c.req.valid('query')

  let query = db.select().from(partsInventory).where(eq(partsInventory.ownerId, user.userId)).$dynamic()

  if (category) {
    query = query.where(and(
      eq(partsInventory.ownerId, user.userId),
      eq(partsInventory.category, category),
    ))
  }
  if (search) {
    query = query.where(and(
      eq(partsInventory.ownerId, user.userId),
      or(
        ilike(partsInventory.name, `%${search}%`),
        ilike(partsInventory.sku, `%${search}%`),
      ),
    ))
  }

  const rows = await query
  return c.json(rows.map(mapPart), 200)
})

// ── POST / — create item ─────────────────────────────────────────────────────
const createPartRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Parts'],
  summary: 'Create parts inventory item (CRIT-002 fix — was POST /inventory)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1),
            description: z.string().optional(),
            sku: z.string().optional(),
            unitPrice: z.number().positive(),
            stockQty: z.number().int().min(0).default(0),
            unit: z.string().default('piece'),
            category: z.string().optional(),
            condition: z.enum(['new', 'used', 'refurbished']).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Part created',
      content: { 'application/json': { schema: PartSchema } },
    },
    401: { description: 'Unauthorized' },
  },
})

partsRouter.openapi(createPartRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const body = c.req.valid('json')
  const [item] = await db
    .insert(partsInventory)
    .values({
      ownerId: user.userId,
      name: body.name,
      description: body.description ?? null,
      sku: body.sku ?? null,
      unitPriceThb: String(body.unitPrice),
      stockQuantity: body.stockQty,
      unit: body.unit,
      category: body.category ?? null,
    })
    .returning()

  return c.json(mapPart(item), 201)
})

// ── GET /dashboard/ — aggregate stats ───────────────────────────────────────
// NOTE: must be registered BEFORE /:id/ to avoid param capture
const dashboardRoute = createRoute({
  method: 'get',
  path: '/dashboard/',
  tags: ['Parts'],
  summary: 'Parts dashboard — total SKUs, stock value, low stock (NOTE-SUB4)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Dashboard stats',
      content: {
        'application/json': {
          schema: z.object({
            total_skus: z.number(),
            total_stock_value: z.number(),
            low_stock: z.array(PartSchema),
            recent_movements: z.array(StockMovementSchema),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
  },
})

partsRouter.openapi(dashboardRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const rows = await db
    .select()
    .from(partsInventory)
    .where(eq(partsInventory.ownerId, user.userId))

  const total_skus = rows.length
  const total_stock_value = rows.reduce(
    (sum, r) => sum + parseFloat(String(r.unitPriceThb)) * r.stockQuantity,
    0,
  )
  const low_stock = rows.filter((r) => r.stockQuantity <= 5).map(mapPart)

  return c.json({
    total_skus,
    total_stock_value: Math.round(total_stock_value * 100) / 100,
    low_stock,
    recent_movements: [], // scaffold — no stock_movements table yet
  }, 200)
})

// ── GET /movements/ — list movements (scaffold) ──────────────────────────────
const listMovementsRoute = createRoute({
  method: 'get',
  path: '/movements/',
  tags: ['Parts'],
  summary: 'List stock movements — scaffold (no DB table yet, NOTE-SUB4)',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      partId: z.string().optional(),
      type: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Movements list (scaffold — always empty)',
      content: { 'application/json': { schema: z.array(StockMovementSchema) } },
    },
    401: { description: 'Unauthorized' },
  },
})

partsRouter.openapi(listMovementsRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)
  // TODO D-3: create stock_movements table + implement tracking
  return c.json([], 200)
})

// ── GET /movements/:id/ — single movement (scaffold) ─────────────────────────
const getMovementRoute = createRoute({
  method: 'get',
  path: '/movements/:id/',
  tags: ['Parts'],
  summary: 'Get single stock movement — scaffold',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Movement (scaffold)' },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
})

partsRouter.openapi(getMovementRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)
  return c.json(err('Stock movements not yet implemented.'), 404)
})

// ── GET /reservations/ — list reservations (scaffold) ────────────────────────
const listReservationsRoute = createRoute({
  method: 'get',
  path: '/reservations/',
  tags: ['Parts'],
  summary: 'List parts reservations — scaffold (NOTE-SUB4)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Reservations list (scaffold — always empty)',
      content: {
        'application/json': {
          schema: z.array(z.object({
            partId: z.string(),
            partName: z.string(),
            qty: z.number(),
            jobId: z.string(),
            jobType: z.string(),
            reservedAt: z.string(),
          })),
        },
      },
    },
    401: { description: 'Unauthorized' },
  },
})

partsRouter.openapi(listReservationsRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)
  // TODO D-3: implement reservations tracking
  return c.json([], 200)
})

// ── GET /:id/ — get single part ───────────────────────────────────────────────
const getPartRoute = createRoute({
  method: 'get',
  path: '/:id/',
  tags: ['Parts'],
  summary: 'Get single parts inventory item (NEW — CRIT-002 fix)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Part item',
      content: { 'application/json': { schema: PartSchema } },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
})

partsRouter.openapi(getPartRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const [item] = await db
    .select()
    .from(partsInventory)
    .where(and(eq(partsInventory.id, id), eq(partsInventory.ownerId, user.userId)))

  if (!item) return c.json(err('Not found.'), 404)
  return c.json(mapPart(item), 200)
})

// ── PATCH /:id/ — update item ────────────────────────────────────────────────
const updatePartRoute = createRoute({
  method: 'patch',
  path: '/:id/',
  tags: ['Parts'],
  summary: 'Update parts inventory item (CRIT-002 fix — was PATCH /inventory/:id)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().optional(),
            unitPrice: z.number().positive().optional(),
            stockQty: z.number().int().min(0).optional(),
            category: z.string().optional(),
            condition: z.enum(['new', 'used', 'refurbished']).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated part',
      content: { 'application/json': { schema: PartSchema } },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
})

partsRouter.openapi(updatePartRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const updateData: Partial<typeof partsInventory.$inferInsert> = { updatedAt: new Date() }
  if (body.name !== undefined) updateData.name = body.name
  if (body.unitPrice !== undefined) updateData.unitPriceThb = String(body.unitPrice)
  if (body.stockQty !== undefined) updateData.stockQuantity = body.stockQty
  if (body.category !== undefined) updateData.category = body.category

  const [updated] = await db
    .update(partsInventory)
    .set(updateData)
    .where(and(eq(partsInventory.id, id), eq(partsInventory.ownerId, user.userId)))
    .returning()

  if (!updated) return c.json(err('Not found.'), 404)
  return c.json(mapPart(updated), 200)
})

// ── DELETE /:id/ — delete item ───────────────────────────────────────────────
const deletePartRoute = createRoute({
  method: 'delete',
  path: '/:id/',
  tags: ['Parts'],
  summary: 'Delete parts inventory item (CRIT-002 fix — was DELETE /inventory/:id)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: 'Deleted' },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
})

partsRouter.openapi(deletePartRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const [deleted] = await db
    .delete(partsInventory)
    .where(and(eq(partsInventory.id, id), eq(partsInventory.ownerId, user.userId)))
    .returning({ id: partsInventory.id })

  if (!deleted) return c.json(err('Not found.'), 404)
  return c.json({ success: true }, 200)
})

// ── POST /:id/stock-in/ — add stock ─────────────────────────────────────────
const stockInRoute = createRoute({
  method: 'post',
  path: '/:id/stock-in/',
  tags: ['Parts'],
  summary: 'Stock in — increment part quantity (NEW, NOTE-SUB4)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            qty: z.number().int().positive(),
            reason: z.enum(['purchase', 'receive_from_disassembly']),
            refId: z.string().optional(),
            note: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Stock movement recorded',
      content: { 'application/json': { schema: StockMovementSchema } },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Part not found' },
  },
})

partsRouter.openapi(stockInRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const [updated] = await db
    .update(partsInventory)
    .set({
      stockQuantity: sql`${partsInventory.stockQuantity} + ${body.qty}`,
      updatedAt: new Date(),
    })
    .where(and(eq(partsInventory.id, id), eq(partsInventory.ownerId, user.userId)))
    .returning({ stockQuantity: partsInventory.stockQuantity })

  if (!updated) return c.json(err('Not found.'), 404)

  // Scaffold movement record (no DB table yet — return stub)
  const movement: z.infer<typeof StockMovementSchema> = {
    id: crypto.randomUUID(),
    partId: id,
    type: 'STOCK_IN',
    qty: body.qty,
    reason: body.reason,
    refId: body.refId ?? null,
    note: body.note ?? null,
    performedBy: user.userId,
    performedAt: new Date().toISOString(),
    balanceAfter: updated.stockQuantity,
  }
  return c.json(movement, 201)
})

// ── POST /:id/stock-adjust/ — set absolute stock quantity ───────────────────
const stockAdjustRoute = createRoute({
  method: 'post',
  path: '/:id/stock-adjust/',
  tags: ['Parts'],
  summary: 'Stock adjust — set absolute stock quantity (NEW, NOTE-SUB4)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            qty: z.number().int().min(0),
            note: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Stock adjustment recorded',
      content: { 'application/json': { schema: StockMovementSchema } },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Part not found' },
  },
})

partsRouter.openapi(stockAdjustRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const [updated] = await db
    .update(partsInventory)
    .set({ stockQuantity: body.qty, updatedAt: new Date() })
    .where(and(eq(partsInventory.id, id), eq(partsInventory.ownerId, user.userId)))
    .returning({ stockQuantity: partsInventory.stockQuantity })

  if (!updated) return c.json(err('Not found.'), 404)

  const movement: z.infer<typeof StockMovementSchema> = {
    id: crypto.randomUUID(),
    partId: id,
    type: 'STOCK_ADJUSTMENT',
    qty: body.qty,
    reason: 'manual',
    refId: null,
    note: body.note,
    performedBy: user.userId,
    performedAt: new Date().toISOString(),
    balanceAfter: updated.stockQuantity,
  }
  return c.json(movement, 201)
})

// ── POST /order — create order + hold escrow (kept from original) ────────────
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
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const body = c.req.valid('json')

  const [part] = await db.select().from(partsInventory).where(eq(partsInventory.id, body.partId))
  if (!part) return c.json(err('Part not found.'), 404)

  const unitPrice = parseFloat(String(part.unitPriceThb))
  const total = unitPrice * body.quantity

  // @needs-point-review: escrow hold logic (debit point_ledger)
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

  if (!order) return c.json(err('Duplicate order key.'), 409)
  return c.json({ id: order.id, status: order.status }, 201)
})

// ── POST /order/:id/confirm — release escrow ─────────────────────────────────
const confirmOrderRoute = createRoute({
  method: 'post',
  path: '/order/:id/confirm',
  tags: ['Parts'],
  summary: 'Confirm order → release escrow to WeeeR (NOTE-SUB4, @needs-point-review)',
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
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  // @needs-point-review: credit WeeeR point_ledger (escrow release)
  const [updated] = await db
    .update(partsOrders)
    .set({ status: 'confirmed', updatedAt: new Date() })
    .where(and(eq(partsOrders.id, id), eq(partsOrders.buyerId, user.userId)))
    .returning({ id: partsOrders.id })

  if (!updated) return c.json(err('Order not found.'), 404)
  return c.json({ success: true, status: 'confirmed' }, 200)
})

// ── POST /order/:id/refund — refund escrow ───────────────────────────────────
const refundOrderRoute = createRoute({
  method: 'post',
  path: '/order/:id/refund',
  tags: ['Parts'],
  summary: 'Refund order → return escrow to buyer (NOTE-SUB4, @needs-point-review)',
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
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  // @needs-point-review: credit buyer point_ledger (escrow refund)
  const [updated] = await db
    .update(partsOrders)
    .set({ status: 'refunded', updatedAt: new Date() })
    .where(and(eq(partsOrders.id, id), eq(partsOrders.buyerId, user.userId))) // SECURITY-FIX: buyerId check (637fd4a)
    .returning({ id: partsOrders.id })

  if (!updated) return c.json(err('Order not found.'), 404)
  return c.json({ success: true, status: 'refunded' }, 200)
})

