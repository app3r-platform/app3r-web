/**
 * resell-disputes.ts — D2 Resell Wave 3b: admin dispute resolution (3-way · guarded)
 *
 * Mounted at: /api/v1/admin/resell/disputes
 *   GET  /                       → admin list open disputes (open|under_review)
 *   POST /{disputeId}/resolve    → admin 3-way: seller(release) | buyer(refund) | split(splitEscrow)
 *
 * Money: outcome derive payer/recipient/amount จาก escrow_holds + selected offer (ไม่เชื่อ body · security rule 5).
 *   seller → releaseEscrow (disputed→completed · net−fee D75) · faultParty=buyer
 *   buyer  → refundEscrow  (disputed→cancelled · full · F1 ทำให้ refund fire) + offer_fee refund (carry#1) · faultParty=seller
 *   split  → splitEscrow   (admin กรอก sellerShare absolute Gold · Q2) → completed (releaseEscrow no-op) · faultParty=mutual
 *   fee = Q1 seller-bound (A1 pct=0 → fee=0). admin-only (S1 lineage · disputed transitions = guarded เท่านั้น).
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { and, eq, desc, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { resellDisputes, listingMeta } from '../db/schema'
import { verifyAccessToken } from '../lib/jwt'
import { transitionListingState, StateTransitionError } from '../lib/listing-state'
import { splitEscrow } from '../lib/escrow-service'

export const resellDisputesRouter = new OpenAPIHono()

async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}
const unauthorized = (c: { json: (b: unknown, s: 401) => Response }) =>
  c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)
const isAdminRole = (role?: string) => role === 'admin' || role === 'super_admin'

// ── GET / — admin list open disputes ──────────────────────────────────────────
const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Admin', 'Resell Disputes'],
  summary: 'Admin: list open disputes (open|under_review)',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Open disputes' }, 401: { description: 'Unauthorized' }, 403: { description: 'Admin only' } },
})

resellDisputesRouter.openapi(listRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  if (!isAdminRole(user.role)) return c.json({ error: { code: 'FORBIDDEN', message: 'Admin only' } }, 403)
  const rows = await db
    .select()
    .from(resellDisputes)
    .where(inArray(resellDisputes.status, ['open', 'under_review']))
    .orderBy(desc(resellDisputes.createdAt))
  return c.json(rows, 200)
})

// ── POST /{disputeId}/resolve — admin 3-way resolution ────────────────────────
const resolveRoute = createRoute({
  method: 'post',
  path: '/{disputeId}/resolve',
  tags: ['Admin', 'Resell Disputes'],
  summary: 'Admin resolve dispute 3-way: seller(release) | buyer(refund) | split(splitEscrow)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ disputeId: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            resolution: z.enum(['seller', 'buyer', 'split']),
            sellerShare: z.number().int().nonnegative().optional(), // Q2: absolute Gold (required if split)
            note: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Resolved' },
    400: { description: 'Invalid resolution / split share' },
    401: { description: 'Unauthorized' },
    403: { description: 'Admin only' },
    404: { description: 'Dispute not found' },
    409: { description: 'Already resolved / listing not disputed' },
  },
})

resellDisputesRouter.openapi(resolveRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  if (!isAdminRole(user.role)) return c.json({ error: { code: 'FORBIDDEN', message: 'Admin only' } }, 403)
  const { disputeId } = c.req.valid('param')
  const { resolution, sellerShare, note } = c.req.valid('json')

  const [dispute] = await db.select().from(resellDisputes).where(eq(resellDisputes.id, disputeId)).limit(1)
  if (!dispute) return c.json({ error: { code: 'NOT_FOUND', message: 'Dispute not found' } }, 404)
  if (dispute.status !== 'open' && dispute.status !== 'under_review') {
    return c.json({ error: { code: 'ALREADY_RESOLVED', message: `Dispute is ${dispute.status}` } }, 409)
  }
  const [listing] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, dispute.listingId)).limit(1)
  if (!listing) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
  if (listing.state !== 'disputed') {
    return c.json({ error: { code: 'INVALID_STATE', message: `Listing is ${listing.state}, expected disputed` } }, 409)
  }
  if (resolution === 'split' && sellerShare == null) {
    return c.json({ error: { code: 'SPLIT_REQUIRES_SHARE', message: 'sellerShare required for split' } }, 400)
  }

  try {
    const result = await db.transaction(async (tx) => {
      let split: { buyerRefund: number; sellerCredit: number; fee: number } | null = null
      if (resolution === 'seller') {
        // seller-win → release escrow (net−fee) · buyer's claim rejected → faultParty=buyer
        await transitionListingState(
          { listingId: listing.listingId, to: 'completed', actorUserId: user.userId, actorRole: 'admin', faultParty: 'buyer' },
          tx,
        )
      } else if (resolution === 'buyer') {
        // buyer-win → refund escrow full (F1 ทำให้ disputed→cancelled fire refundEscrow) + offer_fee refund (carry#1)
        await transitionListingState(
          { listingId: listing.listingId, to: 'cancelled', actorUserId: user.userId, actorRole: 'admin', faultParty: 'seller' },
          tx,
        )
      } else {
        // split → แบ่งเงิน (splitEscrow) แล้ว settle (completed · releaseEscrow no-op เพราะ hold released)
        const sp = await splitEscrow(tx, listing.listingId, sellerShare!)
        if (!sp) throw new Error('NO_LOCKED_ESCROW')
        split = { buyerRefund: sp.buyerRefund, sellerCredit: sp.sellerCredit, fee: sp.fee }
        await transitionListingState(
          { listingId: listing.listingId, to: 'completed', actorUserId: user.userId, actorRole: 'admin', faultParty: 'mutual' },
          tx,
        )
      }
      const resolutionNote =
        resolution === 'split' && split
          ? `split sellerShare=${Math.round(sellerShare!)} buyerRefund=${split.buyerRefund} sellerCredit=${split.sellerCredit} fee=${split.fee}${note ? ` · ${note}` : ''}`
          : (note ?? null)
      await tx
        .update(resellDisputes)
        .set({
          status: 'resolved',
          resolution,
          resolutionNote,
          resolvedByUserId: user.userId,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(resellDisputes.id, disputeId))
      return split
    })
    return c.json({ disputeId, listingId: dispute.listingId, resolution, split: result }, 200)
  } catch (err) {
    if (err instanceof StateTransitionError) {
      return c.json({ error: { code: 'INVALID_TRANSITION', message: err.message } }, 400)
    }
    const msg = err instanceof Error ? err.message : 'RESOLVE_FAILED'
    if (msg === 'LISTING_NOT_FOUND') return c.json({ error: { code: 'NOT_FOUND', message: msg } }, 404)
    return c.json({ error: { code: 'RESOLVE_FAILED', message: msg } }, 400)
  }
})
