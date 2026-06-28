/**
 * dev-guard.test.ts — HUB Gen86 Task 1 (SECURITY)
 *
 * `_dev` routes must HARD-FAIL in production (not merely "not mounted") — even though no
 * `_dev/get-test-token` exists in the repo yet, the guard must protect it preemptively.
 *   @prod → reject (404 DEV_ROUTE_DISABLED · active reject)
 *   @dev  → allow (route reachable)
 * Not DB-backed.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { Hono } from 'hono'
import { devRouteGuard } from '../../src/middleware/dev-guard'
import { app } from '../../src/app'

// throwaway app that mounts the guard + dummy dev routes at both plausible mount points
function makeApp() {
  const a = new Hono()
  a.use('*', devRouteGuard)
  a.get('/_dev/ping', (c) => c.json({ ok: true }))
  a.get('/api/v1/_dev/get-test-token', (c) => c.json({ token: 'dev' }))
  a.get('/health', (c) => c.json({ ok: true }))
  return a
}

const ORIGINAL_NODE_ENV = process.env.NODE_ENV
afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_NODE_ENV
})

describe('dev-guard — hard-fail _dev routes in production (HUB Gen86 · SECURITY)', () => {
  it('@prod → _dev hard-rejected at BOTH mount points (404 + DEV_ROUTE_DISABLED)', async () => {
    process.env.NODE_ENV = 'production'
    const a = makeApp()
    for (const p of ['/_dev/ping', '/api/v1/_dev/get-test-token']) {
      const r = await a.request(p)
      expect(r.status).toBe(404)
      const b = (await r.json()) as { error?: { code?: string } }
      // distinct code proves an ACTIVE reject, not a plain route-miss
      expect(b.error?.code).toBe('DEV_ROUTE_DISABLED')
    }
  })

  it('@prod → non-dev route unaffected (guard targets only the _dev segment)', async () => {
    process.env.NODE_ENV = 'production'
    const r = await makeApp().request('/health')
    expect(r.status).toBe(200)
  })

  it('@dev → _dev route allowed (dev backdoor reachable in development)', async () => {
    process.env.NODE_ENV = 'development'
    const a = makeApp()
    const r = await a.request('/_dev/ping')
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ ok: true })
    const r2 = await a.request('/api/v1/_dev/get-test-token')
    expect(r2.status).toBe(200)
  })

  it('real app wires the guard — _dev path @prod → 404 DEV_ROUTE_DISABLED', async () => {
    process.env.NODE_ENV = 'production'
    const r = await app.request('/api/v1/_dev/get-test-token')
    expect(r.status).toBe(404)
    const b = (await r.json()) as { error?: { code?: string } }
    expect(b.error?.code).toBe('DEV_ROUTE_DISABLED')
  })
})
