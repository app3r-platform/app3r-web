/**
 * location-master.ts — D87 W-Round-1 Wave 1: Thai admin location reference API
 *
 * PUBLIC (no auth) — non-sensitive reference data (D71 public access)
 *
 * GR-9 cascade dropdown + zipcode auto-fill:
 *   GET /api/v1/locations/provinces                  — list provinces
 *   GET /api/v1/locations/provinces/:id/amphoes      — amphoes of a province
 *   GET /api/v1/locations/amphoes/:id/tambons        — tambons of an amphoe (+ zipcode)
 *   GET /api/v1/locations/tambons/:id                — single tambon detail (zipcode auto-fill)
 *
 * GR-10 "ใกล้ฉัน":
 *   GET /api/v1/locations/nearby?lat=&lng=&radiusKm=&limit=
 *     Haversine บน tambon lat/lng (ไม่ใช้ PostGIS ตาม D87) — คืน tambon เรียงตามระยะ
 *
 * Decision: D87 (36e813ec-7277-81ec-8d00-dc3e3fee8816)
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { db } from '../db/client'
import { provinces, amphoes, tambons } from '../db/schema'
import { eq, asc, isNotNull, and, sql } from 'drizzle-orm'

export const locationMasterRouter = new OpenAPIHono()

// ── GET /provinces ──────────────────────────────────────────────────────────
const provincesRoute = createRoute({
  method: 'get',
  path: '/provinces',
  tags: ['LocationMaster'],
  summary: 'List all provinces (GR-9 cascade dropdown, public) (D87)',
  responses: {
    200: {
      description: 'Provinces',
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(
              z.object({
                id: z.number(),
                nameTh: z.string(),
                nameEn: z.string().nullable(),
                region: z.string().nullable(),
              }),
            ),
          }),
        },
      },
    },
  },
})

locationMasterRouter.openapi(provincesRoute, async (c) => {
  const rows = await db
    .select({
      id: provinces.id,
      nameTh: provinces.nameTh,
      nameEn: provinces.nameEn,
      region: provinces.region,
    })
    .from(provinces)
    .orderBy(asc(provinces.nameTh))
  return c.json({ items: rows }, 200)
})

// ── GET /provinces/:id/amphoes ────────────────────────────────────────────────
const amphoesRoute = createRoute({
  method: 'get',
  path: '/provinces/{id}/amphoes',
  tags: ['LocationMaster'],
  summary: 'List amphoes of a province (GR-9 cascade, public) (D87)',
  request: { params: z.object({ id: z.coerce.number().int() }) },
  responses: {
    200: {
      description: 'Amphoes',
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(
              z.object({
                id: z.number(),
                provinceId: z.number(),
                nameTh: z.string(),
                nameEn: z.string().nullable(),
              }),
            ),
          }),
        },
      },
    },
  },
})

locationMasterRouter.openapi(amphoesRoute, async (c) => {
  const { id } = c.req.valid('param')
  const rows = await db
    .select({
      id: amphoes.id,
      provinceId: amphoes.provinceId,
      nameTh: amphoes.nameTh,
      nameEn: amphoes.nameEn,
    })
    .from(amphoes)
    .where(eq(amphoes.provinceId, id))
    .orderBy(asc(amphoes.nameTh))
  return c.json({ items: rows }, 200)
})

// ── GET /amphoes/:id/tambons ──────────────────────────────────────────────────
const tambonsRoute = createRoute({
  method: 'get',
  path: '/amphoes/{id}/tambons',
  tags: ['LocationMaster'],
  summary: 'List tambons of an amphoe + zipcode (GR-9 auto-fill, public) (D87)',
  request: { params: z.object({ id: z.coerce.number().int() }) },
  responses: {
    200: {
      description: 'Tambons',
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(
              z.object({
                id: z.number(),
                amphoeId: z.number(),
                nameTh: z.string(),
                nameEn: z.string().nullable(),
                zipcode: z.string().nullable(),
              }),
            ),
          }),
        },
      },
    },
  },
})

locationMasterRouter.openapi(tambonsRoute, async (c) => {
  const { id } = c.req.valid('param')
  const rows = await db
    .select({
      id: tambons.id,
      amphoeId: tambons.amphoeId,
      nameTh: tambons.nameTh,
      nameEn: tambons.nameEn,
      zipcode: tambons.zipcode,
    })
    .from(tambons)
    .where(eq(tambons.amphoeId, id))
    .orderBy(asc(tambons.nameTh))
  return c.json({ items: rows }, 200)
})

// ── GET /tambons/:id ──────────────────────────────────────────────────────────
const tambonDetailRoute = createRoute({
  method: 'get',
  path: '/tambons/{id}',
  tags: ['LocationMaster'],
  summary: 'Single tambon detail — zipcode auto-fill (GR-9, public) (D87)',
  request: { params: z.object({ id: z.coerce.number().int() }) },
  responses: {
    200: {
      description: 'Tambon detail',
      content: {
        'application/json': {
          schema: z.object({
            id: z.number(),
            amphoeId: z.number(),
            nameTh: z.string(),
            nameEn: z.string().nullable(),
            zipcode: z.string().nullable(),
            lat: z.number().nullable(),
            lng: z.number().nullable(),
          }),
        },
      },
    },
    404: { description: 'Not found' },
  },
})

locationMasterRouter.openapi(tambonDetailRoute, async (c) => {
  const { id } = c.req.valid('param')
  const [row] = await db.select().from(tambons).where(eq(tambons.id, id)).limit(1)
  if (!row) return c.json({ error: { code: 'NOT_FOUND', message: 'Tambon not found' } }, 404)
  return c.json(
    {
      id: row.id,
      amphoeId: row.amphoeId,
      nameTh: row.nameTh,
      nameEn: row.nameEn,
      zipcode: row.zipcode,
      lat: row.lat,
      lng: row.lng,
    },
    200,
  )
})

// ── GET /nearby (GR-10 ใกล้ฉัน — Haversine) ────────────────────────────────────
const nearbyRoute = createRoute({
  method: 'get',
  path: '/nearby',
  tags: ['LocationMaster'],
  summary: 'Nearby tambons by Haversine distance (GR-10 "ใกล้ฉัน", no PostGIS) (D87)',
  request: {
    query: z.object({
      lat: z.coerce.number().min(-90).max(90),
      lng: z.coerce.number().min(-180).max(180),
      radiusKm: z.coerce.number().positive().max(500).default(20),
      limit: z.coerce.number().int().positive().max(200).default(50),
    }),
  },
  responses: {
    200: {
      description: 'Nearby tambons ordered by distance',
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(
              z.object({
                id: z.number(),
                amphoeId: z.number(),
                nameTh: z.string(),
                zipcode: z.string().nullable(),
                lat: z.number(),
                lng: z.number(),
                distanceKm: z.number(),
              }),
            ),
          }),
        },
      },
    },
  },
})

locationMasterRouter.openapi(nearbyRoute, async (c) => {
  const { lat, lng, radiusKm, limit } = c.req.valid('query')

  // Haversine in SQL — 6371 km earth radius. Only rows with coords.
  const distanceKm = sql<number>`(
    6371 * acos(
      least(1, greatest(-1,
        cos(radians(${lat})) * cos(radians(${tambons.lat})) *
        cos(radians(${tambons.lng}) - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(${tambons.lat}))
      ))
    )
  )`

  const rows = await db
    .select({
      id: tambons.id,
      amphoeId: tambons.amphoeId,
      nameTh: tambons.nameTh,
      zipcode: tambons.zipcode,
      lat: tambons.lat,
      lng: tambons.lng,
      distanceKm,
    })
    .from(tambons)
    .where(and(isNotNull(tambons.lat), isNotNull(tambons.lng), sql`${distanceKm} <= ${radiusKm}`))
    .orderBy(asc(distanceKm))
    .limit(limit)

  return c.json(
    {
      items: rows.map((r) => ({
        id: r.id,
        amphoeId: r.amphoeId,
        nameTh: r.nameTh,
        zipcode: r.zipcode,
        lat: r.lat as number,
        lng: r.lng as number,
        distanceKm: Math.round(r.distanceKm * 1000) / 1000,
      })),
    },
    200,
  )
})
