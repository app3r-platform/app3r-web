/**
 * d1-auth-points.test.ts — Phase D Sprint D-1 integration tests
 *
 * Rubrics:
 *   #1 POST /auth/otp-request → returns code (dev mode) + expiresAt
 *   #2 POST /auth/otp-verify → valid code = 200 verified
 *   #3 POST /auth/otp-verify → expired / used / wrong code = 400 INVALID_OTP
 *   #4 GET /points/balance → returns {gold, silver}
 *   #5 POST /points/topup → credits Gold · D75 rounding log on decimal input
 *   #6 POST /points/withdraw → debits Gold · insufficient = 400 INSUFFICIENT_GOLD
 *   #7 GET /users/me → returns profile + goldBalance
 *   #8 PUT /users/me → upserts user_profiles + returns updated data
 *   #9 GET /shops/me → non-WeeeR = 403 FORBIDDEN · WeeeR returns shop data
 *   #10 PUT /shops/me → upserts shop_profiles · non-WeeeR = 403
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { app } from '../../src/app'
import { db } from '../../src/db/client'
import { users, refreshTokens, wallets, otpCodes, userProfiles, shopProfiles, pointLedger } from '../../src/db/schema'

// ── Test users ────────────────────────────────────────────────────────────────
const STAMP = Date.now()
const TEST_USER = { email: `d1-user-${STAMP}@app3r.test`, password: 'TestPassword123!', role: 'weeeu' }
const TEST_WEEER = { email: `d1-shop-${STAMP}@app3r.test`, password: 'TestPassword123!', role: 'weeer' }

let userId: string
let weeerUserId: string
let accessToken: string
let weeerAccessToken: string

// ── Helpers ───────────────────────────────────────────────────────────────────
async function signup(email: string, password: string, role: string) {
  const res = await app.request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  })
  const body = await res.json() as { access_token: string; user: { id: string } }
  return { token: body.access_token, userId: body.user.id }
}

function bearer(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  const u = await signup(TEST_USER.email, TEST_USER.password, TEST_USER.role)
  userId = u.userId
  accessToken = u.token

  const r = await signup(TEST_WEEER.email, TEST_WEEER.password, TEST_WEEER.role)
  weeerUserId = r.userId
  weeerAccessToken = r.token
})

afterAll(async () => {
  for (const uid of [userId, weeerUserId]) {
    if (uid) {
      await db.delete(shopProfiles).where(eq(shopProfiles.userId, uid))
      await db.delete(userProfiles).where(eq(userProfiles.userId, uid))
      await db.delete(otpCodes).where(eq(otpCodes.userId, uid))
      await db.delete(pointLedger).where(eq(pointLedger.userId, uid))
      await db.delete(wallets).where(eq(wallets.userId, uid))
      await db.delete(refreshTokens).where(eq(refreshTokens.userId, uid))
      await db.delete(users).where(eq(users.id, uid))
    }
  }
})

// ── Rubric #1: OTP Request ────────────────────────────────────────────────────
describe('POST /api/v1/auth/otp-request', () => {
  it('#1a: returns OTP code + expiresAt in dev/test mode', async () => {
    const res = await app.request('/api/v1/auth/otp-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER.email, type: 'email_verify' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { code: string; expiresAt: string; message: string }
    expect(body.code).toMatch(/^\d{6}$/)
    expect(body.expiresAt).toBeTruthy()
    expect(body.message).toContain('OTP sent')
  })

  it('#1b: returns 404 for unknown email', async () => {
    const res = await app.request('/api/v1/auth/otp-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'no-such@app3r.test' }),
    })
    expect(res.status).toBe(404)
    const body = await res.json() as { error: { code: string } }
    expect(body.error.code).toBe('USER_NOT_FOUND')
  })
})

// ── Rubric #2 + #3: OTP Verify ───────────────────────────────────────────────
describe('POST /api/v1/auth/otp-verify', () => {
  it('#2: valid code → 200 verified:true', async () => {
    // Request a fresh OTP
    const reqRes = await app.request('/api/v1/auth/otp-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER.email, type: 'email_verify' }),
    })
    const { code } = await reqRes.json() as { code: string }

    const verifyRes = await app.request('/api/v1/auth/otp-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER.email, code, type: 'email_verify' }),
    })
    expect(verifyRes.status).toBe(200)
    const body = await verifyRes.json() as { verified: boolean }
    expect(body.verified).toBe(true)
  })

  it('#3a: already-used code → 400 INVALID_OTP', async () => {
    // Request OTP
    const reqRes = await app.request('/api/v1/auth/otp-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER.email }),
    })
    const { code } = await reqRes.json() as { code: string }

    // Use it once
    await app.request('/api/v1/auth/otp-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER.email, code }),
    })

    // Use it again → should fail
    const secondRes = await app.request('/api/v1/auth/otp-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER.email, code }),
    })
    expect(secondRes.status).toBe(400)
    const body = await secondRes.json() as { error: { code: string } }
    expect(body.error.code).toBe('INVALID_OTP')
  })

  it('#3b: wrong code → 400 INVALID_OTP', async () => {
    const res = await app.request('/api/v1/auth/otp-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER.email, code: '000000' }),
    })
    expect(res.status).toBe(400)
  })
})

// ── Rubric #4: GET /points/balance ────────────────────────────────────────────
describe('GET /api/v1/points/balance', () => {
  it('#4: returns {gold, silver} — both integers, default 0', async () => {
    const res = await app.request('/api/v1/points/balance', {
      headers: bearer(accessToken),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { gold: number; silver: number }
    expect(typeof body.gold).toBe('number')
    expect(typeof body.silver).toBe('number')
    expect(Number.isInteger(body.gold)).toBe(true)
    expect(Number.isInteger(body.silver)).toBe(true)
  })

  it('#4b: 401 without token', async () => {
    const res = await app.request('/api/v1/points/balance')
    expect(res.status).toBe(401)
  })
})

// ── Rubric #5: POST /points/topup ─────────────────────────────────────────────
describe('POST /api/v1/points/topup', () => {
  it('#5a: integer amount — credits Gold exactly', async () => {
    const res = await app.request('/api/v1/points/topup', {
      method: 'POST',
      headers: bearer(accessToken),
      body: JSON.stringify({ amountThb: 100 }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { goldCredited: number; balanceAfter: number; rounded: boolean }
    expect(body.goldCredited).toBe(100)
    expect(body.balanceAfter).toBe(100)
    expect(body.rounded).toBe(false)
  })

  it('#5b: decimal amount → D75 rounding applied + rounded=true', async () => {
    const res = await app.request('/api/v1/points/topup', {
      method: 'POST',
      headers: bearer(accessToken),
      body: JSON.stringify({ amountThb: 50.7 }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { goldCredited: number; rounded: boolean }
    // Math.round(50.7) = 51
    expect(body.goldCredited).toBe(51)
    expect(body.rounded).toBe(true)
  })

  it('#5c: D75 rounding down — .4 rounds down', async () => {
    const res = await app.request('/api/v1/points/topup', {
      method: 'POST',
      headers: bearer(accessToken),
      body: JSON.stringify({ amountThb: 10.4 }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { goldCredited: number; rounded: boolean }
    // Math.round(10.4) = 10
    expect(body.goldCredited).toBe(10)
    expect(body.rounded).toBe(true)
  })
})

// ── Rubric #6: POST /points/withdraw ──────────────────────────────────────────
describe('POST /api/v1/points/withdraw', () => {
  it('#6a: withdraw within balance → 200 debited', async () => {
    // Balance from previous topups: 100 + 51 + 10 = 161
    const res = await app.request('/api/v1/points/withdraw', {
      method: 'POST',
      headers: bearer(accessToken),
      body: JSON.stringify({ goldAmount: 50 }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { goldDebited: number; balanceAfter: number }
    expect(body.goldDebited).toBe(50)
    expect(body.balanceAfter).toBeLessThan(200)
    expect(body.balanceAfter).toBeGreaterThanOrEqual(0)
  })

  it('#6b: insufficient balance → 400 INSUFFICIENT_GOLD', async () => {
    const res = await app.request('/api/v1/points/withdraw', {
      method: 'POST',
      headers: bearer(accessToken),
      body: JSON.stringify({ goldAmount: 999999 }),
    })
    expect(res.status).toBe(400)
    const body = await res.json() as { error: { code: string } }
    expect(body.error.code).toBe('INSUFFICIENT_GOLD')
  })
})

// ── Rubric #7: GET /users/me ──────────────────────────────────────────────────
describe('GET /api/v1/users/me', () => {
  it('#7: returns user info + goldBalance', async () => {
    const res = await app.request('/api/v1/users/me', {
      headers: bearer(accessToken),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as {
      id: string; email: string; role: string
      displayName: string | null; goldBalance: number
    }
    expect(body.id).toBe(userId)
    expect(body.email).toBe(TEST_USER.email)
    expect(body.role).toBe('weeeu')
    expect(typeof body.goldBalance).toBe('number')
    // displayName not set yet
    expect(body.displayName).toBeNull()
  })
})

// ── Rubric #8: PUT /users/me ──────────────────────────────────────────────────
describe('PUT /api/v1/users/me', () => {
  it('#8a: create profile on first PUT → 200 with updated fields', async () => {
    const res = await app.request('/api/v1/users/me', {
      method: 'PUT',
      headers: bearer(accessToken),
      body: JSON.stringify({ displayName: 'Test User D1', phone: '0812345678' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { displayName: string; phone: string }
    expect(body.displayName).toBe('Test User D1')
    expect(body.phone).toBe('0812345678')
  })

  it('#8b: GET /users/me reflects the update', async () => {
    const res = await app.request('/api/v1/users/me', {
      headers: bearer(accessToken),
    })
    const body = await res.json() as { displayName: string }
    expect(body.displayName).toBe('Test User D1')
  })

  it('#8c: update single field without wiping others', async () => {
    const res = await app.request('/api/v1/users/me', {
      method: 'PUT',
      headers: bearer(accessToken),
      body: JSON.stringify({ displayName: 'Updated Name' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { displayName: string; phone: string }
    expect(body.displayName).toBe('Updated Name')
    // phone should still be set from previous PUT
    expect(body.phone).toBe('0812345678')
  })
})

// ── Rubric #9 + #10: GET/PUT /shops/me ───────────────────────────────────────
describe('GET /api/v1/shops/me', () => {
  it('#9a: non-WeeeR (weeeu) → 403 FORBIDDEN', async () => {
    const res = await app.request('/api/v1/shops/me', {
      headers: bearer(accessToken),
    })
    expect(res.status).toBe(403)
    const body = await res.json() as { error: { code: string } }
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('#9b: WeeeR returns empty shop profile by default', async () => {
    const res = await app.request('/api/v1/shops/me', {
      headers: bearer(weeerAccessToken),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { userId: string; shopName: string; phone: null }
    expect(body.userId).toBe(weeerUserId)
    expect(body.shopName).toBe('')
    expect(body.phone).toBeNull()
  })
})

describe('PUT /api/v1/shops/me', () => {
  it('#10a: non-WeeeR → 403 FORBIDDEN', async () => {
    const res = await app.request('/api/v1/shops/me', {
      method: 'PUT',
      headers: bearer(accessToken),
      body: JSON.stringify({ shopName: 'Hacker Shop' }),
    })
    expect(res.status).toBe(403)
  })

  it('#10b: WeeeR creates shop profile → 200 with data', async () => {
    const res = await app.request('/api/v1/shops/me', {
      method: 'PUT',
      headers: bearer(weeerAccessToken),
      body: JSON.stringify({
        shopName: 'D1 Test Shop',
        phone: '0891234567',
        address: '123 Main St, Bangkok',
        description: 'Best repair shop',
      }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { shopName: string; phone: string; address: string; description: string }
    expect(body.shopName).toBe('D1 Test Shop')
    expect(body.phone).toBe('0891234567')
    expect(body.address).toBe('123 Main St, Bangkok')
    expect(body.description).toBe('Best repair shop')
  })

  it('#10c: GET /shops/me reflects PUT', async () => {
    const res = await app.request('/api/v1/shops/me', {
      headers: bearer(weeerAccessToken),
    })
    const body = await res.json() as { shopName: string }
    expect(body.shopName).toBe('D1 Test Shop')
  })
})
