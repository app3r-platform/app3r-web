/**
 * tests/unit/sdk-adapters.test.ts — Sub-CMD-2 Wave 1
 *
 * Unit tests for 6 SDK adapters (target coverage ≥ 60%):
 *   - src/lib/config.ts          — validateSdkConfig dev vs prod
 *   - src/lib/websocket.ts       — registry add/remove/emit/broadcast
 *   - src/lib/email.ts           — template helpers + send mock
 *   - src/lib/r2.ts              — generateR2Key + presign (mocked S3)
 *   - src/lib/payment/interface.ts — NotImplementedError
 *   - src/lib/payment/index.ts   — getPaymentProvider + registry
 *   - src/lib/payment/providers/manualBankTransfer.ts — createCheckoutSession
 *   - src/lib/promptpay.ts       — QR payload generation
 *
 * No DB required — all external calls mocked via vi.mock()
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mock external SDKs before imports ────────────────────────────────────────
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: vi.fn() })),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}))
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://r2.example.com/presigned-url'),
}))
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'msg-001' }, error: null }),
    },
  })),
}))

// ════════════════════════════════════════════════════════════════════════════
// Config Validator (src/lib/config.ts)
// ════════════════════════════════════════════════════════════════════════════
describe('Config Validator — validateSdkConfig()', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    // Restore env after each test
    Object.keys(process.env).forEach((k) => {
      if (!(k in originalEnv)) delete process.env[k]
      else process.env[k] = originalEnv[k]
    })
  })

  it('returns valid:true when all required vars are set (non-placeholder)', async () => {
    const { validateSdkConfig } = await import('../../src/lib/config')
    process.env.R2_ENDPOINT = 'https://real.r2.cloudflarestorage.com'
    process.env.R2_ACCESS_KEY_ID = 'real-key-abc123'
    process.env.R2_SECRET_ACCESS_KEY = 'real-secret-xyz789'
    process.env.R2_BUCKET = 'app3r-prod'
    process.env.MAPS_API_KEY = 'AIzaSyRealKey123'
    process.env.RESEND_API_KEY = 're_realkey_abc'
    process.env.TWILIO_SMS_FROM = '+66812345678'

    const result = validateSdkConfig('development')
    expect(result.valid).toBe(true)
    expect(result.missing).toHaveLength(0)
  })

  it('returns valid:false when vars are missing (dev mode — no throw)', async () => {
    const { validateSdkConfig } = await import('../../src/lib/config')
    delete process.env.R2_ENDPOINT
    delete process.env.MAPS_API_KEY
    delete process.env.RESEND_API_KEY

    const result = validateSdkConfig('development')
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('R2_ENDPOINT')
    expect(result.missing).toContain('MAPS_API_KEY')
    expect(result.missing).toContain('RESEND_API_KEY')
  })

  it('throws in production when vars are missing', async () => {
    const { validateSdkConfig } = await import('../../src/lib/config')
    delete process.env.R2_ENDPOINT
    delete process.env.MAPS_API_KEY

    expect(() => validateSdkConfig('production')).toThrow(/Missing required environment variables/)
  })

  it('throws in production when placeholder values detected', async () => {
    const { validateSdkConfig } = await import('../../src/lib/config')
    // Set all vars but with placeholder values
    process.env.R2_ENDPOINT = 'https://placeholder.r2.cloudflarestorage.com'
    process.env.R2_ACCESS_KEY_ID = 'placeholder-key'
    process.env.R2_SECRET_ACCESS_KEY = 'placeholder-secret'
    process.env.R2_BUCKET = 'app3r-dev'
    process.env.MAPS_API_KEY = 'placeholder-maps'
    process.env.RESEND_API_KEY = 're_placeholder'
    process.env.TWILIO_SMS_FROM = '+66812345678'

    expect(() => validateSdkConfig('production')).toThrow(/Placeholder values detected/)
  })

  it('assertGatewayVar returns value when set', async () => {
    const { assertGatewayVar } = await import('../../src/lib/config')
    process.env.TEST_GATEWAY_VAR = 'real-value'
    expect(assertGatewayVar('TEST_GATEWAY_VAR')).toBe('real-value')
    delete process.env.TEST_GATEWAY_VAR
  })

  it('assertGatewayVar throws when missing', async () => {
    const { assertGatewayVar } = await import('../../src/lib/config')
    delete process.env.MISSING_GATEWAY_VAR
    expect(() => assertGatewayVar('MISSING_GATEWAY_VAR')).toThrow(/missing/)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// WebSocket Registry (src/lib/websocket.ts)
// ════════════════════════════════════════════════════════════════════════════
describe('WebSocket Registry — wsRegistry', () => {
  let wsRegistry: typeof import('../../src/lib/websocket').wsRegistry
  let createWsEvent: typeof import('../../src/lib/websocket').createWsEvent

  const makeMockWs = () => ({
    send: vi.fn(),
    close: vi.fn(),
    readyState: 1,
  } as unknown as import('hono/ws').WSContext)

  beforeEach(async () => {
    const mod = await import('../../src/lib/websocket')
    wsRegistry = mod.wsRegistry
    createWsEvent = mod.createWsEvent
  })

  it('add() registers a WS connection for a user', () => {
    const ws = makeMockWs()
    wsRegistry.add('user-001', ws)
    expect(wsRegistry.connectionCount()).toBeGreaterThanOrEqual(1)
    wsRegistry.remove('user-001', ws)
  })

  it('remove() cleans up empty sets', () => {
    const ws = makeMockWs()
    wsRegistry.add('user-cleanup', ws)
    wsRegistry.remove('user-cleanup', ws)
    // connectionCount should not include removed user
    const before = wsRegistry.connectionCount()
    wsRegistry.add('user-cleanup', ws)
    wsRegistry.remove('user-cleanup', ws)
    expect(wsRegistry.connectionCount()).toBe(before)
  })

  it('emit() sends JSON payload to user connections', () => {
    const ws = makeMockWs()
    wsRegistry.add('user-emit', ws)

    const event = createWsEvent('ping', { hello: 'world' })
    wsRegistry.emit('user-emit', event)

    expect(ws.send).toHaveBeenCalledOnce()
    const payload = JSON.parse((ws.send as ReturnType<typeof vi.fn>).mock.calls[0][0] as string)
    expect(payload.type).toBe('ping')
    expect(payload.data).toEqual({ hello: 'world' })
    expect(payload.timestamp).toBeDefined()

    wsRegistry.remove('user-emit', ws)
  })

  it('emit() silently handles stale connections', () => {
    const ws = makeMockWs()
    ;(ws.send as ReturnType<typeof vi.fn>).mockImplementation(() => { throw new Error('connection closed') })

    wsRegistry.add('user-stale', ws)
    expect(() => wsRegistry.emit('user-stale', createWsEvent('pong', {}))).not.toThrow()
    wsRegistry.remove('user-stale', ws)
  })

  it('emit() does nothing when user has no connections', () => {
    // Should not throw for unknown user
    expect(() => wsRegistry.emit('unknown-user-xyz', createWsEvent('ping', {}))).not.toThrow()
  })

  it('broadcast() sends to multiple users', () => {
    const ws1 = makeMockWs()
    const ws2 = makeMockWs()
    wsRegistry.add('user-bc-1', ws1)
    wsRegistry.add('user-bc-2', ws2)

    const event = createWsEvent('notification.new', { title: 'test' })
    wsRegistry.broadcast(['user-bc-1', 'user-bc-2'], event)

    expect(ws1.send).toHaveBeenCalledOnce()
    expect(ws2.send).toHaveBeenCalledOnce()

    wsRegistry.remove('user-bc-1', ws1)
    wsRegistry.remove('user-bc-2', ws2)
  })

  it('createWsEvent() generates correct shape', () => {
    const event = createWsEvent('location.update', { lat: 13.7, lng: 100.5 })
    expect(event.type).toBe('location.update')
    expect(event.data).toEqual({ lat: 13.7, lng: 100.5 })
    expect(typeof event.timestamp).toBe('string')
    expect(new Date(event.timestamp).getTime()).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Email Adapter (src/lib/email.ts)
// ════════════════════════════════════════════════════════════════════════════
describe('Email Adapter (Resend) + Template Helpers', () => {
  it('resendAdapter.send() returns success with messageId', async () => {
    const { resendAdapter } = await import('../../src/lib/email')
    const result = await resendAdapter.send({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Hello</p>',
    })
    expect(result.success).toBe(true)
    expect(result.messageId).toBe('msg-001')
  })

  it('renderSignupVerifyEmail returns html + text with userName and verifyUrl', async () => {
    const { renderSignupVerifyEmail } = await import('../../src/lib/email')
    const { html, text } = renderSignupVerifyEmail({
      userName: 'สมชาย',
      verifyUrl: 'https://app3r.dev/verify?token=abc',
    })
    expect(html).toContain('สมชาย')
    expect(html).toContain('https://app3r.dev/verify?token=abc')
    expect(text).toContain('สมชาย')
    expect(text).toContain('https://app3r.dev/verify?token=abc')
  })

  it('renderPaymentReceiptEmail returns html + text with amount and intentId', async () => {
    const { renderPaymentReceiptEmail } = await import('../../src/lib/email')
    const { html, text } = renderPaymentReceiptEmail({
      userName: 'อรทัย',
      amount: '1000',
      intentId: 'pi_test_abc123',
    })
    expect(html).toContain('1000')
    expect(html).toContain('pi_test_abc123')
    expect(text).toContain('pi_test_abc123')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// R2 Adapter (src/lib/r2.ts)
// ════════════════════════════════════════════════════════════════════════════
describe('R2 File Storage Adapter', () => {
  it('generateR2Key returns path with purpose/ownerId/timestamp.ext', async () => {
    const { generateR2Key } = await import('../../src/lib/r2')
    const key = generateR2Key('user-uuid-123', 'service_photo', 'photo.jpg')
    expect(key).toMatch(/^service_photo\/user-uuid-123\/\d+\.jpg$/)
  })

  it('generateR2Key handles files without extension gracefully', async () => {
    const { generateR2Key } = await import('../../src/lib/r2')
    const key = generateR2Key('owner-1', 'document', 'noextension')
    expect(key).toMatch(/^document\/owner-1\/\d+\.noextension$/)
  })

  it('r2Adapter.presignPut returns uploadUrl + r2Key + expiresIn', async () => {
    const { r2Adapter } = await import('../../src/lib/r2')
    const result = await r2Adapter.presignPut('test/key.jpg', 'image/jpeg')
    expect(result.uploadUrl).toContain('presigned-url')
    expect(result.r2Key).toBe('test/key.jpg')
    expect(result.expiresIn).toBeGreaterThan(0)
  })

  it('r2Adapter.presignGet returns a presigned URL string', async () => {
    const { r2Adapter } = await import('../../src/lib/r2')
    const url = await r2Adapter.presignGet('test/key.jpg')
    expect(typeof url).toBe('string')
    expect(url.length).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Payment Provider Interface + Registry
// ════════════════════════════════════════════════════════════════════════════
describe('Payment Provider Interface + Registry', () => {
  it('NotImplementedError has correct name + message', async () => {
    const { NotImplementedError } = await import('../../src/lib/payment/interface')
    const err = new NotImplementedError('stripe', 'createCheckoutSession')
    expect(err.name).toBe('NotImplementedError')
    expect(err.message).toContain('stripe')
    expect(err.message).toContain('createCheckoutSession')
    expect(err.message).toContain('Phase D-5')
  })

  it('getPaymentProvider returns manualBankTransfer (default)', async () => {
    const { getPaymentProvider, DEFAULT_PAYMENT_PROVIDER } = await import('../../src/lib/payment/index')
    expect(DEFAULT_PAYMENT_PROVIDER).toBe('manual_bank_transfer')
    const provider = getPaymentProvider('manual_bank_transfer')
    expect(provider.name).toBe('manual_bank_transfer')
  })

  it('getPaymentProvider throws for unknown provider', async () => {
    const { getPaymentProvider } = await import('../../src/lib/payment/index')
    expect(() => getPaymentProvider('paypal')).toThrow(/Unknown payment provider/)
  })

  it('skeleton providers throw NotImplementedError', async () => {
    const { stripeAdapter } = await import('../../src/lib/payment/providers/stripe')
    const { twoCTwoPAdapter } = await import('../../src/lib/payment/providers/twoC2P')
    const { trueMoneyAdapter } = await import('../../src/lib/payment/providers/truemoney')
    const { omiseAdapter } = await import('../../src/lib/payment/providers/omise')

    const dummyInput = {
      amount: 100, currency: 'THB', purposeRef: 'ref-1',
      description: 'test', returnUrl: 'https://x.com', cancelUrl: 'https://x.com',
    }

    await expect(stripeAdapter.createCheckoutSession(dummyInput)).rejects.toThrow(/not implemented/i)
    await expect(twoCTwoPAdapter.createCheckoutSession(dummyInput)).rejects.toThrow(/not implemented/i)
    await expect(trueMoneyAdapter.createCheckoutSession(dummyInput)).rejects.toThrow(/not implemented/i)
    await expect(omiseAdapter.createCheckoutSession(dummyInput)).rejects.toThrow(/not implemented/i)
  })

  it('manualBankTransferAdapter.createCheckoutSession returns a checkout URL', async () => {
    const { manualBankTransferAdapter } = await import('../../src/lib/payment/providers/manualBankTransfer')
    const result = await manualBankTransferAdapter.createCheckoutSession({
      amount: 500, currency: 'THB', purposeRef: 'pi_test_123',
      description: 'deposit test', returnUrl: 'https://app3r.dev', cancelUrl: 'https://app3r.dev',
    })
    expect(result.provider).toBe('manual_bank_transfer')
    expect(result.checkoutUrl).toContain('MANUAL')
    expect(result.providerRef).toContain('MANUAL')
  })

  it('manualBankTransferAdapter.refund returns success:false with message', async () => {
    const { manualBankTransferAdapter } = await import('../../src/lib/payment/providers/manualBankTransfer')
    const result = await manualBankTransferAdapter.refund('tx-123', 100)
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

// ════════════════════════════════════════════════════════════════════════════
// PromptPay QR Generator (src/lib/promptpay.ts)
// ════════════════════════════════════════════════════════════════════════════
describe('PromptPay QR Generator', () => {
  it('generates a valid QR payload string for phone number', async () => {
    const { generatePromptPayQr } = await import('../../src/lib/promptpay')
    const payload = generatePromptPayQr({ phone: '0812345678' })
    expect(typeof payload).toBe('string')
    expect(payload.length).toBeGreaterThan(20)
    // EMVCo format starts with 000201
    expect(payload).toMatch(/^000201/)
    // Ends with 4-char hex CRC
    expect(payload).toMatch(/6304[0-9A-F]{4}$/)
  })

  it('generates QR with amount when specified', async () => {
    const { generatePromptPayQr } = await import('../../src/lib/promptpay')
    const payload = generatePromptPayQr({ phone: '0812345678', amount: 500 })
    // Amount field (tag 54) should be present
    expect(payload).toContain('5406') // tag 54, length 06 (for "500.00")
  })

  it('generates QR for National ID', async () => {
    const { generatePromptPayQr } = await import('../../src/lib/promptpay')
    const payload = generatePromptPayQr({ nationalId: '1234567890123' })
    expect(payload).toMatch(/^000201/)
    expect(payload).toContain('1234567890123')
  })

  it('CRC checksum is correct (4 uppercase hex chars)', async () => {
    const { generatePromptPayQr } = await import('../../src/lib/promptpay')
    const payload = generatePromptPayQr({ phone: '0899999999' })
    const crcPart = payload.slice(-4)
    expect(crcPart).toMatch(/^[0-9A-F]{4}$/)
  })
})
