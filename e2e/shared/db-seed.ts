/**
 * e2e/shared/db-seed.ts — Sub-CMD-9: DB seeding utilities for E2E tests
 *
 * Seeds test data via API endpoints (not direct DB access).
 * This ensures E2E tests use the same code paths as real users.
 *
 * Pattern:
 *   1. Create user + login (auth)
 *   2. Create parts inventory item (parts seller)
 *   3. Create order via POST /api/v1/parts/orders/
 *
 * W5 compliance: each test function is independent — no shared state
 */
import type { APIRequestContext } from '@playwright/test'
import { authPost, authGet } from './auth'

export interface SeededPart {
  id: string
  ownerId: string
  ownerToken: string
  unitPriceThb: string
}

export interface SeededOrder {
  id: string
  buyerToken: string
  sellerToken: string
  partId: string
  status: string
}

/**
 * Seed a parts inventory item via POST /api/v1/parts/
 * Requires a seller (WeeeR) user token
 */
export async function seedPart(
  api: APIRequestContext,
  sellerToken: string,
  overrides?: Partial<{
    name: string
    sku: string
    unitPriceThb: number
    stockQuantity: number
  }>,
): Promise<{ id: string }> {
  const sku = `E2E-SKU-${Date.now()}`
  const res = await authPost(api, '/api/v1/parts/', sellerToken, {
    name: overrides?.name ?? 'E2E Test Part',
    sku: overrides?.sku ?? sku,
    unitPriceThb: overrides?.unitPriceThb ?? 100,
    stockQuantity: overrides?.stockQuantity ?? 50,
    description: 'E2E test part — auto-seeded',
  })

  const body = await res.json()
  return { id: body.id }
}

/**
 * Seed a parts order (pending → held) via POST /api/v1/parts/orders/
 */
export async function seedOrder(
  api: APIRequestContext,
  buyerToken: string,
  partId: string,
  overrides?: Partial<{ quantity: number }>,
): Promise<{ id: string; status: string }> {
  const idempotencyKey = `e2e-idem-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const res = await authPost(api, '/api/v1/parts/orders/', buyerToken, {
    partId,
    quantity: overrides?.quantity ?? 1,
    idempotencyKey,
  })
  const body = await res.json()
  return { id: body.id, status: body.status }
}
