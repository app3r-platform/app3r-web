/**
 * resell-w3c-jobs.test.ts — D2 Resell W3c (DB-backed)
 *
 * ครอบ gate ที่ CMD บังคับ:
 *   - cron R4 funding-timeout: offer_selected expired → revert receiving_offers · offer_fee FORFEIT (faultParty=buyer)
 *   - cron R7 inspection-deadline: inspection_period expired → auto-complete (releaseEscrow) · faultParty=none
 *   - not_shipped manual: dispute จาก buyer_confirmed → admin buyer-win → refund + offer_fee (carry#1)
 *   - no-ship auto-SLA: buyer_confirmed เกิน window → auto-dispute(not_shipped)
 *   - reject-offer (re-point canonical): seller reject pending offer → offer_fee refund
 *   - W3a/b regression (escrow idempotency · F1) — รันรวมไฟล์อื่น
 *
 * cron funcs รับ `now` (server-time injected · GAP-3 testable). Requires DEV PG :5433 + 0040-0044.
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
import {
  revertExpiredFundingWindows,
  autoCompleteExpiredInspections,
  autoDisputeNoShip,
} from '../../src/lib/resell-funding'

const TS = Date.now()
const PW = 'W3cTestPassword123!'
const OFFER_FEE = 5
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

async function signup(role: string, tag: string) {
  const res = await app.request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `w3c-${tag}-${TS}@app3r.test`, password: PW, role }),
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
async function state(id: string): Promise<string> {
  const [m] = await db.select({ s: listingMeta.state }).from(listingMeta).where(eq(listingMeta.listingId, id))
  return m!.s
}

let seller: { id: string; token: string }
let buyer: { id: string; token: string }
let admin: { id: string; token: string }
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
async function makeOffer(id: string, price: number): Promise<string> {
  const of = await authed('POST', `/api/v1/listings/${id}/offers`, buyer.token, { offerPrice: price, deliveryMethod: 'parcel' })
  expect(of.status).toBe(201)
  return ((await of.json()) as { id: string }).id
}
async function driveToOfferSelected(price: number): Promise<{ id: string; offerId: string }> {
  const id = await createListing(price)
  const offerId = await makeOffer(id, price)
  expect((await authed('POST', `/api/v1/listings/${id}/select-offer`, seller.token, { offerId })).status).toBe(200)
  return { id, offerId }
}
async function driveToBuyerConfirmed(price: number): Promise<string> {
  const { id } = await driveToOfferSelected(price)
  expect((await authed('POST', `/api/v1/listings/${id}/confirm-funding`, buyer.token)).status).toBe(200)
  return id
}
async function driveToInspection(price: number): Promise<string> {
  const id = await driveToBuyerConfirmed(price)
  expect((await authed('POST', `/api/v1/listings/${id}/ship`, seller.token, { deliveryMethod: 'parcel', trackingNo: 'T', shipEvidence: ['f'] })).status).toBe(200)
  expect((await authed('POST', `/api/v1/listings/${id}/deliver`, buyer.token)).status).toBe(200)
  return id
}

beforeAll(async () => {
  seller = await signup('weeeu', 'seller')
  buyer = await signup('weeeu', 'buyer')
  admin = await signup('admin', 'admin')
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
  for (const u of [seller?.id, buyer?.id, admin?.id].filter(Boolean) as string[]) {
    await db.delete(pointLedger).where(eq(pointLedger.userId, u))
    await db.delete(wallets).where(eq(wallets.userId, u))
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, u))
  }
  await db.delete(adminConfig).where(eq(adminConfig.key, 'offer_fee'))
  for (const u of [seller?.id, buyer?.id, admin?.id].filter(Boolean) as string[]) {
    await db.delete(users).where(eq(users.id, u))
  }
})

describe('W3c cron R4 funding-timeout', () => {
  it('offer_selected expired → revert receiving_offers · offer_fee FORFEIT (faultParty=buyer · no escrow)', async () => {
    const buyerStart = await gold(buyer.id)
    const { id, offerId } = await driveToOfferSelected(400)
    expect(buyerStart - (await gold(buyer.id))).toBe(OFFER_FEE) // offer_fee charged · ยังไม่ lock escrow

    // funding_deadline = select +24h → ยิง cron ที่ +25h (server-time)
    const res = await revertExpiredFundingWindows(new Date(Date.now() + 25 * HOUR))
    expect(res.reverted).toContain(offerId)
    expect(await state(id)).toBe('receiving_offers') // re-open รับ offer ใหม่
    const [o] = await db.select({ s: offers.status }).from(offers).where(eq(offers.id, offerId))
    expect(o!.s).toBe('rejected')
    // FORFEIT: offer_fee ไม่คืน (faultParty=buyer) → buyer ยังเสีย offer_fee
    expect(await gold(buyer.id)).toBe(buyerStart - OFFER_FEE)

    // re-fire idempotent: ยิงซ้ำ → ไม่ re-process (listing=receiving_offers · offer rejected · no double)
    const res2 = await revertExpiredFundingWindows(new Date(Date.now() + 25 * HOUR))
    expect(res2.reverted).not.toContain(offerId)
    expect(await state(id)).toBe('receiving_offers')
    expect(await gold(buyer.id)).toBe(buyerStart - OFFER_FEE)
  })
})

describe('W3c cron R7 inspection auto-complete', () => {
  it('inspection_period expired → auto-complete → releaseEscrow seller (faultParty=none)', async () => {
    const id = await driveToInspection(900)
    const sellerBefore = await gold(seller.id)
    // inspectionDeadline = deliver +72h → ยิง cron ที่ +73h
    const res = await autoCompleteExpiredInspections(new Date(Date.now() + 73 * HOUR))
    expect(res.completed).toContain(id)
    expect(await state(id)).toBe('completed')
    expect((await gold(seller.id)) - sellerBefore).toBe(900) // net (fee=0)
    const holds = await db.select().from(escrowHolds).where(eq(escrowHolds.transactionRef, id))
    expect(holds[0]!.state).toBe('released')

    // re-fire idempotent: ยิงซ้ำ → ไม่ re-process (listing=completed · hold released · no double-release)
    const res2 = await autoCompleteExpiredInspections(new Date(Date.now() + 73 * HOUR))
    expect(res2.completed).not.toContain(id)
    expect((await gold(seller.id)) - sellerBefore).toBe(900)
  })
})

describe('W3c not_shipped manual dispute', () => {
  it('buyer dispute(not_shipped) from buyer_confirmed → admin buyer-win → refund + offer_fee (carry#1)', async () => {
    const id = await driveToBuyerConfirmed(700)
    const dr = await authed('POST', `/api/v1/listings/${id}/dispute`, buyer.token, { disputeType: 'not_shipped', reason: 'no ship' })
    expect(dr.status).toBe(201)
    const disputeId = ((await dr.json()) as { disputeId: string }).disputeId
    expect(await state(id)).toBe('disputed')

    const buyerBefore = await gold(buyer.id)
    const rr = await authed('POST', `/api/v1/admin/resell/disputes/${disputeId}/resolve`, admin.token, { resolution: 'buyer' })
    expect(rr.status).toBe(200)
    expect((await gold(buyer.id)) - buyerBefore).toBe(700 + OFFER_FEE) // escrow + offer_fee
  })

  it('non-not_shipped dispute from buyer_confirmed → 400 (เคสคุณภาพต้องหลังส่ง)', async () => {
    const id = await driveToBuyerConfirmed(500)
    const dr = await authed('POST', `/api/v1/listings/${id}/dispute`, buyer.token, { disputeType: 'not_as_described', reason: 'x' })
    expect(dr.status).toBe(400)
  })
})

describe('W3c no-ship auto-SLA', () => {
  it('buyer_confirmed เกิน 7d → auto-dispute(not_shipped) raisedBy=buyer → disputed', async () => {
    const id = await driveToBuyerConfirmed(600)
    // SLA 7d (นับจาก lock@buyer_confirmed = escrow createdAt) → ยิง cron ที่ +8d
    const res = await autoDisputeNoShip(new Date(Date.now() + 8 * DAY))
    expect(res.disputed).toContain(id)
    expect(await state(id)).toBe('disputed')
    const [d] = await db.select().from(resellDisputes).where(and(eq(resellDisputes.listingId, id), eq(resellDisputes.status, 'open')))
    expect(d!.disputeType).toBe('not_shipped')
    expect(d!.raisedByUserId).toBe(buyer.id)
  })
})

describe('W3c reject-offer (re-point canonical)', () => {
  it('seller reject pending offer → rejected + offer_fee refund', async () => {
    const id = await createListing(300)
    const offerId = await makeOffer(id, 300) // receiving_offers · offer_fee charged
    const beforeReject = await gold(buyer.id)
    const r = await authed('POST', `/api/v1/listings/${id}/offers/${offerId}/reject`, seller.token)
    expect(r.status).toBe(200)
    expect((await gold(buyer.id)) - beforeReject).toBe(OFFER_FEE) // offer_fee refund (seller reject · faultParty≠buyer)
    const [o] = await db.select({ s: offers.status }).from(offers).where(eq(offers.id, offerId))
    expect(o!.s).toBe('rejected')
  })
})
