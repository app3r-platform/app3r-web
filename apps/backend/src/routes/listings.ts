/**
 * listings.ts — W-Round-1 Wave 1.2 [3][4]: listing_meta state + counters API
 *
 * Mounted at: /api/v1/listings (Bearer JWT required ยกเว้น view = public-friendly)
 *
 *   GET  /api/v1/listings/{id}            → meta + public counters (GR-8 visibility)
 *   POST /api/v1/listings/{id}/transition → D83 state machine + point lock (Escrow)
 *   POST /api/v1/listings/{id}/view       → GR-8 record unique view → view_count
 *   POST /api/v1/listings/{id}/offer      → increment offer_count (raw)
 *
 * Decision: D83 (state machine) · GR-8 (counters visibility)
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { listingMeta, LISTING_STATES } from '../db/schema'
import { verifyAccessToken } from '../lib/jwt'
import { transitionListingState, StateTransitionError } from '../lib/listing-state'
import { recordView, incrementOfferCount, publicCounters, isListingInsider } from '../lib/listing-counters'

export const listingsRouter = new OpenAPIHono()

async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}
const unauthorized = (c: { json: (b: unknown, s: 401) => Response }) =>
  c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

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
