/**
 * e2e/parts-b2b/orders.spec.ts — Sub-CMD-9: Parts B2B E2E Smoke Tests
 *
 * Scope: API-level E2E for /api/v1/parts/orders/
 * W5: max 2 retries (configured in playwright.config.ts)
 * Pattern: Page Object Model (Protocol item 11)
 *
 * Tests:
 *   1. GET /api/v1/parts/orders/ — unauthenticated → 401
 *   2. GET /api/v1/parts/orders/ — authenticated → 200 with pagination shape
 *   3. GET /api/v1/parts/orders/?status=held — filter works
 *   4. GET /api/v1/parts/orders/:id/ — not found → 404
 *   5. Health check — backend is up
 *
 * Note: These are smoke tests. Full order lifecycle is in unit tests (vitest).
 * E2E creates no DB state — tests run against live backend in CI.
 *
 * Sub-CMD-9: 361813ec-7277-81d3-a2b2-dffb9c71bfe8
 */
import { test, expect } from '../shared/fixtures'
import { authGet } from '../shared/auth'

// ── Page Object Model: Parts Orders API ───────────────────────────────────────
class PartsOrdersPage {
  constructor(
    private api: import('@playwright/test').APIRequestContext,
    private token?: string,
  ) {}

  async list(params?: Record<string, string>) {
    if (!this.token) {
      return this.api.get('/api/v1/parts/orders/', {
        headers: { Accept: 'application/json' },
      })
    }
    return authGet(this.api, '/api/v1/parts/orders/', this.token, params)
  }

  async getOne(id: string) {
    if (!this.token) {
      return this.api.get(`/api/v1/parts/orders/${id}/`)
    }
    return authGet(this.api, `/api/v1/parts/orders/${id}/`, this.token!)
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Parts B2B Orders API — E2E Smoke', () => {
  test('GET /health — backend is up', async ({ api }) => {
    const res = await api.get('/health')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('status')
  })

  test('GET /api/v1/parts/orders/ without auth → 401', async ({ api }) => {
    const page = new PartsOrdersPage(api) // no token
    const res = await page.list()
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty('detail')
  })

  test('GET /api/v1/parts/orders/ with valid auth → 200 with pagination shape', async ({
    api,
    authAs,
  }) => {
    const auth = await authAs('buyer')
    const page = new PartsOrdersPage(api, auth.token)
    const res = await page.list()

    // Accept 200 (authenticated, even if 0 orders)
    expect(res.status()).toBe(200)
    const body = await res.json()

    // Validate pagination shape
    expect(body).toHaveProperty('items')
    expect(body).toHaveProperty('total')
    expect(body).toHaveProperty('limit')
    expect(body).toHaveProperty('offset')
    expect(Array.isArray(body.items)).toBe(true)
    expect(typeof body.total).toBe('number')
    expect(typeof body.limit).toBe('number')
    expect(typeof body.offset).toBe('number')
  })

  test('GET /api/v1/parts/orders/?status=held — filter parameter accepted', async ({
    api,
    authAs,
  }) => {
    const auth = await authAs('buyer')
    const page = new PartsOrdersPage(api, auth.token)
    const res = await page.list({ status: 'held' })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.items)).toBe(true)
    // All returned items should have status 'held'
    for (const item of body.items) {
      expect(item.status).toBe('held')
    }
  })

  test('GET /api/v1/parts/orders/?limit=5&offset=0 — pagination params accepted', async ({
    api,
    authAs,
  }) => {
    const auth = await authAs('buyer')
    const page = new PartsOrdersPage(api, auth.token)
    const res = await page.list({ limit: '5', offset: '0' })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.limit).toBe(5)
    expect(body.offset).toBe(0)
  })

  test('GET /api/v1/parts/orders/:id/ — non-existent order → 404', async ({
    api,
    authAs,
  }) => {
    const auth = await authAs('buyer')
    const page = new PartsOrdersPage(api, auth.token)
    const nonExistentId = '00000000-0000-0000-0000-000000000001'
    const res = await page.getOne(nonExistentId)
    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body).toHaveProperty('detail')
  })
})
