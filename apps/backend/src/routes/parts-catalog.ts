/**
 * parts-catalog.ts — D-6 Parts B2B: Public Catalog API
 *
 * GET  /api/v1/parts/catalog/         — list listings (filter: category/condition/price/search)
 * GET  /api/v1/parts/catalog/:id/     — listing detail
 * GET  /api/v1/parts/search/          — full-text search (name + part_number)
 * POST /api/v1/parts/catalog/         — WeeeR สร้าง listing ใหม่
 * PATCH /api/v1/parts/catalog/:id/    — WeeeR อัพเดต listing
 * DELETE /api/v1/parts/catalog/:id/   — WeeeR ลบ listing (soft delete → status=deleted)
 *
 * Auth: GET = optional (public catalog) | POST/PATCH/DELETE = required (weeer)
 * Error format: { detail: "..." }
 *
 * Migration: 0021_d6_parts_b2b.sql
 */
import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { db } from '../db/client'
import { partsListings, listingMeta } from '../db/schema'
import { eq, and, ilike, or, gte, lte, sql } from 'drizzle-orm'
import { verifyAccessToken } from '../lib/jwt'

export const partsCatalogRouter = new OpenAPIHono()

// ── Auth helper ──────────────────────────────────────────────────────────────
async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}

const err = (detail: string) => ({ detail })

// ── Listing response schema ──────────────────────────────────────────────────
const ListingSchema = z.object({
  id: z.string(),
  weeerUserId: z.string(),
  inventoryItemId: z.string().nullable(),
  sourceType: z.string(),
  sourceScrapId: z.string().nullable(),
  partName: z.string(),
  partNumber: z.string().nullable(),
  manufacturer: z.string().nullable(),
  oemCompatibility: z.unknown(),
  conditionScore: z.number(),
  unitPrice: z.string(),
  tierPricing: z.unknown(),
  qtyAvailable: z.number(),
  qtyReserved: z.number(),
  photos: z.unknown(),
  warrantyDays: z.number(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

function mapListing(row: typeof partsListings.$inferSelect) {
  return {
    id: row.id,
    weeerUserId: row.weeerUserId,
    inventoryItemId: row.inventoryItemId ?? null,
    sourceType: row.sourceType,
    sourceScrapId: row.sourceScrapId ?? null,
    partName: row.partName,
    partNumber: row.partNumber ?? null,
    manufacturer: row.manufacturer ?? null,
    oemCompatibility: row.oemCompatibility,
    conditionScore: row.conditionScore,
    unitPrice: row.unitPrice,
    tierPricing: row.tierPricing,
    qtyAvailable: row.qtyAvailable,
    qtyReserved: row.qtyReserved,
    photos: row.photos,
    warrantyDays: row.warrantyDays,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

// ── GET /catalog/ — list public listings ─────────────────────────────────────
partsCatalogRouter.get('/', async (c) => {
  const { search, sourceType, minScore, maxPrice, minPrice, status } = c.req.query()

  const conditions = [
    eq(partsListings.status, status ?? 'active'),
  ]

  if (search) {
    conditions.push(
      or(
        ilike(partsListings.partName, `%${search}%`),
        ilike(partsListings.partNumber, `%${search}%`),
        ilike(partsListings.manufacturer, `%${search}%`),
      )!,
    )
  }
  if (sourceType) conditions.push(eq(partsListings.sourceType, sourceType))
  if (minScore) conditions.push(gte(partsListings.conditionScore, parseInt(minScore)))
  if (minPrice) conditions.push(gte(partsListings.unitPrice, minPrice))
  if (maxPrice) conditions.push(lte(partsListings.unitPrice, maxPrice))

  const rows = await db
    .select()
    .from(partsListings)
    .where(and(...conditions))
    .orderBy(sql`${partsListings.createdAt} DESC`)
    .limit(100)

  return c.json({ items: rows.map(mapListing), total: rows.length })
})

// ── GET /catalog/search/ — full-text search ──────────────────────────────────
partsCatalogRouter.get('/search', async (c) => {
  const { q } = c.req.query()
  if (!q || q.trim().length < 2) {
    return c.json({ detail: 'กรุณาระบุคำค้นหา (อย่างน้อย 2 ตัวอักษร)' }, 400)
  }

  const rows = await db
    .select()
    .from(partsListings)
    .where(
      and(
        eq(partsListings.status, 'active'),
        or(
          ilike(partsListings.partName, `%${q}%`),
          ilike(partsListings.partNumber, `%${q}%`),
          ilike(partsListings.manufacturer, `%${q}%`),
        ),
      ),
    )
    .orderBy(sql`${partsListings.createdAt} DESC`)
    .limit(50)

  return c.json({ items: rows.map(mapListing), total: rows.length, query: q })
})

// ── GET /catalog/:id/ — listing detail ───────────────────────────────────────
partsCatalogRouter.get('/:id', async (c) => {
  const { id } = c.req.param()
  const [row] = await db
    .select()
    .from(partsListings)
    .where(eq(partsListings.id, id))
    .limit(1)

  if (!row) return c.json(err('ไม่พบ listing'), 404)
  if (row.status === 'deleted') return c.json(err('listing ถูกลบแล้ว'), 404)

  return c.json(mapListing(row))
})

// ── POST /catalog/ — WeeeR สร้าง listing ─────────────────────────────────────
partsCatalogRouter.post('/', async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const body = await c.req.json().catch(() => null)
  if (!body) return c.json(err('ข้อมูลไม่ถูกต้อง'), 400)

  const Schema = z.object({
    partName: z.string().min(1).max(200),
    partNumber: z.string().max(100).optional(),
    manufacturer: z.string().max(100).optional(),
    sourceType: z.enum(['new', 'used', 'disassembled']).default('new'),
    conditionScore: z.number().int().min(1).max(10).default(7),
    unitPrice: z.number().positive(),
    qtyAvailable: z.number().int().min(0).default(0),
    warrantyDays: z.number().int().min(0).default(7),
    inventoryItemId: z.string().uuid().optional(),
    sourceScrapId: z.string().uuid().optional(),
    oemCompatibility: z.array(z.unknown()).default([]),
    tierPricing: z.array(z.unknown()).default([]),
    photos: z.array(z.string()).default([]),
    status: z.enum(['active', 'inactive']).default('active'),
    // B6 single-source-of-truth: ตำบล (GR-9) เก็บที่ listing_meta (parts_listings ไม่มี column)
    tambonId: z.number().int().positive().optional(),
  })

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return c.json(err(parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ครบถ้วน'), 422)
  }

  const d = parsed.data
  // Ruling 1A: ทุก listing ต้องมี listing_meta (B6) — insert parts row + listing_meta
  // + เซ็ต listing_meta_id ใน transaction เดียว (กัน orphan → /transition|reviews|questions ใช้ได้)
  const created = await db.transaction(async (tx) => {
    // 1) insert parts_listings ก่อน (ได้ id ไว้เป็น domain_ref_id)
    const [partRow] = await tx
      .insert(partsListings)
      .values({
        weeerUserId: user.userId,
        partName: d.partName,
        partNumber: d.partNumber,
        manufacturer: d.manufacturer,
        sourceType: d.sourceType,
        sourceScrapId: d.sourceScrapId,
        conditionScore: d.conditionScore,
        unitPrice: String(d.unitPrice),
        qtyAvailable: d.qtyAvailable,
        warrantyDays: d.warrantyDays,
        inventoryItemId: d.inventoryItemId,
        oemCompatibility: d.oemCompatibility,
        tierPricing: d.tierPricing,
        photos: d.photos,
        status: d.status,
      })
      .returning()

    // 2) insert listing_meta (universal id) — active listing → state 'published'
    const [meta] = await tx
      .insert(listingMeta)
      .values({
        listingType: 'parts',
        domainRefId: partRow!.id,
        ownerId: user.userId,
        tambonId: d.tambonId ?? null,
        state: d.status === 'active' ? 'published' : 'draft',
      })
      .returning({ listingId: listingMeta.listingId })

    // 3) backlink parts_listings.listing_meta_id (integrity 2 ทาง)
    const [linked] = await tx
      .update(partsListings)
      .set({ listingMetaId: meta!.listingId, updatedAt: new Date() })
      .where(eq(partsListings.id, partRow!.id))
      .returning()
    return linked!
  })

  return c.json(mapListing(created), 201)
})

// ── PATCH /catalog/:id/ — WeeeR อัพเดต listing ───────────────────────────────
partsCatalogRouter.patch('/:id', async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const { id } = c.req.param()
  const [existing] = await db
    .select()
    .from(partsListings)
    .where(eq(partsListings.id, id))
    .limit(1)

  if (!existing) return c.json(err('ไม่พบ listing'), 404)
  if (existing.weeerUserId !== user.userId) return c.json(err('ไม่มีสิทธิ์แก้ไข listing นี้'), 403)

  const body = await c.req.json().catch(() => ({}))

  const UpdateSchema = z.object({
    partName: z.string().min(1).max(200).optional(),
    unitPrice: z.number().positive().optional(),
    qtyAvailable: z.number().int().min(0).optional(),
    conditionScore: z.number().int().min(1).max(10).optional(),
    warrantyDays: z.number().int().min(0).optional(),
    status: z.enum(['active', 'inactive', 'sold_out']).optional(),
    photos: z.array(z.string()).optional(),
    tierPricing: z.array(z.unknown()).optional(),
  })

  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(err(parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง'), 422)
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  const d = parsed.data
  if (d.partName !== undefined) updates.partName = d.partName
  if (d.unitPrice !== undefined) updates.unitPrice = String(d.unitPrice)
  if (d.qtyAvailable !== undefined) updates.qtyAvailable = d.qtyAvailable
  if (d.conditionScore !== undefined) updates.conditionScore = d.conditionScore
  if (d.warrantyDays !== undefined) updates.warrantyDays = d.warrantyDays
  if (d.status !== undefined) updates.status = d.status
  if (d.photos !== undefined) updates.photos = d.photos
  if (d.tierPricing !== undefined) updates.tierPricing = d.tierPricing

  const [updated] = await db
    .update(partsListings)
    .set(updates)
    .where(eq(partsListings.id, id))
    .returning()

  return c.json(mapListing(updated!))
})

// ── DELETE /catalog/:id/ — WeeeR ลบ listing (soft delete) ────────────────────
partsCatalogRouter.delete('/:id', async (c) => {
  const user = await getAuthUser(c)
  if (!user) return c.json(err('กรุณาเข้าสู่ระบบ'), 401)

  const { id } = c.req.param()
  const [existing] = await db
    .select()
    .from(partsListings)
    .where(eq(partsListings.id, id))
    .limit(1)

  if (!existing) return c.json(err('ไม่พบ listing'), 404)
  if (existing.weeerUserId !== user.userId) return c.json(err('ไม่มีสิทธิ์ลบ listing นี้'), 403)

  // soft delete + cascade state ไป listing_meta (D83 cancelled) ใน transaction เดียว
  await db.transaction(async (tx) => {
    await tx
      .update(partsListings)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(partsListings.id, id))
    if (existing.listingMetaId) {
      await tx
        .update(listingMeta)
        .set({ state: 'cancelled', updatedAt: new Date() })
        .where(eq(listingMeta.listingId, existing.listingMetaId))
    }
  })

  return c.json({ success: true, id })
})
