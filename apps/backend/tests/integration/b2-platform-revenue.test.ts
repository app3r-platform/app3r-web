/**
 * b2-platform-revenue.test.ts — HUB Gen89 · B2 Platform Revenue Account STEP 1/2 (Backend)
 *
 * Verifies migration 0047 seed + resolver + the non-loginable guardrail.
 *   - getPlatformRevenueUserId() resolves the seeded user (deterministic UUID)
 *   - users row: role='platform' (outside login enum) · sentinel password_hash
 *   - 'cash' wallet seeded at balance 0 (revenue pool)
 *   - admin_config platform_fee_percent → getPlatformFeePercent() = 0 (CF1 NOT lifted)
 *   - GUARDRAIL: platform account cannot sign in (sentinel hash → bcrypt.compare false → 401)
 *
 * Requires DEV PG :5433 with migration 0047 applied (CI runs db:migrate:all first).
 * Reads PERMANENT seed rows — does NOT mutate/clean them.
 */
import { describe, it, expect } from 'vitest'
import { eq, and } from 'drizzle-orm'
import { app } from '../../src/app'
import { db } from '../../src/db/client'
import { users, wallets } from '../../src/db/schema'
import { verifyPassword } from '../../src/lib/password'
import { getPlatformFeePercent } from '../../src/lib/escrow-service'
import {
  getPlatformRevenueUserId,
  PLATFORM_REVENUE_USER_ID,
  PLATFORM_REVENUE_EMAIL,
} from '../../src/lib/platform-account'

const SENTINEL_HASH = '!SYSTEM_NON_LOGINABLE'

describe('B2 platform revenue account — seed + resolver (HUB Gen89)', () => {
  it('getPlatformRevenueUserId resolves seeded user = constant UUID', async () => {
    const id = await db.transaction((tx) => getPlatformRevenueUserId(tx))
    expect(id).toBe(PLATFORM_REVENUE_USER_ID)
  })

  it('users row: deterministic UUID · role=platform · sentinel hash', async () => {
    const [u] = await db.select().from(users).where(eq(users.email, PLATFORM_REVENUE_EMAIL)).limit(1)
    expect(u).toBeTruthy()
    expect(u!.id).toBe(PLATFORM_REVENUE_USER_ID)
    expect(u!.role).toBe('platform') // outside Zod login enum (weeeu|weeer|weeet|admin)
    expect(u!.passwordHash).toBe(SENTINEL_HASH)
  })

  it("'cash' wallet seeded at balance 0 (revenue pool · recipient ready)", async () => {
    const [w] = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.userId, PLATFORM_REVENUE_USER_ID), eq(wallets.pointType, 'cash')))
      .limit(1)
    expect(w).toBeTruthy()
    expect(w!.pointType).toBe('cash')
    expect(w!.balance).toBe(0)
  })

  it('platform_fee_percent forced 0 (CF1 NOT lifted)', async () => {
    const pct = await db.transaction((tx) => getPlatformFeePercent(tx))
    expect(pct).toBe(0)
  })
})

describe('B2 guardrail — platform account is non-loginable (HUB Gen89)', () => {
  it('sentinel hash can never match (bcrypt.compare false · no throw)', async () => {
    // len 21 ≠ 60 → bcryptjs returns false (does not throw) — proves the seed is unmatchable
    expect(await verifyPassword('any-guess', SENTINEL_HASH)).toBe(false)
    expect(await verifyPassword('', SENTINEL_HASH)).toBe(false)
  })

  it('POST /auth/signin with platform email → login fails, no token issued', async () => {
    const r = await app.request('/api/v1/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: PLATFORM_REVENUE_EMAIL, password: 'whatever-they-try' }),
    })
    // Non-loginable at MULTIPLE layers:
    //   (a) email '@system.app3r' fails zod .email() → 400 at the route boundary (cannot even submit)
    //   (b) even past (a), the sentinel password_hash → bcrypt.compare false → 401 INVALID_CREDENTIALS
    //       (proven independently by the verifyPassword test above)
    // Either path: NO access token is ever issued.
    expect([400, 401]).toContain(r.status)
    const b = (await r.json()) as { access_token?: string }
    expect(b.access_token).toBeUndefined()
  })
})
