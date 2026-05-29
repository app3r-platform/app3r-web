/**
 * offers.ts — W-Round-1 Wave 2.x Part1 (Ruling 1F · D61) — buyer offers API
 *
 * Mounted at: /api/v1/offers
 *   POST /api/v1/offers              → create (body {listingId,...}) — ตรง WeeeU offers.create
 *   GET  /api/v1/offers/mine         → offers ที่ buyer ยื่น
 *   POST /api/v1/offers/{id}/withdraw → buyer ถอน offer → status=withdrawn
 *
 * (POST/GET /api/v1/listings/{id}/offers อยู่ใน routes/listings.ts)
 * Contract: camelCase (HUB Gen 37 casing FINAL · DB snake_case map ที่ serialize)
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { and, eq, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { offers, listingMeta } from '../db/schema'
import { verifyAccessToken } from '../lib/jwt'
import { sellerTypeFromRole, getFee, chargeFee } from '../lib/listing-helpers'

export const offersRouter = new OpenAPIHono()

async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}
const unauthorized = (c: { json: (b: unknown, s: 401) => Response }) =>
  c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

function offerDto(o: typeof offers.$inferSelect) {
  return {
    id: o.id,
    listingId: o.listingMetaId,
    buyerId: o.buyerId,
    buyerType: o.buyerType,
    offerPrice: Number(o.offerPrice),
    deliveryMethod: o.deliveryMethod,
    message: o.message,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }
}

// ── GET /mine — offers ที่ buyer ยื่น ──────────────────────────────────────────
const mineRoute = createRoute({
  method: 'get',
  path: '/mine',
  tags: ['Offers'],
  summary: "Buyer's own offers",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'My offers' }, 401: { description: 'Unauthorized' } },
})

offersRouter.openapi(mineRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const rows = await db.select().from(offers).where(eq(offers.buyerId, user.userId)).orderBy(desc(offers.createdAt))
  return c.json(rows.map(offerDto), 200)
})

// ── POST / — create offer (listingId in body) ────────────────────────────────
const createRoute_ = createRoute({
  method: 'post',
  path: '/',
  tags: ['Offers'],
  summary: 'Create offer (D61) — listingId in body + offer_fee (1D)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            listingId: z.string().uuid(),
            offerPrice: z.number().nonnegative(),
            deliveryMethod: z.string(),
            message: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: 'Offer created' },
    401: { description: 'Unauthorized' },
    404: { description: 'Listing not found' },
  },
})

offersRouter.openapi(createRoute_, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const b = c.req.valid('json')
  const [listing] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, b.listingId)).limit(1)
  if (!listing) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)

  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(offers)
      .values({
        listingMetaId: b.listingId,
        buyerId: user.userId,
        buyerType: sellerTypeFromRole(user.role),
        offerPrice: String(b.offerPrice),
        deliveryMethod: b.deliveryMethod,
        message: b.message ?? null,
        status: 'pending',
      })
      .returning()
    await tx
      .update(listingMeta)
      .set({
        offerCount: listing.offerCount + 1,
        state: listing.state === 'announced' ? 'receiving_offers' : listing.state,
        updatedAt: new Date(),
      })
      .where(eq(listingMeta.listingId, b.listingId))
    const fee = await getFee(tx, 'offer_fee')
    await chargeFee(tx, { userId: user.userId, amount: fee, reference: `offer:${row!.id}`, kind: 'offer_fee' })
    return row!
  })
  return c.json(offerDto(created), 201)
})

// ── POST /{id}/withdraw — buyer ถอน offer ──────────────────────────────────────
const withdrawRoute = createRoute({
  method: 'post',
  path: '/{id}/withdraw',
  tags: ['Offers'],
  summary: 'Buyer withdraws own pending offer → withdrawn',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: 'Withdrawn' },
    401: { description: 'Unauthorized' },
    403: { description: 'Not offer owner' },
    404: { description: 'Not found' },
    409: { description: 'Not pending' },
  },
})

offersRouter.openapi(withdrawRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id } = c.req.valid('param')
  const [offer] = await db.select().from(offers).where(eq(offers.id, id)).limit(1)
  if (!offer) return c.json({ error: { code: 'NOT_FOUND', message: 'Offer not found' } }, 404)
  if (offer.buyerId !== user.userId) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Not your offer' } }, 403)
  }
  if (offer.status !== 'pending') {
    return c.json({ error: { code: 'NOT_PENDING', message: `Offer is ${offer.status}` } }, 409)
  }
  const [row] = await db
    .update(offers)
    .set({ status: 'withdrawn', updatedAt: new Date() })
    .where(and(eq(offers.id, id), eq(offers.status, 'pending')))
    .returning()
  return c.json(offerDto(row!), 200)
})
