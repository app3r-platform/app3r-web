/**
 * e2e/admin/auth.spec.ts — Sub-CMD-9: Admin Auth Flow E2E
 *
 * Scope: API-level E2E for admin authentication
 * W5: max 2 retries (playwright.config.ts)
 * Pattern: Page Object Model (Protocol item 11)
 *
 * Tests:
 *   1. GET /health — backend is up
 *   2. POST /auth/signup — admin role registration → 201
 *   3. POST /auth/signin — admin credentials → 200 + access_token
 *   4. POST /auth/signin — wrong password → 401
 *   5. GET /auth/me — admin token → role = 'admin'
 *   6. GET /auth/me — no token → 401
 *   7. POST /auth/signin — non-existent email → 401
 *
 * Sub-CMD-9: 361813ec-7277-81d3-a2b2-dffb9c71bfe8
 */
import { test, expect } from '@playwright/test'
import { AdminAuthPage, createAndLoginUser } from './helpers'

// ── Page Object Model ─────────────────────────────────────────────────────────

test.describe('Admin Auth — E2E Smoke', () => {

  test('GET /health — backend is up', async ({ request }) => {
    const res = await request.get('/health')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('status')
  })

  test('POST /api/v1/auth/signup — admin role → 201', async ({ request }) => {
    const authPage = new AdminAuthPage(request)
    const email = `e2e-admin-signup-${Date.now()}@test.local`

    const res = await authPage.signup(email, 'AdminTest@9999', 'admin')
    expect(res.status()).toBe(201)

    const body = await res.json()
    expect(body).toHaveProperty('access_token')
    expect(body.user.email).toBe(email)
    expect(body.user.role).toBe('admin')
  })

  test('POST /api/v1/auth/signin — admin credentials → 200 + access_token', async ({ request }) => {
    const authPage = new AdminAuthPage(request)
    const email = `e2e-admin-signin-${Date.now()}@test.local`

    // Register first
    await authPage.signup(email, 'AdminTest@9999', 'admin')

    // Sign in
    const res = await authPage.signin(email, 'AdminTest@9999')
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty('access_token')
    expect(typeof body.access_token).toBe('string')
    expect(body.access_token.length).toBeGreaterThan(10)
    expect(body.user.role).toBe('admin')
  })

  test('POST /api/v1/auth/signin — wrong password → 401', async ({ request }) => {
    const authPage = new AdminAuthPage(request)
    const email = `e2e-admin-wrongpw-${Date.now()}@test.local`

    await authPage.signup(email, 'AdminTest@9999', 'admin')

    const res = await authPage.signin(email, 'WrongPassword@000')
    expect(res.status()).toBe(401)

    const body = await res.json()
    expect(body).toHaveProperty('error')
    expect(body.error.code).toBe('INVALID_CREDENTIALS')
  })

  test('POST /api/v1/auth/signin — non-existent email → 401', async ({ request }) => {
    const authPage = new AdminAuthPage(request)
    const res = await authPage.signin('nonexistent-admin@test.local', 'AdminTest@9999')
    expect(res.status()).toBe(401)
  })

  test('GET /api/v1/auth/me — admin token → role = admin', async ({ request }) => {
    // Create and login admin user
    const auth = await createAndLoginUser(request, 'admin')
    expect(auth.role).toBe('admin')

    // Verify /me endpoint returns admin role
    const authPage = new AdminAuthPage(request, auth.token)
    const res = await authPage.me()
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body.user.role).toBe('admin')
    expect(body.user.id).toBe(auth.userId)
  })

  test('GET /api/v1/auth/me — no token → 401', async ({ request }) => {
    const authPage = new AdminAuthPage(request) // no token
    const res = await authPage.me()
    expect(res.status()).toBe(401)
  })
})
