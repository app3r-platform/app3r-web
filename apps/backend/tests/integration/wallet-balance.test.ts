/**
 * wallet-balance.test.ts — HUB Gen89 · go-live P0 (GET /wallet/gold-balance)
 *
 * Authenticated Gold (cash) balance · reuses point-service.getGoldBalance · self only (JWT userId).
 * Requires DEV PG :5433.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { app } from '../../src/app'
import { db } from '../../src/db/client'
import { users, refreshTokens, wallets } from '../../src/db/schema'

const TS = Date.now()
let userA: { id: string; token: string }
let userB: { id: string; token: string }

async function signup(tag: string) {
  const res = await app.request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `wal-${tag}-${TS}@app3r.test`, password: 'WalletTestPass123!', role: 'weeeu' }),
  })
  expect(res.status).toBe(201)
  const b = (await res.json()) as { access_token: string; user: { id: string } }
  return { id: b.user.id, token: b.access_token }
}
async function getBalance(token?: string) {
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
  return app.request('/api/v1/wallet/gold-balance', { headers })
}

beforeAll(async () => {
  userA = await signup('a')
  userB = await signup('b')
})
afterAll(async () => {
  for (const u of [userA, userB]) {
    if (u?.id) {
      await db.delete(wallets).where(eq(wallets.userId, u.id))
      await db.delete(refreshTokens).where(eq(refreshTokens.userId, u.id))
      await db.delete(users).where(eq(users.id, u.id))
    }
  }
})

describe('P0 GET /api/v1/wallet/gold-balance (HUB Gen89)', () => {
  it('no token → 401', async () => {
    const r = await getBalance()
    expect(r.status).toBe(401)
  })

  it('new user (no wallet) → 200 { balance: 0 }', async () => {
    const r = await getBalance(userA.token)
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ balance: 0 })
  })

  it('reflects seeded cash wallet (reuse getGoldBalance · no recompute)', async () => {
    await db.insert(wallets).values({ userId: userA.id, pointType: 'cash', balance: 350 })
    const r = await getBalance(userA.token)
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ balance: 350 })
  })

  it('self only — userB sees own balance, never userA', async () => {
    await db.insert(wallets).values({ userId: userB.id, pointType: 'cash', balance: 999 })
    const rb = await getBalance(userB.token)
    expect((await rb.json()).balance).toBe(999)
    // userA unaffected (balance derived from JWT, not any caller input)
    const ra = await getBalance(userA.token)
    expect((await ra.json()).balance).toBe(350)
  })
})
