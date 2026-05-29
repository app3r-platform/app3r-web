/**
 * listing-reviews.ts — W-Round-1 Wave 1.2 [5] / D86: รีวิว listing + เจ้าของตอบ
 *
 * Mounted at: /api/v1/listings/{id}/reviews
 *
 *   GET  /api/v1/listings/{id}/reviews             → list visible reviews (+ replies)
 *   POST /api/v1/listings/{id}/reviews             → create review (1 ต่อ user/listing)
 *   POST /api/v1/listings/{id}/reviews/{rid}/reply → owner ตอบรีวิว
 *
 * Decision: D86 (reviews + replies)
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { and, eq, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { listingMeta, listingReviews, listingReviewReplies } from '../db/schema'
import { verifyAccessToken } from '../lib/jwt'

export const listingReviewsRouter = new OpenAPIHono()

async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}
const unauthorized = (c: { json: (b: unknown, s: 401) => Response }) =>
  c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

// ── GET /{id}/reviews ─────────────────────────────────────────────────────────
const listRoute = createRoute({
  method: 'get',
  path: '/{id}/reviews',
  tags: ['ListingReviews'],
  summary: 'List visible reviews + owner replies (D86)',
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: 'Reviews' } },
})

listingReviewsRouter.openapi(listRoute, async (c) => {
  const { id } = c.req.valid('param')
  const reviews = await db
    .select()
    .from(listingReviews)
    .where(and(eq(listingReviews.listingId, id), eq(listingReviews.isVisible, true)))
    .orderBy(desc(listingReviews.createdAt))
  const ids = reviews.map((r) => r.id)
  const replies = ids.length
    ? await db.select().from(listingReviewReplies).orderBy(listingReviewReplies.createdAt)
    : []
  const byReview = new Map<string, typeof replies>()
  for (const rep of replies) {
    if (!byReview.has(rep.reviewId)) byReview.set(rep.reviewId, [])
    byReview.get(rep.reviewId)!.push(rep)
  }
  return c.json(
    {
      items: reviews.map((r) => ({
        id: r.id,
        reviewerUserId: r.reviewerUserId,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        replies: (byReview.get(r.id) ?? []).map((rep) => ({
          id: rep.id,
          replierUserId: rep.replierUserId,
          body: rep.body,
          createdAt: rep.createdAt.toISOString(),
        })),
      })),
    },
    200,
  )
})

// ── POST /{id}/reviews ────────────────────────────────────────────────────────
const createRev = createRoute({
  method: 'post',
  path: '/{id}/reviews',
  tags: ['ListingReviews'],
  summary: 'Create review (1 per user per listing) (D86)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({ rating: z.number().int().min(1).max(5), comment: z.string().optional() }),
        },
      },
    },
  },
  responses: {
    201: { description: 'Created' },
    401: { description: 'Unauthorized' },
    404: { description: 'Listing not found' },
    409: { description: 'Already reviewed' },
  },
})

listingReviewsRouter.openapi(createRev, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id } = c.req.valid('param')
  const { rating, comment } = c.req.valid('json')

  const [listing] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, id)).limit(1)
  if (!listing) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)

  try {
    const [row] = await db
      .insert(listingReviews)
      .values({ listingId: id, reviewerUserId: user.userId, rating, comment: comment ?? null })
      .returning()
    return c.json({ id: row.id, rating: row.rating }, 201)
  } catch {
    return c.json({ error: { code: 'ALREADY_REVIEWED', message: 'You already reviewed this listing' } }, 409)
  }
})

// ── POST /{id}/reviews/{rid}/reply (owner only) ───────────────────────────────
const replyRoute = createRoute({
  method: 'post',
  path: '/{id}/reviews/{rid}/reply',
  tags: ['ListingReviews'],
  summary: 'Owner reply to a review (D86)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid(), rid: z.string().uuid() }),
    body: { content: { 'application/json': { schema: z.object({ body: z.string().min(1) }) } } },
  },
  responses: {
    201: { description: 'Replied' },
    401: { description: 'Unauthorized' },
    403: { description: 'Only owner can reply' },
    404: { description: 'Not found' },
  },
})

listingReviewsRouter.openapi(replyRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id, rid } = c.req.valid('param')
  const { body } = c.req.valid('json')

  const [listing] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, id)).limit(1)
  if (!listing) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
  const isAdmin = user.role === 'admin' || user.role === 'super_admin'
  if (listing.ownerId !== user.userId && !isAdmin) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Only listing owner can reply' } }, 403)
  }
  const [review] = await db.select().from(listingReviews).where(eq(listingReviews.id, rid)).limit(1)
  if (!review || review.listingId !== id) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Review not found' } }, 404)
  }
  const [row] = await db
    .insert(listingReviewReplies)
    .values({ reviewId: rid, replierUserId: user.userId, body })
    .returning()
  return c.json({ id: row.id, body: row.body }, 201)
})
