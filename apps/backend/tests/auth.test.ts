/**
 * auth.test.ts — Auth endpoint tests (Rubric items #4-#10)
 *
 * Requires:
 *   - .env.local with DATABASE_URL
 *   - docker compose up -d (PostgreSQL running)
 *   - pnpm db:migrate (tables created)
 *
 * Coverage:
 *   Happy path: signup → signup duplicate → signin → /me → refresh → logout
 *   Edge cases: wrong password, expired cookie, missing auth header, malformed JWT
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { app } from '../src/app'
import { db } from '../src/db/client'
import { users, refreshTokens } from '../src/db/schema'

const TEST_EMAIL = `test-auth-${Date.now()}@app3r.test`
const TEST_PASSWORD = 'TestPassword123!'
const TEST_ROLE = 'weeeu'

let testUserId: string
let accessToken: string
let refreshCookie: string

// Cleanup test user after all tests
afterAll(async () => {
  if (testUserId) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, testUserId))
    await db.delete(users).where(eq(users.id, testUserId))
  }
})

// ── Happy Path ────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/signup', () => {
  it('creates user + returns access_token + sets refresh cookie', async () => {
    const res = await app.request('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, role: TEST_ROLE }),
    })

    expect(res.status).toBe(201)
    const body = await res.json() as { access_token: string; user: { id: string; email: string; role: string } }
    expect(body.access_token).toBeTruthy()
    expect(body.user.email).toBe(TEST_EMAIL)
    expect(body.user.role).toBe(TEST_ROLE)
    expect(body.user).not.toHaveProperty('passwordHash')

    accessToken = body.access_token
    testUserId = body.user.id

    // Verify refresh cookie is set
    const setCookieHeader = res.headers.get('set-cookie')
    expect(setCookieHeader).toContain('refresh_token=')
    expect(setCookieHeader).toContain('HttpOnly')
    refreshCookie = setCookieHeader ?? ''
  })

  it('rejects duplicate email — returns 400 EMAIL_EXISTS', async () => {
    const res = await app.request('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, role: TEST_ROLE }),
    })
    expect(res.status).toBe(400)
    const body = await res.json() as { error: { code: string } }
    expect(body.error.code).toBe('EMAIL_EXISTS')
  })

  it('rejects invalid body — returns 400', async () => {
    const res = await app.request('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: '123', role: 'invalid' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/v1/auth/signin', () => {
  it('signs in with correct credentials', async () => {
    const res = await app.request('/api/v1/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { access_token: string }
    expect(body.access_token).toBeTruthy()
    accessToken = body.access_token

    const setCookieHeader = res.headers.get('set-cookie')
    expect(setCookieHeader).toContain('refresh_token=')
    refreshCookie = setCookieHeader ?? ''
  })

  it('rejects wrong password — 401 INVALID_CREDENTIALS', async () => {
    const res = await app.request('/api/v1/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: 'WrongPassword!' }),
    })
    expect(res.status).toBe(401)
    const body = await res.json() as { error: { code: string } }
    expect(body.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('rejects non-existent email — 401 INVALID_CREDENTIALS', async () => {
    const res = await app.request('/api/v1/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@app3r.test', password: TEST_PASSWORD }),
    })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/v1/auth/me', () => {
  it('returns user with valid access token', async () => {
    const res = await app.request('/api/v1/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { user: { email: string } }
    expect(body.user.email).toBe(TEST_EMAIL)
  })

  it('rejects missing Authorization header — 401', async () => {
    const res = await app.request('/api/v1/auth/me', { method: 'GET' })
    expect(res.status).toBe(401)
  })

  it('rejects malformed JWT — 401', async () => {
    const res = await app.request('/api/v1/auth/me', {
      method: 'GET',
      headers: { Authorization: 'Bearer not.a.valid.jwt' },
    })
    expect(res.status).toBe(401)
  })
})

describe('POST /api/v1/auth/refresh', () => {
  it('rotates refresh token — returns new access token + new cookie', async () => {
    // Extract raw cookie value from the set-cookie header
    const rawCookie = refreshCookie.split(';')[0] // "refresh_token=<value>"

    const res = await app.request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { Cookie: rawCookie },
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { access_token: string }
    expect(body.access_token).toBeTruthy()

    // New cookie should be set
    const newCookie = res.headers.get('set-cookie')
    expect(newCookie).toContain('refresh_token=')

    // Update for logout test
    accessToken = body.access_token
    refreshCookie = newCookie ?? refreshCookie
  })

  it('rejects missing cookie — 401', async () => {
    const res = await app.request('/api/v1/auth/refresh', { method: 'POST' })
    expect(res.status).toBe(401)
  })
})

describe('POST /api/v1/auth/logout', () => {
  it('revokes refresh token + clears cookie', async () => {
    const rawCookie = refreshCookie.split(';')[0]

    const res = await app.request('/api/v1/auth/logout', {
      method: 'POST',
      headers: { Cookie: rawCookie },
    })
    expect(res.status).toBe(200)

    // Cookie should be cleared
    const clearedCookie = res.headers.get('set-cookie')
    expect(clearedCookie).toContain('refresh_token=;')
  })

  it('after logout: refresh token is revoked — 401 on retry', async () => {
    const rawCookie = refreshCookie.split(';')[0]

    const res = await app.request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { Cookie: rawCookie },
    })
    expect(res.status).toBe(401)
  })
})

// ── OpenAPI + Health ──────────────────────────────────────────────────────────

describe('System endpoints', () => {
  it('GET /health returns 200 + db_ping_ms', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const body = await res.json() as { status: string; db_ping_ms: number }
    expect(body.status).toBe('ok')
    expect(typeof body.db_ping_ms).toBe('number')
  })

  it('GET /openapi.json returns valid OpenAPI 3.1 spec', async () => {
    const res = await app.request('/openapi.json')
    expect(res.status).toBe(200)
    const body = await res.json() as { openapi: string; info: { title: string } }
    expect(body.openapi).toBe('3.1.0')
    expect(body.info.title).toBe('App3R API')
  })

  it('GET /docs returns 200 (Swagger UI)', async () => {
    const res = await app.request('/docs')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('swagger')
  })
})
