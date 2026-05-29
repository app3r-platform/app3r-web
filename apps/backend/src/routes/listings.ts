/**
 * listings.ts — W-Round-1 Wave 1.2 [3][4] + Wave 2.x: listing_meta CRUD + state + counters API
 *
 * Mounted at: /api/v1/listings (Bearer JWT required ยกเว้น browse/view = public-friendly)
 *
 *   POST /api/v1/listings                 → create draft listing_meta (Wave 2.x)
 *   GET  /api/v1/listings/mine            → เจ้าของดู listing ของตัวเอง (Wave 2.x)
 *   GET  /api/v1/listings/browse          → public feed (filter type/tambon/state) (Wave 2.x)
 *   GET  /api/v1/listings/{id}            → meta + public counters (GR-8 visibility)
 *   POST /api/v1/listings/{id}/transition → D83 state machine + point lock (Escrow)
 *   POST /api/v1/listings/{id}/select-offer → owner เลือกผู้ชนะ → matched + Escrow full-hold (Wave 2.x)
 *   POST /api/v1/listings/{id}/view       → GR-8 record unique view → view_count
 *   POST /api/v1/listings/{id}/offer      → increment offer_count (raw)
 *
 * Decision: D83 (state machine) · GR-8 (counters visibility) · Escrow full-hold-then-release
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { and, eq, desc, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { listingMeta, LISTING_STATES, LISTING_TYPES } from '../db/schema'
import { verifyAccessToken } from '../lib/jwt'
import { transitionListingState, StateTransitionError } from '../lib/listing-state'
import { recordView, incrementOfferCount, publicCounters, isListingInsider } from '../lib/listing-counters'

export const listingsRouter = new OpenAPIHono()

// states ที่ public browse แสดงได้ (live เท่านั้น — ตัด draft/cancelled/completed)
const PUBLIC_BROWSE_STATES = ['published', 'has_offer', 'matched'] as const

// shape สำหรับ public list/detail (counters ผ่าน GR-8 visibility)
function toListingDto(row: typeof listingMeta.$inferSelect, insider: boolean) {
  const counters = publicCounters(row, insider)
  return {
    listingId: row.listingId,
    listingType: row.listingType,
    state: row.state,
    ownerId: row.ownerId,
    domainRefId: row.domainRefId,
    tambonId: row.tambonId,
    viewCount: counters.viewCount,
    offerCount: counters.offerCount, // null = ซ่อน (matched + คนนอก)
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}
const unauthorized = (c: { json: (b: unknown, s: 401) => Response }) =>
  c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

// ── POST / — create draft listing_meta ────────────────────────────────────────
const createRoute_ = createRoute({
  method: 'post',
  path: '/',
  tags: ['Listings'],
  summary: 'Create draft listing_meta (owner = caller, state=draft)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            listingType: z.enum(LISTING_TYPES),
            domainRefId: z.string().uuid().optional(),
            tambonId: z.number().int().positive().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: 'Created (draft)' },
    401: { description: 'Unauthorized' },
  },
})

listingsRouter.openapi(createRoute_, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { listingType, domainRefId, tambonId } = c.req.valid('json')
  const [row] = await db
    .insert(listingMeta)
    .values({
      listingType,
      domainRefId: domainRefId ?? null,
      tambonId: tambonId ?? null,
      ownerId: user.userId,
      state: 'draft',
    })
    .returning()
  return c.json(toListingDto(row, true), 201)
})

// ── GET /mine — เจ้าของดู listing ตัวเอง (ทุก state) ───────────────────────────
const mineRoute = createRoute({
  method: 'get',
  path: '/mine',
  tags: ['Listings'],
  summary: "List caller's own listings (all states)",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      state: z.enum(LISTING_STATES).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      offset: z.coerce.number().int().min(0).optional(),
    }),
  },
  responses: { 200: { description: 'My listings' }, 401: { description: 'Unauthorized' } },
})

listingsRouter.openapi(mineRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { state, limit, offset } = c.req.valid('query')
  const conds = [eq(listingMeta.ownerId, user.userId)]
  if (state) conds.push(eq(listingMeta.state, state))
  const rows = await db
    .select()
    .from(listingMeta)
    .where(and(...conds))
    .orderBy(desc(listingMeta.updatedAt))
    .limit(limit ?? 50)
    .offset(offset ?? 0)
  // เจ้าของ = insider เสมอ → เห็น counters ครบ
  return c.json({ items: rows.map((r) => toListingDto(r, true)) }, 200)
})

// ── GET /browse — public feed (filter type/tambon/state) ───────────────────────
const browseRoute = createRoute({
  method: 'get',
  path: '/browse',
  tags: ['Listings'],
  summary: 'Public browse feed (live listings) — filter by type/tambon/state',
  request: {
    query: z.object({
      listingType: z.enum(LISTING_TYPES).optional(),
      tambonId: z.coerce.number().int().positive().optional(),
      state: z.enum(PUBLIC_BROWSE_STATES).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      offset: z.coerce.number().int().min(0).optional(),
    }),
  },
  responses: { 200: { description: 'Public listing feed' } },
})

listingsRouter.openapi(browseRoute, async (c) => {
  const { listingType, tambonId, state, limit, offset } = c.req.valid('query')
  // public เห็นเฉพาะ live states (default ทั้ง 3) — ถ้าระบุ state ต้องอยู่ในชุด live
  const conds = [
    state
      ? eq(listingMeta.state, state)
      : inArray(listingMeta.state, [...PUBLIC_BROWSE_STATES]),
  ]
  if (listingType) conds.push(eq(listingMeta.listingType, listingType))
  if (tambonId) conds.push(eq(listingMeta.tambonId, tambonId))
  const rows = await db
    .select()
    .from(listingMeta)
    .where(and(...conds))
    .orderBy(desc(listingMeta.createdAt))
    .limit(limit ?? 20)
    .offset(offset ?? 0)
  // browse = มุมมองคนนอก → counters ผ่าน GR-8 visibility (matched ซ่อน offer)
  const user = await getAuthUser(c)
  return c.json(
    {
      items: rows.map((r) =>
        toListingDto(
          r,
          isListingInsider(r, { userId: user?.userId ?? null, role: user?.role ?? null }),
        ),
      ),
    },
    200,
  )
})

// ── GET /{id} — meta + visibility-filtered counters ───────────────────────────
const getRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Listings'],
  summary: 'Get listing_meta + public counters (GR-8 visibility)',
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: 'Listing meta' },
    404: { description: 'Not found' },
  },
})

listingsRouter.openapi(getRoute, async (c) => {
  const { id } = c.req.valid('param')
  const [row] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, id)).limit(1)
  if (!row) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)

  const user = await getAuthUser(c) // อาจเป็น null (คนนอก/anon)
  const insider = isListingInsider(row, {
    userId: user?.userId ?? null,
    role: user?.role ?? null,
  })
  const counters = publicCounters(row, insider)
  return c.json(
    {
      listingId: row.listingId,
      listingType: row.listingType,
      state: row.state,
      ownerId: row.ownerId,
      tambonId: row.tambonId,
      viewCount: counters.viewCount,
      offerCount: counters.offerCount, // null = ซ่อน (matched + คนนอก)
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
    200,
  )
})

// ── POST /{id}/transition — D83 state machine + Escrow point lock ─────────────
const transitionRoute = createRoute({
  method: 'post',
  path: '/{id}/transition',
  tags: ['Listings'],
  summary: 'D83 state transition + point lock (matched=hold / completed=release / cancelled=refund)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            to: z.enum(LISTING_STATES),
            buyerUserId: z.string().uuid().optional(),
            pointAmount: z.number().int().nonnegative().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Transitioned' },
    400: { description: 'Invalid transition / missing args' },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
})

listingsRouter.openapi(transitionRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id } = c.req.valid('param')
  const { to, buyerUserId, pointAmount } = c.req.valid('json')
  try {
    const updated = await transitionListingState({
      listingId: id,
      to,
      actorUserId: user.userId,
      buyerUserId,
      pointAmount,
    })
    return c.json({ listingId: updated.listingId, state: updated.state }, 200)
  } catch (err) {
    if (err instanceof StateTransitionError) {
      return c.json({ error: { code: 'INVALID_TRANSITION', message: err.message } }, 400)
    }
    const msg = err instanceof Error ? err.message : 'TRANSITION_FAILED'
    if (msg === 'LISTING_NOT_FOUND') {
      return c.json({ error: { code: 'NOT_FOUND', message: msg } }, 404)
    }
    return c.json({ error: { code: 'TRANSITION_FAILED', message: msg } }, 400)
  }
})

// ── POST /{id}/view — GR-8 unique view dedupe → view_count ────────────────────
const viewRoute = createRoute({
  method: 'post',
  path: '/{id}/view',
  tags: ['Listings'],
  summary: 'GR-8 record unique view (dedupe per user/ip per day) → view_count',
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: 'Recorded (counted=true if new)' } },
})

listingsRouter.openapi(viewRoute, async (c) => {
  const { id } = c.req.valid('param')
  const user = await getAuthUser(c)
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    null
  const counted = await recordView(id, { userId: user?.userId ?? null, ip })
  return c.json({ counted }, 200)
})

// ── POST /{id}/offer — increment offer_count (raw) ────────────────────────────
const offerRoute = createRoute({
  method: 'post',
  path: '/{id}/offer',
  tags: ['Listings'],
  summary: 'Increment offer_count (raw) — GR-8',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: 'Incremented' }, 401: { description: 'Unauthorized' } },
})

listingsRouter.openapi(offerRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id } = c.req.valid('param')
  const offerCount = await incrementOfferCount(id)
  return c.json({ offerCount }, 200)
})

// ── POST /{id}/select-offer — owner เลือกผู้ชนะ → matched + Escrow full-hold ────
// owner-only: ตรวจสิทธิ์ก่อน แล้ว transition → matched (debit buyer เต็มจำนวน hold)
const selectOfferRoute = createRoute({
  method: 'post',
  path: '/{id}/select-offer',
  tags: ['Listings'],
  summary: 'Owner selects winning offer → matched + Escrow full-hold (D83 + point lock)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            buyerUserId: z.string().uuid(),
            pointAmount: z.number().int().nonnegative(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Matched (escrow held)' },
    400: { description: 'Invalid transition / insufficient Gold' },
    401: { description: 'Unauthorized' },
    403: { description: 'Not listing owner' },
    404: { description: 'Not found' },
  },
})

listingsRouter.openapi(selectOfferRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id } = c.req.valid('param')
  const { buyerUserId, pointAmount } = c.req.valid('json')

  // ตรวจ owner ก่อน transition (transition lib ไม่ enforce ownership)
  const [listing] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, id)).limit(1)
  if (!listing) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
  const isAdmin = user.role === 'admin' || user.role === 'super_admin'
  if (listing.ownerId !== user.userId && !isAdmin) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Only listing owner can select offer' } }, 403)
  }

  try {
    const updated = await transitionListingState({
      listingId: id,
      to: 'matched',
      actorUserId: user.userId,
      buyerUserId,
      pointAmount,
    })
    return c.json({ listingId: updated.listingId, state: updated.state, heldAmount: Math.round(pointAmount) }, 200)
  } catch (err) {
    if (err instanceof StateTransitionError) {
      return c.json({ error: { code: 'INVALID_TRANSITION', message: err.message } }, 400)
    }
    const msg = err instanceof Error ? err.message : 'SELECT_OFFER_FAILED'
    if (msg === 'LISTING_NOT_FOUND') {
      return c.json({ error: { code: 'NOT_FOUND', message: msg } }, 404)
    }
    return c.json({ error: { code: 'SELECT_OFFER_FAILED', message: msg } }, 400)
  }
})
