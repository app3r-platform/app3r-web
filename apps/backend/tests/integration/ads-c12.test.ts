/**
 * ads-c12.test.ts — C12 Ad System integration tests
 *
 * Covers:
 *   - Migration 0031 (cancelled status CHECK + cancelled_at column)
 *   - POST /{id}/cancel: pending → full refund
 *   - POST /{id}/cancel: active → proportional refund (D75)
 *   - POST /{id}/cancel: non-cancellable state → 409
 *   - POST /{id}/cancel: not owner → 403
 *   - GET / ?position= filter (list by placement)
 *   - GET /public (active ads for display)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '../../src/db/client'
import { ads, users, wallets, pointLedger, listingMeta } from '../../src/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import app from '../../src/app'
import { signAccessToken } from '../../src/lib/jwt'

// ── helpers ──────────────────────────────────────────────────────────────────

async function createTestUser(email: string, role = 'weeeu') {
  const [u] = await db
    .insert(users)
    .values({ email, passwordHash: 'x', role })
    .onConflictDoUpdate({ target: users.email, set: { role } })
    .returning()
  return u!
}

async function seedWallet(userId: string, balance: number) {
  await db
    .insert(wallets)
    .values({ userId, pointType: 'cash', balance })
    .onConflictDoUpdate({
      target: [wallets.userId, wallets.pointType],
      set: { balance, updatedAt: new Date() },
    })
}

async function getWalletBalance(userId: string): Promise<number> {
  const [w] = await db
    .select({ balance: wallets.balance })
    .from(wallets)
    .where(eq(wallets.userId, userId))
  return w?.balance ?? 0
}

async function bearerHeader(userId: string, role: string) {
  const token = await signAccessToken({ userId, role })
  return { Authorization: `Bearer ${token}` }
}

async function createAdRow(
  advertiserUserId: string,
  overrides: Partial<typeof ads.$inferInsert> = {},
) {
  const [row] = await db
    .insert(ads)
    .values({
      advertiserUserId,
      adType: 'own_listing',
      position: 'sidebar',
      goldCost: 30,
      durationDays: 10,
      status: 'pending',
      ...overrides,
    })
    .returning()
  return row!
}

// ── test suite ────────────────────────────────────────────────────────────────

describe('C12 Ad System — cancel-refund + list-by-placement', () => {
  let buyerUser: { id: string; email: string; role: string }
  let adminUser: { id: string; email: string; role: string }
  let otherUser: { id: string; email: string; role: string }

  beforeAll(async () => {
    buyerUser = await createTestUser('ads-c12-buyer@test.app', 'weeeu')
    adminUser = await createTestUser('ads-c12-admin@test.app', 'admin')
    otherUser = await createTestUser('ads-c12-other@test.app', 'weeeu')
    await seedWallet(buyerUser.id, 500)
  })

  afterAll(async () => {
    // cleanup ads created in tests
    await db.delete(ads).where(eq(ads.advertiserUserId, buyerUser.id))
    await db.delete(ads).where(eq(ads.advertiserUserId, adminUser.id))
  })

  // ── Rubric 1: Migration 0031 DB state ──────────────────────────────────────
  describe('Rubric #1 — Migration 0031 DB state', () => {
    it('cancelled_at column exists in ads table', async () => {
      const rows = await db.execute(
        sql`SELECT column_name FROM information_schema.columns
            WHERE table_name='ads' AND column_name='cancelled_at'`,
      )
      expect(rows.rows.length).toBe(1)
    })

    it('status CHECK allows cancelled value', async () => {
      // direct INSERT with status='cancelled' must succeed
      const [row] = await db
        .insert(ads)
        .values({
          advertiserUserId: buyerUser.id,
          adType: 'own_listing',
          position: 'sidebar',
          goldCost: 0,
          durationDays: 1,
          status: 'cancelled',
          cancelledAt: new Date(),
        })
        .returning()
      expect(row).toBeDefined()
      expect(row!.status).toBe('cancelled')
      // cleanup
      await db.delete(ads).where(eq(ads.id, row!.id))
    })
  })

  // ── Rubric 2: cancel pending → full refund ────────────────────────────────
  describe('Rubric #2 — POST /{id}/cancel: pending → full refund', () => {
    it('cancels pending ad and refunds full goldCost', async () => {
      const ad = await createAdRow(buyerUser.id, { goldCost: 30, status: 'pending' })
      const balanceBefore = await getWalletBalance(buyerUser.id)
      const headers = await bearerHeader(buyerUser.id, 'weeeu')

      const res = await app.request(`/api/v1/ads/${ad.id}/cancel`, {
        method: 'POST',
        headers,
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('cancelled')
      expect(body.refunded).toBe(30)
      expect(body.cancelledAt).toBeTruthy()

      const balanceAfter = await getWalletBalance(buyerUser.id)
      expect(balanceAfter).toBe(balanceBefore + 30)
    })
  })

  // ── Rubric 3: cancel active → proportional refund (D75) ───────────────────
  describe('Rubric #3 — POST /{id}/cancel: active → proportional refund', () => {
    it('cancels active ad and refunds proportional Gold (D75 Math.round)', async () => {
      // ad กำลัง active: start=5 วันที่แล้ว · end=5 วันข้างหน้า (10 วันรวม) · goldCost=30
      // remaining ≈ 5 วัน → refund = Math.round(5/10 × 30) = 15
      const now = new Date()
      const start = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      const end = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
      const ad = await createAdRow(buyerUser.id, {
        goldCost: 30,
        durationDays: 10,
        status: 'active',
        startDate: start,
        endDate: end,
      })
      const balanceBefore = await getWalletBalance(buyerUser.id)
      const headers = await bearerHeader(buyerUser.id, 'weeeu')

      const res = await app.request(`/api/v1/ads/${ad.id}/cancel`, {
        method: 'POST',
        headers,
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('cancelled')
      // Math.round(ceil(5) / 10 × 30) = Math.round(15) = 15
      expect(body.refunded).toBeGreaterThanOrEqual(14)
      expect(body.refunded).toBeLessThanOrEqual(16)

      const balanceAfter = await getWalletBalance(buyerUser.id)
      expect(balanceAfter).toBe(balanceBefore + body.refunded)
    })

    it('cancel active ad with 0 days remaining → refund 0', async () => {
      const now = new Date()
      const start = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
      const end = new Date(now.getTime() - 1000) // just expired
      const ad = await createAdRow(buyerUser.id, {
        goldCost: 30,
        durationDays: 10,
        status: 'active',
        startDate: start,
        endDate: end,
      })
      const headers = await bearerHeader(buyerUser.id, 'weeeu')
      const res = await app.request(`/api/v1/ads/${ad.id}/cancel`, {
        method: 'POST',
        headers,
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.refunded).toBe(0)
    })
  })

  // ── Rubric 4: cancel non-cancellable states → 409 ─────────────────────────
  describe('Rubric #4 — cancel non-cancellable → 409', () => {
    it('rejected ad → 409', async () => {
      const ad = await createAdRow(buyerUser.id, { status: 'rejected' })
      const headers = await bearerHeader(buyerUser.id, 'weeeu')
      const res = await app.request(`/api/v1/ads/${ad.id}/cancel`, { method: 'POST', headers })
      expect(res.status).toBe(409)
    })

    it('expired ad → 409', async () => {
      const ad = await createAdRow(buyerUser.id, { status: 'expired' })
      const headers = await bearerHeader(buyerUser.id, 'weeeu')
      const res = await app.request(`/api/v1/ads/${ad.id}/cancel`, { method: 'POST', headers })
      expect(res.status).toBe(409)
    })

    it('already cancelled → 409', async () => {
      const ad = await createAdRow(buyerUser.id, { status: 'cancelled', cancelledAt: new Date() })
      const headers = await bearerHeader(buyerUser.id, 'weeeu')
      const res = await app.request(`/api/v1/ads/${ad.id}/cancel`, { method: 'POST', headers })
      expect(res.status).toBe(409)
    })
  })

  // ── Rubric 5: cancel not-owner → 403 ─────────────────────────────────────
  describe('Rubric #5 — cancel not owner → 403', () => {
    it('other user cannot cancel someone else ad', async () => {
      const ad = await createAdRow(buyerUser.id, { status: 'pending' })
      const headers = await bearerHeader(otherUser.id, 'weeeu')
      const res = await app.request(`/api/v1/ads/${ad.id}/cancel`, { method: 'POST', headers })
      expect(res.status).toBe(403)
      // cleanup
      await db.delete(ads).where(eq(ads.id, ad.id))
    })

    it('admin CAN cancel any ad', async () => {
      const ad = await createAdRow(buyerUser.id, { goldCost: 5, status: 'pending' })
      const headers = await bearerHeader(adminUser.id, 'admin')
      const res = await app.request(`/api/v1/ads/${ad.id}/cancel`, { method: 'POST', headers })
      expect(res.status).toBe(200)
    })
  })

  // ── Rubric 6: GET / ?position= filter ─────────────────────────────────────
  describe('Rubric #6 — GET / ?position= list by placement', () => {
    it('filters my ads by position', async () => {
      const [adSidebar, adHome] = await Promise.all([
        createAdRow(buyerUser.id, { position: 'sidebar', status: 'pending' }),
        createAdRow(buyerUser.id, { position: 'home_first_row', status: 'pending' }),
      ])
      const headers = await bearerHeader(buyerUser.id, 'weeeu')
      const res = await app.request('/api/v1/ads?position=sidebar', { headers })
      expect(res.status).toBe(200)
      const body = await res.json()
      const ids = body.items.map((i: { id: string }) => i.id)
      expect(ids).toContain(adSidebar.id)
      expect(ids).not.toContain(adHome.id)
      // cleanup
      await db.delete(ads).where(eq(ads.id, adSidebar.id))
      await db.delete(ads).where(eq(ads.id, adHome.id))
    })

    it('without ?position= returns all my ads', async () => {
      const headers = await bearerHeader(buyerUser.id, 'weeeu')
      const res = await app.request('/api/v1/ads', { headers })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(Array.isArray(body.items)).toBe(true)
    })
  })

  // ── Rubric 7: GET /public (first-row push data) ───────────────────────────
  describe('Rubric #7 — GET /public active ads for display', () => {
    it('returns only active ads within date window', async () => {
      const now = new Date()
      const start = new Date(now.getTime() - 1000)
      const end = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const activeAd = await createAdRow(buyerUser.id, {
        status: 'active',
        position: 'module_first_row',
        startDate: start,
        endDate: end,
      })
      const pendingAd = await createAdRow(buyerUser.id, { status: 'pending' })

      const res = await app.request('/api/v1/ads/public')
      expect(res.status).toBe(200)
      const body = await res.json()
      const ids = body.items.map((i: { id: string }) => i.id)
      expect(ids).toContain(activeAd.id)
      expect(ids).not.toContain(pendingAd.id)

      // cleanup
      await db.delete(ads).where(eq(ads.id, activeAd.id))
      await db.delete(ads).where(eq(ads.id, pendingAd.id))
    })

    it('?position= filter returns only matching position', async () => {
      const now = new Date()
      const start = new Date(now.getTime() - 1000)
      const end = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const [modAd, sideAd] = await Promise.all([
        createAdRow(buyerUser.id, { status: 'active', position: 'module_first_row', startDate: start, endDate: end }),
        createAdRow(buyerUser.id, { status: 'active', position: 'sidebar', startDate: start, endDate: end }),
      ])
      const res = await app.request('/api/v1/ads/public?position=module_first_row')
      const body = await res.json()
      const ids = body.items.map((i: { id: string }) => i.id)
      expect(ids).toContain(modAd.id)
      expect(ids).not.toContain(sideAd.id)
      // cleanup
      await db.delete(ads).where(eq(ads.id, modAd.id))
      await db.delete(ads).where(eq(ads.id, sideAd.id))
    })
  })
})

// ── C12 ad-purchase debit (POST buy) — Point scope: debit Gold + audit + D75 ──
describe('C12 ad-purchase debit (POST /api/v1/ads) — debit + audit (Point)', () => {
  let buyer: { id: string; email: string; role: string }
  let poor: { id: string; email: string; role: string }
  let listingId: string

  beforeAll(async () => {
    buyer = await createTestUser('ads-c12-buydebit@test.app', 'weeer')
    poor = await createTestUser('ads-c12-poor@test.app', 'weeer')
    await seedWallet(buyer.id, 500)
    await seedWallet(poor.id, 5)
    // listing_meta จริง (FK ของ ads.listing_id) — owner = buyer
    const [lm] = await db
      .insert(listingMeta)
      .values({ listingType: 'resell', ownerId: buyer.id, state: 'announced' })
      .returning()
    listingId = lm!.listingId
  })

  afterAll(async () => {
    await db.delete(ads).where(eq(ads.advertiserUserId, buyer.id))
    await db.delete(ads).where(eq(ads.advertiserUserId, poor.id))
    await db.delete(listingMeta).where(eq(listingMeta.listingId, listingId))
  })

  it('debits Gold (D75) + writes single audit ledger row (ref=ad:<adId>, idemp=ad-buy:<adId>)', async () => {
    // sidebar = 3 Gold/วัน × 10 วัน = 30 (D75 Math.round ปัดเต็ม)
    const balanceBefore = await getWalletBalance(buyer.id)
    const headers = await bearerHeader(buyer.id, 'weeer')
    const res = await app.request('/api/v1/ads', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, position: 'sidebar', durationDays: 10 }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.goldCost).toBe(30)
    expect(body.status).toBe('pending')

    // wallet ถูกตัด 30
    expect(await getWalletBalance(buyer.id)).toBe(balanceBefore - 30)

    // audit: ledger row เดียว · ref=ad:<adId> · spend · cash · debit · amount 30
    const rows = await db
      .select()
      .from(pointLedger)
      .where(and(eq(pointLedger.reference, `ad:${body.id}`), eq(pointLedger.userId, buyer.id)))
    expect(rows.length).toBe(1)
    expect(rows[0]!.direction).toBe('debit')
    expect(rows[0]!.pointType).toBe('cash')
    expect(rows[0]!.type).toBe('spend')
    expect(rows[0]!.amount).toBe(30)
    expect(rows[0]!.idempotencyKey).toBe(`ad-buy:${body.id}`)
  })

  it('insufficient Gold → 400, wallet unchanged, ad+ledger rolled back', async () => {
    const balanceBefore = await getWalletBalance(poor.id) // 5 < 30
    const headers = await bearerHeader(poor.id, 'weeer')
    const res = await app.request('/api/v1/ads', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, position: 'sidebar', durationDays: 10 }),
    })
    expect(res.status).toBe(400)
    // wallet ไม่เปลี่ยน
    expect(await getWalletBalance(poor.id)).toBe(balanceBefore)
    // transaction rollback ครบ → ไม่มี ledger row + ไม่มี ad ของ poor
    const ledger = await db.select({ id: pointLedger.id }).from(pointLedger).where(eq(pointLedger.userId, poor.id))
    expect(ledger.length).toBe(0)
    const poorAds = await db.select().from(ads).where(eq(ads.advertiserUserId, poor.id))
    expect(poorAds.length).toBe(0)
  })
})
