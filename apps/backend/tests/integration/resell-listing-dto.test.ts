/**
 * resell-listing-dto.test.ts — HUB Gen85 (cutover step-4 BLOCKER fix · DB-backed)
 *
 *   A/B: GET /api/v1/listings/{id} = full toListingDto (price/status/deliveryMethods/id present)
 *        — กัน latent shape-bug (3 detail page price.toLocaleString white-screen)
 *   C  : warranty (nested) + expiresAt round-trip (POST → GET คืนครบ · no-migration · column มีอยู่)
 *
 * Requires DEV PG :5433. ❌ no migration.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { app } from '../../src/app'
import { db } from '../../src/db/client'
import { users, refreshTokens, listingMeta, usedApplianceListings } from '../../src/db/schema'

const TS = Date.now()
let seller: { id: string; token: string }
const listingIds: string[] = []

async function signup(tag: string) {
  const res = await app.request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `dto-${tag}-${TS}@app3r.test`, password: 'DtoTestPassword123!', role: 'weeeu' }),
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
})
afterAll(async () => {
  if (listingIds.length) {
    await db.delete(usedApplianceListings).where(inArray(usedApplianceListings.listingMetaId, listingIds))
    await db.delete(listingMeta).where(inArray(listingMeta.listingId, listingIds))
  }
  if (seller?.id) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, seller.id))
    await db.delete(users).where(eq(users.id, seller.id))
  }
})

describe('A/B — GET /{id} full toListingDto shape', () => {
  it('GET /listings/{id} → id, price (number), status, deliveryMethods present (ไม่ใช่ hand-build bare)', async () => {
    const cr = await authed('POST', '/api/v1/listings', seller.token, {
      listingType: 'used_appliance',
      price: 4500,
      deliveryMethods: ['parcel', 'on_site'],
      status: 'announced',
    })
    expect(cr.status).toBe(201)
    const id = ((await cr.json()) as { id: string }).id
    listingIds.push(id)

    const r = await app.request(`/api/v1/listings/${id}`) // public (no auth)
    expect(r.status).toBe(200)
    const dto = (await r.json()) as Record<string, unknown>
    // shape ที่ 3 detail page ต้องใช้ (กัน white-screen)
    expect(dto.id).toBe(id)
    expect(dto.price).toBe(4500)
    expect(typeof dto.price).toBe('number')
    expect(dto.status).toBe('announced')
    expect(dto.deliveryMethods).toEqual(['parcel', 'on_site'])
    expect(dto.listingType).toBe('used_appliance') // toListingDto = used.listingType (domain · ตรง /mine,/browse)
    // counters ยังมา (toListingDto)
    expect(dto).toHaveProperty('viewCount')
    expect(dto).toHaveProperty('offerCount')
  })
})

describe('C — warranty (nested) + expiresAt round-trip', () => {
  it('POST nested warranty + expiresAt → GET คืนครบ (no silent data-loss)', async () => {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const cr = await authed('POST', '/api/v1/listings', seller.token, {
      listingType: 'used_appliance',
      price: 8000,
      deliveryMethods: ['parcel'],
      warranty: { sourceWarranty: 12, additionalWarranty: 6 },
      expiresAt,
      status: 'announced',
    })
    expect(cr.status).toBe(201)
    const id = ((await cr.json()) as { id: string }).id
    listingIds.push(id)

    const r = await app.request(`/api/v1/listings/${id}`)
    expect(r.status).toBe(200)
    const dto = (await r.json()) as { warranty: { sourceWarranty: number; additionalWarranty: number } | null; expiresAt: string | null }
    expect(dto.warranty).toEqual({ sourceWarranty: 12, additionalWarranty: 6 }) // ไม่ null (เดิม silent-strip)
    expect(dto.expiresAt).toBeTruthy()
    expect(new Date(dto.expiresAt!).getTime()).toBe(new Date(expiresAt).getTime())
  })
})
