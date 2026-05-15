/**
 * e2e/weeer/parts-buyer.spec.ts — WeeeR Buyer Flow E2E
 *
 * Tests: B2B Order lifecycle — create → fulfill → close → dispute → rate
 * Scope: apps/weeer/ ← สอดคล้องกับ lib/parts-api.ts
 *
 * W3 carry-over: Dispute UI + Rating UI endpoints
 * W5: retry max 2 — fail ซ้ำ = block merge
 * Security Rule #5: ทุก call ผ่าน Bearer token
 */
import { test, expect } from '../shared/fixtures'
import { PartsOrdersPage } from './pages/parts-orders.page'

// ── Helper: create a part and return its ID ────────────────────────────────────
async function setupPartForSale(
  page: PartsOrdersPage,
  sellerToken: string,
): Promise<string> {
  const res = await page.createPart(sellerToken, {
    name: `E2E Sale Part ${Date.now()}`,
    unitPrice: 1500,
    stockQty: 20,
    condition: 'new',
  })
  expect(res.status()).toBe(201)
  const part = await res.json() as { id: string }
  return part.id
}

test.describe('WeeeR — Buyer Order Flow API', () => {
  let page: PartsOrdersPage

  test.beforeEach(({ api }) => {
    page = new PartsOrdersPage(api)
  })

  // ── Auth guard ──────────────────────────────────────────────────────────────

  test('POST /api/v1/parts/orders/ — unauthenticated returns 401', async ({ api }) => {
    const res = await api.post('/api/v1/parts/orders/', {
      data: { partId: 'x', quantity: 1, idempotencyKey: 'k' },
    })
    expect(res.status()).toBe(401)
  })

  test('GET /api/v1/parts/orders/ — unauthenticated returns 401', async ({ api }) => {
    const res = await api.get('/api/v1/parts/orders/')
    expect(res.status()).toBe(401)
  })

  // ── List orders ─────────────────────────────────────────────────────────────

  test('GET /api/v1/parts/orders/ — authenticated returns paginated list', async ({ authAs }) => {
    const buyer = await authAs('buyer')
    const res = await page.listOrders(buyer.token)
    expect(res.status()).toBe(200)

    const body = await res.json() as { items: unknown[]; total: number; limit: number; offset: number }
    expect(Array.isArray(body.items)).toBe(true)
    expect(typeof body.total).toBe('number')
    expect(typeof body.limit).toBe('number')
    expect(typeof body.offset).toBe('number')
  })

  test('GET /api/v1/parts/orders/ — supports buyerId filter', async ({ authAs }) => {
    const buyer = await authAs('buyer')
    const res = await page.listOrders(buyer.token, { buyerId: buyer.userId, limit: '10' })
    expect(res.status()).toBe(200)
    const body = await res.json() as { items: { buyerId: string }[] }
    // All returned orders should belong to this buyer
    expect(body.items.every((o) => o.buyerId === buyer.userId)).toBe(true)
  })

  test('GET /api/v1/parts/orders/ — supports status filter', async ({ authAs }) => {
    const buyer = await authAs('buyer')
    const res = await page.listOrders(buyer.token, { status: 'held' })
    expect(res.status()).toBe(200)
    const body = await res.json() as { items: { status: string }[] }
    expect(body.items.every((o) => o.status === 'held')).toBe(true)
  })

  test('GET /api/v1/parts/orders/ — pagination params respected', async ({ authAs }) => {
    const buyer = await authAs('buyer')
    const res = await page.listOrders(buyer.token, { limit: '5', offset: '0' })
    expect(res.status()).toBe(200)
    const body = await res.json() as { items: unknown[]; limit: number; offset: number }
    expect(body.limit).toBe(5)
    expect(body.offset).toBe(0)
    expect(body.items.length).toBeLessThanOrEqual(5)
  })

  // ── Order detail ────────────────────────────────────────────────────────────

  test('GET /api/v1/parts/orders/:id/ — 404 for unknown order', async ({ authAs }) => {
    const buyer = await authAs('buyer')
    const res = await page.getOrderDetail(buyer.token, '00000000-0000-0000-0000-000000000000')
    expect(res.status()).toBe(404)
  })

  // ── Full happy path: create → fulfill → close ───────────────────────────────

  test('Full B2B flow: buyer creates order → seller fulfills → buyer closes', async ({ authAs }) => {
    const seller = await authAs('seller')
    const buyer  = await authAs('buyer')

    // Setup: seller creates a part
    const partId = await setupPartForSale(page, seller.token)

    // Step 1: Buyer creates order
    const idemKey = `e2e-order-${Date.now()}`
    const createRes = await page.createOrder(buyer.token, {
      partId,
      quantity: 2,
      idempotencyKey: idemKey,
    })
    expect(createRes.status()).toBe(201)
    const order = await createRes.json() as {
      id: string; status: string; quantity: number; partId: string
    }
    expect(order.status).toBe('held')
    expect(order.quantity).toBe(2)
    expect(order.partId).toBe(partId)
    const orderId = order.id

    // Step 2: GET order detail — includes events
    const detailRes = await page.getOrderDetail(buyer.token, orderId)
    expect(detailRes.status()).toBe(200)
    const detail = await detailRes.json() as {
      id: string; status: string; events: unknown[]; dispute: null; rating: null
    }
    expect(detail.status).toBe('held')
    expect(Array.isArray(detail.events)).toBe(true)
    expect(detail.events.length).toBeGreaterThanOrEqual(1)
    expect(detail.dispute).toBeNull()
    expect(detail.rating).toBeNull()

    // Step 3: Seller fulfills
    const fulfillRes = await page.fulfillOrder(seller.token, orderId, {
      trackingNumber: `E2E-TRK-${Date.now()}`,
      fulfillmentNote: 'ส่ง Kerry E2E test',
    })
    expect(fulfillRes.status()).toBe(200)
    const fulfilled = await fulfillRes.json() as { status: string; trackingNumber: string }
    expect(fulfilled.status).toBe('fulfilled')
    expect(fulfilled.trackingNumber).toBeTruthy()

    // Step 4: Buyer closes
    const closeRes = await page.closeOrder(buyer.token, orderId)
    expect(closeRes.status()).toBe(200)
    const closed = await closeRes.json() as { status: string; closedAt: string }
    expect(closed.status).toBe('closed')
    expect(closed.closedAt).toBeTruthy()
  })

  // ── Idempotency ─────────────────────────────────────────────────────────────

  test('Duplicate idempotency key returns 409 or same order', async ({ authAs }) => {
    const seller = await authAs('seller')
    const buyer  = await authAs('buyer')
    const partId = await setupPartForSale(page, seller.token)

    const idemKey = `idem-dup-${Date.now()}`
    const payload = { partId, quantity: 1, idempotencyKey: idemKey }

    const res1 = await page.createOrder(buyer.token, payload)
    expect(res1.status()).toBe(201)

    const res2 = await page.createOrder(buyer.token, payload)
    // Should be idempotent (201) or conflict (409)
    expect([201, 409]).toContain(res2.status())
  })

  // ── W3 Carry-over: Dispute flow ─────────────────────────────────────────────

  test('Buyer can raise dispute on held order', async ({ authAs }) => {
    const seller = await authAs('seller')
    const buyer  = await authAs('buyer')
    const partId = await setupPartForSale(page, seller.token)

    // Create order (→ held)
    const createRes = await page.createOrder(buyer.token, {
      partId,
      quantity: 1,
      idempotencyKey: `dispute-test-${Date.now()}`,
    })
    expect(createRes.status()).toBe(201)
    const order = await createRes.json() as { id: string; status: string }
    expect(order.status).toBe('held')

    // Raise dispute
    const disputeRes = await page.raiseDispute(
      buyer.token,
      order.id,
      'สินค้าไม่ตรงตามที่สั่ง E2E test dispute reason ยาวพอ 30+ ตัวอักษร',
    )
    expect(disputeRes.status()).toBe(201)
    const dispute = await disputeRes.json() as {
      id: string; orderId: string; status: string; reason: string
    }
    expect(dispute.orderId).toBe(order.id)
    expect(dispute.status).toBe('open')
    expect(dispute.reason).toContain('สินค้าไม่ตรง')
  })

  test('POST /api/v1/parts/orders/:id/dispute/ — reason too short returns 400', async ({ authAs }) => {
    const seller = await authAs('seller')
    const buyer  = await authAs('buyer')
    const partId = await setupPartForSale(page, seller.token)

    const createRes = await page.createOrder(buyer.token, {
      partId,
      quantity: 1,
      idempotencyKey: `dispute-short-${Date.now()}`,
    })
    expect(createRes.status()).toBe(201)
    const order = await createRes.json() as { id: string }

    const disputeRes = await page.raiseDispute(buyer.token, order.id, 'สั้นไป')
    expect(disputeRes.status()).toBe(400)
  })

  // ── W3 Carry-over: Rating flow ──────────────────────────────────────────────

  test('Buyer can rate seller after order is closed', async ({ authAs }) => {
    const seller = await authAs('seller')
    const buyer  = await authAs('buyer')
    const partId = await setupPartForSale(page, seller.token)

    // Full flow to reach closed
    const createRes = await page.createOrder(buyer.token, {
      partId,
      quantity: 1,
      idempotencyKey: `rate-test-${Date.now()}`,
    })
    expect(createRes.status()).toBe(201)
    const order = await createRes.json() as { id: string }

    await page.fulfillOrder(seller.token, order.id, { trackingNumber: 'RATE-TRK-001' })
    await page.closeOrder(buyer.token, order.id)

    // Rate
    const rateRes = await page.rateOrder(buyer.token, order.id, 5, 'ส่งเร็ว สินค้าดี E2E ✓')
    expect(rateRes.status()).toBe(201)
    const rating = await rateRes.json() as {
      id: string; orderId: string; score: number; comment: string
    }
    expect(rating.orderId).toBe(order.id)
    expect(rating.score).toBe(5)
    expect(rating.comment).toContain('ส่งเร็ว')
  })

  test('POST /api/v1/parts/orders/:id/rate/ — score out of range returns 400', async ({ authAs }) => {
    const seller = await authAs('seller')
    const buyer  = await authAs('buyer')
    const partId = await setupPartForSale(page, seller.token)

    const createRes = await page.createOrder(buyer.token, {
      partId,
      quantity: 1,
      idempotencyKey: `rate-bad-${Date.now()}`,
    })
    expect(createRes.status()).toBe(201)
    const order = await createRes.json() as { id: string }
    await page.fulfillOrder(seller.token, order.id)
    await page.closeOrder(buyer.token, order.id)

    // Score = 6 — invalid
    const rateRes = await page.rateOrder(buyer.token, order.id, 6)
    expect(rateRes.status()).toBe(400)
  })

  test('Cannot rate order that is not closed', async ({ authAs }) => {
    const seller = await authAs('seller')
    const buyer  = await authAs('buyer')
    const partId = await setupPartForSale(page, seller.token)

    const createRes = await page.createOrder(buyer.token, {
      partId,
      quantity: 1,
      idempotencyKey: `rate-notclosed-${Date.now()}`,
    })
    expect(createRes.status()).toBe(201)
    const order = await createRes.json() as { id: string; status: string }
    expect(order.status).toBe('held')

    // Try to rate while still held
    const rateRes = await page.rateOrder(buyer.token, order.id, 4)
    expect(rateRes.status()).toBe(400)
  })
})
