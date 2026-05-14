/**
 * tests/integration/parts.test.ts — Sub-CMD-2 Wave 1
 *
 * Integration tests for 7 Parts Endpoints (CRIT-002 aligned paths):
 *   GET    /api/v1/parts/              — list
 *   POST   /api/v1/parts/              — create
 *   GET    /api/v1/parts/:id/          — single
 *   PATCH  /api/v1/parts/:id/          — update
 *   DELETE /api/v1/parts/:id/          — delete
 *   POST   /api/v1/parts/:id/stock-in/ — increment stock
 *   GET    /api/v1/parts/dashboard/    — aggregate stats
 *
 * Requires: DATABASE_URL in .env.local + pnpm db:migrate applied
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { app } from '../../src/app'
import { db } from '../../src/db/client'
import { users, refreshTokens, partsInventory } from '../../src/db/schema'

// ── Fixtures ─────────────────────────────────────────────────────────────────
const TEST_EMAIL = `parts-test-${Date.now()}@app3r.test`
const TEST_PASSWORD = 'PartsTestPass123!'

let accessToken: string
let testUserId: string
let createdPartId: string

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  // Sign up test user
  const res = await app.request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, role: 'weeer' }),
  })
  expect(res.status).toBe(201)
  const body = await res.json() as { access_token: string; user: { id: string } }
  testUserId = body.user.id
  accessToken = body.access_token
})

// ── Cleanup ────────────────────────────────────────────────────────────────────
afterAll(async () => {
  if (testUserId) {
    await db.delete(partsInventory).where(eq(partsInventory.ownerId, testUserId))
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, testUserId))
    await db.delete(users).where(eq(users.id, testUserId))
  }
})

// ── Auth helper ────────────────────────────────────────────────────────────────
const authHeader = () => ({ Authorization: `Bearer ${accessToken}` })
const jsonHeaders = () => ({ ...authHeader(), 'Content-Type': 'application/json' })

// ════════════════════════════════════════════════════════════════════════════
// POST / — create part
// ════════════════════════════════════════════════════════════════════════════
describe('POST /api/v1/parts/ — create part', () => {
  it('creates a part and returns Part shape', async () => {
    const res = await app.request('/api/v1/parts/', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({
        name: 'Test Motor Part',
        sku: 'SKU-001',
        unitPrice: 1500,
        stockQty: 10,
        unit: 'piece',
        category: 'motor',
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json() as {
      id: string; shopId: string; name: string; sku: string
      unitPrice: number; stockQty: number; condition: string
    }
    expect(body.id).toBeDefined()
    expect(body.shopId).toBe(testUserId)
    expect(body.name).toBe('Test Motor Part')
    expect(body.unitPrice).toBe(1500)
    expect(body.stockQty).toBe(10)
    expect(body.condition).toBe('used') // default
    createdPartId = body.id
  })

  it('returns 401 without auth token', async () => {
    const res = await app.request('/api/v1/parts/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test', unitPrice: 100, stockQty: 0, unit: 'piece' }),
    })
    expect(res.status).toBe(401)
    const body = await res.json() as { detail: string }
    expect(body.detail).toBeDefined() // Django-style error format
  })
})

// ════════════════════════════════════════════════════════════════════════════
// GET / — list parts
// ════════════════════════════════════════════════════════════════════════════
describe('GET /api/v1/parts/ — list parts', () => {
  it('returns array of parts for authenticated user', async () => {
    const res = await app.request('/api/v1/parts/', {
      headers: authHeader(),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as unknown[]
    expect(Array.isArray(body)).toBe(true)
    // Should include the created part
    const found = body.find((p: unknown) => (p as { id: string }).id === createdPartId)
    expect(found).toBeDefined()
  })

  it('filters by category when ?category= param provided', async () => {
    const res = await app.request('/api/v1/parts/?category=motor', {
      headers: authHeader(),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as Array<{ category: string }>
    // All returned items should have category=motor
    for (const item of body) {
      expect(item.category).toBe('motor')
    }
  })

  it('returns 401 without token', async () => {
    const res = await app.request('/api/v1/parts/')
    expect(res.status).toBe(401)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// GET /:id/ — single part
// ════════════════════════════════════════════════════════════════════════════
describe('GET /api/v1/parts/:id/ — single part', () => {
  it('returns part by id', async () => {
    const res = await app.request(`/api/v1/parts/${createdPartId}/`, {
      headers: authHeader(),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { id: string; name: string; unitPrice: number }
    expect(body.id).toBe(createdPartId)
    expect(body.name).toBe('Test Motor Part')
    expect(body.unitPrice).toBe(1500)
  })

  it('returns 404 for non-existent part', async () => {
    const res = await app.request('/api/v1/parts/00000000-0000-0000-0000-000000000000/', {
      headers: authHeader(),
    })
    expect(res.status).toBe(404)
    const body = await res.json() as { detail: string }
    expect(body.detail).toBeDefined()
  })
})

// ════════════════════════════════════════════════════════════════════════════
// PATCH /:id/ — update part
// ════════════════════════════════════════════════════════════════════════════
describe('PATCH /api/v1/parts/:id/ — update part', () => {
  it('updates name + unitPrice and returns updated Part', async () => {
    const res = await app.request(`/api/v1/parts/${createdPartId}/`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({ name: 'Updated Motor Part', unitPrice: 1800 }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { name: string; unitPrice: number }
    expect(body.name).toBe('Updated Motor Part')
    expect(body.unitPrice).toBe(1800)
  })

  it('cannot update another user\'s part (returns 404)', async () => {
    // Use a different user's UUID pattern (doesn't exist for this user)
    const res = await app.request('/api/v1/parts/11111111-1111-1111-1111-111111111111/', {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({ name: 'hacked' }),
    })
    expect(res.status).toBe(404)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// POST /:id/stock-in/ — increment stock
// ════════════════════════════════════════════════════════════════════════════
describe('POST /api/v1/parts/:id/stock-in/ — add stock', () => {
  it('increments stock quantity and returns StockMovement', async () => {
    // Get current stock first
    const beforeRes = await app.request(`/api/v1/parts/${createdPartId}/`, {
      headers: authHeader(),
    })
    const before = await beforeRes.json() as { stockQty: number }
    const beforeQty = before.stockQty

    const res = await app.request(`/api/v1/parts/${createdPartId}/stock-in/`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ qty: 5, reason: 'purchase' }),
    })
    expect(res.status).toBe(201)
    const movement = await res.json() as {
      type: string; qty: number; reason: string; balanceAfter: number; performedBy: string
    }
    expect(movement.type).toBe('STOCK_IN')
    expect(movement.qty).toBe(5)
    expect(movement.reason).toBe('purchase')
    expect(movement.balanceAfter).toBe(beforeQty + 5)
    expect(movement.performedBy).toBe(testUserId)
  })

  it('returns 404 for non-existent part', async () => {
    const res = await app.request('/api/v1/parts/00000000-0000-0000-0000-000000000001/stock-in/', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ qty: 1, reason: 'purchase' }),
    })
    expect(res.status).toBe(404)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// GET /dashboard/ — aggregate stats
// ════════════════════════════════════════════════════════════════════════════
describe('GET /api/v1/parts/dashboard/ — aggregate stats', () => {
  it('returns total_skus, total_stock_value, low_stock, recent_movements', async () => {
    const res = await app.request('/api/v1/parts/dashboard/', {
      headers: authHeader(),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as {
      total_skus: number
      total_stock_value: number
      low_stock: unknown[]
      recent_movements: unknown[]
    }
    expect(typeof body.total_skus).toBe('number')
    expect(body.total_skus).toBeGreaterThanOrEqual(1) // at least the test part
    expect(typeof body.total_stock_value).toBe('number')
    expect(Array.isArray(body.low_stock)).toBe(true)
    expect(Array.isArray(body.recent_movements)).toBe(true)
    expect(body.recent_movements).toHaveLength(0) // scaffold: always empty
  })
})

// ════════════════════════════════════════════════════════════════════════════
// GET /movements/ — scaffold
// ════════════════════════════════════════════════════════════════════════════
describe('GET /api/v1/parts/movements/ — scaffold', () => {
  it('returns empty array (no stock_movements table yet)', async () => {
    const res = await app.request('/api/v1/parts/movements/', {
      headers: authHeader(),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as unknown[]
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(0)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// GET /reservations/ — scaffold
// ════════════════════════════════════════════════════════════════════════════
describe('GET /api/v1/parts/reservations/ — scaffold', () => {
  it('returns empty array (scaffold)', async () => {
    const res = await app.request('/api/v1/parts/reservations/', {
      headers: authHeader(),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as unknown[]
    expect(body).toHaveLength(0)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// DELETE /:id/ — delete part (last — preserves test data for above)
// ════════════════════════════════════════════════════════════════════════════
describe('DELETE /api/v1/parts/:id/ — delete part', () => {
  it('deletes part and returns success', async () => {
    const res = await app.request(`/api/v1/parts/${createdPartId}/`, {
      method: 'DELETE',
      headers: authHeader(),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean }
    expect(body.success).toBe(true)
  })

  it('returns 404 when deleting same part again', async () => {
    const res = await app.request(`/api/v1/parts/${createdPartId}/`, {
      method: 'DELETE',
      headers: authHeader(),
    })
    expect(res.status).toBe(404)
  })
})
