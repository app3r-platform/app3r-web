/**
 * resell-purchases.test.ts — HUB Gen86 Task 3 (transactionsList buyer-view)
 *
 * /listings/mine is seller-only (listingMeta.ownerId). New /listings/purchases gives buyers a
 * view of transactions where they are the SELECTED buyer.
 *   buyer  → sees only the listing they won (selected offer)
 *   other  → empty (not a party)
 *   seller → empty on /purchases (not a buyer) · still sees it on /mine (no regression)
 *
 * Requires DEV PG :5433. Fees default 0 (no admin_config) → no Gold/escrow needed pre-funding.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { app } from '../../src/app'
import { db } from '../../src/db/client'
import { users, refreshTokens, listingMeta, usedApplianceListings, offers } from '../../src/db/schema'

const TS = Date.now()
let seller: { id: string; token: string }
let buyer: { id: string; token: string }
let other: { id: string; token: string }
let listingId: string

async function signup(tag: string, role = 'weeeu') {
  const res = await app.request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `purch-${tag}-${TS}@app3r.test`, password: 'PurchTestPassword123!', role }),
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

beforeAll(async () => {
  seller = await signup('seller')
  buyer = await signup('buyer')
  other = await signup('other')

  // seller publishes a resell listing
  const cr = await authed('POST', '/api/v1/listings', seller.token, {
    listingType: 'used_appliance',
    price: 5000,
    deliveryMethods: ['parcel'],
    status: 'announced',
  })
  expect(cr.status).toBe(201)
  listingId = ((await cr.json()) as { id: string }).id

  // buyer makes an offer → listing announced → receiving_offers
  const off = await authed('POST', `/api/v1/listings/${listingId}/offers`, buyer.token, {
    offerPrice: 4800,
    deliveryMethod: 'parcel',
  })
  expect(off.status).toBe(201)
  const offerId = ((await off.json()) as { id: string }).id

  // seller selects the buyer's offer → offer.status = selected (buyer is now the transacting party)
  const sel = await authed('POST', `/api/v1/listings/${listingId}/select-offer`, seller.token, { offerId })
  expect(sel.status).toBe(200)
})

afterAll(async () => {
  if (listingId) {
    await db.delete(offers).where(eq(offers.listingMetaId, listingId))
    await db.delete(usedApplianceListings).where(inArray(usedApplianceListings.listingMetaId, [listingId]))
    await db.delete(listingMeta).where(eq(listingMeta.listingId, listingId))
  }
  for (const u of [seller, buyer, other]) {
    if (u?.id) {
      await db.delete(refreshTokens).where(eq(refreshTokens.userId, u.id))
      await db.delete(users).where(eq(users.id, u.id))
    }
  }
})

describe('GET /listings/purchases — buyer-view (HUB Gen86)', () => {
  it('buyer → sees the won listing (selected offer)', async () => {
    const r = await authed('GET', '/api/v1/listings/purchases', buyer.token)
    expect(r.status).toBe(200)
    const rows = (await r.json()) as { id: string; status: string }[]
    expect(Array.isArray(rows)).toBe(true)
    const ids = rows.map((x) => x.id)
    expect(ids).toContain(listingId)
  })

  it('other user → does NOT see it (not a party)', async () => {
    const r = await authed('GET', '/api/v1/listings/purchases', other.token)
    expect(r.status).toBe(200)
    const rows = (await r.json()) as { id: string }[]
    expect(rows.map((x) => x.id)).not.toContain(listingId)
  })

  it('seller → empty on /purchases (not a buyer) but still on /mine (no regression)', async () => {
    const p = await authed('GET', '/api/v1/listings/purchases', seller.token)
    expect(p.status).toBe(200)
    const purchases = (await p.json()) as { id: string }[]
    expect(purchases.map((x) => x.id)).not.toContain(listingId)

    const m = await authed('GET', '/api/v1/listings/mine', seller.token)
    expect(m.status).toBe(200)
    const mine = (await m.json()) as { id: string }[]
    expect(mine.map((x) => x.id)).toContain(listingId)
  })

  it('unauthenticated → 401', async () => {
    const r = await app.request('/api/v1/listings/purchases')
    expect(r.status).toBe(401)
  })
})
