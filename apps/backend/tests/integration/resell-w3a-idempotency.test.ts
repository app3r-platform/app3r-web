/**
 * resell-w3a-idempotency.test.ts — D2 Resell W3a money-path idempotency (DB-backed)
 *
 * ตรวจหัวใจ W3a: release / refund / F3 ยิงซ้ำ = NO double-move (verify-before-claim · money code)
 *   - release: inspect-confirm → completed (credit seller net) · re-fire → 409 + balance คงเดิม + hold='released'
 *   - refund : cancel จาก buyer_confirmed → refund buyer เต็ม · re-fire → 409 + balance คงเดิม + hold='refunded'
 *   - F3     : cancel จาก receiving_offers → คืน offer_fee (faultParty=seller) · re-fire → 409 + คงเดิม
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
  adminConfig,
  adminConfigAudit,
} from '../../src/db/schema'

const TS = Date.now()
const PW = 'W3aTestPassword123!'

async function signup(role: string, tag: string) {
  const res = await app.request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `w3a-${tag}-${TS}@app3r.test`, password: PW, role }),
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

async function createListing(token: string, price: number): Promise<string> {
  const r = await authed('POST', '/api/v1/listings', token, {
    listingType: 'used_appliance',
    price,
    deliveryMethods: ['parcel'],
    status: 'announced',
  })
  expect(r.status).toBe(201)
  const b = (await r.json()) as { id: string }
  listingIds.push(b.id)
  return b.id
}

async function makeOffer(token: string, listingId: string, price: number): Promise<string> {
  const r = await authed('POST', `/api/v1/listings/${listingId}/offers`, token, {
    offerPrice: price,
    deliveryMethod: 'parcel',
  })
  expect(r.status).toBe(201)
  return ((await r.json()) as { id: string }).id
}

let seller: { id: string; token: string }
let buyer: { id: string; token: string }
const listingIds: string[] = []
let offerFeePrev: { value: unknown } | null = null

beforeAll(async () => {
  seller = await signup('weeeu', 'seller')
  buyer = await signup('weeeu', 'buyer')
  // seed buyer Gold (lock + offer_fee ต้องมีเงินพอ)
  await db
    .insert(wallets)
    .values({ userId: buyer.id, pointType: 'cash', balance: 1_000_000 })
    .onConflictDoUpdate({ target: [wallets.userId, wallets.pointType], set: { balance: 1_000_000 } })
  // snapshot + seed offer_fee=5 (สำหรับ F3 — ต้อง >0 ถึงจะมี fee ให้คืน)
  const [cur] = await db.select().from(adminConfig).where(eq(adminConfig.key, 'offer_fee')).limit(1)
  offerFeePrev = cur ? { value: cur.value } : null
  await db
    .insert(adminConfig)
    .values({ key: 'offer_fee', value: 5 })
    .onConflictDoUpdate({ target: adminConfig.key, set: { value: 5 } })
})

afterAll(async () => {
  if (listingIds.length) {
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
  for (const u of [seller?.id, buyer?.id].filter(Boolean) as string[]) {
    await db.delete(pointLedger).where(eq(pointLedger.userId, u))
    await db.delete(wallets).where(eq(wallets.userId, u))
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, u))
  }
  // restore offer_fee config
  if (offerFeePrev) {
    await db.update(adminConfig).set({ value: offerFeePrev.value }).where(eq(adminConfig.key, 'offer_fee'))
  } else {
    await db.delete(adminConfig).where(eq(adminConfig.key, 'offer_fee'))
  }
  for (const u of [seller?.id, buyer?.id].filter(Boolean) as string[]) {
    await db.delete(users).where(eq(users.id, u))
  }
})

describe('W3a mount + auth gate (no DB write)', () => {
  const FAKE = '00000000-0000-0000-0000-000000000000'
  it('guarded endpoints → 401 without token (mount ok · auth gate)', async () => {
    for (const ep of ['ship', 'deliver', 'inspect-confirm', 'cancel']) {
      const r = await app.request(`/api/v1/listings/${FAKE}/${ep}`, { method: 'POST' })
      expect(r.status).toBe(401)
    }
  })
})

describe('W3a RELEASE idempotency', () => {
  it('inspect-confirm re-fire → 409 + no double-release (seller credited once)', async () => {
    const id = await createListing(seller.token, 1000)
    const offerId = await makeOffer(buyer.token, id, 1000)
    expect((await authed('POST', `/api/v1/listings/${id}/select-offer`, seller.token, { offerId })).status).toBe(200)
    expect((await authed('POST', `/api/v1/listings/${id}/confirm-funding`, buyer.token)).status).toBe(200)
    expect(
      (
        await authed('POST', `/api/v1/listings/${id}/ship`, seller.token, {
          deliveryMethod: 'parcel',
          carrier: 'TH-EXPRESS',
          trackingNo: 'TRK-1',
          shipEvidence: ['file-1'],
        })
      ).status,
    ).toBe(200)
    expect((await authed('POST', `/api/v1/listings/${id}/deliver`, buyer.token)).status).toBe(200)

    const before = await gold(seller.id)
    const r1 = await authed('POST', `/api/v1/listings/${id}/inspect-confirm`, buyer.token)
    expect(r1.status).toBe(200)
    const after = await gold(seller.id)
    expect(after - before).toBe(1000) // released net (A1 pct=0 → fee=0)

    // RE-FIRE → state=completed → 409 + balance unchanged
    const r2 = await authed('POST', `/api/v1/listings/${id}/inspect-confirm`, buyer.token)
    expect(r2.status).toBe(409)
    expect(await gold(seller.id)).toBe(after)

    const holds = await db.select().from(escrowHolds).where(eq(escrowHolds.transactionRef, id))
    expect(holds.length).toBe(1)
    expect(holds[0]!.state).toBe('released')
  })
})

describe('W3a REFUND idempotency', () => {
  it('cancel from buyer_confirmed re-fire → 409 + no double-refund (buyer refunded once)', async () => {
    const id = await createListing(seller.token, 500)
    const offerId = await makeOffer(buyer.token, id, 500)
    expect((await authed('POST', `/api/v1/listings/${id}/select-offer`, seller.token, { offerId })).status).toBe(200)
    expect((await authed('POST', `/api/v1/listings/${id}/confirm-funding`, buyer.token)).status).toBe(200)

    const locked = await gold(buyer.id)
    const c1 = await authed('POST', `/api/v1/listings/${id}/cancel`, buyer.token)
    expect(c1.status).toBe(200)
    const refunded = await gold(buyer.id)
    expect(refunded - locked).toBe(500) // full escrow refund

    // RE-FIRE → terminal cancelled → 409 + balance unchanged
    const c2 = await authed('POST', `/api/v1/listings/${id}/cancel`, buyer.token)
    expect(c2.status).toBe(409)
    expect(await gold(buyer.id)).toBe(refunded)

    const holds = await db.select().from(escrowHolds).where(eq(escrowHolds.transactionRef, id))
    expect(holds[0]!.state).toBe('refunded')
  })
})

describe('W3a F3 offer_fee bulk-refund idempotency', () => {
  it('cancel from receiving_offers refunds offer_fee (faultParty=seller); re-fire → no double', async () => {
    const id = await createListing(seller.token, 300)
    const beforeOffer = await gold(buyer.id)
    await makeOffer(buyer.token, id, 300)
    const afterOffer = await gold(buyer.id)
    expect(beforeOffer - afterOffer).toBe(5) // offer_fee charged (config=5)

    const c1 = await authed('POST', `/api/v1/listings/${id}/cancel`, seller.token)
    expect(c1.status).toBe(200)
    const body1 = (await c1.json()) as { faultParty: string }
    expect(body1.faultParty).toBe('seller')
    const afterRefund = await gold(buyer.id)
    expect(afterRefund - afterOffer).toBe(5) // offer_fee refunded (F3 · faultParty≠buyer)

    // RE-FIRE → terminal cancelled → 409 + no double-refund
    const c2 = await authed('POST', `/api/v1/listings/${id}/cancel`, seller.token)
    expect(c2.status).toBe(409)
    expect(await gold(buyer.id)).toBe(afterRefund)
  })
})
