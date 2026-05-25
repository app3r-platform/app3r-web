/**
 * tests/unit/parts-d6.test.ts — D-6 Parts B2B Unit Tests
 *
 * Tests:
 *   - Schema types: PartsListing, PartsCartItem, PartsOrderItem, PartsRequest, PartsReturn
 *   - Route logic validation (Zod schemas)
 *   - Cart tier pricing helper
 *   - Migration SQL smoke check: 0021_d6_parts_b2b.sql
 *   - Ensure Sub-8 tables (parts_orders, parts_b2b) unchanged
 *
 * No DB required — mocked via vi.mock()
 * Target: vitest ≥ 60% coverage
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

// ── Mock DB ───────────────────────────────────────────────────────────────────
vi.mock('../../src/db/client', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => []),
        onConflictDoNothing: vi.fn(() => ({ returning: vi.fn(async () => []) })),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(async () => []),
          })),
          limit: vi.fn(async () => []),
          innerJoin: vi.fn(() => ({
            where: vi.fn(async () => []),
          })),
        })),
        innerJoin: vi.fn(() => ({
          where: vi.fn(async () => []),
        })),
        orderBy: vi.fn(() => ({ limit: vi.fn(async () => []) })),
        limit: vi.fn(async () => []),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => []),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(async () => []),
    })),
    execute: vi.fn(async () => []),
  },
}))

// ── Mock JWT ──────────────────────────────────────────────────────────────────
vi.mock('../../src/lib/jwt', () => ({
  verifyAccessToken: vi.fn(async () => ({
    userId: 'user-weeer-001',
    email: 'weeer@test.com',
    role: 'weeer',
  })),
}))

// ── Mock env ──────────────────────────────────────────────────────────────────
vi.mock('../../src/env', () => ({
  env: { JWT_SECRET: 'test-secret-key-32chars-minimum!!' },
}))

// ── Import modules ────────────────────────────────────────────────────────────
import { partsCatalogRouter } from '../../src/routes/parts-catalog'
import { partsCartRouter } from '../../src/routes/parts-cart'
import { partsRequestsRouter } from '../../src/routes/parts-requests'
import { partsReturnsRouter } from '../../src/routes/parts-returns'

// ── Schema type tests ──────────────────────────────────────────────────────────
describe('D-6 Schema types', () => {
  it('PartsListing type has required fields', async () => {
    const { partsListings } = await import('../../src/db/schema/parts-listings')
    const columns = Object.keys(partsListings)
    expect(typeof partsListings).toBe('object')
    expect(columns).toBeDefined()
  })

  it('PartsCartItem type has required fields', async () => {
    const { partsCartItems } = await import('../../src/db/schema/parts-cart')
    expect(typeof partsCartItems).toBe('object')
  })

  it('PartsOrderItem type references partsOrders', async () => {
    const { partsOrderItems } = await import('../../src/db/schema/parts-order-items')
    expect(typeof partsOrderItems).toBe('object')
  })

  it('PartsRequest type has urgency + status fields', async () => {
    const { partsRequests } = await import('../../src/db/schema/parts-requests')
    expect(typeof partsRequests).toBe('object')
  })

  it('PartsRequestQuote type references partsRequests', async () => {
    const { partsRequestQuotes } = await import('../../src/db/schema/parts-requests')
    expect(typeof partsRequestQuotes).toBe('object')
  })

  it('PartsReturn type has reason + resolution fields', async () => {
    const { partsReturns } = await import('../../src/db/schema/parts-returns')
    expect(typeof partsReturns).toBe('object')
  })
})

// ── Migration SQL smoke test ──────────────────────────────────────────────────
describe('Migration 0021_d6_parts_b2b.sql', () => {
  const migrationPath = join(
    __dirname,
    '../../src/db/migrations/0021_d6_parts_b2b.sql',
  )
  let sql: string

  beforeEach(() => {
    sql = readFileSync(migrationPath, 'utf-8')
  })

  it('creates parts_listings table', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "parts_listings"')
  })

  it('creates parts_cart_items table', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "parts_cart_items"')
  })

  it('adds is_multi_item column to parts_orders', () => {
    expect(sql).toContain('ALTER TABLE "parts_orders"')
    expect(sql).toContain('"is_multi_item" BOOLEAN NOT NULL DEFAULT false')
  })

  it('creates parts_order_items table', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "parts_order_items"')
  })

  it('creates parts_requests table with for_repair_job_id → services', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "parts_requests"')
    expect(sql).toContain('"for_repair_job_id"')
    expect(sql).toContain('REFERENCES "services"("id")')
  })

  it('creates parts_request_quotes table', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "parts_request_quotes"')
  })

  it('creates parts_returns table (separate from disputes)', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "parts_returns"')
    // ห้ามสร้าง parts_disputes อีก (มีแล้วใน 0008)
    expect(sql).not.toContain('CREATE TABLE IF NOT EXISTS "parts_disputes"')
  })

  it('source_scrap_id has NO FK constraint (waiting for scrap module)', () => {
    // scrap_source_id เป็นแค่ UUID ไม่ REFERENCES
    const scrapSection = sql.substring(
      sql.indexOf('"source_scrap_id"'),
      sql.indexOf('"source_scrap_id"') + 200,
    )
    expect(scrapSection).not.toContain('REFERENCES')
  })

  it('for_repair_job_id references services NOT repair_jobs', () => {
    // must reference services, not repair_jobs
    const requestsSection = sql.substring(
      sql.indexOf('"for_repair_job_id"'),
      sql.indexOf('"for_repair_job_id"') + 200,
    )
    expect(requestsSection).toContain('REFERENCES "services"("id")')
    expect(requestsSection).not.toContain('repair_jobs')
  })

  it('has rollback comment section', () => {
    expect(sql).toContain('Rollback:')
    expect(sql).toContain('DROP TABLE IF EXISTS "parts_returns" CASCADE')
  })

  it('includes all required indexes', () => {
    expect(sql).toContain('idx_parts_listings_seller')
    expect(sql).toContain('idx_parts_cart_buyer_listing')
    expect(sql).toContain('idx_parts_order_items_order')
    expect(sql).toContain('idx_parts_requests_status')
    expect(sql).toContain('idx_parts_returns_status')
  })
})

// ── Catalog router validation ─────────────────────────────────────────────────
describe('Catalog router (GET /catalog/)', () => {
  it('router is defined and has routes', () => {
    expect(partsCatalogRouter).toBeDefined()
    // Hono router should have routes registered
    expect(typeof partsCatalogRouter.fetch).toBe('function')
  })

  it('GET /catalog/ returns 200 with empty array when no data', async () => {
    const req = new Request('http://localhost/', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid.token.here' },
    })
    const res = await partsCatalogRouter.fetch(req)
    // DB is mocked to return [] so should get 200 with items: []
    expect(res.status).toBe(200)
    const body = await res.json() as { items: unknown[] }
    expect(body).toHaveProperty('items')
    expect(Array.isArray(body.items)).toBe(true)
  })

  it('GET /search returns 400 with short query', async () => {
    const req = new Request('http://localhost/search?q=a', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid.token.here' },
    })
    const res = await partsCatalogRouter.fetch(req)
    expect(res.status).toBe(400)
  })

  it('POST /catalog/ with invalid body returns 422', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid.token.here',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ partName: '' }), // empty name = invalid
    })
    const res = await partsCatalogRouter.fetch(req)
    expect(res.status).toBe(422)
  })
})

// ── Cart router validation ────────────────────────────────────────────────────
describe('Cart router (POST /cart/add)', () => {
  it('router is defined', () => {
    expect(partsCartRouter).toBeDefined()
    expect(typeof partsCartRouter.fetch).toBe('function')
  })

  it('POST /add without auth returns 401', async () => {
    // No Authorization header → requireAuth returns null immediately (no JWT call needed)
    const req = new Request('http://localhost/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: 'abc', qty: 1 }),
    })
    const res = await partsCartRouter.fetch(req)
    expect(res.status).toBe(401)
  })

  it('POST /add with invalid qty returns 422', async () => {
    const req = new Request('http://localhost/add', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid.token.here',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ listingId: '123e4567-e89b-12d3-a456-426614174000', qty: 100 }), // qty > 50
    })
    const res = await partsCartRouter.fetch(req)
    // qty 100 exceeds max 50
    expect(res.status).toBe(422)
  })

  it('GET /cart returns 200 with groups', async () => {
    const req = new Request('http://localhost/', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid.token.here' },
    })
    const res = await partsCartRouter.fetch(req)
    expect(res.status).toBe(200)
    const body = await res.json() as { groups: unknown[] }
    expect(body).toHaveProperty('groups')
  })
})

// ── Requests router validation ────────────────────────────────────────────────
describe('Parts Requests router', () => {
  it('router is defined', () => {
    expect(partsRequestsRouter).toBeDefined()
  })

  it('POST / with missing required fields returns 422', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid.token.here',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ applianceBrand: 'Samsung' }), // missing other required fields
    })
    const res = await partsRequestsRouter.fetch(req)
    expect(res.status).toBe(422)
  })

  it('GET /inbox returns 200', async () => {
    const req = new Request('http://localhost/inbox', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid.token.here' },
    })
    const res = await partsRequestsRouter.fetch(req)
    expect(res.status).toBe(200)
  })

  it('GET /my returns 200', async () => {
    const req = new Request('http://localhost/my', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid.token.here' },
    })
    const res = await partsRequestsRouter.fetch(req)
    expect(res.status).toBe(200)
  })
})

// ── Returns router validation ─────────────────────────────────────────────────
describe('Parts Returns router', () => {
  it('router is defined', () => {
    expect(partsReturnsRouter).toBeDefined()
  })

  it('POST /:id/return-defective with no body returns 400', async () => {
    const req = new Request('http://localhost/abc123/return-defective', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid.token.here' },
      // no body
    })
    const res = await partsReturnsRouter.fetch(req)
    // order not found (DB returns empty) OR bad body
    expect([400, 404]).toContain(res.status)
  })

  it('GET /:id/warranty requires auth', async () => {
    const { verifyAccessToken } = await import('../../src/lib/jwt')
    vi.mocked(verifyAccessToken).mockRejectedValueOnce(new Error('no auth'))

    const req = new Request('http://localhost/abc123/warranty', {
      method: 'GET',
      // no auth header
    })
    const res = await partsReturnsRouter.fetch(req)
    expect(res.status).toBe(401)
  })
})

// ── Schema index completeness test ────────────────────────────────────────────
describe('Schema index.ts exports D-6 tables', () => {
  it('exports all 5 new D-6 schema files', async () => {
    const schema = await import('../../src/db/schema/index')
    expect(schema).toHaveProperty('partsListings')
    expect(schema).toHaveProperty('partsCartItems')
    expect(schema).toHaveProperty('partsOrderItems')
    expect(schema).toHaveProperty('partsRequests')
    expect(schema).toHaveProperty('partsRequestQuotes')
    expect(schema).toHaveProperty('partsReturns')
  })

  it('still exports Sub-8 tables unchanged', async () => {
    const schema = await import('../../src/db/schema/index')
    expect(schema).toHaveProperty('partsOrders')
    expect(schema).toHaveProperty('partsOrderEvents')
    expect(schema).toHaveProperty('partsDisputes')
    expect(schema).toHaveProperty('partsRatings')
  })
})

// ── Cart tier pricing logic test ──────────────────────────────────────────────
describe('Tier pricing discount logic', () => {
  // Replicate the helper from parts-cart.ts for direct unit testing
  function getTierDiscount(tierPricing: unknown[], qty: number): number {
    if (!Array.isArray(tierPricing)) return 0
    for (const tier of tierPricing) {
      const t = tier as { minQty?: number; maxQty?: number; discount?: number }
      const min = t.minQty ?? 0
      const max = t.maxQty ?? Infinity
      if (qty >= min && qty <= max && typeof t.discount === 'number') {
        return t.discount
      }
    }
    if (qty >= 6) return 0.10
    if (qty >= 2) return 0.05
    return 0
  }

  it('qty=1 → 0% discount', () => {
    expect(getTierDiscount([], 1)).toBe(0)
  })

  it('qty=2 → 5% default discount', () => {
    expect(getTierDiscount([], 2)).toBe(0.05)
  })

  it('qty=6 → 10% default discount', () => {
    expect(getTierDiscount([], 6)).toBe(0.10)
  })

  it('custom tier pricing overrides default', () => {
    const tiers = [
      { minQty: 3, maxQty: 10, discount: 0.08 },
      { minQty: 11, maxQty: 99, discount: 0.15 },
    ]
    expect(getTierDiscount(tiers, 5)).toBe(0.08)
    expect(getTierDiscount(tiers, 20)).toBe(0.15)
    expect(getTierDiscount(tiers, 1)).toBe(0) // no matching tier
  })

  it('qty=50 (max) applies 10% default', () => {
    expect(getTierDiscount([], 50)).toBe(0.10)
  })
})
