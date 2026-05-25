/**
 * parts.ts — NOTE-SUB4: WeeeR parts inventory + order (escrow) routes
 *
 * CRIT-002 FIX (Sub-CMD-1.1 Wave 1): Aligned API paths + response shapes + error format
 *   to match WeeeR FE (apps/weeer/app/(app)/parts/_lib/api.ts)
 *
 * B5-Backend (2026-05-25): Extended with reserve/release/adjust + real stock_movements
 *
 * Paths:
 *   GET    /api/v1/parts/                     — list inventory
 *   POST   /api/v1/parts/                     — create item
 *   GET    /api/v1/parts/dashboard/           — aggregate stats
 *   GET    /api/v1/parts/movements/           — list all movements (real DB)
 *   GET    /api/v1/parts/movements/:id/       — single movement
 *   GET    /api/v1/parts/reservations/        — list reservations (scaffold)
 *   GET    /api/v1/parts/:id/                 — get single item
 *   PATCH  /api/v1/parts/:id/                 — update item
 *   DELETE /api/v1/parts/:id/                 — delete item
 *   POST   /api/v1/parts/:id/stock-in/        — add stock (existing)
 *   POST   /api/v1/parts/:id/stock-adjust/    — set absolute qty (existing)
 *   POST   /api/v1/parts/:id/reserve          — B5: reserve qty
 *   POST   /api/v1/parts/:id/release          — B5: release reserved qty
 *   GET    /api/v1/parts/:id/movements        — B5: per-item movements
 *   POST   /api/v1/parts/:id/adjust           — B5: delta adjust + log
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
import { partsInventory, partsOrders, inventoryStockMovements } from '../db/schema'
import { eq, and, sql, ilike, or, desc } from 'drizzle-orm'
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
  // B5: stock tracking fields
  stockQty: z.number(),
  reservedQty: z.number(),
  availableQty: z.number(),                           // stockQty - reservedQty
  sourceType: z.enum(['NEW', 'USED', 'DISASSEMBLED']),
  scrapSourceId: z.string().nullable(),
  unitPrice: z.number(),
  imageUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const StockMovementSchema = z.object({
  id: z.string(),
  partId: z.string(),
  movementType: z.enum(['IN', 'OUT', 'RESERVE', 'RELEASE', 'ADJUST']),
  quantityDelta: z.number(),
  referenceType: z.string().nullable(),
  referenceId: z.string().nullable(),
  note: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.string(),
})

// Helper: map DB row → Part response
function mapPart(row: typeof partsInventory.$inferSelect): z.infer<typeof PartSchema> {
  const reserved = row.reservedQuantity ?? 0
  return {
    id: row.id,
    shopId: row.ownerId,
    name: row.name,
    sku: row.sku ?? null,
    category: row.category ?? null,
    unit: row.unit,
    condition: 'used',  // no condition column in DB yet — default 'used'
    stockQty: row.stockQuantity,
    reservedQty: reserved,
    availableQty: row.stockQuantity - reserved,
    sourceType: (row.sourceType ?? 'NEW') as 'NEW' | 'USED' | 'DISASSEMBLED',
    scrapSourceId: row.scrapSourceId ?? null,
    unitPrice: parseFloat(String(row.unitPriceThb)),
    imageUrl: null,     // imageR2Key is internal key — presign separately if needed
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

// Helper: map DB movement row → StockMovementSchema
function mapMovement(row: typeof inventoryStockMovements.$inferSelect): z.infer<typeof StockMovementSchema> {
  return {
    id: row.id,
    partId: row.inventoryItemId,
    movementType: row.movementType as 'IN' | 'OUT' | 'RESERVE' | 'RELEASE' | 'ADJUST',
    quantityDelta: row.quantityDelta,
    referenceType: row.referenceType ?? null,
    referenceId: row.referenceId ?? null,
    note: row.note ?? null,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
  }
}

// Helper: Django-style error (matches FE apiFetch `err.detail` parsing)
const err = (detail: string) => ({ detail })

// Helper: insert a stock movement record (B5)
async function insertMovement(data: {
  inventoryItemId: string
  movementType: 'IN' | 'OUT' | 'RESERVE' | 'RELEASE' | 'ADJUST'
  quantityDelta: number
  referenceType?: string | null
  referenceId?: string | null
  note?: string | null
  createdBy: string
}) {
  await db.insert(inventoryStockMovements).values({
    inventoryItemId: data.inventoryItemId,
    movementType: data.movementType,
    quantityDelta: data.quantityDelta,
    referenceType: data.referenceType ?? null,
    referenceId: data.referenceId ?? null,
    note: data.note ?? null,
    createdBy: data.createdBy,
  })
}

// ── GET / — list inventory ───────────────────────────────────────────────────
const listPartsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Parts'],
  summary: 'List WeeeR parts inventory',
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
  summary: 'Create parts inventory item',
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
            sourceType: z.enum(['NEW', 'USED', 'DISASSEMBLED']).default('NEW'),
            scrapSourceId: z.string().uuid().optional(),
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
      sourceType: body.sourceType,
      scrapSourceId: body.scrapSourceId ?? null,
    })
    .returning()

  // Log initial IN movement if stockQty > 0
  if (body.stockQty > 0) {
    await insertMovement({
      inventoryItemId: item.id,
      movementType: 'IN',
      quantityDelta: body.stockQty,
      referenceType: 'manual',
      note: 'initial stock on create',
      createdBy: user.userId,
    })
  }

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

  // B5: real recent movements for this owner's items
  const recentMovements = await db
    .select({ mv: inventoryStockMovements })
    .from(inventoryStockMovements)
    .innerJoin(partsInventory, eq(inventoryStockMovements.inventoryItemId, partsInventory.id))
    .where(eq(partsInventory.ownerId, user.userId))
    .orderBy(desc(inventoryStockMovements.createdAt))
    .limit(10)

  return c.json({
    total_skus,
    total_stock_value: Math.round(total_stock_value * 100) / 100,
    low_stock,
    recent_movements: recentMovements.map(r => mapMovement(r.mv)),
  }, 200)
})

// ── GET /movements/ — list all movements ─────────────────────────────────────
const listMovementsRoute = createRoute({
  method: 'get',
  path: '/movements/',
  tags: ['Parts'],
  summary: 'List stock movements — real DB (B5 upgrade from scaffold)',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      partId: z.string().uuid().optional(),
      type: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Movements list',
      content: { 'application/json': { schema: z.array(StockMovementSchema) } },
    },
    401: { description: 'Unauthorized' },
  },
})

partsRouter.openapi(listMovementsRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { partId } = c.req.valid('query')

  const rows = await db
    .select({ mv: inventoryStockMovements })
    .from(inventoryStockMovements)
    .innerJoin(partsInventory, eq(inventoryStockMovements.inventoryItemId, partsInventory.id))
    .where(
      and(
        eq(partsInventory.ownerId, user.userId),
        partId ? eq(inventoryStockMovements.inventoryItemId, partId) : undefined,
      ),
    )
    .orderBy(desc(inventoryStockMovements.createdAt))
    .limit(200)

  return c.json(rows.map(r => mapMovement(r.mv)), 200)
})

// ── GET /movements/:id/ — single movement ────────────────────────────────────
const getMovementRoute = createRoute({
  method: 'get',
  path: '/movements/:id/',
  tags: ['Parts'],
  summary: 'Get single stock movement',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Movement',
      content: { 'application/json': { schema: StockMovementSchema } },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
})

partsRouter.openapi(getMovementRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const [row] = await db
    .select({ mv: inventoryStockMovements })
    .from(inventoryStockMovements)
    .innerJoin(partsInventory, eq(inventoryStockMovements.inventoryItemId, partsInventory.id))
    .where(
      and(
        eq(inventoryStockMovements.id, id),
        eq(partsInventory.ownerId, user.userId),
      ),
    )

  if (!row) return c.json(err('Not found.'), 404)
  return c.json(mapMovement(row.mv), 200)
})

// ── GET /reservations/ — list reservations (scaffold) ────────────────────────
const listReservationsRoute = createRoute({
  method: 'get',
  path: '/reservations/',
  tags: ['Parts'],
  summary: 'List parts reservations — filtered RESERVE movements (B5)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Active reservations (RESERVE movements without matching RELEASE)',
      content: { 'application/json': { schema: z.array(StockMovementSchema) } },
    },
    401: { description: 'Unauthorized' },
  },
})

partsRouter.openapi(listReservationsRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const rows = await db
    .select({ mv: inventoryStockMovements })
    .from(inventoryStockMovements)
    .innerJoin(partsInventory, eq(inventoryStockMovements.inventoryItemId, partsInventory.id))
    .where(
      and(
        eq(partsInventory.ownerId, user.userId),
        eq(inventoryStockMovements.movementType, 'RESERVE'),
      ),
    )
    .orderBy(desc(inventoryStockMovements.createdAt))
    .limit(100)

  return c.json(rows.map(r => mapMovement(r.mv)), 200)
})

// ── GET /:id/ — get single part ───────────────────────────────────────────────
const getPartRoute = createRoute({
  method: 'get',
  path: '/:id/',
  tags: ['Parts'],
  summary: 'Get single parts inventory item',
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
  summary: 'Update parts inventory item',
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
            sourceType: z.enum(['NEW', 'USED', 'DISASSEMBLED']).optional(),
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
  if (body.sourceType !== undefined) updateData.sourceType = body.sourceType

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
  summary: 'Delete parts inventory item',
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

// ── POST /:id/stock-in/ — add stock (existing, now logs to movements) ────────
const stockInRoute = createRoute({
  method: 'post',
  path: '/:id/stock-in/',
  tags: ['Parts'],
  summary: 'Stock in — increment part quantity (NOTE-SUB4)',
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
    .returning({ id: partsInventory.id })

  if (!updated) return c.json(err('Not found.'), 404)

  // B5: log real movement to DB
  await insertMovement({
    inventoryItemId: id,
    movementType: 'IN',
    quantityDelta: body.qty,
    referenceType: 'manual',
    referenceId: body.refId ?? null,
    note: body.note ?? body.reason,
    createdBy: user.userId,
  })

  const [mv] = await db
    .select()
    .from(inventoryStockMovements)
    .where(eq(inventoryStockMovements.inventoryItemId, id))
    .orderBy(desc(inventoryStockMovements.createdAt))
    .limit(1)

  return c.json(mapMovement(mv), 201)
})

// ── POST /:id/stock-adjust/ — set absolute stock quantity (existing) ─────────
const stockAdjustRoute = createRoute({
  method: 'post',
  path: '/:id/stock-adjust/',
  tags: ['Parts'],
  summary: 'Stock adjust — set absolute stock quantity (NOTE-SUB4)',
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

  const [before] = await db
    .select({ stockQuantity: partsInventory.stockQuantity })
    .from(partsInventory)
    .where(and(eq(partsInventory.id, id), eq(partsInventory.ownerId, user.userId)))

  if (!before) return c.json(err('Not found.'), 404)

  await db
    .update(partsInventory)
    .set({ stockQuantity: body.qty, updatedAt: new Date() })
    .where(and(eq(partsInventory.id, id), eq(partsInventory.ownerId, user.userId)))

  const delta = body.qty - before.stockQuantity

  await insertMovement({
    inventoryItemId: id,
    movementType: 'ADJUST',
    quantityDelta: delta,
    referenceType: 'manual',
    note: body.note,
    createdBy: user.userId,
  })

  const [mv] = await db
    .select()
    .from(inventoryStockMovements)
    .where(eq(inventoryStockMovements.inventoryItemId, id))
    .orderBy(desc(inventoryStockMovements.createdAt))
    .limit(1)

  return c.json(mapMovement(mv), 201)
})

// ── POST /:id/reserve — B5: reserve stock for a repair job ───────────────────
const reserveRoute = createRoute({
  method: 'post',
  path: '/:id/reserve',
  tags: ['Parts'],
  summary: 'B5: Reserve stock quantity for a repair job',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            quantity: z.number().int().positive(),
            repair_job_id: z.string().uuid(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Reserved — returns updated part',
      content: { 'application/json': { schema: PartSchema } },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Part not found' },
    422: { description: 'Insufficient available stock' },
  },
})

partsRouter.openapi(reserveRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  // ตรวจสอบ available stock ก่อน reserve (security: ต้องเป็น owner)
  const [current] = await db
    .select()
    .from(partsInventory)
    .where(and(eq(partsInventory.id, id), eq(partsInventory.ownerId, user.userId)))

  if (!current) return c.json(err('Not found.'), 404)

  const available = current.stockQuantity - (current.reservedQuantity ?? 0)
  if (body.quantity > available) {
    return c.json(err(`Insufficient available stock. Available: ${available}, requested: ${body.quantity}`), 422)
  }

  const [updated] = await db
    .update(partsInventory)
    .set({
      reservedQuantity: sql`${partsInventory.reservedQuantity} + ${body.quantity}`,
      updatedAt: new Date(),
    })
    .where(and(eq(partsInventory.id, id), eq(partsInventory.ownerId, user.userId)))
    .returning()

  await insertMovement({
    inventoryItemId: id,
    movementType: 'RESERVE',
    quantityDelta: -body.quantity,  // RESERVE = ลด available
    referenceType: 'repair_job',
    referenceId: body.repair_job_id,
    createdBy: user.userId,
  })

  return c.json(mapPart(updated), 200)
})

// ── POST /:id/release — B5: release reserved stock ───────────────────────────
const releaseRoute = createRoute({
  method: 'post',
  path: '/:id/release',
  tags: ['Parts'],
  summary: 'B5: Release previously reserved stock quantity',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            quantity: z.number().int().positive(),
            repair_job_id: z.string().uuid(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Released — returns updated part',
      content: { 'application/json': { schema: PartSchema } },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Part not found' },
    422: { description: 'Cannot release more than reserved' },
  },
})

partsRouter.openapi(releaseRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const [current] = await db
    .select()
    .from(partsInventory)
    .where(and(eq(partsInventory.id, id), eq(partsInventory.ownerId, user.userId)))

  if (!current) return c.json(err('Not found.'), 404)

  const reserved = current.reservedQuantity ?? 0
  if (body.quantity > reserved) {
    return c.json(err(`Cannot release ${body.quantity} — only ${reserved} reserved.`), 422)
  }

  const [updated] = await db
    .update(partsInventory)
    .set({
      reservedQuantity: sql`${partsInventory.reservedQuantity} - ${body.quantity}`,
      updatedAt: new Date(),
    })
    .where(and(eq(partsInventory.id, id), eq(partsInventory.ownerId, user.userId)))
    .returning()

  await insertMovement({
    inventoryItemId: id,
    movementType: 'RELEASE',
    quantityDelta: body.quantity,  // RELEASE = เพิ่ม available กลับ
    referenceType: 'repair_job',
    referenceId: body.repair_job_id,
    createdBy: user.userId,
  })

  return c.json(mapPart(updated), 200)
})

// ── GET /:id/movements — B5: per-item movement history ───────────────────────
const itemMovementsRoute = createRoute({
  method: 'get',
  path: '/:id/movements',
  tags: ['Parts'],
  summary: 'B5: List stock movements for a specific inventory item',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    query: z.object({
      limit: z.string().optional(),  // default 50
    }),
  },
  responses: {
    200: {
      description: 'Movements for this item (newest first)',
      content: { 'application/json': { schema: z.array(StockMovementSchema) } },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Part not found' },
  },
})

partsRouter.openapi(itemMovementsRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const { limit: limitStr } = c.req.valid('query')
  const limit = Math.min(parseInt(limitStr ?? '50', 10) || 50, 200)

  // ตรวจสอบว่า item เป็น owner ก่อน (security)
  const [item] = await db
    .select({ id: partsInventory.id })
    .from(partsInventory)
    .where(and(eq(partsInventory.id, id), eq(partsInventory.ownerId, user.userId)))

  if (!item) return c.json(err('Not found.'), 404)

  const rows = await db
    .select()
    .from(inventoryStockMovements)
    .where(eq(inventoryStockMovements.inventoryItemId, id))
    .orderBy(desc(inventoryStockMovements.createdAt))
    .limit(limit)

  return c.json(rows.map(mapMovement), 200)
})

// ── POST /:id/adjust — B5: delta-based stock adjust + log ────────────────────
const adjustRoute = createRoute({
  method: 'post',
  path: '/:id/adjust',
  tags: ['Parts'],
  summary: 'B5: Adjust stock by delta (±quantity_delta) + log movement',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            quantity_delta: z.number().int(),  // บวก = เพิ่ม, ลบ = ลด
            note: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Adjusted — returns updated part',
      content: { 'application/json': { schema: PartSchema } },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Part not found' },
    422: { description: 'Adjustment would make stock negative' },
  },
})

partsRouter.openapi(adjustRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('Authentication credentials were not provided.'), 401)

  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const [current] = await db
    .select()
    .from(partsInventory)
    .where(and(eq(partsInventory.id, id), eq(partsInventory.ownerId, user.userId)))

  if (!current) return c.json(err('Not found.'), 404)

  const newQty = current.stockQuantity + body.quantity_delta
  if (newQty < 0) {
    return c.json(err(`Adjustment would result in negative stock (current: ${current.stockQuantity}, delta: ${body.quantity_delta})`), 422)
  }

  const [updated] = await db
    .update(partsInventory)
    .set({
      stockQuantity: newQty,
      updatedAt: new Date(),
    })
    .where(and(eq(partsInventory.id, id), eq(partsInventory.ownerId, user.userId)))
    .returning()

  await insertMovement({
    inventoryItemId: id,
    movementType: 'ADJUST',
    quantityDelta: body.quantity_delta,
    referenceType: 'manual',
    note: body.note,
    createdBy: user.userId,
  })

  return c.json(mapPart(updated), 200)
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
    .where(and(eq(partsOrders.id, id), eq(partsOrders.buyerId, user.userId)))  // SECURITY-FIX: buyerId check
    .returning({ id: partsOrders.id })

  if (!updated) return c.json(err('Order not found.'), 404)
  return c.json({ success: true, status: 'refunded' }, 200)
})
