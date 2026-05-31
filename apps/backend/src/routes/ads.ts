/**
 * ads.ts — W-Round-1 Wave 1.2 [5] / C12: โฆษณา + ตัด Gold Point (D75)
 *
 * Mounted at: /api/v1/ads
 *
 *   GET  /api/v1/ads/public           → active ads for display (no auth, ?position= filter)
 *   POST /api/v1/ads                  → buy (own_listing): คำนวณ D75 → debit Gold → status pending
 *   GET  /api/v1/ads                  → my ads (advertiser ?position=) / all (admin ?all=1)
 *   POST /api/v1/ads/{id}/approve     → admin approve → active (+start/end date)
 *   POST /api/v1/ads/{id}/reject      → admin reject → refund Gold (full)
 *   POST /api/v1/ads/{id}/cancel      → advertiser cancel: pending→full refund · active→proportional refund (D75)
 *
 * Flow (Advisor): buy(debit) → approval queue → approve→active / reject→refund / cancel→refund
 * เรต default (admin ปรับผ่าน admin_config key 'ad_rates'): home_first_row=5, module_first_row=3, sidebar=3 Gold/วัน
 * D75: goldCost = rate/วัน × วัน → Math.round
 * Cancel refund policy: pending=goldCost full · active=Math.round(remainingDays/durationDays × goldCost) · others=409
 * Decision: C12 (ads + Gold deduct) · 0031_ads_cancel (cancelled state)
 */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { and, eq, desc, lte, gte, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { ads, adminConfig, AD_POSITIONS, type AdPosition } from '../db/schema'
import { verifyAccessToken } from '../lib/jwt'
import { calcAdCost, debitGold, creditGold, roundD75 } from '../lib/point-service'

export const adsRouter = new OpenAPIHono()

async function getAuthUser(c: { req: { header: (k: string) => string | undefined } }) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyAccessToken(auth.slice(7)).catch(() => null)
}
const unauthorized = (c: { json: (b: unknown, s: 401) => Response }) =>
  c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)
const forbidden = (c: { json: (b: unknown, s: 403) => Response }) =>
  c.json({ error: { code: 'FORBIDDEN', message: 'Admin only' } }, 403)
const isAdminRole = (role?: string) => role === 'admin' || role === 'super_admin'

const DEFAULT_RATES: Record<AdPosition, number> = {
  home_first_row: 5,
  module_first_row: 3,
  sidebar: 3,
}

/** rate/วัน ของ position (admin override ผ่าน admin_config 'ad_rates' ถ้ามี) */
async function rateForPosition(position: AdPosition): Promise<number> {
  const [cfg] = await db.select().from(adminConfig).where(eq(adminConfig.key, 'ad_rates')).limit(1)
  const overrides = (cfg?.value ?? null) as Record<string, number> | null
  const r = overrides?.[position]
  return typeof r === 'number' && r >= 0 ? r : DEFAULT_RATES[position]
}

// ── GET /public — B1 active ads สำหรับแสดงผล (no auth) ─────────────────────────
// status=active + อยู่ในช่วง start/end date · optional ?position= filter
const publicRoute = createRoute({
  method: 'get',
  path: '/public',
  tags: ['Ads'],
  summary: 'Public active ads for display (B1) — filter by position',
  request: { query: z.object({ position: z.enum(AD_POSITIONS).optional() }) },
  responses: { 200: { description: 'Active ads' } },
})

adsRouter.openapi(publicRoute, async (c) => {
  const { position } = c.req.valid('query')
  const now = new Date()
  const conds = [
    eq(ads.status, 'active'),
    lte(ads.startDate, now),
    // endDate ว่าง = ไม่หมดอายุ · ถ้ามี ต้อง >= now
    sql`(${ads.endDate} IS NULL OR ${ads.endDate} >= ${now})`,
  ]
  if (position) conds.push(eq(ads.position, position))
  const rows = await db
    .select()
    .from(ads)
    .where(and(...conds))
    .orderBy(desc(ads.startDate))
  return c.json(
    {
      items: rows.map((r) => ({
        id: r.id,
        adType: r.adType,
        listingId: r.listingId,
        position: r.position,
        bannerImage: r.bannerImage,
        targetUrl: r.targetUrl,
        startDate: r.startDate?.toISOString() ?? null,
        endDate: r.endDate?.toISOString() ?? null,
      })),
    },
    200,
  )
})

// ── POST / — buy ad (debit Gold D75) ──────────────────────────────────────────
const buyRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Ads'],
  summary: 'Buy own_listing ad: D75 cost → debit Gold → pending (C12)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            listingId: z.string().uuid(),
            position: z.enum(AD_POSITIONS),
            durationDays: z.number().int().min(1),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: 'Ad created (pending)' },
    400: { description: 'Insufficient Gold / invalid' },
    401: { description: 'Unauthorized' },
  },
})

adsRouter.openapi(buyRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { listingId, position, durationDays } = c.req.valid('json')
  const rate = await rateForPosition(position)
  const goldCost = calcAdCost(rate, durationDays) // D75 round

  try {
    const created = await db.transaction(async (tx) => {
      // insert ad ก่อน → ได้ adId มาใช้เป็น ledger reference/idempotencyKey
      // (C12: audit ref = adId · stable idempotent — แก้ปัญหา Date.now() ที่ retry แล้วตัดซ้ำ)
      const [row] = await tx
        .insert(ads)
        .values({
          advertiserUserId: user.userId,
          adType: 'own_listing',
          listingId,
          position,
          goldCost,
          durationDays,
          status: 'pending',
        })
        .returning()
      // debit Gold (D75 ปัดเต็มมาแล้วใน calcAdCost) — audit log ทุกครั้งผ่าน point_ledger
      if (goldCost > 0) {
        await debitGold(tx, {
          userId: user.userId,
          amount: goldCost,
          reference: `ad:${row.id}`,
          idempotencyKey: `ad-buy:${row.id}`,
          type: 'spend',
          metadata: { ad: true, listingId, position, durationDays },
        })
      }
      return row
    })
    return c.json({ id: created.id, goldCost: created.goldCost, status: created.status }, 201)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AD_BUY_FAILED'
    return c.json({ error: { code: 'AD_BUY_FAILED', message: msg } }, 400)
  }
})

// ── GET / — my ads / all (admin) · optional ?position= filter ─────────────────
const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Ads'],
  summary: 'List ads (mine ?position=, or all with ?all=1 for admin)',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      all: z.string().optional(),
      position: z.enum(AD_POSITIONS).optional(),
    }),
  },
  responses: { 200: { description: 'Ads' }, 401: { description: 'Unauthorized' } },
})

adsRouter.openapi(listRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  const { all, position } = c.req.valid('query')
  const wantAll = all === '1' && isAdminRole(user.role)

  // build conditions: owner filter + optional position filter
  const conds = wantAll ? [] : [eq(ads.advertiserUserId, user.userId)]
  if (position) conds.push(eq(ads.position, position))

  const rows = await db
    .select()
    .from(ads)
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(desc(ads.createdAt))

  return c.json(
    {
      items: rows.map((r) => ({
        id: r.id,
        adType: r.adType,
        listingId: r.listingId,
        position: r.position,
        goldCost: r.goldCost,
        durationDays: r.durationDays,
        status: r.status,
        rejectReason: r.rejectReason,
        startDate: r.startDate?.toISOString() ?? null,
        endDate: r.endDate?.toISOString() ?? null,
        cancelledAt: r.cancelledAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
    },
    200,
  )
})

// ── POST /{id}/approve (admin) → active ───────────────────────────────────────
const approveRoute = createRoute({
  method: 'post',
  path: '/{id}/approve',
  tags: ['Ads'],
  summary: 'Admin approve ad → active (set start/end date)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: 'Approved/active' },
    401: { description: 'Unauthorized' },
    403: { description: 'Admin only' },
    404: { description: 'Not found' },
    409: { description: 'Not pending' },
  },
})

adsRouter.openapi(approveRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  if (!isAdminRole(user.role)) return forbidden(c)
  const { id } = c.req.valid('param')
  const [ad] = await db.select().from(ads).where(eq(ads.id, id)).limit(1)
  if (!ad) return c.json({ error: { code: 'NOT_FOUND', message: 'Ad not found' } }, 404)
  if (ad.status !== 'pending') {
    return c.json({ error: { code: 'NOT_PENDING', message: `Ad is ${ad.status}` } }, 409)
  }
  const start = new Date()
  const end = new Date(start.getTime() + ad.durationDays * 24 * 60 * 60 * 1000)
  const [row] = await db
    .update(ads)
    .set({ status: 'active', approvedBy: user.userId, approvedAt: start, startDate: start, endDate: end, updatedAt: start })
    .where(eq(ads.id, id))
    .returning()
  return c.json({ id: row.id, status: row.status, startDate: row.startDate?.toISOString(), endDate: row.endDate?.toISOString() }, 200)
})

// ── POST /{id}/reject (admin) → refund Gold ───────────────────────────────────
const rejectRoute = createRoute({
  method: 'post',
  path: '/{id}/reject',
  tags: ['Ads'],
  summary: 'Admin reject ad → refund Gold (credit back)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: z.object({ reason: z.string().optional() }) } }, required: false },
  },
  responses: {
    200: { description: 'Rejected + refunded' },
    401: { description: 'Unauthorized' },
    403: { description: 'Admin only' },
    404: { description: 'Not found' },
    409: { description: 'Not pending' },
  },
})

adsRouter.openapi(rejectRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)
  if (!isAdminRole(user.role)) return forbidden(c)
  const { id } = c.req.valid('param')
  const { reason } = c.req.valid('json') ?? {}
  const [ad] = await db.select().from(ads).where(eq(ads.id, id)).limit(1)
  if (!ad) return c.json({ error: { code: 'NOT_FOUND', message: 'Ad not found' } }, 404)
  if (ad.status !== 'pending') {
    return c.json({ error: { code: 'NOT_PENDING', message: `Ad is ${ad.status}` } }, 409)
  }
  const row = await db.transaction(async (tx) => {
    if (ad.goldCost > 0) {
      await creditGold(tx, {
        userId: ad.advertiserUserId,
        amount: ad.goldCost,
        reference: `ad:${ad.listingId ?? ad.id}`,
        idempotencyKey: `ad-refund:${ad.id}`,
        type: 'refund',
        metadata: { ad: true, phase: 'reject-refund' },
      })
    }
    const [updated] = await tx
      .update(ads)
      .set({ status: 'rejected', rejectReason: reason ?? null, approvedBy: user.userId, approvedAt: new Date(), updatedAt: new Date() })
      .where(eq(ads.id, id))
      .returning()
    return updated
  })
  return c.json({ id: row.id, status: row.status, refunded: ad.goldCost }, 200)
})

// ── POST /{id}/cancel (advertiser) → refund Gold ──────────────────────────────
// pending → full refund · active → proportional (remaining days, D75 round)
// expired/rejected/cancelled → 409
const cancelRoute = createRoute({
  method: 'post',
  path: '/{id}/cancel',
  tags: ['Ads'],
  summary: 'Advertiser cancel ad → refund Gold (pending=full · active=proportional D75)',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: 'Cancelled + refunded' },
    401: { description: 'Unauthorized' },
    403: { description: 'Not your ad' },
    404: { description: 'Not found' },
    409: { description: 'Cannot cancel (already expired/rejected/cancelled)' },
  },
})

adsRouter.openapi(cancelRoute, async (c) => {
  const user = await getAuthUser(c)
  if (!user) return unauthorized(c)

  const { id } = c.req.valid('param')
  const [ad] = await db.select().from(ads).where(eq(ads.id, id)).limit(1)
  if (!ad) return c.json({ error: { code: 'NOT_FOUND', message: 'Ad not found' } }, 404)

  // เฉพาะเจ้าของ (advertiser) หรือ admin ยกเลิกได้
  if (ad.advertiserUserId !== user.userId && !isAdminRole(user.role)) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Not your ad' } }, 403)
  }

  const cancellable = ['pending', 'active'] as const
  if (!(cancellable as readonly string[]).includes(ad.status)) {
    return c.json({ error: { code: 'NOT_CANCELLABLE', message: `Ad is ${ad.status}` } }, 409)
  }

  /**
   * คำนวณ refund:
   *   pending → full (goldCost ทั้งหมด เพราะยังไม่ active)
   *   active  → proportional: Math.round(remainingDays / durationDays × goldCost)  [D75]
   *             remainingDays = max(0, ceil((endDate - now) / msPerDay))
   */
  const now = new Date()
  let refundAmount = ad.goldCost

  if (ad.status === 'active' && ad.endDate) {
    const msRemaining = Math.max(0, ad.endDate.getTime() - now.getTime())
    const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000))
    refundAmount = roundD75((daysRemaining / ad.durationDays) * ad.goldCost)
  }

  const row = await db.transaction(async (tx) => {
    if (refundAmount > 0) {
      await creditGold(tx, {
        userId: ad.advertiserUserId,
        amount: refundAmount,
        reference: `ad:${ad.listingId ?? ad.id}`,
        idempotencyKey: `ad-cancel:${ad.id}`,
        type: 'refund',
        metadata: { ad: true, phase: 'cancel-refund', previousStatus: ad.status, refundAmount },
      })
    }
    const [updated] = await tx
      .update(ads)
      .set({ status: 'cancelled', cancelledAt: now, updatedAt: now })
      .where(eq(ads.id, id))
      .returning()
    return updated
  })

  return c.json({ id: row.id, status: row.status, refunded: refundAmount, cancelledAt: row.cancelledAt?.toISOString() ?? null }, 200)
})
