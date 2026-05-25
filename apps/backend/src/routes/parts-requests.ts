/**
 * parts-requests.ts — D-6 Parts B2B: Cross-Shop Broadcast Request API
 *
 * POST /api/v1/parts/requests/                    — WeeeR สร้าง broadcast request
 * GET  /api/v1/parts/requests/inbox/              — ร้านอื่น (WeeeR) เห็นคำขอที่ broadcast
 * GET  /api/v1/parts/requests/my/                 — WeeeR ดู request ของตัวเอง
 * GET  /api/v1/parts/requests/:id/                — รายละเอียด request + quotes
 * POST /api/v1/parts/requests/:id/quote/          — WeeeR เสนอราคา
 * POST /api/v1/parts/requests/:id/accept-quote/   — WeeeR เจ้าของ request ตกลง quote
 *
 * ⚠️ flow นี้ = WeeeR ขออะไหล่จากร้านอื่น (cross-shop broadcast)
 *    ต่างจาก B5 in-shop request (WeeeT ขอจาก stock ร้านตัวเอง)
 *
 * Auth: required (weeer only)
 * Error format: { detail: "..." }
 *
 * Migration: 0021_d6_parts_b2b.sql
 */
import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { db } from '../db/client'
import { partsRequests, partsRequestQuotes } from '../db/schema'
import { eq, and, ne, sql } from 'drizzle-orm'
import { verifyAccessToken } from '../lib/jwt'

export const partsRequestsRouter = new OpenAPIHono()

// ── Auth helper ──────────────────────────────────────────────────────────────
async function requireAuth(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

const err = (detail: string) => ({ detail })

// ── Mappers ──────────────────────────────────────────────────────────────────
function mapRequest(row: typeof partsRequests.$inferSelect) {
  return {
    id: row.id,
    requesterWeeerUserId: row.requesterWeeerUserId,
    forRepairJobId: row.forRepairJobId ?? null,
    specificShopId: row.specificShopId ?? null,
    matchedOrderId: row.matchedOrderId ?? null,
    applianceBrand: row.applianceBrand,
    applianceModel: row.applianceModel,
    partName: row.partName,
    partNumber: row.partNumber ?? null,
    qtyNeeded: row.qtyNeeded,
    urgency: row.urgency,
    neededBy: row.neededBy?.toISOString() ?? null,
    preferredCondition: row.preferredCondition ?? null,
    maxPricePerUnit: row.maxPricePerUnit ?? null,
    broadcastScope: row.broadcastScope,
    status: row.status,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }
}

function mapQuote(row: typeof partsRequestQuotes.$inferSelect) {
  return {
    id: row.id,
    requestId: row.requestId,
    responderWeeerUserId: row.responderWeeerUserId,
    listingId: row.listingId ?? null,
    quotedPricePerUnit: row.quotedPricePerUnit,
    availableQty: row.availableQty,
    estimatedDeliveryDays: row.estimatedDeliveryDays ?? null,
    notes: row.notes ?? null,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }
}

// ── POST /requests/ — สร้าง broadcast request ────────────────────────────────
partsRequestsRouter.post('/', async (c) => {
  const user = await requireAuth(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const body = await c.req.json().catch(() => null)
  if (!body) return c.json(err('ข้อมูลไม่ถูกต้อง'), 400)

  const Schema = z.object({
    applianceBrand: z.string().min(1).max(100),
    applianceModel: z.string().min(1).max(100),
    partName: z.string().min(1).max(200),
    partNumber: z.string().max(100).optional(),
    qtyNeeded: z.number().int().min(1).default(1),
    urgency: z.enum(['normal', 'urgent', 'emergency']).default('normal'),
    neededBy: z.string().datetime().optional(),
    preferredCondition: z.string().optional(),
    maxPricePerUnit: z.number().positive().optional(),
    broadcastScope: z.enum(['nearby', 'all', 'specific']).default('all'),
    specificShopId: z.string().uuid().optional(),
    forRepairJobId: z.string().uuid().optional(),
  })

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return c.json(err(parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ครบ'), 422)
  }

  const d = parsed.data

  // คำนวณ expiresAt ตาม urgency
  const expiresHours = d.urgency === 'emergency' ? 2 : d.urgency === 'urgent' ? 12 : 24
  const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000)

  const [created] = await db
    .insert(partsRequests)
    .values({
      requesterWeeerUserId: user.userId,
      applianceBrand: d.applianceBrand,
      applianceModel: d.applianceModel,
      partName: d.partName,
      partNumber: d.partNumber,
      qtyNeeded: d.qtyNeeded,
      urgency: d.urgency,
      neededBy: d.neededBy ? new Date(d.neededBy) : undefined,
      preferredCondition: d.preferredCondition,
      maxPricePerUnit: d.maxPricePerUnit ? String(d.maxPricePerUnit) : undefined,
      broadcastScope: d.broadcastScope,
      specificShopId: d.specificShopId,
      forRepairJobId: d.forRepairJobId,
      expiresAt,
      status: 'open',
    })
    .returning()

  return c.json(mapRequest(created!), 201)
})

// ── GET /requests/inbox/ — ดู broadcast requests จากร้านอื่น ─────────────────
partsRequestsRouter.get('/inbox', async (c) => {
  const user = await requireAuth(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const now = new Date()

  // เห็น requests ที่ open + ยังไม่หมดอายุ + ไม่ใช่ของตัวเอง
  const rows = await db
    .select()
    .from(partsRequests)
    .where(
      and(
        eq(partsRequests.status, 'open'),
        ne(partsRequests.requesterWeeerUserId, user.userId),
        sql`${partsRequests.expiresAt} > ${now}`,
      ),
    )
    .orderBy(sql`${partsRequests.createdAt} DESC`)
    .limit(50)

  return c.json({ items: rows.map(mapRequest), total: rows.length })
})

// ── GET /requests/my/ — ดู requests ของตัวเอง ─────────────────────────────────
partsRequestsRouter.get('/my', async (c) => {
  const user = await requireAuth(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const rows = await db
    .select()
    .from(partsRequests)
    .where(eq(partsRequests.requesterWeeerUserId, user.userId))
    .orderBy(sql`${partsRequests.createdAt} DESC`)
    .limit(50)

  return c.json({ items: rows.map(mapRequest), total: rows.length })
})

// ── GET /requests/:id/ — รายละเอียด + quotes ─────────────────────────────────
partsRequestsRouter.get('/:id', async (c) => {
  const user = await requireAuth(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const { id } = c.req.param()

  const [request] = await db
    .select()
    .from(partsRequests)
    .where(eq(partsRequests.id, id))
    .limit(1)

  if (!request) return c.json(err('ไม่พบ request'), 404)

  // ดึง quotes (เห็นได้ทั้ง requester + responders)
  const quotes = await db
    .select()
    .from(partsRequestQuotes)
    .where(eq(partsRequestQuotes.requestId, id))
    .orderBy(sql`${partsRequestQuotes.createdAt} DESC`)

  return c.json({ ...mapRequest(request), quotes: quotes.map(mapQuote) })
})

// ── POST /requests/:id/quote/ — เสนอราคา ─────────────────────────────────────
partsRequestsRouter.post('/:id/quote', async (c) => {
  const user = await requireAuth(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const { id } = c.req.param()
  const [request] = await db
    .select()
    .from(partsRequests)
    .where(eq(partsRequests.id, id))
    .limit(1)

  if (!request) return c.json(err('ไม่พบ request'), 404)
  if (request.status !== 'open') return c.json(err('request ไม่เปิดรับ quote แล้ว'), 409)
  if (request.requesterWeeerUserId === user.userId) {
    return c.json(err('ไม่สามารถ quote request ของตัวเองได้'), 403)
  }

  const body = await c.req.json().catch(() => null)
  if (!body) return c.json(err('ข้อมูลไม่ถูกต้อง'), 400)

  const Schema = z.object({
    quotedPricePerUnit: z.number().positive(),
    availableQty: z.number().int().min(1),
    estimatedDeliveryDays: z.number().int().min(0).optional(),
    notes: z.string().max(500).optional(),
    listingId: z.string().uuid().optional(),
  })

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return c.json(err(parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ครบ'), 422)
  }

  const d = parsed.data

  const [quote] = await db
    .insert(partsRequestQuotes)
    .values({
      requestId: id,
      responderWeeerUserId: user.userId,
      listingId: d.listingId,
      quotedPricePerUnit: String(d.quotedPricePerUnit),
      availableQty: d.availableQty,
      estimatedDeliveryDays: d.estimatedDeliveryDays,
      notes: d.notes,
      status: 'pending',
    })
    .returning()

  // อัพเดต request status → 'quoted'
  if (request.status === 'open') {
    await db
      .update(partsRequests)
      .set({ status: 'quoted' })
      .where(eq(partsRequests.id, id))
  }

  return c.json(mapQuote(quote!), 201)
})

// ── POST /requests/:id/accept-quote/ — ตกลง quote ────────────────────────────
partsRequestsRouter.post('/:id/accept-quote', async (c) => {
  const user = await requireAuth(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const { id } = c.req.param()
  const [request] = await db
    .select()
    .from(partsRequests)
    .where(eq(partsRequests.id, id))
    .limit(1)

  if (!request) return c.json(err('ไม่พบ request'), 404)
  if (request.requesterWeeerUserId !== user.userId) {
    return c.json(err('ไม่มีสิทธิ์ accept quote ของ request นี้'), 403)
  }
  if (request.status === 'matched') {
    return c.json(err('request มี match แล้ว'), 409)
  }

  const body = await c.req.json().catch(() => null)
  const quoteId = body?.quoteId
  if (!quoteId) return c.json(err('กรุณาระบุ quoteId'), 400)

  const [quote] = await db
    .select()
    .from(partsRequestQuotes)
    .where(
      and(eq(partsRequestQuotes.id, quoteId), eq(partsRequestQuotes.requestId, id)),
    )
    .limit(1)

  if (!quote) return c.json(err('ไม่พบ quote'), 404)
  if (quote.status !== 'pending') return c.json(err('quote ไม่พร้อม accept'), 409)

  // accept quote
  await db
    .update(partsRequestQuotes)
    .set({ status: 'accepted' })
    .where(eq(partsRequestQuotes.id, quoteId))

  // reject quotes อื่น
  await db
    .update(partsRequestQuotes)
    .set({ status: 'rejected' })
    .where(
      and(
        eq(partsRequestQuotes.requestId, id),
        ne(partsRequestQuotes.id, quoteId),
      ),
    )

  // อัพเดต request → matched
  await db
    .update(partsRequests)
    .set({ status: 'matched' })
    .where(eq(partsRequests.id, id))

  return c.json({
    success: true,
    requestId: id,
    acceptedQuoteId: quoteId,
    nextStep: 'สร้าง order จาก quote (POST /parts/cart/checkout หรือ POST /parts/orders)',
  })
})
