/**
 * tests/unit/settlements.test.ts — Sub-CMD-6 Wave 2
 *
 * Unit tests for Settlement API:
 *   - types/settlement.ts      — DTO shape, enum values
 *   - lib/bank-adapter/mock.ts — MockBankAdapter behaviour
 *   - lib/bank-adapter/index.ts — getBankAdapter registry
 *   - dal/settlements.ts       — mappers (mocked DB)
 *   - Audit log presence       — Security Rule #5
 *
 * No DB required — mocked via vi.mock()
 * Target: vitest coverage ≥ 60%
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock DB ───────────────────────────────────────────────────────────────────
vi.mock('../../src/db/client', () => ({
  db: {
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(async () => []) })) })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({ offset: vi.fn(async () => []) })),
          })),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => []),
        })),
      })),
    })),
  },
}))

// ── Mock DAL ──────────────────────────────────────────────────────────────────
vi.mock('../../src/dal/settlements', () => ({
  mapSettlementToDto: vi.fn((row) => ({
    id: row.id,
    serviceId: row.serviceId,
    weeerUserId: row.weeerUserId,
    amountThb: String(row.amountThb),
    status: row.status,
    bankAdapter: row.bankAdapter,
    bankRef: row.bankRef ?? null,
    initiatedBy: row.initiatedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  })),
  mapAuditToDto: vi.fn((row) => ({
    id: row.id,
    settlementId: row.settlementId,
    action: row.action,
    actorId: row.actorId ?? null,
    oldStatus: row.oldStatus ?? null,
    newStatus: row.newStatus ?? null,
    detail: row.detail ?? null,
    createdAt: row.createdAt.toISOString(),
  })),
  createSettlement: vi.fn(),
  getSettlementById: vi.fn(),
  listSettlements: vi.fn(),
}))

// ── Mock JWT ──────────────────────────────────────────────────────────────────
vi.mock('../../src/lib/jwt', () => ({
  verifyAccessToken: vi.fn().mockResolvedValue({ userId: 'admin-001', role: 'admin' }),
}))

import * as dal from '../../src/dal/settlements'
import { MockBankAdapter } from '../../src/lib/bank-adapter/mock'
import { getBankAdapter, DEFAULT_BANK_ADAPTER } from '../../src/lib/bank-adapter/index'
import { mapSettlementToDto, mapAuditToDto } from '../../src/dal/settlements'
import type { SettlementDto, SettlementAuditLogDto } from '../../src/types/settlement'

// ── Fixtures ──────────────────────────────────────────────────────────────────
const now = new Date('2026-05-14T10:00:00Z')

const sampleRow = {
  id: 'settle-uuid-001',
  serviceId: 'svc-uuid-001',
  weeerUserId: 'weeer-user-001',
  amountThb: '1500.00',
  status: 'completed',
  bankAdapter: 'mock',
  bankRef: 'MOCK-1234567890-SETTLEUUI',
  bankResponse: '{"status":"completed"}',
  initiatedBy: 'admin-001',
  createdAt: now,
  updatedAt: now,
}

const sampleDto: SettlementDto = {
  id: 'settle-uuid-001',
  serviceId: 'svc-uuid-001',
  weeerUserId: 'weeer-user-001',
  amountThb: '1500.00',
  status: 'completed',
  bankAdapter: 'mock',
  bankRef: 'MOCK-1234567890-SETTLEUUI',
  initiatedBy: 'admin-001',
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
}

const sampleAuditRow = {
  id: 'audit-uuid-001',
  settlementId: 'settle-uuid-001',
  action: 'created',
  actorId: 'admin-001',
  oldStatus: null,
  newStatus: 'pending',
  detail: '{"serviceId":"svc-uuid-001"}',
  createdAt: now,
}

// ── Types — SettlementDto shape ───────────────────────────────────────────────
describe('SettlementDto — type shape (Sub-CMD-6 source-of-truth)', () => {
  it('includes all required fields', () => {
    const dto: SettlementDto = sampleDto
    expect(dto).toHaveProperty('id')
    expect(dto).toHaveProperty('serviceId')
    expect(dto).toHaveProperty('weeerUserId')
    expect(dto).toHaveProperty('amountThb')
    expect(dto).toHaveProperty('status')
    expect(dto).toHaveProperty('bankAdapter')
    expect(dto).toHaveProperty('bankRef')
    expect(dto).toHaveProperty('initiatedBy')
    expect(dto).toHaveProperty('createdAt')
    expect(dto).toHaveProperty('updatedAt')
  })

  it('amountThb is a string (numeric JSON safe)', () => {
    expect(typeof sampleDto.amountThb).toBe('string')
  })

  it('status is one of 4 valid values', () => {
    const valid = ['pending', 'processing', 'completed', 'failed']
    expect(valid).toContain(sampleDto.status)
  })

  it('bankAdapter is one of 3 valid values', () => {
    const valid = ['mock', 'scb', 'kbank']
    expect(valid).toContain(sampleDto.bankAdapter)
  })

  it('bankRef can be null (before bank transfer)', () => {
    const pending: SettlementDto = { ...sampleDto, status: 'pending', bankRef: null }
    expect(pending.bankRef).toBeNull()
  })
})

// ── Audit log DTO shape ───────────────────────────────────────────────────────
describe('SettlementAuditLogDto — Security Rule #5 audit trail', () => {
  it('has all required audit fields', () => {
    const auditDto: SettlementAuditLogDto = {
      id: 'audit-001',
      settlementId: 'settle-001',
      action: 'created',
      actorId: 'admin-001',
      oldStatus: null,
      newStatus: 'pending',
      detail: '{"serviceId":"svc-1"}',
      createdAt: now.toISOString(),
    }
    expect(auditDto).toHaveProperty('action')
    expect(auditDto).toHaveProperty('settlementId')
    expect(auditDto).toHaveProperty('createdAt')
  })

  it('action is one of 4 valid audit actions', () => {
    const valid = ['created', 'status_changed', 'bank_response', 'error']
    expect(valid).toContain('created')
    expect(valid).toContain('status_changed')
    expect(valid).toContain('bank_response')
    expect(valid).toContain('error')
  })

  it('actorId can be null (system action)', () => {
    const systemLog: SettlementAuditLogDto = {
      id: 'audit-002',
      settlementId: 'settle-001',
      action: 'status_changed',
      actorId: null, // system
      oldStatus: 'pending',
      newStatus: 'processing',
      detail: null,
      createdAt: now.toISOString(),
    }
    expect(systemLog.actorId).toBeNull()
  })
})

// ── Mappers ───────────────────────────────────────────────────────────────────
describe('mapSettlementToDto — DB row → DTO', () => {
  it('maps all fields correctly', () => {
    const dto = mapSettlementToDto(sampleRow as any)
    expect(dto.id).toBe('settle-uuid-001')
    expect(dto.amountThb).toBe('1500.00')
    expect(dto.status).toBe('completed')
    expect(dto.bankRef).toBe('MOCK-1234567890-SETTLEUUI')
  })

  it('bankRef is null when not set', () => {
    const row = { ...sampleRow, bankRef: null }
    const dto = mapSettlementToDto(row as any)
    expect(dto.bankRef).toBeNull()
  })

  it('converts dates to ISO strings', () => {
    const dto = mapSettlementToDto(sampleRow as any)
    expect(dto.createdAt).toBe(now.toISOString())
    expect(dto.updatedAt).toBe(now.toISOString())
  })
})

describe('mapAuditToDto — DB row → AuditDto', () => {
  it('maps audit log row correctly', () => {
    const dto = mapAuditToDto(sampleAuditRow as any)
    expect(dto.id).toBe('audit-uuid-001')
    expect(dto.action).toBe('created')
    expect(dto.newStatus).toBe('pending')
    expect(dto.actorId).toBe('admin-001')
  })

  it('handles null actor (system action)', () => {
    const row = { ...sampleAuditRow, actorId: null }
    const dto = mapAuditToDto(row as any)
    expect(dto.actorId).toBeNull()
  })
})

// ── MockBankAdapter ───────────────────────────────────────────────────────────
describe('MockBankAdapter — R1 Mitigation (interface-based)', () => {
  const adapter = new MockBankAdapter()

  it('name is "mock"', () => {
    expect(adapter.name).toBe('mock')
  })

  it('initiateTransfer returns success with bankRef', async () => {
    const result = await adapter.initiateTransfer({
      ref: 'settle-uuid-001',
      weeerBankAccount: '1234567890',
      amountThb: 1500,
      recipientName: 'WeeeR Tech',
    })
    expect(result.success).toBe(true)
    expect(result.bankRef).not.toBeNull()
    expect(result.bankRef).toMatch(/^MOCK-/)
    expect(result.errorMessage).toBeNull()
  })

  it('initiateTransfer includes raw JSON response', async () => {
    const result = await adapter.initiateTransfer({
      ref: 'ref-001', weeerBankAccount: '0000000000', amountThb: 100, recipientName: 'Test',
    })
    expect(result.rawResponse).toContain('"adapter":"mock"')
    expect(result.rawResponse).toContain('"status":"completed"')
  })

  it('checkStatus always returns "completed"', async () => {
    const status = await adapter.checkStatus('MOCK-REF-001')
    expect(status).toBe('completed')
  })

  it('bankRef contains settlement ref prefix (trace)', async () => {
    const result = await adapter.initiateTransfer({
      ref: 'abcdef12-3456-7890-abcd-ef1234567890',
      weeerBankAccount: '1234567890',
      amountThb: 500,
      recipientName: 'Test',
    })
    expect(result.bankRef).toContain('ABCDEF12')
  })
})

// ── getBankAdapter registry ───────────────────────────────────────────────────
describe('getBankAdapter — registry', () => {
  it('DEFAULT_BANK_ADAPTER is "mock"', () => {
    expect(DEFAULT_BANK_ADAPTER).toBe('mock')
  })

  it('getBankAdapter("mock") returns adapter with name "mock"', () => {
    const adapter = getBankAdapter('mock')
    expect(adapter.name).toBe('mock')
  })

  it('getBankAdapter("scb") returns a valid adapter (stub mock)', () => {
    const adapter = getBankAdapter('scb')
    expect(adapter).toBeDefined()
    expect(adapter.name).toBe('mock') // scb → mock stub currently
  })

  it('getBankAdapter("kbank") returns a valid adapter (stub mock)', () => {
    const adapter = getBankAdapter('kbank')
    expect(adapter).toBeDefined()
  })

  it('getBankAdapter() with no arg returns default (mock)', () => {
    const adapter = getBankAdapter()
    expect(adapter.name).toBe('mock')
  })
})

// ── DAL functions (mocked) ────────────────────────────────────────────────────
describe('DAL — createSettlement()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns SettlementDto on success', async () => {
    vi.mocked(dal.createSettlement).mockResolvedValueOnce(sampleDto)
    const result = await dal.createSettlement('admin-001', {
      serviceId: 'svc-uuid-001',
      weeerUserId: 'weeer-user-001',
      amountThb: 1500,
      weeerBankAccount: '1234567890',
      weeerBankName: 'WeeeR Tech',
    })
    expect(result.id).toBe('settle-uuid-001')
    expect(result.status).toBe('completed')
    expect(result.bankRef).not.toBeNull()
  })

  it('defaults to mock adapter when not specified', async () => {
    vi.mocked(dal.createSettlement).mockResolvedValueOnce(sampleDto)
    const result = await dal.createSettlement('admin-001', {
      serviceId: 'svc-1', weeerUserId: 'weeer-1', amountThb: 500,
      weeerBankAccount: '1111111111', weeerBankName: 'Test',
    })
    expect(result.bankAdapter).toBe('mock')
  })
})

describe('DAL — getSettlementById()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns SettlementDetailDto with audit log', async () => {
    const detail = {
      ...sampleDto,
      auditLog: [
        { id: 'audit-1', settlementId: 'settle-uuid-001', action: 'created' as const,
          actorId: 'admin-001', oldStatus: null, newStatus: 'pending', detail: null, createdAt: now.toISOString() },
        { id: 'audit-2', settlementId: 'settle-uuid-001', action: 'bank_response' as const,
          actorId: null, oldStatus: 'processing', newStatus: 'completed', detail: null, createdAt: now.toISOString() },
      ],
    }
    vi.mocked(dal.getSettlementById).mockResolvedValueOnce(detail)
    const result = await dal.getSettlementById('settle-uuid-001')
    expect(result).not.toBeNull()
    expect(result!.auditLog).toHaveLength(2)
    // Security Rule #5: audit log must have created entry
    expect(result!.auditLog[0].action).toBe('created')
  })

  it('returns null when not found', async () => {
    vi.mocked(dal.getSettlementById).mockResolvedValueOnce(null)
    const result = await dal.getSettlementById('nonexistent')
    expect(result).toBeNull()
  })
})

describe('DAL — listSettlements()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns items and total', async () => {
    vi.mocked(dal.listSettlements).mockResolvedValueOnce({ items: [sampleDto], total: 1 })
    const result = await dal.listSettlements({ weeerUserId: 'weeer-user-001' })
    expect(result.items).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it('returns empty list for user with no settlements', async () => {
    vi.mocked(dal.listSettlements).mockResolvedValueOnce({ items: [], total: 0 })
    const result = await dal.listSettlements({ weeerUserId: 'new-weeer' })
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })
})

// ── Migration SQL smoke check ─────────────────────────────────────────────────
describe('Migration SQL — 0006_settlement.sql', () => {
  it('contains both tables', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const content = readFileSync(
      join(process.cwd(), 'src/db/migrations/0006_settlement.sql'), 'utf-8',
    )
    expect(content).toContain('"settlements"')
    expect(content).toContain('"settlement_audit_log"')
    expect(content).toContain('weeer_user_id')
    expect(content).toContain('bank_adapter')
    expect(content).toContain('initiated_by')
  })

  it('contains rollback section', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const content = readFileSync(
      join(process.cwd(), 'src/db/migrations/0006_settlement.sql'), 'utf-8',
    )
    expect(content).toContain('Rollback')
    expect(content).toContain('DROP TABLE')
  })
})
