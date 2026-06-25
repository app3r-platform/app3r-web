/**
 * listings.ts — W-Round-1 Wave 1.2 [3][4] + Wave 2.x Part1: listing CRUD + state + offers
 *
 * Mounted at: /api/v1/listings
 *
 *   POST /api/v1/listings                  → create (listing_meta + used_appliance_listings txn) [Ruling 1F]
 *   GET  /api/v1/listings/mine             → seller's listings (array)            [1F]
 *   GET  /api/v1/listings/browse           → public feed ({results,count})        [1E/1F]
 *   GET  /api/v1/listings/{id}             → meta + public counters (GR-8)        [existing]
 *   POST /api/v1/listings/{id}/transition  → D59 state machine + Escrow (D83 1D)  [existing]
 *   POST /api/v1/listings/{id}/select-offer → {offerId} → selected + offer_selected + escrow [1F]
 *   POST /api/v1/listings/{id}/offers      → buyer ยื่น offer (D61)               [1F]
 *   GET  /api/v1/listings/{id}/offers      → offers บน listing (seller view)      [1F]
 *   POST /api/v1/listings/{id}/view        → GR-8 record unique view              [existing]
 *   POST /api/v1/listings/{id}/offer       → increment offer_count (raw)          [existing]
 *
 * Contract (HUB Gen 37 casing FINAL): API = camelCase ทั้งหมด (request body + response + DTO)
 *   - DB columns = snake_case (map ที่ชั้น serialize เท่านั้น — ไม่แตะ migration/schema)
 *   - envelope: error = { error: {...} } object · /browse = { results, count } · /mine = array
 *     · GET /{id} = bare object · offers list = array
 *   (reviews/questions routers แยกไฟล์ใช้ envelope { items })
 *   B2 category enum (CHECK) = defer → Wave 3 (canonical taxonomy author จากข้อมูลจริง)
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { and, eq, desc, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import {
  listingMeta,
  usedApplianceListings,
  offers,
  resellFulfillment,
  resellDisputes,
  LISTING_STATES,
  type ListingState,
  type ListingMeta,
  type UsedApplianceListing,
} from '../db/schema'
import { verifyAccessToken } from '../lib/jwt'
import { transitionListingState, StateTransitionError, isEscrowMutatingTransition } from '../lib/listing-state'
import { recordView, incrementOfferCount, publicCounters, isListingInsider } from '../lib/listing-counters'
import { sellerTypeFromRole, getFee, chargeFee, toListingDto, isResellListingType, type AuthedUser } from '../lib/listing-helpers'
import { refundOfferFee } from '../lib/escrow-service'

export const listingsRouter = new OpenAPIHono()

async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}
const unauthorized = (c: { json: (b: unknown, s: 401) => Response }) =>
  c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)

// states ที่ public browse แสดงได้ (live — รับ offer อยู่)
const PUBLIC_BROWSE_STATES = ['announced', 'receiving_offers'] as const

// ── POST / — create listing (listing_meta + used_appliance_listings txn) ──────
const createListingRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Listings'],
  summary: 'Create resell/scrap listing (listing_meta + used_appliance_listings, B6)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            listingType: z.enum(['used_appliance', 'scrap']),
            applianceId: z.string().uuid().optional(),
            conditionGrade: z.string().optional(),
            workingParts: z.array(z.string()).optional(),
            price: z.number().nonnegative(),
            deliveryMethods: z.array(z.string()).default([]),
            sourceWarranty: z.number().optional(),
            additionalWarranty: z.number().optional(),
            scrapItemId: z.string().uuid().optional(),
            tambonId: z.number().int().positive().optional(),
            status: z.enum(['draft', 'announced']).default('draft'),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: 'Created' },
    401: { description: 'Unauthorized' },
  },
})

listingsRouter.openapi(createListingRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const b = c.req.valid('json')
  const warranty =
    b.sourceWarranty != null || b.additionalWarranty != null
      ? { sourceWarranty: b.sourceWarranty ?? 0, additionalWarranty: b.additionalWarranty ?? 0 }
      : null

  const { meta, used } = await db.transaction(async (tx) => {
    // 1) listing_meta (universal) — used_appliance→'resell', scrap→'scrap'
    const [m] = await tx
      .insert(listingMeta)
      .values({
        listingType: b.listingType === 'scrap' ? 'scrap' : 'resell',
        ownerId: user.userId,
        tambonId: b.tambonId ?? null,
        state: b.status,
      })
      .returning()
    // 2) used_appliance_listings (D59 domain)
    const [u] = await tx
      .insert(usedApplianceListings)
      .values({
        listingMetaId: m!.listingId,
        sellerId: user.userId,
        sellerType: sellerTypeFromRole(user.role),
        listingType: b.listingType,
        applianceId: b.applianceId ?? null,
        warranty,
        scrapItemId: b.scrapItemId ?? null,
        conditionGrade: b.conditionGrade ?? null,
        workingParts: b.workingParts ?? null,
        price: String(b.price),
        deliveryMethods: b.deliveryMethods,
        status: b.status,
      })
      .returning()
    // 3) backlink domain_ref_id (integrity 2 ทาง)
    await tx
      .update(listingMeta)
      .set({ domainRefId: u!.id, updatedAt: new Date() })
      .where(eq(listingMeta.listingId, m!.listingId))
    // 1D point timing: publish (announced) → listing_fee (config-driven · D75 · audit)
    if (b.status === 'announced') {
      const fee = await getFee(tx, 'listing_fee')
      await chargeFee(tx, { userId: user.userId, amount: fee, reference: `listing:${m!.listingId}`, kind: 'listing_fee' })
    }
    return { meta: { ...m!, domainRefId: u!.id }, used: u! }
  })
  return c.json(toListingDto(meta, used, true), 201)
})

// ── GET /mine — seller's listings (array · ตรง WeeeU fetch) ────────────────────
const mineRoute = createRoute({
  method: 'get',
  path: '/mine',
  tags: ['Listings'],
  summary: "Seller's own listings (array)",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      status: z.enum(LISTING_STATES).optional(),
      listingType: z.string().optional(),
    }),
  },
  responses: { 200: { description: 'My listings' }, 401: { description: 'Unauthorized' } },
})

listingsRouter.openapi(mineRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { status } = c.req.valid('query')
  const conds = [eq(listingMeta.ownerId, user.userId)]
  if (status) conds.push(eq(listingMeta.state, status))
  const rows = await db
    .select()
    .from(listingMeta)
    .leftJoin(usedApplianceListings, eq(usedApplianceListings.listingMetaId, listingMeta.listingId))
    .where(and(...conds))
    .orderBy(desc(listingMeta.updatedAt))
  return c.json(
    rows.map((r) => toListingDto(r.listing_meta, r.used_appliance_listings, true)),
    200,
  )
})

// ── GET /browse — public feed ({results,count}) ────────────────────────────────
const browseRoute = createRoute({
  method: 'get',
  path: '/browse',
  tags: ['Listings'],
  summary: 'Public browse feed (live) — {results,count}',
  request: {
    query: z.object({
      listingType: z.string().optional(),
      tambonId: z.coerce.number().int().positive().optional(),
      minPrice: z.coerce.number().optional(),
      maxPrice: z.coerce.number().optional(),
      status: z.enum(PUBLIC_BROWSE_STATES).optional(),
      page: z.coerce.number().int().min(1).optional(),
      pageSize: z.coerce.number().int().min(1).max(100).optional(),
    }),
  },
  responses: { 200: { description: 'Public feed' } },
})

listingsRouter.openapi(browseRoute, async (c) => {
  const q = c.req.valid('query')
  const conds = [
    q.status ? eq(listingMeta.state, q.status) : inArray(listingMeta.state, [...PUBLIC_BROWSE_STATES]),
  ]
  if (q.tambonId) conds.push(eq(listingMeta.tambonId, q.tambonId))
  const pageSize = q.pageSize ?? 20
  const offset = ((q.page ?? 1) - 1) * pageSize
  const rows = await db
    .select()
    .from(listingMeta)
    .leftJoin(usedApplianceListings, eq(usedApplianceListings.listingMetaId, listingMeta.listingId))
    .where(and(...conds))
    .orderBy(desc(listingMeta.createdAt))
  // filter (type/price) ในชั้น app — domain fields อยู่ใน used_appliance_listings (nullable)
  const user = await getAuthUser(c)
  let results = rows
    .filter((r) => {
      const u = r.used_appliance_listings
      if (q.listingType && u?.listingType !== q.listingType) return false
      const price = u ? Number(u.price) : null
      if (q.minPrice != null && (price == null || price < q.minPrice)) return false
      if (q.maxPrice != null && (price == null || price > q.maxPrice)) return false
      return true
    })
    .map((r) =>
      toListingDto(
        r.listing_meta,
        r.used_appliance_listings,
        isListingInsider(r.listing_meta, { userId: user?.userId ?? null, role: user?.role ?? null }),
      ),
    )
  const count = results.length
  results = results.slice(offset, offset + pageSize)
  return c.json({ results, count }, 200)
})

// ── GET /{id} — meta + visibility-filtered counters (existing) ────────────────
const getRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Listings'],
  summary: 'Get listing_meta + public counters (GR-8 visibility)',
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: 'Listing meta' }, 404: { description: 'Not found' } },
})

listingsRouter.openapi(getRoute, async (c) => {
  const { id } = c.req.valid('param')
  const [row] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, id)).limit(1)
  if (!row) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
  const user = await getAuthUser(c)
  const insider = isListingInsider(row, { userId: user?.userId ?? null, role: user?.role ?? null })
  const counters = publicCounters(row, insider)
  return c.json(
    {
      listingId: row.listingId,
      listingType: row.listingType,
      state: row.state,
      ownerId: row.ownerId,
      tambonId: row.tambonId,
      viewCount: counters.viewCount,
      offerCount: counters.offerCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
    200,
  )
})

// ── POST /{id}/transition — D59 state machine + Escrow (existing) ─────────────
const transitionRoute = createRoute({
  method: 'post',
  path: '/{id}/transition',
  tags: ['Listings'],
  summary: 'D59 state transition + point lock (offer_selected=hold / completed=release / cancel=refund)',
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
            actorRole: z.string().optional(), // 2A audit
            faultParty: z.enum(['seller', 'buyer', 'mutual', 'none']).optional(), // 2A bad_record
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Transitioned' },
    400: { description: 'Invalid transition / missing args' },
    401: { description: 'Unauthorized' },
    403: { description: 'Escrow-mutating transition blocked (use guarded endpoint)' },
    404: { description: 'Not found' },
  },
})

listingsRouter.openapi(transitionRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id } = c.req.valid('param')
  const { to, buyerUserId, pointAmount, actorRole, faultParty } = c.req.valid('json')
  // S1 (W2.1 · B1 blocker): BLOCK escrow-mutating transitions ออกจาก generic route (Gold theft vector).
  //   buyer_confirmed=lock / completed=release / cancel-from-locked=refund ต้องผ่าน guarded endpoint
  //   ที่ derive payer/amount จาก selected offer (ไม่เชื่อ body buyerUserId/pointAmount).
  const [cur] = await db
    .select({ state: listingMeta.state, ownerId: listingMeta.ownerId })
    .from(listingMeta)
    .where(eq(listingMeta.listingId, id))
    .limit(1)
  if (!cur) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
  // GAP-1 (W2.1 · adversarial · authz): เฉพาะ owner/admin เปลี่ยน state ประกาศได้ (กัน griefing — hostile cancel/dispute/revert)
  const isAdmin = user.role === 'admin' || user.role === 'super_admin'
  if (cur.ownerId !== user.userId && !isAdmin) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Only listing owner or admin can transition' } }, 403)
  }
  if (isEscrowMutatingTransition(cur.state as ListingState, to)) {
    return c.json(
      {
        error: {
          code: 'ESCROW_TRANSITION_BLOCKED',
          message: 'Escrow-affecting transition must use its dedicated guarded endpoint (confirm-funding / receipt / cancel)',
        },
      },
      403,
    )
  }
  try {
    const updated = await transitionListingState({ listingId: id, to, actorUserId: user.userId, buyerUserId, pointAmount, actorRole, faultParty })
    return c.json({ listingId: updated.listingId, state: updated.state }, 200)
  } catch (err) {
    if (err instanceof StateTransitionError) {
      return c.json({ error: { code: 'INVALID_TRANSITION', message: err.message } }, 400)
    }
    const msg = err instanceof Error ? err.message : 'TRANSITION_FAILED'
    if (msg === 'LISTING_NOT_FOUND') return c.json({ error: { code: 'NOT_FOUND', message: msg } }, 404)
    return c.json({ error: { code: 'TRANSITION_FAILED', message: msg } }, 400)
  }
})

// ── POST /{id}/select-offer — {offerId} → selected + offer_selected + escrow ──
const selectOfferRoute = createRoute({
  method: 'post',
  path: '/{id}/select-offer',
  tags: ['Listings'],
  summary: 'Seller selects offer → offer.selected + listing offer_selected + escrow hold (1F)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: z.object({ offerId: z.string().uuid() }) } } },
  },
  responses: {
    200: { description: 'Offer selected + escrow held' },
    400: { description: 'Invalid transition / insufficient Gold' },
    401: { description: 'Unauthorized' },
    403: { description: 'Not listing owner' },
    404: { description: 'Listing/offer not found' },
    409: { description: 'Offer not pending' },
  },
})

listingsRouter.openapi(selectOfferRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id } = c.req.valid('param')
  const { offerId } = c.req.valid('json')

  const [listing] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, id)).limit(1)
  if (!listing) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
  // W2.1-addon (Advisor ③): select/escrow flow เฉพาะ resell/scrap (defense-in-depth)
  if (!isResellListingType(listing.listingType)) {
    return c.json({ error: { code: 'NOT_RESELL_LISTING', message: 'Select-offer applies only to resell/scrap listings' } }, 403)
  }
  const isAdmin = user.role === 'admin' || user.role === 'super_admin'
  if (listing.ownerId !== user.userId && !isAdmin) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Only listing owner can select offer' } }, 403)
  }
  const [offer] = await db.select().from(offers).where(eq(offers.id, offerId)).limit(1)
  if (!offer || offer.listingMetaId !== id) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Offer not found on this listing' } }, 404)
  }
  // S2 (W2.1): select ได้เฉพาะ offer ที่ยัง pending (กัน re-select offer ที่ buyer ถอน/rejected/selected แล้ว)
  if (offer.status !== 'pending') {
    return c.json({ error: { code: 'OFFER_NOT_PENDING', message: `Offer is ${offer.status}` } }, 409)
  }

  // 1A funding window: เลือก → buyer มี 24h ยืนยัน+เติม (เงินล็อก@buyer_confirmed · ❌ ยังไม่ล็อกที่นี่)
  const FUNDING_WINDOW_MS = 24 * 60 * 60 * 1000
  const now = new Date()
  const fundingDeadline = new Date(now.getTime() + FUNDING_WINDOW_MS)
  try {
    // S2 (W2.1 · adversarial): ทุกอย่างใน 1 txn (atomic) + listing FOR UPDATE + CAS offer (กัน TOCTOU re-select/double-select)
    const res = await db.transaction(async (tx) => {
      const [lst] = await tx
        .select()
        .from(listingMeta)
        .where(eq(listingMeta.listingId, id))
        .for('update')
      if (!lst) throw new Error('LISTING_NOT_FOUND')
      if (lst.state !== 'receiving_offers') throw new Error('LISTING_NOT_RECEIVING_OFFERS')
      // CAS: select เฉพาะถ้า offer ยัง pending จริง ณ จุดเขียน (กัน re-select offer ที่ถอน/rejected)
      const selUpd = await tx
        .update(offers)
        .set({ status: 'selected', selectedAt: now, fundingDeadline, updatedAt: now })
        .where(and(eq(offers.id, offerId), eq(offers.status, 'pending')))
        .returning({ id: offers.id })
      if (selUpd.length === 0) throw new Error('OFFER_NOT_PENDING')
      // reject pending อื่น + คืน offer_fee (faultParty≠buyer · ruling 5)
      const others = await tx
        .select()
        .from(offers)
        .where(and(eq(offers.listingMetaId, id), eq(offers.status, 'pending')))
      for (const o of others) {
        await tx.update(offers).set({ status: 'rejected', updatedAt: now }).where(eq(offers.id, o.id))
        await refundOfferFee(tx, o.id, o.buyerId)
      }
      // transition → offer_selected (atomic · ไม่ล็อกเงิน · เงินล็อกตอน confirm-funding · 1A)
      return transitionListingState(
        { listingId: id, to: 'offer_selected', actorUserId: user.userId, actorRole: 'seller' },
        tx,
      )
    })
    return c.json(
      { listingId: res.listingId, state: res.state, offerId, fundingDeadline: fundingDeadline.toISOString() },
      200,
    )
  } catch (err) {
    if (err instanceof StateTransitionError) {
      return c.json({ error: { code: 'INVALID_TRANSITION', message: err.message } }, 400)
    }
    const msg = err instanceof Error ? err.message : 'SELECT_OFFER_FAILED'
    if (msg === 'OFFER_NOT_PENDING') {
      return c.json({ error: { code: 'OFFER_NOT_PENDING', message: 'Offer is no longer pending' } }, 409)
    }
    if (msg === 'LISTING_NOT_RECEIVING_OFFERS') {
      return c.json({ error: { code: 'INVALID_STATE', message: 'Listing is not receiving offers' } }, 409)
    }
    if (msg === 'LISTING_NOT_FOUND') {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
    }
    return c.json({ error: { code: 'SELECT_OFFER_FAILED', message: msg } }, 400)
  }
})

// ── POST /{id}/confirm-funding — buyer ยืนยัน+เติม → buyer_confirmed + escrow LOCK (1A) ──
const confirmFundingRoute = createRoute({
  method: 'post',
  path: '/{id}/confirm-funding',
  tags: ['Listings'],
  summary: 'Buyer confirms funding → buyer_confirmed + escrow lock (1A · authoritative selected offer)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: 'Funded + escrow locked' },
    400: { description: 'Invalid transition / insufficient Gold' },
    401: { description: 'Unauthorized' },
    403: { description: 'Not the selected buyer' },
    404: { description: 'Listing not found' },
    409: { description: 'No selected offer / funding window expired' },
  },
})

listingsRouter.openapi(confirmFundingRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id } = c.req.valid('param')
  const [listing] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, id)).limit(1)
  if (!listing) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
  // W2.1-addon (Advisor ③): confirm/escrow flow เฉพาะ resell/scrap (defense-in-depth)
  if (!isResellListingType(listing.listingType)) {
    return c.json({ error: { code: 'NOT_RESELL_LISTING', message: 'Confirm-funding applies only to resell/scrap listings' } }, 403)
  }
  // S6 (W2.1 · defense-in-depth): ต้องอยู่ offer_selected เท่านั้น (state machine กันอีกชั้น)
  if (listing.state !== 'offer_selected') {
    return c.json({ error: { code: 'INVALID_STATE', message: `Listing is ${listing.state}, expected offer_selected` } }, 409)
  }
  // selected offer = authoritative buyer + amount (ไม่เชื่อ body · security rule 5)
  const [sel] = await db
    .select()
    .from(offers)
    .where(and(eq(offers.listingMetaId, id), eq(offers.status, 'selected')))
    .limit(1)
  if (!sel) return c.json({ error: { code: 'NO_SELECTED_OFFER', message: 'No selected offer to fund' } }, 409)
  if (sel.buyerId !== user.userId) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Only the selected buyer can confirm funding' } }, 403)
  }
  // R4 + GAP-5 (W2.1): funding window หมดอายุ/ไม่มี → ปฏิเสธ (treat null = invalid · defense-in-depth)
  if (!sel.fundingDeadline || sel.fundingDeadline.getTime() < Date.now()) {
    return c.json({ error: { code: 'FUNDING_WINDOW_EXPIRED', message: 'Funding window expired or missing' } }, 409)
  }
  try {
    const res = await transitionListingState({
      listingId: id,
      to: 'buyer_confirmed',
      actorUserId: user.userId,
      actorRole: 'buyer',
      buyerUserId: sel.buyerId,
      pointAmount: Math.round(Number(sel.offerPrice)),
    })
    return c.json(
      { listingId: res.listingId, state: res.state, lockedAmount: Math.round(Number(sel.offerPrice)) },
      200,
    )
  } catch (err) {
    if (err instanceof StateTransitionError) {
      return c.json({ error: { code: 'INVALID_TRANSITION', message: err.message } }, 400)
    }
    const msg = err instanceof Error ? err.message : 'CONFIRM_FUNDING_FAILED'
    return c.json({ error: { code: 'CONFIRM_FUNDING_FAILED', message: msg } }, 400)
  }
})

// ════════════════════════════════════════════════════════════════════════════
// D2 Resell Wave 3a — guarded endpoints (RELEASE + REFUND · money path)
//   RELEASE: ship → deliver → inspect-confirm (release escrow)
//   REFUND : cancel (refundEscrow จาก locked · offer_fee bulk จาก receiving_offers · F3)
//   เงินเคลื่อนผ่าน guarded endpoint เท่านั้น (S1 ยังคง block generic /transition)
// ════════════════════════════════════════════════════════════════════════════

const INSPECTION_WINDOW_MS = 72 * 60 * 60 * 1000 // D5: inspection window 72h (ค่าคงที่ · timeout job = W3c)

// helper: map transition error → response (ใช้ร่วม guarded endpoints)
function mapTransitionError(
  c: { json: (b: unknown, s: 400 | 404) => Response },
  err: unknown,
): Response {
  if (err instanceof StateTransitionError) {
    return c.json({ error: { code: 'INVALID_TRANSITION', message: err.message } }, 400)
  }
  const msg = err instanceof Error ? err.message : 'OPERATION_FAILED'
  if (msg === 'LISTING_NOT_FOUND') return c.json({ error: { code: 'NOT_FOUND', message: msg } }, 404)
  return c.json({ error: { code: 'OPERATION_FAILED', message: msg } }, 400)
}

// ── POST /{id}/ship — seller ส่ง → in_progress + fulfillment (R1/R6) ───────────
const shipRoute = createRoute({
  method: 'post',
  path: '/{id}/ship',
  tags: ['Listings'],
  summary: 'Seller ships → in_progress + fulfillment (carrier/tracking/evidence · R1/R6)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            deliveryMethod: z.enum(['parcel', 'on_site']).optional(),
            carrier: z.string().optional(),
            trackingNo: z.string().optional(),
            shipEvidence: z.array(z.string()).optional(), // file_uploads ref[] (R6 pre-ship)
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Shipped' },
    400: { description: 'Invalid transition' },
    401: { description: 'Unauthorized' },
    403: { description: 'Not seller / not resell listing' },
    404: { description: 'Not found' },
    409: { description: 'Wrong state' },
  },
})

listingsRouter.openapi(shipRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id } = c.req.valid('param')
  const b = c.req.valid('json')
  const [listing] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, id)).limit(1)
  if (!listing) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
  if (!isResellListingType(listing.listingType)) {
    return c.json({ error: { code: 'NOT_RESELL_LISTING', message: 'Ship applies only to resell/scrap listings' } }, 403)
  }
  const isAdmin = user.role === 'admin' || user.role === 'super_admin'
  if (listing.ownerId !== user.userId && !isAdmin) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Only the seller can ship' } }, 403)
  }
  if (listing.state !== 'buyer_confirmed') {
    return c.json({ error: { code: 'INVALID_STATE', message: `Listing is ${listing.state}, expected buyer_confirmed` } }, 409)
  }
  try {
    const res = await db.transaction(async (tx) => {
      const now = new Date()
      await tx
        .insert(resellFulfillment)
        .values({
          listingId: id,
          deliveryMethod: b.deliveryMethod ?? null,
          carrier: b.carrier ?? null,
          trackingNo: b.trackingNo ?? null,
          shipAt: now,
          shipEvidence: b.shipEvidence ?? null,
        })
        .onConflictDoUpdate({
          target: resellFulfillment.listingId,
          set: {
            deliveryMethod: b.deliveryMethod ?? null,
            carrier: b.carrier ?? null,
            trackingNo: b.trackingNo ?? null,
            shipAt: now,
            shipEvidence: b.shipEvidence ?? null,
            updatedAt: now,
          },
        })
      // buyer_confirmed → in_progress (ไม่ใช่ escrow-mutating · เงินยัง locked)
      return transitionListingState({ listingId: id, to: 'in_progress', actorUserId: user.userId, actorRole: 'seller' }, tx)
    })
    return c.json({ listingId: res.listingId, state: res.state }, 200)
  } catch (err) {
    return mapTransitionError(c, err)
  }
})

// ── POST /{id}/deliver — ถึงผู้ซื้อ → delivered → inspection_period (R1) ───────
const deliverRoute = createRoute({
  method: 'post',
  path: '/{id}/deliver',
  tags: ['Listings'],
  summary: 'Mark delivered → inspection_period + inspection deadline (72h · R1)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: 'Delivered → inspection_period' },
    400: { description: 'Invalid transition' },
    401: { description: 'Unauthorized' },
    403: { description: 'Not party / not resell listing' },
    404: { description: 'Not found' },
    409: { description: 'Wrong state' },
  },
})

listingsRouter.openapi(deliverRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id } = c.req.valid('param')
  const [listing] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, id)).limit(1)
  if (!listing) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
  if (!isResellListingType(listing.listingType)) {
    return c.json({ error: { code: 'NOT_RESELL_LISTING', message: 'Deliver applies only to resell/scrap listings' } }, 403)
  }
  if (listing.state !== 'in_progress') {
    return c.json({ error: { code: 'INVALID_STATE', message: `Listing is ${listing.state}, expected in_progress` } }, 409)
  }
  // authz: seller(owner) OR selected buyer OR admin (parcel arrive / on_site hand-off)
  const isAdmin = user.role === 'admin' || user.role === 'super_admin'
  const isOwner = listing.ownerId === user.userId
  let allowed = isOwner || isAdmin
  if (!allowed) {
    const [sel] = await db
      .select({ buyerId: offers.buyerId })
      .from(offers)
      .where(and(eq(offers.listingMetaId, id), eq(offers.status, 'selected')))
      .limit(1)
    allowed = !!sel && sel.buyerId === user.userId
  }
  if (!allowed) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Only seller, selected buyer, or admin can mark delivered' } }, 403)
  }
  const now = new Date()
  const inspectionDeadline = new Date(now.getTime() + INSPECTION_WINDOW_MS)
  try {
    const res = await db.transaction(async (tx) => {
      await tx
        .update(resellFulfillment)
        .set({ deliverAt: now, inspectionDeadline, updatedAt: now })
        .where(eq(resellFulfillment.listingId, id))
      // in_progress → delivered → inspection_period (atomic · เปิด countdown ตรวจรับ · ไม่ใช่ escrow-mutating)
      await transitionListingState(
        { listingId: id, to: 'delivered', actorUserId: user.userId, actorRole: isOwner ? 'seller' : 'buyer' },
        tx,
      )
      return transitionListingState(
        { listingId: id, to: 'inspection_period', actorUserId: user.userId, actorRole: isOwner ? 'seller' : 'buyer' },
        tx,
      )
    })
    return c.json({ listingId: res.listingId, state: res.state, inspectionDeadline: inspectionDeadline.toISOString() }, 200)
  } catch (err) {
    return mapTransitionError(c, err)
  }
})

// ── POST /{id}/inspect-confirm — buyer ยืนยันรับ → completed = releaseEscrow (R1) ──
const inspectConfirmRoute = createRoute({
  method: 'post',
  path: '/{id}/inspect-confirm',
  tags: ['Listings'],
  summary: 'Buyer confirms receipt → completed + release escrow (net−fee D75 · guarded · S1)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: 'Completed + escrow released' },
    400: { description: 'Invalid transition' },
    401: { description: 'Unauthorized' },
    403: { description: 'Not the selected buyer / not resell listing' },
    404: { description: 'Not found' },
    409: { description: 'Wrong state / no selected offer' },
  },
})

listingsRouter.openapi(inspectConfirmRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id } = c.req.valid('param')
  const [listing] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, id)).limit(1)
  if (!listing) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
  if (!isResellListingType(listing.listingType)) {
    return c.json({ error: { code: 'NOT_RESELL_LISTING', message: 'Inspect-confirm applies only to resell/scrap listings' } }, 403)
  }
  if (listing.state !== 'inspection_period') {
    return c.json({ error: { code: 'INVALID_STATE', message: `Listing is ${listing.state}, expected inspection_period` } }, 409)
  }
  // release authoritative: derive buyer (payer) จาก selected offer (S1 pattern · ไม่เชื่อ body · กัน Gold theft)
  const [sel] = await db
    .select({ buyerId: offers.buyerId })
    .from(offers)
    .where(and(eq(offers.listingMetaId, id), eq(offers.status, 'selected')))
    .limit(1)
  if (!sel) return c.json({ error: { code: 'NO_SELECTED_OFFER', message: 'No selected offer to complete' } }, 409)
  if (sel.buyerId !== user.userId) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Only the buyer can confirm receipt' } }, 403)
  }
  try {
    // inspection_period → completed → releaseEscrow (credit seller net−fee · A1 pct=0→fee=0 · reference=escrow:{holdId})
    const res = await transitionListingState({ listingId: id, to: 'completed', actorUserId: user.userId, actorRole: 'buyer' })
    return c.json({ listingId: res.listingId, state: res.state }, 200)
  } catch (err) {
    return mapTransitionError(c, err)
  }
})

// ── POST /{id}/cancel — REFUND: refundEscrow(locked) / offer_fee bulk(receiving_offers · F3) ──
const cancelRoute = createRoute({
  method: 'post',
  path: '/{id}/cancel',
  tags: ['Listings'],
  summary: 'Cancel → refund escrow (locked) / refund offer_fee (receiving_offers · F3) · faultParty single-source',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: 'Cancelled + refunded' },
    400: { description: 'Invalid transition' },
    401: { description: 'Unauthorized' },
    403: { description: 'Not authorized / not resell listing' },
    404: { description: 'Not found' },
    409: { description: 'Not cancellable in W3a (post-ship → dispute/mutual)' },
  },
})

// W3a cancel-able states (pre-ship): post-ship (in_progress+) → dispute/mutual = W3b
const W3A_CANCELLABLE: ReadonlySet<ListingState> = new Set([
  'draft',
  'announced',
  'receiving_offers',
  'buyer_confirmed',
])

listingsRouter.openapi(cancelRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id } = c.req.valid('param')
  const [listing] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, id)).limit(1)
  if (!listing) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
  if (!isResellListingType(listing.listingType)) {
    return c.json({ error: { code: 'NOT_RESELL_LISTING', message: 'Cancel applies only to resell/scrap listings' } }, 403)
  }
  const state = listing.state as ListingState
  if (!W3A_CANCELLABLE.has(state)) {
    return c.json(
      { error: { code: 'CANCEL_NOT_ALLOWED', message: `Cannot cancel from ${state} (post-ship → dispute/mutual-cancel)` } },
      409,
    )
  }
  const isAdmin = user.role === 'admin' || user.role === 'super_admin'
  const isOwner = listing.ownerId === user.userId
  // selected buyer = buyer-initiated cancel จาก buyer_confirmed (pre-ship withdraw)
  let isSelectedBuyer = false
  if (state === 'buyer_confirmed') {
    const [sel] = await db
      .select({ buyerId: offers.buyerId })
      .from(offers)
      .where(and(eq(offers.listingMetaId, id), eq(offers.status, 'selected')))
      .limit(1)
    isSelectedBuyer = !!sel && sel.buyerId === user.userId
  }
  if (!isOwner && !isAdmin && !isSelectedBuyer) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Only owner, admin, or the selected buyer can cancel' } }, 403)
  }
  // faultParty single-source (F6 prep · bad_record derive จาก faultParty)
  let faultParty: 'seller' | 'buyer' | 'mutual' | 'none'
  let actorRole: string
  if (isSelectedBuyer && !isOwner) {
    faultParty = 'buyer' // buyer ถอนก่อนส่ง
    actorRole = 'buyer'
  } else if (isOwner) {
    faultParty = state === 'draft' || state === 'announced' ? 'none' : 'seller'
    actorRole = 'seller'
  } else {
    faultParty = 'none' // admin neutral
    actorRole = 'admin'
  }
  try {
    // cancel จาก buyer_confirmed = escrow-mutating → guarded endpoint นี้คือ path ที่อนุญาต (refundEscrow)
    // cancel จาก receiving_offers → F3 bulk offer_fee refund (centralize ใน transitionListingState)
    const res = await transitionListingState({ listingId: id, to: 'cancelled', actorUserId: user.userId, actorRole, faultParty })
    return c.json({ listingId: res.listingId, state: res.state, faultParty }, 200)
  } catch (err) {
    return mapTransitionError(c, err)
  }
})

// ── POST /{id}/dispute — raise dispute (party-only · in_progress/delivered/inspection_period) ──
//   W3b · R6/R8/R11 → disputed (เงินค้าง locked รอ admin-resolve) · admin 3-way = routes/resell-disputes.ts
const disputeRoute = createRoute({
  method: 'post',
  path: '/{id}/dispute',
  tags: ['Listings'],
  summary: 'Raise dispute (party-only · in_progress/delivered/inspection_period → disputed · R6/R8/R11)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            disputeType: z.enum(['not_as_described', 'damaged', 'not_shipped', 'parcel_damage', 'other']),
            reason: z.string().min(1),
            evidence: z.array(z.string()).optional(), // file_uploads ref[]
          }),
        },
      },
    },
  },
  responses: {
    201: { description: 'Dispute raised → disputed' },
    400: { description: 'Invalid transition' },
    401: { description: 'Unauthorized' },
    403: { description: 'Not a party / not resell listing' },
    404: { description: 'Not found' },
    409: { description: 'Wrong state / dispute already open' },
  },
})

// W3c: +buyer_confirmed — R6 seller no-ship (เปิด not_shipped ก่อนส่งได้) · post-ship states = เคสคุณภาพ
const DISPUTABLE_STATES: ReadonlySet<ListingState> = new Set([
  'buyer_confirmed',
  'in_progress',
  'delivered',
  'inspection_period',
])

listingsRouter.openapi(disputeRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id } = c.req.valid('param')
  const b = c.req.valid('json')
  const [listing] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, id)).limit(1)
  if (!listing) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
  if (!isResellListingType(listing.listingType)) {
    return c.json({ error: { code: 'NOT_RESELL_LISTING', message: 'Dispute applies only to resell/scrap listings' } }, 403)
  }
  if (!DISPUTABLE_STATES.has(listing.state as ListingState)) {
    return c.json({ error: { code: 'INVALID_STATE', message: `Cannot dispute from ${listing.state}` } }, 409)
  }
  // W3c: ก่อนส่ง (buyer_confirmed) เปิดได้เฉพาะ not_shipped (R6) · เคสคุณภาพต้องหลังส่ง
  if (listing.state === 'buyer_confirmed' && b.disputeType !== 'not_shipped') {
    return c.json({ error: { code: 'INVALID_DISPUTE_TYPE', message: 'Only not_shipped dispute allowed before shipping' } }, 400)
  }
  // authz: party only (seller=owner OR selected buyer)
  const [sel] = await db
    .select({ buyerId: offers.buyerId })
    .from(offers)
    .where(and(eq(offers.listingMetaId, id), eq(offers.status, 'selected')))
    .limit(1)
  const isOwner = listing.ownerId === user.userId
  const isBuyer = !!sel && sel.buyerId === user.userId
  if (!isOwner && !isBuyer) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Only the seller or buyer can raise a dispute' } }, 403)
  }
  // one open dispute per listing
  const [existing] = await db
    .select({ id: resellDisputes.id })
    .from(resellDisputes)
    .where(and(eq(resellDisputes.listingId, id), inArray(resellDisputes.status, ['open', 'under_review'])))
    .limit(1)
  if (existing) {
    return c.json({ error: { code: 'DISPUTE_ALREADY_OPEN', message: 'An open dispute already exists' } }, 409)
  }
  try {
    const res = await db.transaction(async (tx) => {
      const [d] = await tx
        .insert(resellDisputes)
        .values({
          listingId: id,
          raisedByUserId: user.userId,
          disputeType: b.disputeType,
          reason: b.reason,
          evidence: b.evidence ?? null,
          status: 'open',
        })
        .returning({ id: resellDisputes.id })
      // → disputed (ไม่ใช่ escrow-mutating · เงินค้าง locked รอ admin) · fault กำหนดตอน resolve
      await transitionListingState(
        { listingId: id, to: 'disputed', actorUserId: user.userId, actorRole: isOwner ? 'seller' : 'buyer' },
        tx,
      )
      return d!
    })
    return c.json({ disputeId: res.id, listingId: id, state: 'disputed' }, 201)
  } catch (err) {
    return mapTransitionError(c, err)
  }
})

// ── POST /{id}/offers — buyer ยื่น offer (D61) ─────────────────────────────────
const createOfferRoute = createRoute({
  method: 'post',
  path: '/{id}/offers',
  tags: ['Offers'],
  summary: 'Buyer creates offer on listing (D61) + offer_fee (1D)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            offerPrice: z.number().int().positive(), // W3b GAP-2: Gold integer > 0 (กัน 0/เศษ → price drift @lock)
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
    403: { description: 'Owner cannot bid on own listing' },
    404: { description: 'Listing not found' },
  },
})

listingsRouter.openapi(createOfferRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id } = c.req.valid('param')
  const b = c.req.valid('json')
  const [listing] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, id)).limit(1)
  if (!listing) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
  // W2.1-addon (Advisor ③): offer flow เฉพาะ resell/scrap (กัน parts/repair/maintain เข้า escrow → stranded Gold)
  if (!isResellListingType(listing.listingType)) {
    return c.json({ error: { code: 'NOT_RESELL_LISTING', message: 'Offers apply only to resell/scrap listings' } }, 403)
  }
  // S5 (W2.1): กัน self-deal — owner ยื่น offer ใส่ประกาศตัวเองไม่ได้
  if (listing.ownerId === user.userId) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Owner cannot bid on own listing' } }, 403)
  }

  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(offers)
      .values({
        listingMetaId: id,
        buyerId: user.userId,
        buyerType: sellerTypeFromRole(user.role),
        offerPrice: String(b.offerPrice),
        deliveryMethod: b.deliveryMethod,
        message: b.message ?? null,
        status: 'pending',
      })
      .returning()
    // GR-8 counter + D83: announced → receiving_offers (first offer)
    await tx
      .update(listingMeta)
      .set({
        offerCount: listing.offerCount + 1,
        state: listing.state === 'announced' ? 'receiving_offers' : listing.state,
        updatedAt: new Date(),
      })
      .where(eq(listingMeta.listingId, id))
    // 1D: offer_fee (config · D75 · audit)
    const fee = await getFee(tx, 'offer_fee')
    await chargeFee(tx, { userId: user.userId, amount: fee, reference: `offer:${row!.id}`, kind: 'offer_fee' })
    return row!
  })
  return c.json(offerDto(created), 201)
})

// ── POST /{id}/offers/{offerId}/reject — seller rejects one pending offer (+refund offer_fee) ──
//   W3c re-point: canonical สำหรับ WeeeR `rejectOffer` (faultParty≠buyer → คืน offer_fee · ruling 5)
const rejectOfferRoute = createRoute({
  method: 'post',
  path: '/{id}/offers/{offerId}/reject',
  tags: ['Offers'],
  summary: 'Seller rejects a pending offer (+refund offer_fee · canonical for WeeeR rejectOffer)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid(), offerId: z.string().uuid() }) },
  responses: {
    200: { description: 'Rejected + offer_fee refunded' },
    401: { description: 'Unauthorized' },
    403: { description: 'Not seller / not resell listing' },
    404: { description: 'Not found' },
    409: { description: 'Offer not pending' },
  },
})

listingsRouter.openapi(rejectOfferRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id, offerId } = c.req.valid('param')
  const [listing] = await db.select().from(listingMeta).where(eq(listingMeta.listingId, id)).limit(1)
  if (!listing) return c.json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } }, 404)
  if (!isResellListingType(listing.listingType)) {
    return c.json({ error: { code: 'NOT_RESELL_LISTING', message: 'Reject applies only to resell/scrap listings' } }, 403)
  }
  const isAdmin = user.role === 'admin' || user.role === 'super_admin'
  if (listing.ownerId !== user.userId && !isAdmin) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Only the seller can reject an offer' } }, 403)
  }
  const [offer] = await db.select().from(offers).where(eq(offers.id, offerId)).limit(1)
  if (!offer || offer.listingMetaId !== id) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Offer not found on this listing' } }, 404)
  }
  if (offer.status !== 'pending') {
    return c.json({ error: { code: 'OFFER_NOT_PENDING', message: `Offer is ${offer.status}` } }, 409)
  }
  await db.transaction(async (tx) => {
    // CAS: reject เฉพาะถ้ายัง pending จริง (กัน double) + refund offer_fee (seller reject · faultParty≠buyer)
    await tx
      .update(offers)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(and(eq(offers.id, offerId), eq(offers.status, 'pending')))
    await refundOfferFee(tx, offerId, offer.buyerId)
  })
  return c.json({ offerId, status: 'rejected' }, 200)
})

// ── GET /{id}/offers — offers บน listing (seller view) ─────────────────────────
const listOffersRoute = createRoute({
  method: 'get',
  path: '/{id}/offers',
  tags: ['Offers'],
  summary: 'List offers on a listing (seller view)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: 'Offers' }, 401: { description: 'Unauthorized' } },
})

listingsRouter.openapi(listOffersRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { id } = c.req.valid('param')
  const rows = await db.select().from(offers).where(eq(offers.listingMetaId, id)).orderBy(desc(offers.createdAt))
  return c.json(rows.map(offerDto), 200)
})

// ── POST /{id}/view — GR-8 unique view (existing) ─────────────────────────────
const viewRoute = createRoute({
  method: 'post',
  path: '/{id}/view',
  tags: ['Listings'],
  summary: 'GR-8 record unique view (dedupe per user/ip per day)',
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: 'Recorded' } },
})

listingsRouter.openapi(viewRoute, async (c) => {
  const { id } = c.req.valid('param')
  const user = await getAuthUser(c)
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? null
  const counted = await recordView(id, { userId: user?.userId ?? null, ip })
  return c.json({ counted }, 200)
})

// ── POST /{id}/offer — increment offer_count raw (existing) ───────────────────
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

// offer DTO (D61) — camelCase API contract
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

// re-export types ที่ helper ใช้ (ป้องกัน unused import warning ในบางโหมด)
export type { ListingMeta, UsedApplianceListing, AuthedUser }
