/**
 * tests/unit/transfers-withdraw.test.ts — CMD-B2 D91
 *
 * Unit tests for POST /api/v1/transfers/withdraw/ (upgraded — WeeeU + WeeeR)
 * Tests: role guard + balance check + happy path
 *
 * No real DB — db/client mocked via vi.hoisted() + vi.mock()
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mocks (must be before imports) ─────────────────────────────────────
const { mockVerifyAccessToken, mockDb } = vi.hoisted(() => {
  const mockVerifyAccessToken = vi.fn()
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
  return { mockVerifyAccessToken, mockDb }
})

vi.mock('../../src/lib/jwt', () => ({
  verifyAccessToken: (...args: unknown[]) => mockVerifyAccessToken(...args),
  signAccessToken: vi.fn(),
}))

vi.mock('../../src/db/client', () => ({ db: mockDb }))

vi.mock('../../src/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test',
    JWT_SECRET: 'test-secret-32-characters-long!!',
    COOKIE_DOMAIN: 'localhost',
    REFRESH_TOKEN_TTL_DAYS: 7,
  },
}))

vi.mock('../../src/lib/r2', () => ({
  r2Adapter: { presignGet: vi.fn() },
  generateR2Key: vi.fn(),
}))
vi.mock('../../src/lib/promptpay', () => ({
  generatePromptPayQrForDeposit: vi.fn(() => ({ payload: 'qr', promptpayRef: 'ref' })),
}))

// ── Import after mocks ────────────────────────────────────────────────────────
import { app } from '../../src/app'

// ── Helpers ───────────────────────────────────────────────────────────────────
const WITHDRAW_PATH = '/api/v1/transfers/withdraw/'

function makeRequest(body: Record<string, unknown>, token = 'valid-token') {
  return app.request(WITHDRAW_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
}

const validBody = {
  amountThb: 500,
  bankName: 'กสิกรไทย',
  accountNumber: '1234567890',
  accountName: 'สมชาย ใจดี',
}

const mockTransferRow = {
  id: 'transfer-uuid-001',
  userId: 'user-uuid-001',
  type: 'withdraw',
  amountThb: '500',
  slipR2Key: null,
  refNo: null,
  promptpayRef: null,
  status: 'pending',
  adminNote: null,
  bankName: 'กสิกรไทย',
  accountNumber: '1234567890',
  accountName: 'สมชาย ใจดี',
  verifiedBy: null,
  verifiedAt: null,
  createdAt: new Date('2026-05-25T00:00:00Z'),
  updatedAt: new Date('2026-05-25T00:00:00Z'),
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/v1/transfers/withdraw/ — CMD-B2 D91', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Auth ────────────────────────────────────────────────────────────────────

  it('401 — no Authorization header', async () => {
    const res = await app.request(WITHDRAW_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    })
    expect(res.status).toBe(401)
  })

  it('401 — invalid token', async () => {
    mockVerifyAccessToken.mockRejectedValueOnce(new Error('invalid'))
    const res = await makeRequest(validBody)
    expect(res.status).toBe(401)
  })

  // ── Role guard ──────────────────────────────────────────────────────────────

  it('403 — weeet role cannot withdraw', async () => {
    mockVerifyAccessToken.mockResolvedValueOnce({ userId: 'user-001', role: 'weeet' })
    const res = await makeRequest(validBody)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.detail).toMatch(/WeeeU and WeeeR/)
  })

  it('403 — admin role cannot withdraw', async () => {
    mockVerifyAccessToken.mockResolvedValueOnce({ userId: 'user-001', role: 'admin' })
    const res = await makeRequest(validBody)
    expect(res.status).toBe(403)
  })

  // ── Balance check ───────────────────────────────────────────────────────────

  it('422 — insufficient balance (no wallet row → balance = 0)', async () => {
    mockVerifyAccessToken.mockResolvedValueOnce({ userId: 'user-001', role: 'weeeu' })

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    })

    const res = await makeRequest(validBody) // amountThb = 500
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.detail).toMatch(/Insufficient balance/)
    expect(json.detail).toMatch(/Available: 0 THB/)
  })

  it('422 — insufficient balance (balance 300 < requested 500)', async () => {
    mockVerifyAccessToken.mockResolvedValueOnce({ userId: 'user-001', role: 'weeer' })

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ balance: 300 }]),
        }),
      }),
    })

    const res = await makeRequest({ ...validBody, amountThb: 500 })
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.detail).toMatch(/Available: 300 THB/)
    expect(json.detail).toMatch(/Requested: 500 THB/)
  })

  // ── Happy path — WeeeU ──────────────────────────────────────────────────────

  it('201 — weeeu with sufficient balance creates withdrawal', async () => {
    mockVerifyAccessToken.mockResolvedValueOnce({ userId: 'user-001', role: 'weeeu' })

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ balance: 1000 }]),
        }),
      }),
    })

    mockDb.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockTransferRow]),
      }),
    })

    const res = await makeRequest(validBody)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.type).toBe('withdraw')
    expect(json.status).toBe('pending')
    expect(json.amountThb).toBe('500')
    expect(json.bankName).toBe('กสิกรไทย')
  })

  // ── Happy path — WeeeR ──────────────────────────────────────────────────────

  it('201 — weeer with sufficient balance creates withdrawal', async () => {
    mockVerifyAccessToken.mockResolvedValueOnce({ userId: 'user-002', role: 'weeer' })

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ balance: 2000 }]),
        }),
      }),
    })

    mockDb.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ ...mockTransferRow, userId: 'user-002' }]),
      }),
    })

    const res = await makeRequest(validBody)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.type).toBe('withdraw')
    expect(json.status).toBe('pending')
  })

  // ── Balance boundary ─────────────────────────────────────────────────────────

  it('201 — exact balance = amount passes (boundary)', async () => {
    mockVerifyAccessToken.mockResolvedValueOnce({ userId: 'user-001', role: 'weeeu' })

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ balance: 500 }]),
        }),
      }),
    })

    mockDb.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockTransferRow]),
      }),
    })

    const res = await makeRequest(validBody) // amountThb = 500, balance = 500
    expect(res.status).toBe(201)
  })

  // ── Validation ──────────────────────────────────────────────────────────────

  it('400 — missing bank fields', async () => {
    mockVerifyAccessToken.mockResolvedValueOnce({ userId: 'user-001', role: 'weeeu' })
    const res = await makeRequest({ amountThb: 100 })
    expect(res.status).toBe(400)
  })

  it('400 — negative amountThb rejected', async () => {
    mockVerifyAccessToken.mockResolvedValueOnce({ userId: 'user-001', role: 'weeeu' })
    const res = await makeRequest({ ...validBody, amountThb: -100 })
    expect(res.status).toBe(400)
  })
})
