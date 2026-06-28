/**
 * resell-appliance-name.test.ts — HUB Gen86 Task 2 (applianceName emit)
 *
 * toListingDto now emits `applianceName` (denormalized appliance_models.name · FE display).
 * appliance_id has no FK (appliance module pending) → read paths leftJoin appliance_models.
 *   GET /{id} + /browse → applianceName present (ไม่ null เมื่อมี appliance) · null-safe เมื่อไม่มี.
 *
 * Requires DEV PG :5433.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { app } from '../../src/app'
import { db } from '../../src/db/client'
import {
  users,
  refreshTokens,
  listingMeta,
  usedApplianceListings,
  repairApplianceCategories,
  applianceBrands,
  applianceModels,
} from '../../src/db/schema'

const TS = Date.now()
let seller: { id: string; token: string }
const listingIds: string[] = []
let categoryId: string
let brandId: string
let modelId: string
const MODEL_NAME = `แอร์ Daikin Inverter ${TS}`

async function signup(tag: string) {
  const res = await app.request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `appl-${tag}-${TS}@app3r.test`, password: 'ApplTestPassword123!', role: 'weeeu' }),
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
  // appliance master chain: category → brand → model (model.name = applianceName)
  const [cat] = await db
    .insert(repairApplianceCategories)
    .values({ code: `appl-cat-${TS}`, labelTh: 'เครื่องปรับอากาศ' })
    .returning({ id: repairApplianceCategories.id })
  categoryId = cat!.id
  const [brand] = await db
    .insert(applianceBrands)
    .values({ categoryId, name: `Daikin-${TS}` })
    .returning({ id: applianceBrands.id })
  brandId = brand!.id
  const [model] = await db
    .insert(applianceModels)
    .values({ brandId, name: MODEL_NAME })
    .returning({ id: applianceModels.id })
  modelId = model!.id
})
afterAll(async () => {
  if (listingIds.length) {
    await db.delete(usedApplianceListings).where(inArray(usedApplianceListings.listingMetaId, listingIds))
    await db.delete(listingMeta).where(inArray(listingMeta.listingId, listingIds))
  }
  if (modelId) await db.delete(applianceModels).where(eq(applianceModels.id, modelId))
  if (brandId) await db.delete(applianceBrands).where(eq(applianceBrands.id, brandId))
  if (categoryId) await db.delete(repairApplianceCategories).where(eq(repairApplianceCategories.id, categoryId))
  if (seller?.id) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, seller.id))
    await db.delete(users).where(eq(users.id, seller.id))
  }
})

describe('applianceName emit — toListingDto join appliance_models (HUB Gen86)', () => {
  it('GET /{id} → applianceName = model name (ไม่ว่างเมื่อมี appliance) + create response too', async () => {
    const cr = await authed('POST', '/api/v1/listings', seller.token, {
      listingType: 'used_appliance',
      applianceId: modelId,
      price: 5500,
      deliveryMethods: ['parcel'],
      status: 'announced',
    })
    expect(cr.status).toBe(201)
    const created = (await cr.json()) as { id: string; applianceId: string; applianceName: string | null }
    listingIds.push(created.id)
    // create response resolves applianceName (single-row lookup)
    expect(created.applianceId).toBe(modelId)
    expect(created.applianceName).toBe(MODEL_NAME)

    const r = await app.request(`/api/v1/listings/${created.id}`) // public (no auth)
    expect(r.status).toBe(200)
    const dto = (await r.json()) as { applianceId: string; applianceName: string | null }
    expect(dto.applianceId).toBe(modelId)
    expect(dto.applianceName).toBe(MODEL_NAME)
  })

  it('GET /browse → listing carries applianceName', async () => {
    const r = await app.request('/api/v1/listings/browse?pageSize=100')
    expect(r.status).toBe(200)
    const body = (await r.json()) as { results: { id: string; applianceName: string | null }[] }
    const found = body.results.find((x) => listingIds.includes(x.id))
    expect(found).toBeTruthy()
    expect(found!.applianceName).toBe(MODEL_NAME)
  })

  it('listing WITHOUT appliance → applianceName null (null-safe leftJoin)', async () => {
    const cr = await authed('POST', '/api/v1/listings', seller.token, {
      listingType: 'used_appliance',
      price: 3000,
      deliveryMethods: ['parcel'],
      status: 'announced',
    })
    expect(cr.status).toBe(201)
    const created = (await cr.json()) as { id: string; applianceName: string | null }
    listingIds.push(created.id)
    expect(created.applianceName).toBeNull()

    const r = await app.request(`/api/v1/listings/${created.id}`)
    const dto = (await r.json()) as { applianceName: string | null }
    expect(dto.applianceName).toBeNull()
  })
})
