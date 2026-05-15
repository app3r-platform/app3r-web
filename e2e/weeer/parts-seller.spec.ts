/**
 * e2e/weeer/parts-seller.spec.ts — WeeeR Seller Inventory E2E
 *
 * Tests: Part CRUD API (Seller role)
 * Scope: apps/weeer/ ← Backend อยู่ใน e2e/parts-b2b/
 *
 * W3: ครอบคลุม Seller inventory flow ฝั่ง WeeeR
 * W5: retry max 2 (ตาม playwright.config.ts)
 * Security Rule #5: ทุก call ผ่าน Bearer token
 */
import { test, expect } from '../shared/fixtures'
import { PartsOrdersPage } from './pages/parts-orders.page'

test.describe('WeeeR — Seller Inventory API', () => {
  let page: PartsOrdersPage

  test.beforeEach(({ api }) => {
    page = new PartsOrdersPage(api)
  })

  // ── Health check ────────────────────────────────────────────────────────────

  test('GET /api/v1/parts/ — unauthenticated returns 401', async ({ api }) => {
    const res = await api.get('/api/v1/parts/')
    expect(res.status()).toBe(401)
  })

  // ── Seller: create + list + get part ────────────────────────────────────────

  test('Seller can create a part and list it', async ({ authAs }) => {
    const seller = await authAs('seller')

    // Create part
    const createRes = await page.createPart(seller.token, {
      name: 'E2E Test Part — คาร์บิวเรเตอร์',
      unitPrice: 2500,
      stockQty: 10,
      sku: `SKU-E2E-${Date.now()}`,
      category: 'Engine',
      condition: 'new',
      unit: 'ชิ้น',
    })
    expect(createRes.status()).toBe(201)

    const part = await createRes.json()
    expect(part.id).toBeTruthy()
    expect(part.name).toBe('E2E Test Part — คาร์บิวเรเตอร์')
    expect(part.unitPrice).toBe(2500)
    expect(part.stockQty).toBe(10)
    expect(part.condition).toBe('new')

    // List parts — should include newly created
    const listRes = await page.listMyParts(seller.token)
    expect(listRes.status()).toBe(200)
    const parts = await listRes.json() as { id: string }[]
    expect(Array.isArray(parts)).toBe(true)
    expect(parts.some((p) => p.id === part.id)).toBe(true)
  })

  test('Seller can get single part by ID', async ({ authAs }) => {
    const seller = await authAs('seller')

    // Create
    const createRes = await page.createPart(seller.token, {
      name: 'E2E Single Part Test',
      unitPrice: 999,
      stockQty: 5,
    })
    expect(createRes.status()).toBe(201)
    const created = await createRes.json() as { id: string }

    // Get by ID
    const getRes = await page.getPart(seller.token, created.id)
    expect(getRes.status()).toBe(200)
    const fetched = await getRes.json() as { id: string; name: string }
    expect(fetched.id).toBe(created.id)
    expect(fetched.name).toBe('E2E Single Part Test')
  })

  test('GET /api/v1/parts/:id/ — 404 for unknown ID', async ({ authAs }) => {
    const seller = await authAs('seller')
    const res = await page.getPart(seller.token, '00000000-0000-0000-0000-000000000000')
    expect(res.status()).toBe(404)
  })

  test('Seller can filter parts by category', async ({ authAs }) => {
    const seller = await authAs('seller')

    await page.createPart(seller.token, {
      name: 'Filter Test — Engine Part',
      unitPrice: 1000,
      category: 'FilterTestCategory',
    })

    const listRes = await page.listMyParts(seller.token, { category: 'FilterTestCategory' })
    expect(listRes.status()).toBe(200)
    const parts = await listRes.json() as { category: string }[]
    expect(parts.length).toBeGreaterThanOrEqual(1)
    expect(parts.every((p) => p.category === 'FilterTestCategory')).toBe(true)
  })
})
