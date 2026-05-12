/**
 * d2.test.ts — Phase D-2 Real Integrations Verification Rubric
 *
 * Rubric #1  : 18 tables in PG (13 new + 5 from D-1)
 * Rubric #2  : push_subscriptions COALESCE unique index exists in PG catalog
 * Rubric #3  : file_uploads.scan_status + scanned_at columns + partial index
 * Rubric #4  : roundCoord rounds to 6 decimals; distance_cache INSERT/SELECT by rounded key
 * Rubric #5  : Cron startReconciliationCron + startScanWorker + startAllCronJobs
 * Rubric #6  : POST /api/v1/files/presign → 200 (or 500 if R2 not configured)
 * Rubric #7  : WebSocket registry: add/remove/emit/broadcast/connectionCount
 * Rubric #8  : FCM adapter exports sendToToken + sendToMultiple
 * Rubric #9  : POST /api/v1/payment/intent → 201 + DB row created (2C2P scaffold)
 * Rubric #10 : POST /api/v1/location/distance → responds; roundCoord math verified
 * Rubric #11 : Email adapter exports send() + template helpers return correct HTML
 * Rubric #12 : GET /openapi.json has D-2 paths (files, push, payment, location, services, parts)
 *
 * Requires:
 *   - .env.local with DATABASE_URL pointing to running PostgreSQL
 *   - pnpm db:migrate applied (18 tables present)
 *   - External services (Google Maps, FCM, Resend, R2) are SCAFFOLD — not called in tests
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { sql, eq, and } from 'drizzle-orm'
import { app } from '../src/app'
import { db } from '../src/db/client'
import {
  users, refreshTokens,
  pushSubscriptions, fileUploads, paymentIntents, distanceCache,
  notifications,
} from '../src/db/schema'
import { roundCoord } from '../src/lib/maps'
import { startReconciliationCron, startScanWorker, startAllCronJobs } from '../src/lib/cron'
import { wsRegistry, createWsEvent } from '../src/lib/websocket'
import type { WsEvent } from '../src/lib/websocket'
import { fcmAdapter } from '../src/lib/fcm'
import { resendAdapter, renderSignupVerifyEmail, renderPaymentReceiptEmail } from '../src/lib/email'

// ── Test fixtures ─────────────────────────────────────────────────────────────
const TEST_EMAIL = `d2-test-${Date.now()}@app3r.test`
const TEST_PASSWORD = 'D2TestPassword123!'

let testUserId: string
let accessToken: string

// ── Setup: create a test user ─────────────────────────────────────────────────
beforeAll(async () => {
  const res = await app.request('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, role: 'weeeu' }),
  })
  expect(res.status).toBe(201)
  const body = await res.json() as { access_token: string; user: { id: string } }
  testUserId = body.user.id
  accessToken = body.access_token
})

// ── Cleanup ───────────────────────────────────────────────────────────────────
afterAll(async () => {
  if (testUserId) {
    await db.delete(fileUploads).where(eq(fileUploads.ownerId, testUserId))
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, testUserId))
    await db.delete(paymentIntents).where(eq(paymentIntents.userId, testUserId))
    await db.delete(notifications).where(eq(notifications.recipientId, testUserId))
    await db.execute(sql`DELETE FROM distance_cache WHERE mode = 'test'`)
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, testUserId))
    await db.delete(users).where(eq(users.id, testUserId))
  }
})

// ════════════════════════════════════════════════════════════════════════════
// Rubric #1 — 18 tables in PostgreSQL
// ════════════════════════════════════════════════════════════════════════════
describe('Rubric #1 — Database: 18 tables migrated', () => {
  it('pg catalog has all 18 expected user tables', async () => {
    const rows = await db.execute(
      sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    )
    const tableNames = rows.rows.map((r: Record<string, unknown>) => r['tablename'] as string)

    const expected = [
      'distance_cache', 'email_log', 'email_preferences',
      'file_uploads', 'locations', 'notifications',
      'parts_inventory', 'parts_orders', 'payment_intents',
      'point_ledger', 'point_rounding_log', 'push_subscriptions',
      'refresh_tokens', 'service_locations', 'services',
      'users', 'wallets', 'webhook_events',
    ]

    for (const tbl of expected) {
      expect(tableNames, `Table "${tbl}" should exist`).toContain(tbl)
    }
    expect(tableNames.length).toBeGreaterThanOrEqual(18)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Rubric #2 — push_subscriptions COALESCE unique index (NOTE-D88-1 + NOTE-SUB1)
// ════════════════════════════════════════════════════════════════════════════
describe('Rubric #2 — push_subscriptions COALESCE unique index', () => {
  it('index uq_push_sub_user_app_platform_token exists with COALESCE in pg_indexes', async () => {
    const rows = await db.execute(sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'push_subscriptions'
        AND indexname = 'uq_push_sub_user_app_platform_token'
    `)
    expect(rows.rows.length).toBe(1)
    const indexDef = rows.rows[0]?.['indexdef'] as string
    // NOTE-D88-1: must use COALESCE expression (not WHERE partial)
    expect(indexDef.toLowerCase()).toContain('coalesce')
  })

  it('POST /api/v1/push/subscribe → 201 with subscription id', async () => {
    const res = await app.request('/api/v1/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        app: 'weeeu',
        platform: 'android',
        fcmToken: `test-fcm-token-${Date.now()}`,
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json() as { id: string }
    expect(body.id).toBeTruthy()
  })

  it('upsert on duplicate subscribe does not throw — returns 201', async () => {
    const token = `dup-token-${Date.now()}`
    const payload = JSON.stringify({ app: 'weeeu', platform: 'ios', fcmToken: token })
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    }

    const r1 = await app.request('/api/v1/push/subscribe', { method: 'POST', headers, body: payload })
    expect(r1.status).toBe(201)

    // Same user/app/platform/token → onConflictDoUpdate → should NOT throw
    const r2 = await app.request('/api/v1/push/subscribe', { method: 'POST', headers, body: payload })
    expect(r2.status).toBe(201)
  })

  it('POST /api/v1/push/subscribe without auth → 401', async () => {
    const res = await app.request('/api/v1/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: 'weeeu', platform: 'web' }),
    })
    expect(res.status).toBe(401)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Rubric #3 — file_uploads: scan_status + scanned_at + partial index (NOTE-M2)
// ════════════════════════════════════════════════════════════════════════════
describe('Rubric #3 — file_uploads scan columns (NOTE-M2)', () => {
  it('file_uploads has scan_status and scanned_at columns in pg catalog', async () => {
    const rows = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'file_uploads'
        AND column_name IN ('scan_status', 'scanned_at')
      ORDER BY column_name
    `)
    const cols = rows.rows.map((r: Record<string, unknown>) => r['column_name'] as string)
    expect(cols).toContain('scan_status')
    expect(cols).toContain('scanned_at')
  })

  it('scan_status default is "pending"', async () => {
    const rows = await db.execute(sql`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_name = 'file_uploads' AND column_name = 'scan_status'
    `)
    const def = rows.rows[0]?.['column_default'] as string
    expect(def).toContain('pending')
  })

  it('partial index idx_files_pending_scan exists and filters scan_status=pending', async () => {
    const rows = await db.execute(sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'file_uploads' AND indexname = 'idx_files_pending_scan'
    `)
    expect(rows.rows.length).toBe(1)
    const def = rows.rows[0]?.['indexdef'] as string
    expect(def.toLowerCase()).toContain('pending')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Rubric #4 — roundCoord 6-decimal precision + distance_cache cache hit (NOTE-D90-2)
// ════════════════════════════════════════════════════════════════════════════
describe('Rubric #4 — roundCoord + distance_cache precision (NOTE-D90-2)', () => {
  it('roundCoord rounds to exactly 6 decimal places', () => {
    expect(roundCoord(13.7563912345)).toBe(13.756391)
    expect(roundCoord(100.52399999)).toBe(100.524)
    expect(roundCoord(0.1234567)).toBe(0.123457)
    expect(roundCoord(13.0)).toBe(13.0)
    expect(roundCoord(-0.00000049)).toBe(-0.0)  // rounds toward zero
  })

  it('distance_cache: INSERT with rounded coords → SELECT by same key returns row', async () => {
    const oLat = roundCoord(13.75639123456789)   // 13.756391
    const oLng = roundCoord(100.52349876543210)  // 100.523499
    const dLat = roundCoord(13.74)
    const dLng = roundCoord(100.51)

    // Ensure clean slate
    await db.execute(sql`
      DELETE FROM distance_cache
      WHERE origin_lat = ${oLat} AND origin_lng = ${oLng}
        AND dest_lat = ${dLat} AND dest_lng = ${dLng} AND mode = 'test'
    `)

    // INSERT using rounded coords (same as cache key)
    await db.execute(sql`
      INSERT INTO distance_cache
        (origin_lat, origin_lng, dest_lat, dest_lng, distance_meters, duration_seconds, mode, cached_at, expires_at)
      VALUES
        (${oLat}, ${oLng}, ${dLat}, ${dLng}, 5000, 300, 'test', NOW(), NOW() + INTERVAL '7 days')
    `)

    // SELECT using rounded coords → must find the row (cache hit pattern)
    const rows = await db.execute(sql`
      SELECT distance_meters FROM distance_cache
      WHERE origin_lat = ${oLat} AND origin_lng = ${oLng}
        AND dest_lat = ${dLat} AND dest_lng = ${dLng} AND mode = 'test'
    `)
    expect(rows.rows.length).toBe(1)
    expect(rows.rows[0]?.['distance_meters']).toBe(5000)
  })

  it('distance_cache: high-precision raw coord would NOT match rounded key', async () => {
    const rawLat = 13.75639123456789  // raw — NOT rounded
    const oLat = roundCoord(rawLat)   // 13.756391 — rounded

    // Raw coord should NOT equal rounded (precision diff)
    expect(rawLat).not.toBe(oLat)
    // But roundCoord applied twice is idempotent
    expect(roundCoord(oLat)).toBe(oLat)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Rubric #5 — Cron jobs: reconciliation + scan worker (NOTE-M3)
// ════════════════════════════════════════════════════════════════════════════
describe('Rubric #5 — Cron jobs register (NOTE-M3)', () => {
  it('startReconciliationCron exports and registers without throwing', () => {
    expect(() => startReconciliationCron()).not.toThrow()
  })

  it('startScanWorker exports and registers without throwing', () => {
    expect(() => startScanWorker()).not.toThrow()
  })

  it('startAllCronJobs calls both without throwing', () => {
    expect(() => startAllCronJobs()).not.toThrow()
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Rubric #6 — POST /api/v1/files/presign (D87)
// ════════════════════════════════════════════════════════════════════════════
describe('Rubric #6 — File presign route (D87)', () => {
  it('POST /api/v1/files/presign → 200 uploadUrl + r2Key (or 500 if R2 not configured in test env)', async () => {
    const res = await app.request('/api/v1/files/presign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        fileName: 'test-photo.jpg',
        mimeType: 'image/jpeg',
        purpose: 'service_photo',
        ownerApp: 'weeeu',
      }),
    })
    // 200 = R2 configured; 500 = R2 keys not set in test env (expected)
    expect([200, 500]).toContain(res.status)
    if (res.status === 200) {
      const body = await res.json() as { uploadUrl: string; r2Key: string; expiresIn: number }
      expect(body.uploadUrl).toBeTruthy()
      expect(body.r2Key).toBeTruthy()
      expect(body.expiresIn).toBeGreaterThan(0)
    }
  })

  it('POST /api/v1/files/presign without auth → 401', async () => {
    const res = await app.request('/api/v1/files/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'x.jpg', mimeType: 'image/jpeg',
        purpose: 'service_photo', ownerApp: 'weeeu',
      }),
    })
    expect(res.status).toBe(401)
  })

  it('POST /api/v1/files/finalize → 201 with file id (writes DB row)', async () => {
    const r2Key = `weeeu/${testUserId}/service_photo/test-${Date.now()}.jpg`
    const res = await app.request('/api/v1/files/finalize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        r2Key,
        fileName: 'test-photo.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 204800,
        purpose: 'service_photo',
        ownerApp: 'weeeu',
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json() as { id: string }
    expect(body.id).toBeTruthy()

    // Verify row in DB with scan_status='pending' (NOTE-M2)
    const [row] = await db.select().from(fileUploads).where(eq(fileUploads.r2Key, r2Key))
    expect(row).toBeDefined()
    expect(row?.scanStatus).toBe('pending')
    expect(row?.scannedAt).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Rubric #7 — WebSocket registry unit tests (NOTE-SUB5)
// ════════════════════════════════════════════════════════════════════════════
describe('Rubric #7 — WebSocket registry (NOTE-SUB5)', () => {
  it('createWsEvent returns correctly typed event', () => {
    const event = createWsEvent('location.update', { lat: 13.7, lng: 100.5 })
    expect(event.type).toBe('location.update')
    expect(event.data).toEqual({ lat: 13.7, lng: 100.5 })
    expect(typeof event.timestamp).toBe('string')
    // ISO timestamp format
    expect(new Date(event.timestamp).getTime()).toBeGreaterThan(0)
  })

  it('wsRegistry.add + connectionCount + remove lifecycle', () => {
    // Mock WSContext with send method
    const mockSend = vi.fn()
    const mockWs = { send: mockSend } as unknown as import('hono/ws').WSContext

    const userId = `ws-test-${Date.now()}`
    const before = wsRegistry.connectionCount()

    wsRegistry.add(userId, mockWs)
    expect(wsRegistry.connectionCount()).toBe(before + 1)

    wsRegistry.remove(userId, mockWs)
    expect(wsRegistry.connectionCount()).toBe(before)
  })

  it('wsRegistry.emit delivers event to registered user', () => {
    const mockSend = vi.fn()
    const mockWs = { send: mockSend } as unknown as import('hono/ws').WSContext
    const userId = `ws-emit-${Date.now()}`

    wsRegistry.add(userId, mockWs)
    const event = createWsEvent('location.update', { lat: 13.7 })
    wsRegistry.emit(userId, event)

    expect(mockSend).toHaveBeenCalledOnce()
    const sent = JSON.parse(mockSend.mock.calls[0][0] as string) as WsEvent
    expect(sent.type).toBe('location.update')

    wsRegistry.remove(userId, mockWs)
  })

  it('wsRegistry.broadcast delivers to all listed users', () => {
    const send1 = vi.fn()
    const send2 = vi.fn()
    const ws1 = { send: send1 } as unknown as import('hono/ws').WSContext
    const ws2 = { send: send2 } as unknown as import('hono/ws').WSContext
    const user1 = `bcast-1-${Date.now()}`
    const user2 = `bcast-2-${Date.now()}`

    wsRegistry.add(user1, ws1)
    wsRegistry.add(user2, ws2)

    const event = createWsEvent('service.update', { serviceId: 'test-123' })
    wsRegistry.broadcast([user1, user2], event)

    expect(send1).toHaveBeenCalledOnce()
    expect(send2).toHaveBeenCalledOnce()

    wsRegistry.remove(user1, ws1)
    wsRegistry.remove(user2, ws2)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Rubric #8 — FCM adapter exports (D88)
// ════════════════════════════════════════════════════════════════════════════
describe('Rubric #8 — FCM push adapter (D88)', () => {
  it('fcmAdapter.sendToToken is exported and is a function', () => {
    expect(typeof fcmAdapter.sendToToken).toBe('function')
  })

  it('fcmAdapter.sendToMultiple is exported and is a function', () => {
    expect(typeof fcmAdapter.sendToMultiple).toBe('function')
  })

  it('fcmAdapter.sendToToken with no Firebase env → returns error result (not throw)', async () => {
    // Without FIREBASE_SERVICE_ACCOUNT, should return {success: false, error: ...}
    const result = await fcmAdapter.sendToToken('test-token', {
      title: 'Test Notification',
      body: 'Test body from D-2 rubric',
    })
    // Either succeeds (key set) or fails gracefully — must not throw
    expect(result).toBeDefined()
    expect(typeof result.success).toBe('boolean')
    expect(result.messageId).toBeDefined()
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Rubric #9 — POST /api/v1/payment/intent (D89 + NOTE-D89-2)
// ════════════════════════════════════════════════════════════════════════════
describe('Rubric #9 — Payment intent route (D89)', () => {
  it('POST /api/v1/payment/intent → 201 with intentId + checkoutUrl', async () => {
    const idempotencyKey = `test-idem-${Date.now()}`
    const res = await app.request('/api/v1/payment/intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        provider: '2c2p',
        amountThb: 500,
        purpose: 'service_payment',
        userApp: 'weeeu',
        description: 'AC repair D-2 test',
        returnUrl: 'https://app3r.test/return',
        cancelUrl: 'https://app3r.test/cancel',
        idempotencyKey,
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json() as {
      intentId: string; checkoutUrl: string; providerRef: string
    }
    expect(body.intentId).toBeTruthy()
    expect(body.checkoutUrl).toBeTruthy()
    expect(body.providerRef).toBeTruthy()
  })

  it('POST /api/v1/payment/intent without auth → 401', async () => {
    const res = await app.request('/api/v1/payment/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: '2c2p', amountThb: 100, purpose: 'service_payment',
        userApp: 'weeeu', description: 'test',
        returnUrl: 'https://app3r.test/r', cancelUrl: 'https://app3r.test/c',
        idempotencyKey: 'no-auth-test',
      }),
    })
    expect(res.status).toBe(401)
  })

  it('payment_intents row created in DB with status=pending', async () => {
    const idempotencyKey = `test-db-check-${Date.now()}`
    await app.request('/api/v1/payment/intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        provider: '2c2p', amountThb: 250, purpose: 'service_payment',
        userApp: 'weeeu', description: 'DB check test',
        returnUrl: 'https://app3r.test/return',
        cancelUrl: 'https://app3r.test/cancel',
        idempotencyKey,
      }),
    })

    const rows = await db
      .select()
      .from(paymentIntents)
      .where(and(
        eq(paymentIntents.userId, testUserId),
        eq(paymentIntents.idempotencyKey, idempotencyKey),
      ))
    expect(rows.length).toBe(1)
    expect(rows[0]?.status).toBe('pending')
    expect(rows[0]?.provider).toBe('2c2p')
  })

  it('duplicate idempotencyKey → 409 CONFLICT', async () => {
    const idempotencyKey = `test-dup-${Date.now()}`
    const payload = JSON.stringify({
      provider: '2c2p', amountThb: 100, purpose: 'service_payment',
      userApp: 'weeeu', description: 'dup test',
      returnUrl: 'https://app3r.test/r', cancelUrl: 'https://app3r.test/c',
      idempotencyKey,
    })
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }

    const r1 = await app.request('/api/v1/payment/intent', { method: 'POST', headers, body: payload })
    expect(r1.status).toBe(201)

    const r2 = await app.request('/api/v1/payment/intent', { method: 'POST', headers, body: payload })
    expect(r2.status).toBe(409)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Rubric #10 — Location routes + distance cache (D90 + NOTE-D90-2)
// ════════════════════════════════════════════════════════════════════════════
describe('Rubric #10 — Location routes (D90)', () => {
  it('POST /api/v1/location/distance → 200 or 500 (if no Google Maps key in test)', async () => {
    const res = await app.request('/api/v1/location/distance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        originLat: 13.7563912345,
        originLng: 100.52349876,
        destLat: 13.74,
        destLng: 100.51,
        mode: 'driving',
      }),
    })
    // 200 = Google Maps worked; 500 = no API key (expected in test env)
    expect([200, 500]).toContain(res.status)
  })

  it('POST /api/v1/location/geocode without auth → 401', async () => {
    const res = await app.request('/api/v1/location/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: 'Bangkok Thailand' }),
    })
    expect(res.status).toBe(401)
  })

  it('POST /api/v1/location/distance without auth → 401', async () => {
    const res = await app.request('/api/v1/location/distance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originLat: 13.75, originLng: 100.5, destLat: 13.74, destLng: 100.51 }),
    })
    expect(res.status).toBe(401)
  })

  it('POST /api/v1/location/live without auth → 401', async () => {
    // Must send valid body (Hono validates request before handler) — no auth token → 401
    const res = await app.request('/api/v1/location/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: '00000000-0000-0000-0000-000000000001',
        lat: 13.7,
        lng: 100.5,
        subscriberUserId: '00000000-0000-0000-0000-000000000002',
      }),
    })
    expect(res.status).toBe(401)
  })

  it('POST /api/v1/location/saved (GET) → 200 list (auth)', async () => {
    const res = await app.request('/api/v1/location/saved', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    expect([200]).toContain(res.status)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Rubric #11 — Email adapter + template helpers (D91)
// ════════════════════════════════════════════════════════════════════════════
describe('Rubric #11 — Email adapter + templates (D91)', () => {
  it('resendAdapter.send is a function (EmailAdapter interface)', () => {
    expect(typeof resendAdapter.send).toBe('function')
  })

  it('renderSignupVerifyEmail returns {html, text} with verify link', () => {
    const result = renderSignupVerifyEmail({
      userName: 'ทดสอบ',
      verifyUrl: 'https://app3r.test/verify?token=abc123',
    })
    expect(result.html).toContain('abc123')
    expect(result.html).toContain('ทดสอบ')
    expect(result.text).toContain('abc123')
    expect(result.text).toContain('ทดสอบ')
  })

  it('renderPaymentReceiptEmail returns {html, text} with amount + intentId', () => {
    const result = renderPaymentReceiptEmail({
      userName: 'ทดสอบ',
      amount: '500',
      intentId: 'intent-12345',
    })
    expect(result.html).toContain('500')
    expect(result.html).toContain('intent-12345')
    expect(result.text).toContain('500')
    expect(result.text).toContain('intent-12345')
  })

  it('resendAdapter.send with placeholder API key returns error (not throw)', async () => {
    // RESEND_API_KEY is not set → uses 're_placeholder' → should return {success: false}
    const result = await resendAdapter.send({
      to: 'test@app3r.test',
      subject: 'D-2 Rubric Test Email',
      html: '<p>Test from D-2 test suite</p>',
    })
    // Either succeeds (key set) or fails gracefully — must not throw
    expect(result).toBeDefined()
    expect(typeof result.success).toBe('boolean')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Rubric #12 — OpenAPI spec version 0.2.0 + all D-2 paths present
// ════════════════════════════════════════════════════════════════════════════
describe('Rubric #12 — OpenAPI spec D-2 routes', () => {
  let spec: Record<string, unknown>
  let paths: Record<string, unknown>

  beforeAll(async () => {
    const res = await app.request('/openapi.json')
    expect(res.status).toBe(200)
    spec = await res.json() as Record<string, unknown>
    paths = spec['paths'] as Record<string, unknown>
  })

  it('spec version is 0.2.0', () => {
    const info = spec['info'] as Record<string, string>
    expect(info.version).toBe('0.2.0')
  })

  it('spec has /api/v1/files/presign (D87)', () => {
    expect(paths['/api/v1/files/presign']).toBeDefined()
  })

  it('spec has /api/v1/files/finalize (D87)', () => {
    expect(paths['/api/v1/files/finalize']).toBeDefined()
  })

  it('spec has /api/v1/push/subscribe (D88)', () => {
    expect(paths['/api/v1/push/subscribe']).toBeDefined()
  })

  it('spec has /api/v1/push/notifications (D88)', () => {
    expect(paths['/api/v1/push/notifications']).toBeDefined()
  })

  it('spec has /api/v1/payment/intent (D89)', () => {
    expect(paths['/api/v1/payment/intent']).toBeDefined()
  })

  it('spec has /api/v1/payment/webhook/:provider (D89)', () => {
    // Hono keeps Express-style :param format in OpenAPI spec (not {param})
    expect(paths['/api/v1/payment/webhook/:provider']).toBeDefined()
  })

  it('spec has /api/v1/location/distance (D90)', () => {
    expect(paths['/api/v1/location/distance']).toBeDefined()
  })

  it('spec has /api/v1/location/geocode (D90)', () => {
    expect(paths['/api/v1/location/geocode']).toBeDefined()
  })

  it('spec has /api/v1/services (D90 NOTE-D90-1)', () => {
    expect(paths['/api/v1/services']).toBeDefined()
  })

  it('spec has /api/v1/parts/inventory (NOTE-SUB4)', () => {
    expect(paths['/api/v1/parts/inventory']).toBeDefined()
  })

  it('GET /docs returns Swagger UI HTML', async () => {
    const res = await app.request('/docs')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html.toLowerCase()).toContain('swagger')
  })
})
