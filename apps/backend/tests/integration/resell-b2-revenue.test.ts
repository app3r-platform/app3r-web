/**
 * resell-b2-revenue.test.ts — B2 Platform Revenue fee-leg (STEP 2/2 · Point · HUB Gen89)
 *
 * พิสูจน์ CF1 fee-leak ปิด: ที่ platform_fee_percent=5 → fee ถูก credit เข้า platform-revenue pool จริง
 * (ไม่หายจาก ledger) + conservation ครบ + idempotent (release/split retry ไม่ double-credit fee).
 *
 *   release pct=5 (total=1000): fee=50 · recipient(seller)=net=950 · platform pool +=50
 *     → conservation SUM(wallets buyer+seller+platform)+SUM(locked) คงที่ · re-fire → no double
 *   split   pct=5 (total=1000, sellerShare=600): fee=round(600*5/100)=30 · seller=570 · buyer=400 · platform +=30
 *     → 400+570+30=1000 (conservation) · re-fire → 409 no double
 *
 * self-contained: seed platform-revenue user เอง (onConflictDoNothing · เผื่อ 0047 ยังไม่ apply DEV)
 *   + set platform_fee_percent=5 ก่อน lock (snapshot@confirm-funding) · restore afterAll.
 * Requires: DEV PG (docker app3r_d1_postgres :5433) + migrations 0040-0044.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq, and, inArray, sql } from 'drizzle-orm'
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
import { PLATFORM_REVENUE_USER_ID, PLATFORM_REVENUE_EMAIL } from '../../src/lib/platform-account'

const TS = Date.now()
const PW = 'B2TestPassword123!'
const PCT = 5

async function signup(role: string, tag: string) {
  const res = await app.request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `b2-${tag}-${TS}@app3r.test`, password: PW, role }),
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
const plat = () => gold(PLATFORM_REVENUE_USER_ID)
async function lockedEscrow(listingId: string): Promise<number> {
  const [r] = await db
    .select({ s: sql<number>`COALESCE(SUM(${escrowHolds.totalAmount}), 0)` })
    .from(escrowHolds)
    .where(and(eq(escrowHolds.transactionRef, listingId), eq(escrowHolds.state, 'locked')))
  return Number(r?.s ?? 0)
}
async function state(id: string): Promise<string> {
  const [m] = await db.select({ s: listingMeta.state }).from(listingMeta).where(eq(listingMeta.listingId, id))
  return m!.s
}

let seller: { id: string; token: string }
let buyer: { id: string; token: string }
let admin: { id: string; token: string }
const listingIds: string[] = []
let pctPrev: { value: unknown } | null = null

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
async function driveToInspection(price: number): Promise<string> {
  const id = await driveToBuyerConfirmed(price)
  expect((await authed('POST', `/api/v1/listings/${id}/ship`, seller.token, { deliveryMethod: 'parcel', trackingNo: 'T', shipEvidence: ['f'] })).status).toBe(200)
  expect((await authed('POST', `/api/v1/listings/${id}/deliver`, buyer.token)).status).toBe(200)
  return id
}
async function driveToDisputed(price: number): Promise<{ id: string; disputeId: string }> {
  const id = await driveToInspection(price)
  const dr = await authed('POST', `/api/v1/listings/${id}/dispute`, buyer.token, { disputeType: 'not_as_described', reason: 'mismatch' })
  expect(dr.status).toBe(201)
  const disputeId = ((await dr.json()) as { disputeId: string }).disputeId
  return { id, disputeId }
}

beforeAll(async () => {
  seller = await signup('weeeu', 'seller')
  buyer = await signup('weeeu', 'buyer')
  admin = await signup('admin', 'admin')
  await db
    .insert(wallets)
    .values({ userId: buyer.id, pointType: 'cash', balance: 1_000_000 })
    .onConflictDoUpdate({ target: [wallets.userId, wallets.pointType], set: { balance: 1_000_000 } })
  // seed platform-revenue user (mirror 0047 · self-contained เผื่อ migration ยังไม่ apply DEV)
  await db
    .insert(users)
    .values({ id: PLATFORM_REVENUE_USER_ID, email: PLATFORM_REVENUE_EMAIL, passwordHash: '!SYSTEM_NON_LOGINABLE', role: 'platform' })
    .onConflictDoNothing({ target: users.id })
  await db
    .insert(wallets)
    .values({ userId: PLATFORM_REVENUE_USER_ID, pointType: 'cash', balance: 0 })
    .onConflictDoNothing({ target: [wallets.userId, wallets.pointType] })
  // pct=5 (snapshot@lock) · offer_fee คง 0 (ไม่แตะ → ไม่รบกวน conservation escrow)
  const [cur] = await db.select().from(adminConfig).where(eq(adminConfig.key, 'platform_fee_percent')).limit(1)
  pctPrev = cur ? { value: cur.value } : null
  await db
    .insert(adminConfig)
    .values({ key: 'platform_fee_percent', value: PCT })
    .onConflictDoUpdate({ target: adminConfig.key, set: { value: PCT } })
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
  // restore platform_fee_percent
  if (pctPrev) {
    await db.update(adminConfig).set({ value: pctPrev.value }).where(eq(adminConfig.key, 'platform_fee_percent'))
  } else {
    await db.delete(adminConfig).where(eq(adminConfig.key, 'platform_fee_percent'))
  }
  // clean platform pool entries created by this run (leave the global platform user row · reset pool to 0)
  await db.delete(pointLedger).where(eq(pointLedger.userId, PLATFORM_REVENUE_USER_ID))
  await db.update(wallets).set({ balance: 0 }).where(and(eq(wallets.userId, PLATFORM_REVENUE_USER_ID), eq(wallets.pointType, 'cash')))
  for (const u of [seller?.id, buyer?.id, admin?.id].filter(Boolean) as string[]) {
    await db.delete(pointLedger).where(eq(pointLedger.userId, u))
    await db.delete(wallets).where(eq(wallets.userId, u))
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, u))
  }
  for (const u of [seller?.id, buyer?.id, admin?.id].filter(Boolean) as string[]) {
    await db.delete(users).where(eq(users.id, u))
  }
})

describe('B2 release fee-leg (pct=5 · CF1 close)', () => {
  it('release → platform pool += fee · seller += net · conservation · idempotent', async () => {
    // I (conservation invariant) = SUM(wallets buyer+seller+platform) + locked-escrow(listing)
    const before = (await gold(buyer.id)) + (await gold(seller.id)) + (await plat())
    const id = await driveToInspection(1000)
    const platBefore = await plat()
    const sellerBefore = await gold(seller.id)

    const r1 = await authed('POST', `/api/v1/listings/${id}/inspect-confirm`, buyer.token)
    expect(r1.status).toBe(200)
    expect(await state(id)).toBe('completed')

    // fee = round(1000 * 5/100) = 50 · net = 950
    expect((await plat()) - platBefore).toBe(50) // fee-leg → platform pool (เดิม=หาย → ตอนนี้เข้า pool)
    expect((await gold(seller.id)) - sellerBefore).toBe(950) // recipient NET = total − fee

    const after = (await gold(buyer.id)) + (await gold(seller.id)) + (await plat()) + (await lockedEscrow(id))
    expect(after).toBe(before) // conservation: ไม่มี Gold mint/หาย (fee อยู่ใน pool ครบ)

    // RE-FIRE → completed (terminal) → 409 + platform/seller balance ไม่ double
    const r2 = await authed('POST', `/api/v1/listings/${id}/inspect-confirm`, buyer.token)
    expect(r2.status).toBe(409)
    expect((await plat()) - platBefore).toBe(50)
    expect((await gold(seller.id)) - sellerBefore).toBe(950)

    const holds = await db.select().from(escrowHolds).where(eq(escrowHolds.transactionRef, id))
    expect(holds[0]!.state).toBe('released')
    expect(holds[0]!.platformFeeAmount).toBe(50)
  })
})

describe('B2 split fee-leg (pct=5 · CF1 close)', () => {
  it('split sellerShare=600 → seller 570 · buyer 400 · platform 30 · conservation · re-fire 409 no double', async () => {
    const before = (await gold(buyer.id)) + (await gold(seller.id)) + (await plat())
    const { id, disputeId } = await driveToDisputed(1000)
    const platBefore = await plat()
    const buyerBefore = await gold(buyer.id)
    const sellerBefore = await gold(seller.id)

    const r = await authed('POST', `/api/v1/admin/resell/disputes/${disputeId}/resolve`, admin.token, {
      resolution: 'split',
      sellerShare: 600,
    })
    expect(r.status).toBe(200)

    // fee = round(600 * 5/100) = 30 · sellerCredit = 570 · buyerRefund = 400
    expect((await gold(buyer.id)) - buyerBefore).toBe(400)
    expect((await gold(seller.id)) - sellerBefore).toBe(570)
    expect((await plat()) - platBefore).toBe(30)
    // conservation: 400 + 570 + 30 = 1000 (total)
    expect((await gold(buyer.id)) - buyerBefore + ((await gold(seller.id)) - sellerBefore) + ((await plat()) - platBefore)).toBe(1000)

    const after = (await gold(buyer.id)) + (await gold(seller.id)) + (await plat()) + (await lockedEscrow(id))
    expect(after).toBe(before)

    // RE-FIRE → dispute resolved → 409 + no double
    const r2 = await authed('POST', `/api/v1/admin/resell/disputes/${disputeId}/resolve`, admin.token, {
      resolution: 'split',
      sellerShare: 600,
    })
    expect(r2.status).toBe(409)
    expect((await plat()) - platBefore).toBe(30)

    const holds = await db.select().from(escrowHolds).where(eq(escrowHolds.transactionRef, id))
    expect(holds[0]!.state).toBe('released')
    expect(holds[0]!.platformFeeAmount).toBe(30)
  })
})
