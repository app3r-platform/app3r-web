/**
 * listing-routes.test.ts — W-Round-1 Wave 1.2 [3][4][5]: route mount + auth/visibility smoke
 *
 * ตรวจว่า router ใหม่ mount ถูก (ไม่ trie-conflict, ไม่ 5xx) + auth gate + GR-8 visibility shape
 * ไม่แตะ DB write — ใช้ app.request in-process (อ่าน/404/401 เท่านั้น)
 */
import { describe, it, expect } from 'vitest'
import { app } from '../../src/app'

const FAKE = '00000000-0000-0000-0000-000000000000'

async function req(method: string, path: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`
  return app.request(path, { method, headers, body: body ? JSON.stringify(body) : undefined })
}

describe('Wave 1.2 listing routes — mount + no 5xx', () => {
  it('GET /listings/{id} → 404 for missing (mounts, no 5xx)', async () => {
    const r = await req('GET', `/api/v1/listings/${FAKE}`)
    expect(r.status).toBe(404)
  })

  it('GET /listings/{id}/reviews → 200 (public, empty list)', async () => {
    const r = await req('GET', `/api/v1/listings/${FAKE}/reviews`)
    expect(r.status).toBe(200)
    const body = (await r.json()) as { items: unknown[] }
    expect(Array.isArray(body.items)).toBe(true)
  })

  it('GET /listings/{id}/questions → 404 when listing missing', async () => {
    const r = await req('GET', `/api/v1/listings/${FAKE}/questions`)
    expect(r.status).toBe(404)
  })
})

describe('Wave 1.2 auth gates', () => {
  it('POST /listings/{id}/transition without token → 401', async () => {
    const r = await req('POST', `/api/v1/listings/${FAKE}/transition`, { to: 'published' })
    expect(r.status).toBe(401)
  })

  it('POST /listings/{id}/reviews without token → 401', async () => {
    const r = await req('POST', `/api/v1/listings/${FAKE}/reviews`, { rating: 5 })
    expect(r.status).toBe(401)
  })

  it('POST /ads without token → 401', async () => {
    const r = await req('POST', `/api/v1/ads`, { listingId: FAKE, position: 'sidebar', durationDays: 3 })
    expect(r.status).toBe(401)
  })

  it('GET /admin/moderation without token → 401', async () => {
    const r = await req('GET', `/api/v1/admin/moderation`)
    expect(r.status).toBe(401)
  })

  it('GET /ads without token → 401', async () => {
    const r = await req('GET', `/api/v1/ads`)
    expect(r.status).toBe(401)
  })
})
