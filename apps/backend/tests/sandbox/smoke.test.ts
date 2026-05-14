/**
 * tests/sandbox/smoke.test.ts — Sub-CMD-2 Wave 1
 *
 * Sandbox Smoke Tests — 5 External Service Accounts
 *
 * IMPORTANT: Tests skip automatically if credentials are placeholder values.
 * For CI sandbox job: set real secrets in GitHub Actions "sandbox" environment.
 * For local run: set real values in .env.local
 *
 * Accounts to verify:
 *   1. Stripe sandbox   — API key + 1 test payment session
 *   2. 2C2P sandbox     — merchant ID + 1 test token
 *   3. Google Maps      — API key + geocode + distance
 *   4. Resend           — API key + 1 test email
 *   5. Cloudflare R2    — bucket + 1 upload/download
 */
import { describe, it, expect, vi } from 'vitest'

// Helper: check if a var is real (not placeholder)
function isReal(varName: string): boolean {
  const v = process.env[varName]
  if (!v) return false
  if (v.includes('placeholder') || v.includes('sandbox-merchant') || v === 're_placeholder') return false
  if (v === 'sk_test_placeholder') return false
  return true
}

// ════════════════════════════════════════════════════════════════════════════
// 1. Stripe Sandbox
// ════════════════════════════════════════════════════════════════════════════
describe.skipIf(!isReal('STRIPE_SECRET_KEY'))('Stripe Sandbox Smoke Tests', () => {
  it('Stripe API key is valid — can retrieve account', async () => {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
    const account = await stripe.accounts.retrieve()
    expect(account.id).toBeDefined()
    console.log(`✅ Stripe account: ${account.id}`)
  })

  it('Stripe can create a checkout session (sandbox)', async () => {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'thb', product_data: { name: 'Smoke Test' }, unit_amount: 10000 }, quantity: 1 }],
      success_url: 'https://app3r.dev/success',
      cancel_url: 'https://app3r.dev/cancel',
    })
    expect(session.id).toBeDefined()
    expect(session.url).toBeTruthy()
    console.log(`✅ Stripe session: ${session.id}`)
  })
})

describe.skipIf(isReal('STRIPE_SECRET_KEY'))('Stripe Sandbox — SKIPPED (no real key)', () => {
  it('placeholder detected — set STRIPE_SECRET_KEY in GitHub Secrets "sandbox" environment', () => {
    console.log('⚠️  STRIPE_SECRET_KEY is placeholder — sandbox tests skipped')
    expect(true).toBe(true)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 2. 2C2P Sandbox
// ════════════════════════════════════════════════════════════════════════════
describe.skipIf(!isReal('TWOC2P_MERCHANT_ID'))('2C2P Sandbox Smoke Tests', () => {
  it('2C2P credentials present — payment token endpoint reachable', async () => {
    const merchantId = process.env.TWOC2P_MERCHANT_ID!
    // Note: 2C2P uses JWT-signed requests — smoke test verifies connectivity only
    const res = await fetch('https://sandbox-pgw.2c2p.com/payment/4.1/paymentToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantID: merchantId, invoiceNo: 'smoke-test-001', description: 'smoke', amount: '1.00', currencyCode: '764' }),
    })
    // 2C2P returns 200 even for auth failures — check it responds
    expect(res.status).toBe(200)
    console.log(`✅ 2C2P endpoint reachable, merchantId: ${merchantId}`)
  })
})

describe.skipIf(isReal('TWOC2P_MERCHANT_ID'))('2C2P Sandbox — SKIPPED (no real key)', () => {
  it('placeholder detected — set TWOC2P_MERCHANT_ID + TWOC2P_SECRET_KEY in "sandbox" env', () => {
    expect(true).toBe(true)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 3. Google Maps
// ════════════════════════════════════════════════════════════════════════════
describe.skipIf(!isReal('MAPS_API_KEY'))('Google Maps Sandbox Smoke Tests', () => {
  it('Geocode API responds with valid coordinates for Bangkok', async () => {
    const { googleMapsAdapter } = await import('../../src/lib/maps')
    const result = await googleMapsAdapter.geocode('Siam Square, Bangkok')
    expect(result.lat).toBeGreaterThan(10)
    expect(result.lat).toBeLessThan(20)
    expect(result.lng).toBeGreaterThan(100)
    expect(result.formattedAddress.length).toBeGreaterThan(0)
    console.log(`✅ Maps geocode: ${result.formattedAddress} (${result.lat}, ${result.lng})`)
  })

  it('Distance Matrix responds with driving distance', async () => {
    const { googleMapsAdapter } = await import('../../src/lib/maps')
    const result = await googleMapsAdapter.distance(13.7462, 100.5343, 13.7307, 100.5204, 'driving')
    expect(result.distanceMeters).toBeGreaterThan(0)
    expect(result.durationSeconds).toBeGreaterThan(0)
    console.log(`✅ Maps distance: ${result.distanceMeters}m / ${result.durationSeconds}s`)
  })
})

describe.skipIf(isReal('MAPS_API_KEY'))('Google Maps — SKIPPED (no real key)', () => {
  it('placeholder detected — set MAPS_API_KEY in "sandbox" env', () => {
    expect(true).toBe(true)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 4. Resend Email
// ════════════════════════════════════════════════════════════════════════════
describe.skipIf(!isReal('RESEND_API_KEY'))('Resend Sandbox Smoke Tests', () => {
  it('Resend API key valid — sends test email to dummy address', async () => {
    const { resendAdapter } = await import('../../src/lib/email')
    const result = await resendAdapter.send({
      to: 'delivered@resend.dev', // Resend's official test recipient
      subject: '[App3R Smoke Test] Backend CI',
      html: '<p>App3R backend smoke test — automated.</p>',
      text: 'App3R backend smoke test — automated.',
    })
    expect(result.success).toBe(true)
    expect(result.messageId.length).toBeGreaterThan(0)
    console.log(`✅ Resend email sent: ${result.messageId}`)
  })
})

describe.skipIf(isReal('RESEND_API_KEY'))('Resend — SKIPPED (no real key)', () => {
  it('placeholder detected — set RESEND_API_KEY in "sandbox" env', () => {
    expect(true).toBe(true)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 5. Cloudflare R2
// ════════════════════════════════════════════════════════════════════════════
describe.skipIf(!isReal('R2_ACCESS_KEY_ID'))('Cloudflare R2 Sandbox Smoke Tests', () => {
  const testKey = `smoke-test/ci-${Date.now()}.txt`

  it('R2 presignPut generates a valid pre-signed URL', async () => {
    const { r2Adapter } = await import('../../src/lib/r2')
    const result = await r2Adapter.presignPut(testKey, 'text/plain', 60)
    expect(result.uploadUrl).toContain('r2.cloudflarestorage.com')
    expect(result.r2Key).toBe(testKey)
    console.log(`✅ R2 presignPut URL generated for: ${testKey}`)
  })

  it('R2 upload + download round trip', async () => {
    const { r2Adapter } = await import('../../src/lib/r2')
    const { uploadUrl } = await r2Adapter.presignPut(testKey, 'text/plain', 60)

    // Upload test content
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: 'App3R R2 smoke test',
    })
    expect(putRes.ok).toBe(true)

    // Download via presigned GET
    const getUrl = await r2Adapter.presignGet(testKey, 60)
    const getRes = await fetch(getUrl)
    expect(getRes.ok).toBe(true)
    const content = await getRes.text()
    expect(content).toBe('App3R R2 smoke test')
    console.log(`✅ R2 upload+download round trip: ${testKey}`)

    // Cleanup
    await r2Adapter.delete(testKey)
  })
})

describe.skipIf(isReal('R2_ACCESS_KEY_ID'))('Cloudflare R2 — SKIPPED (no real key)', () => {
  it('placeholder detected — set R2_* vars in "sandbox" env', () => {
    expect(true).toBe(true)
  })
})
