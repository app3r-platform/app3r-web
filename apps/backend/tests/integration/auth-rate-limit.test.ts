/**
 * auth-rate-limit.test.ts — HUB Gen89 · go-live P1 (SECURITY BAR · rate-limit on auth endpoints)
 *
 * Proves: exceed N/IP/window → 429 (+ Retry-After) on the REAL wired /auth/signin · per-route buckets ·
 * disabled under NODE_ENV=test (no regression to the large existing auth suite) · dev-guard still hard-fails.
 *
 * Enforcement is env-gated (off in 'test'); each case flips NODE_ENV in-process (restored after) and uses
 * a UNIQUE X-Forwarded-For so buckets never collide with other tests. Uses bad/missing creds → NO DB writes.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { app } from '../../src/app'
import { AUTH_RATE_LIMIT } from '../../src/routes/auth'

const TS = Date.now()
const ORIGINAL_NODE_ENV = process.env.NODE_ENV
afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_NODE_ENV
})

function signin(ip: string, i: number) {
  return app.request('/api/v1/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email: `rl-${TS}-${i}@example.com`, password: 'wrong-guess' }),
  })
}

describe('P1 auth rate-limit — brute-force guard (HUB Gen89 · SECURITY BAR)', () => {
  it('@prod: signin exceed N → 429 + Retry-After (first N pass through as 401)', async () => {
    process.env.NODE_ENV = 'production'
    const ip = `198.51.100.10-${TS}`
    const results: Response[] = []
    for (let i = 0; i <= AUTH_RATE_LIMIT; i++) results.push(await signin(ip, i))
    // first N allowed through to the handler → 401 (bad creds · no DB write)
    expect(results[0]!.status).toBe(401)
    expect(results[AUTH_RATE_LIMIT - 1]!.status).toBe(401)
    // (N+1)th request is blocked
    const blocked = results[AUTH_RATE_LIMIT]!
    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('Retry-After')).toBeTruthy()
    const b = (await blocked.json()) as { error?: { code?: string } }
    expect(b.error?.code).toBe('RATE_LIMITED')
  })

  it('@test: limiter disabled → never 429 (existing auth suite not throttled · no regression)', async () => {
    // NODE_ENV stays 'test' (suite default)
    const ip = `203.0.113.20-${TS}`
    const statuses: number[] = []
    for (let i = 0; i <= AUTH_RATE_LIMIT + 2; i++) statuses.push((await signin(ip, i)).status)
    expect(statuses.some((s) => s === 429)).toBe(false)
  })

  it('@prod: per-route buckets — /auth/refresh independent of exhausted /auth/signin budget', async () => {
    process.env.NODE_ENV = 'production'
    const ip = `198.51.100.30-${TS}`
    for (let i = 0; i <= AUTH_RATE_LIMIT; i++) await signin(ip, i) // exhaust signin bucket (last → 429)
    // refresh = different path → its own bucket → first request passes rate-limit (→ 401 missing token, not 429)
    const rf = await app.request('/api/v1/auth/refresh', { method: 'POST', headers: { 'x-forwarded-for': ip } })
    expect(rf.status).not.toBe(429)
    expect(rf.status).toBe(401)
  })

  it('@prod: dev-guard still hard-fails _dev → 404 (rate-limit did not break it)', async () => {
    process.env.NODE_ENV = 'production'
    const r = await app.request('/api/v1/_dev/get-test-token')
    expect(r.status).toBe(404)
    const b = (await r.json()) as { error?: { code?: string } }
    expect(b.error?.code).toBe('DEV_ROUTE_DISABLED')
  })
})
