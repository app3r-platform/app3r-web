/**
 * resell-w3b-dispute.test.ts — D2 Resell W3b money-path (DB-backed)
 *
 * ครอบ gate ที่ CMD บังคับ:
 *   - F1 deadlock-resolved e2e: generic /transition disputed→cancelled = 403 → admin-resolve เท่านั้น
 *   - admin-resolve 3-way: seller-win(release) · buyer-win(refund+offer_fee carry#1) · split(splitEscrow conservation)
 *   - splitEscrow conservation: buyerRefund + sellerCredit (+fee=0) = total · re-fire = no double
 *   - 🔴 carry#1 regression (i): seller-cancel-post-confirm → buyer ได้ escrow+offer_fee คืน · conservation
 *   - 🔴 carry#1 regression (ii): faultParty=buyer (buyer-cancel) → offer_fee ยัง FORFEIT
 *
 * Requires: DEV PG (docker app3r_d1_postgres :5433) + migrations 0040-0044 applied.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq, and, inArray } from 'drizzle-orm'
import { app } from '../../src/app'
import { db } from '../../src/db/client'
import {
  users,
  refreshTokens,
  wallets,
  pointLedger,
  escrowHolds,
  listingMeta,
  usedApplianceListings,
  offers,
  resellFulfillment,
  resellDisputes,
  adminConfig,
  adminConfigAudit,
} from '../../src/db/schema'

const TS = Date.now()
const PW = 'W3bTestPassword123!'
const OFFER_FEE = 5

async function signup(role: string, tag: string) {
  const res = await app.request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `w3b-${tag}-${TS}@app3r.test`, password: PW, role }),
  })
  expect(res.status).toBe(201)
  const b = (await res.json()) as { access_token: string; user: { id: string } }
  return { id: b.user.id, token: b.access_token }
}
async function authed(method: string, path: string, token: string, body?: unknown) {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (body) headers['Content-Type'] = 'application/json'
  return app.request(path, { method, headers, body: body ? JSON.stringify(body) : undefined })
}
async function gold(userId: string): Promise<number> {
  const [w] = await db
    .select({ b: wallets.balance })
    .from(wallets)
    .where(and(eq(wallets.userId, userId), eq(wallets.pointType, 'cash')))
  return w?.b ?? 0
}

let seller: { id: string; token: string }
let buyer: { id: string; token: string }
let admin: { id: string; token: string }
let stranger: { id: string; token: string }
const listingIds: string[] = []

async function createListing(price: number): Promise<string> {
  const r = await authed('POST', '/api/v1/listings', seller.token, {
    listingType: 'used_appliance',
    price,
    deliveryMethods: ['parcel'],
    status: 'announced',
  })
  expect(r.status).toBe(201)
  const id = ((await r.json()) as { id: string }).id
  listingIds.push(id)
  return id
}
async function driveToBuyerConfirmed(price: number): Promise<string> {
  const id = await createListing(price)
  const of = await authed('POST', `/api/v1/listings/${id}/offers`, buyer.token, { offerPrice: price, deliveryMethod: 'parcel' })
  expect(of.status).toBe(201)
  const offerId = ((await of.json()) as { id: string }).id
  expect((await authed('POST', `/api/v1/listings/${id}/select-offer`, seller.token, { offerId })).status).toBe(200)
  expect((await authed('POST', `/api/v1/listings/${id}/confirm-funding`, buyer.token)).status).toBe(200)
  return id
}
async function driveToDisputed(price: number): Promise<{ id: string; disputeId: string }> {
  const id = await driveToBuyerConfirmed(price)
  expect((await authed('POST', `/api/v1/listings/${id}/ship`, seller.token, { deliveryMethod: 'parcel', trackingNo: 'T', shipEvidence: ['f'] })).status).toBe(200)
  expect((await authed('POST', `/api/v1/listings/${id}/deliver`, buyer.token)).status).toBe(200)
  const dr = await authed('POST', `/api/v1/listings/${id}/dispute`, buyer.token, { disputeType: 'not_as_described', reason: 'mismatch' })
  expect(dr.status).toBe(201)
  const disputeId = ((await dr.json()) as { disputeId: string }).disputeId
  return { id, disputeId }
}

beforeAll(async () => {
  seller = await signup('weeeu', 'seller')
  buyer = await signup('weeeu', 'buyer')
  admin = await signup('admin', 'admin')
  stranger = await signup('weeeu', 'stranger')
  await db
    .insert(wallets)
    .values({ userId: buyer.id, pointType: 'cash', balance: 1_000_000 })
    .onConflictDoUpdate({ target: [wallets.userId, wallets.pointType], set: { balance: 1_000_000 } })
  await db
    .insert(adminConfig)
    .values({ key: 'offer_fee', value: OFFER_FEE })
    .onConflictDoUpdate({ target: adminConfig.key, set: { value: OFFER_FEE } })
})

afterAll(async () => {
  if (listingIds.length) {
    await db.delete(resellDisputes).where(inArray(resellDisputes.listingId, listingIds))
    await db.delete(escrowHolds).where(inArray(escrowHolds.transactionRef, listingIds))
    await db.delete(resellFulfillment).where(inArray(resellFulfillment.listingId, listingIds))
    await db.delete(offers).where(inArray(offers.listingMetaId, listingIds))
    await db.delete(usedApplianceListings).where(inArray(usedApplianceListings.listingMetaId, listingIds))
    await db.delete(listingMeta).where(inArray(listingMeta.listingId, listingIds))
    await db.delete(adminConfigAudit).where(
      inArray(
        adminConfigAudit.configKey,
        listingIds.map((id) => `listing_state:${id}`),
      ),
    )
  }
  for (const u of [seller?.id, buyer?.id, admin?.id, stranger?.id].filter(Boolean) as string[]) {
    await db.delete(pointLedger).where(eq(pointLedger.userId, u))
    await db.delete(wallets).where(eq(wallets.userId, u))
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, u))
  }
  await db.delete(adminConfig).where(eq(adminConfig.key, 'offer_fee'))
  for (const u of [seller?.id, buyer?.id, admin?.id, stranger?.id].filter(Boolean) as string[]) {
    await db.delete(users).where(eq(users.id, u))
  }
})

describe('W3b F1 deadlock-resolved + buyer-win (refund + carry#1 offer_fee)', () => {
  it('generic /transition disputed→cancelled = 403 (S1 block) → admin-resolve buyer-win = refund+offer_fee', async () => {
    const { id, disputeId } = await driveToDisputed(1000)

    // F1 deadlock proof: generic /transition (even by admin) blocked → must use admin-resolve
    const t = await authed('POST', `/api/v1/listings/${id}/transition`, admin.token, { to: 'cancelled' })
    expect(t.status).toBe(403)

    const buyerBefore = await gold(buyer.id)
    const r = await authed('POST', `/api/v1/admin/resell/disputes/${disputeId}/resolve`, admin.token, { resolution: 'buyer' })
    expect(r.status).toBe(200)
    // buyer-win → escrow full (1000) + offer_fee (5) refund (carry#1 · faultParty=seller)
    expect((await gold(buyer.id)) - buyerBefore).toBe(1000 + OFFER_FEE)

    const holds = await db.select().from(escrowHolds).where(eq(escrowHolds.transactionRef, id))
    expect(holds[0]!.state).toBe('refunded')
    const [d] = await db.select().from(resellDisputes).where(eq(resellDisputes.id, disputeId))
    expect(d!.status).toBe('resolved')
    expect(d!.resolution).toBe('buyer')
  })
})

describe('W3b admin-resolve seller-win (release)', () => {
  it('seller-win → release escrow net to seller (fee=0)', async () => {
    const { id, disputeId } = await driveToDisputed(800)
    const sellerBefore = await gold(seller.id)
    const r = await authed('POST', `/api/v1/admin/resell/disputes/${disputeId}/resolve`, admin.token, { resolution: 'seller' })
    expect(r.status).toBe(200)
    expect((await gold(seller.id)) - sellerBefore).toBe(800) // net (pct=0 → fee=0)
    const holds = await db.select().from(escrowHolds).where(eq(escrowHolds.transactionRef, id))
    expect(holds[0]!.state).toBe('released')
  })
})

describe('W3b admin-resolve split (splitEscrow conservation + idempotency)', () => {
  it('split sellerShare=600/total=1000 → buyer+400 seller+600 (conservation) · re-fire → 409 no double', async () => {
    const { id, disputeId } = await driveToDisputed(1000)
    const buyerBefore = await gold(buyer.id)
    const sellerBefore = await gold(seller.id)

    const r = await authed('POST', `/api/v1/admin/resell/disputes/${disputeId}/resolve`, admin.token, {
      resolution: 'split',
      sellerShare: 600,
    })
    expect(r.status).toBe(200)
    const buyerDelta = (await gold(buyer.id)) - buyerBefore
    const sellerDelta = (await gold(seller.id)) - sellerBefore
    expect(buyerDelta).toBe(400) // total − sellerShare
    expect(sellerDelta).toBe(600) // sellerShare − fee(0)
    expect(buyerDelta + sellerDelta).toBe(1000) // conservation (fee=0)

    const holds = await db.select().from(escrowHolds).where(eq(escrowHolds.transactionRef, id))
    expect(holds[0]!.state).toBe('released')

    // RE-FIRE → dispute already resolved → 409 + no double-move
    const r2 = await authed('POST', `/api/v1/admin/resell/disputes/${disputeId}/resolve`, admin.token, {
      resolution: 'split',
      sellerShare: 600,
    })
    expect(r2.status).toBe(409)
    expect((await gold(buyer.id)) - buyerBefore).toBe(400)
    expect((await gold(seller.id)) - sellerBefore).toBe(600)
  })
})

describe('W3b carry#1 regression', () => {
  it('(i) seller-cancel-post-confirm → buyer ได้ escrow + offer_fee คืน (faultParty=seller · conservation)', async () => {
    const buyerStart = await gold(buyer.id)
    const id = await driveToBuyerConfirmed(700)
    // buyer จ่าย offer_fee(5) + lock(700) ไปแล้ว
    expect(buyerStart - (await gold(buyer.id))).toBe(700 + OFFER_FEE)
    // seller cancel (owner · faultParty=seller) → refundEscrow + offer_fee refund (carry#1)
    const c = await authed('POST', `/api/v1/listings/${id}/cancel`, seller.token)
    expect(c.status).toBe(200)
    expect(((await c.json()) as { faultParty: string }).faultParty).toBe('seller')
    // buyer คืนสุทธิ = escrow(700) + offer_fee(5) → กลับเท่าเดิม (conservation)
    expect(await gold(buyer.id)).toBe(buyerStart)
  })

  it('(ii) buyer-cancel (faultParty=buyer) → escrow คืน แต่ offer_fee ยัง FORFEIT', async () => {
    const buyerStart = await gold(buyer.id)
    const id = await driveToBuyerConfirmed(700)
    // buyer cancel เอง (pre-ship withdraw · faultParty=buyer)
    const c = await authed('POST', `/api/v1/listings/${id}/cancel`, buyer.token)
    expect(c.status).toBe(200)
    expect(((await c.json()) as { faultParty: string }).faultParty).toBe('buyer')
    // escrow(700) คืน แต่ offer_fee(5) FORFEIT → net loss = offer_fee
    expect(await gold(buyer.id)).toBe(buyerStart - OFFER_FEE)
  })
})

describe('W3b dispute raise authz', () => {
  it('non-party (stranger) → 403', async () => {
    const id = await driveToBuyerConfirmed(300)
    await authed('POST', `/api/v1/listings/${id}/ship`, seller.token, { deliveryMethod: 'parcel', trackingNo: 'T', shipEvidence: ['f'] })
    const r = await authed('POST', `/api/v1/listings/${id}/dispute`, stranger.token, { disputeType: 'damaged', reason: 'x' })
    expect(r.status).toBe(403)
  })
})
