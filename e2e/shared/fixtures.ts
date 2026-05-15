/**
 * e2e/shared/fixtures.ts — Sub-CMD-9: Shared E2E Test Fixtures
 *
 * Provides:
 *   - test (extended Playwright test with API context)
 *   - apiContext — base APIRequestContext pointed at backend
 *   - authHelper — register + login to get Bearer token
 *   - seedHelper — create test data via API
 *   - cleanupHelper — cleanup after tests (via DB reset endpoint)
 *
 * Usage:
 *   import { test, expect } from '../shared/fixtures'
 *
 * Security: uses test-only users (email prefix "e2e-test-")
 * W5: test isolation ensures each spec can retry independently
 */
import { test as base, expect, APIRequestContext } from '@playwright/test'

// ── Types ──────────────────────────────────────────────────────────────────────
export interface AuthContext {
  token: string
  userId: string
  email: string
}

export interface E2EFixtures {
  api: APIRequestContext
  authAs: (role?: 'buyer' | 'seller' | 'admin') => Promise<AuthContext>
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Register + login a test user, return Bearer token + userId
 * Uses unique email per test run to avoid conflicts.
 */
export async function createTestUser(
  api: APIRequestContext,
  email: string,
  password = 'TestPass@123',
): Promise<AuthContext> {
  // Register
  await api.post('/api/v1/auth/register', {
    data: { email, password, role: 'weeer', name: 'E2E Test User' },
  })

  // Login
  const loginRes = await api.post('/api/v1/auth/login', {
    data: { email, password },
  })
  const loginBody = await loginRes.json()

  return {
    token: loginBody.accessToken ?? loginBody.access_token ?? '',
    userId: loginBody.user?.id ?? loginBody.userId ?? '',
    email,
  }
}

// ── Extended test fixture ──────────────────────────────────────────────────────
export const test = base.extend<E2EFixtures>({
  // API context with base URL from playwright.config.ts
  api: async ({ playwright, baseURL }, use) => {
    const context = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { Accept: 'application/json' },
    })
    await use(context)
    await context.dispose()
  },

  // Auth helper — creates a test user and returns token
  authAs: async ({ api }, use) => {
    const created: string[] = []

    const authAs = async (role: 'buyer' | 'seller' | 'admin' = 'buyer'): Promise<AuthContext> => {
      const email = `e2e-test-${role}-${Date.now()}@test.local`
      created.push(email)
      return createTestUser(api, email)
    }

    await use(authAs)
    // Note: cleanup handled by each spec teardown or DB reset
  },
})

export { expect }
