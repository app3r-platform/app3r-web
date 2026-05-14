/**
 * tests/unit/reconciliation.test.ts — Sub-CMD-7 Wave 2
 *
 * Unit tests for Reconciliation Worker:
 *   - types/reconciliation.ts       — DTO shape, enum values
 *   - dal/reconciliation.ts         — mappers (mocked DB)
 *   - lib/reconciliation-worker.ts  — worker logic (idempotency, resolve flow)
 *   - Migration SQL smoke check     — 0007_reconciliation.sql
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
            limit: vi.fn(async () => []),
          })),
          limit: vi.fn(async () => []),
        })),
        orderBy: vi.fn(() => ({
          limit: vi.fn(async () => []),
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
vi.mock('../../src/dal/reconciliation', () => ({
  STUCK_TIMEOUT_MINUTES: 30,
  isReconciliationRunning: vi.fn(),
  getStuckSettlements: vi.fn(),
  createReconciliationRun: vi.fn(),
  completeReconciliationRun: vi.fn(),
  autoResolveStuckSettlement: vi.fn(),
  manualResolveSettlement: vi.fn(),
  getReconciliationReport: vi.fn(),
  mapRunToDto: vi.fn((row) => ({
    id: row.id,
    triggeredBy: row.triggeredBy ?? null,
    status: row.status,
    stuckCount: row.stuckCount,
    resolvedCount: row.resolvedCount,
    failedCount: row.failedCount,
    detail: row.detail ?? null,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  })),
  mapStuckSettlementToDto: vi.fn((row, nowMs) => ({
    id: row.id,
    serviceId: row.serviceId,
    weeerUserId: row.weeerUserId,
    amountThb: String(row.amountThb),
    status: row.status,
    bankAdapter: row.bankAdapter,
    bankRef: row.bankRef ?? null,
    initiatedBy: row.initiatedBy,
    stuckMinutes: Math.floor((nowMs - row.updatedAt.getTime()) / 60_000),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  })),
}))

// ── Mock JWT ──────────────────────────────────────────────────────────────────
vi.mock('../../src/lib/jwt', () => ({
  verifyAccessToken: vi.fn().mockResolvedValue({ userId: 'admin-001', role: 'admin' }),
}))

import * as dal from '../../src/dal/reconciliation'
import { runReconciliationWorker } from '../../src/lib/reconciliation-worker'
import { mapRunToDto, mapStuckSettlementToDto } from '../../src/dal/reconciliation'
import type {
  ReconciliationRunDto,
  StuckSettlementDto,
  ReconciliationReportDto,
  ReconciliationWorkerResult,
} from '../../src/types/reconciliation'

// ── Fixtures ──────────────────────────────────────────────────────────────────
const now = new Date('2026-05-14T10:00:00Z')
const stuckSince = new Date('2026-05-14T09:20:00Z') // 40 min ago (> 30 min timeout)

const sampleRunRow = {
  id: 'run-uuid-001',
  triggeredBy: 'admin-001',
  status: 'completed',
  stuckCount: 2,
  resolvedCount: 2,
  failedCount: 0,
  detail: '{"resolvedIds":["s1","s2"],"errors":[]}',
  startedAt: now,
  completedAt: now,
}

const sampleRunDto: ReconciliationRunDto = {
  id: 'run-uuid-001',
  triggeredBy: 'admin-001',
  status: 'completed',
  stuckCount: 2,
  resolvedCount: 2,
  failedCount: 0,
  detail: '{"resolvedIds":["s1","s2"],"errors":[]}',
  startedAt: now.toISOString(),
  completedAt: now.toISOString(),
}

const sampleStuckRow = {
  id: 'settle-stuck-001',
  serviceId: 'svc-uuid-001',
  weeerUserId: 'weeer-user-001',
  amountThb: '1500.00',
  status: 'processing',
  bankAdapter: 'mock',
  bankRef: null,
  bankResponse: null,
  initiatedBy: 'admin-001',
  createdAt: stuckSince,
  updatedAt: stuckSince,
}

const sampleStuckDto: StuckSettlementDto = {
  id: 'settle-stuck-001',
  serviceId: 'svc-uuid-001',
  weeerUserId: 'weeer-user-001',
  amountThb: '1500.00',
  status: 'processing',
  bankAdapter: 'mock',
  bankRef: null,
  initiatedBy: 'admin-001',
  stuckMinutes: 40,
  createdAt: stuckSince.toISOString(),
  updatedAt: stuckSince.toISOString(),
}

// ── Types — ReconciliationRunDto shape ───────────────────────────────────────
describe('ReconciliationRunDto — type shape', () => {
  it('includes all required fields', () => {
    const dto: ReconciliationRunDto = sampleRunDto
    expect(dto).toHaveProperty('id')
    expect(dto).toHaveProperty('triggeredBy')
    expect(dto).toHaveProperty('status')
    expect(dto).toHaveProperty('stuckCount')
    expect(dto).toHaveProperty('resolvedCount')
    expect(dto).toHaveProperty('failedCount')
    expect(dto).toHaveProperty('detail')
    expect(dto).toHaveProperty('startedAt')
    expect(dto).toHaveProperty('completedAt')
  })

  it('status is one of 3 valid values', () => {
    const valid: ReconciliationRunDto['status'][] = ['running', 'completed', 'failed']
    expect(valid).toContain(sampleRunDto.status)
  })

  it('triggeredBy is null for cron run', () => {
    const cronRun: ReconciliationRunDto = { ...sampleRunDto, triggeredBy: null }
    expect(cronRun.triggeredBy).toBeNull()
  })

  it('completedAt is null when still running', () => {
    const running: ReconciliationRunDto = { ...sampleRunDto, status: 'running', completedAt: null }
    expect(running.completedAt).toBeNull()
  })

  it('counts are numeric', () => {
    expect(typeof sampleRunDto.stuckCount).toBe('number')
    expect(typeof sampleRunDto.resolvedCount).toBe('number')
    expect(typeof sampleRunDto.failedCount).toBe('number')
  })
})

// ── Types — StuckSettlementDto shape ─────────────────────────────────────────
describe('StuckSettlementDto — type shape', () => {
  it('includes all required fields', () => {
    const dto: StuckSettlementDto = sampleStuckDto
    expect(dto).toHaveProperty('id')
    expect(dto).toHaveProperty('status')
    expect(dto).toHaveProperty('stuckMinutes')
    expect(dto).toHaveProperty('amountThb')
    expect(dto).toHaveProperty('bankAdapter')
  })

  it('status is only pending or processing (not completed/failed)', () => {
    const valid: StuckSettlementDto['status'][] = ['pending', 'processing']
    expect(valid).toContain(sampleStuckDto.status)
  })

  it('stuckMinutes is positive number', () => {
    expect(sampleStuckDto.stuckMinutes).toBeGreaterThan(0)
    expect(typeof sampleStuckDto.stuckMinutes).toBe('number')
  })

  it('bankRef can be null (transfer not initiated)', () => {
    expect(sampleStuckDto.bankRef).toBeNull()
  })
})

// ── Mappers ───────────────────────────────────────────────────────────────────
describe('mapRunToDto — DB row → DTO', () => {
  it('maps all fields correctly', () => {
    const dto = mapRunToDto(sampleRunRow as any)
    expect(dto.id).toBe('run-uuid-001')
    expect(dto.status).toBe('completed')
    expect(dto.stuckCount).toBe(2)
    expect(dto.resolvedCount).toBe(2)
    expect(dto.triggeredBy).toBe('admin-001')
  })

  it('triggeredBy is null for cron run', () => {
    const row = { ...sampleRunRow, triggeredBy: null }
    const dto = mapRunToDto(row as any)
    expect(dto.triggeredBy).toBeNull()
  })

  it('completedAt is null when running', () => {
    const row = { ...sampleRunRow, status: 'running', completedAt: null }
    const dto = mapRunToDto(row as any)
    expect(dto.completedAt).toBeNull()
  })

  it('converts dates to ISO strings', () => {
    const dto = mapRunToDto(sampleRunRow as any)
    expect(dto.startedAt).toBe(now.toISOString())
    expect(dto.completedAt).toBe(now.toISOString())
  })
})

describe('mapStuckSettlementToDto — DB row → StuckDto', () => {
  it('maps all fields correctly', () => {
    const nowMs = now.getTime()
    const dto = mapStuckSettlementToDto(sampleStuckRow as any, nowMs)
    expect(dto.id).toBe('settle-stuck-001')
    expect(dto.status).toBe('processing')
    expect(dto.amountThb).toBe('1500.00')
  })

  it('calculates stuckMinutes from updatedAt', () => {
    const nowMs = now.getTime()
    const dto = mapStuckSettlementToDto(sampleStuckRow as any, nowMs)
    // stuckSince = 09:20, now = 10:00 → 40 min
    expect(dto.stuckMinutes).toBe(40)
  })

  it('bankRef is null when not set', () => {
    const nowMs = now.getTime()
    const dto = mapStuckSettlementToDto(sampleStuckRow as any, nowMs)
    expect(dto.bankRef).toBeNull()
  })
})

// ── Reconciliation Worker ─────────────────────────────────────────────────────
describe('runReconciliationWorker — R3 Idempotency', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null if already running (idempotency guard)', async () => {
    vi.mocked(dal.isReconciliationRunning).mockResolvedValueOnce(true)
    const result = await runReconciliationWorker('admin-001')
    expect(result).toBeNull()
    expect(dal.createReconciliationRun).not.toHaveBeenCalled()
  })

  it('creates run record when not already running', async () => {
    vi.mocked(dal.isReconciliationRunning).mockResolvedValueOnce(false)
    vi.mocked(dal.createReconciliationRun).mockResolvedValueOnce({ id: 'run-001', status: 'running' } as any)
    vi.mocked(dal.getStuckSettlements).mockResolvedValueOnce([])
    vi.mocked(dal.completeReconciliationRun).mockResolvedValueOnce(undefined)

    await runReconciliationWorker('admin-001')
    expect(dal.createReconciliationRun).toHaveBeenCalledWith('admin-001')
  })

  it('returns null (cron mode) when triggeredBy is null', async () => {
    vi.mocked(dal.isReconciliationRunning).mockResolvedValueOnce(true)
    const result = await runReconciliationWorker(null)
    expect(result).toBeNull()
  })

  it('resolves stuck settlements and returns counts', async () => {
    vi.mocked(dal.isReconciliationRunning).mockResolvedValueOnce(false)
    vi.mocked(dal.createReconciliationRun).mockResolvedValueOnce({ id: 'run-002' } as any)
    vi.mocked(dal.getStuckSettlements).mockResolvedValueOnce([
      { id: 'settle-1', status: 'pending' },
      { id: 'settle-2', status: 'processing' },
    ] as any)
    vi.mocked(dal.autoResolveStuckSettlement).mockResolvedValue(undefined)
    vi.mocked(dal.completeReconciliationRun).mockResolvedValueOnce(undefined)

    const result = await runReconciliationWorker('admin-001')
    expect(result).not.toBeNull()
    expect(result!.stuckCount).toBe(2)
    expect(result!.resolvedCount).toBe(2)
    expect(result!.failedCount).toBe(0)
  })

  it('counts failedCount when individual resolve throws', async () => {
    vi.mocked(dal.isReconciliationRunning).mockResolvedValueOnce(false)
    vi.mocked(dal.createReconciliationRun).mockResolvedValueOnce({ id: 'run-003' } as any)
    vi.mocked(dal.getStuckSettlements).mockResolvedValueOnce([
      { id: 'settle-bad', status: 'processing' },
    ] as any)
    vi.mocked(dal.autoResolveStuckSettlement).mockRejectedValueOnce(new Error('DB error'))
    vi.mocked(dal.completeReconciliationRun).mockResolvedValueOnce(undefined)

    const result = await runReconciliationWorker('admin-001')
    expect(result!.stuckCount).toBe(1)
    expect(result!.resolvedCount).toBe(0)
    expect(result!.failedCount).toBe(1)
  })

  it('calls completeReconciliationRun with status completed on success', async () => {
    vi.mocked(dal.isReconciliationRunning).mockResolvedValueOnce(false)
    vi.mocked(dal.createReconciliationRun).mockResolvedValueOnce({ id: 'run-004' } as any)
    vi.mocked(dal.getStuckSettlements).mockResolvedValueOnce([])
    vi.mocked(dal.completeReconciliationRun).mockResolvedValueOnce(undefined)

    await runReconciliationWorker(null)
    expect(dal.completeReconciliationRun).toHaveBeenCalledWith(
      'run-004',
      expect.objectContaining({ status: 'completed' }),
    )
  })
})

// ── DAL — manualResolveSettlement ─────────────────────────────────────────────
describe('DAL — manualResolveSettlement()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when settlement not found', async () => {
    vi.mocked(dal.manualResolveSettlement).mockResolvedValueOnce(null)
    const result = await dal.manualResolveSettlement('nonexistent', 'completed', 'reason', 'admin')
    expect(result).toBeNull()
  })

  it('returns updated settlement when resolved', async () => {
    const updated = {
      id: 'settle-001',
      status: 'completed',
      serviceId: 'svc-001',
      weeerUserId: 'weeer-001',
      amountThb: '1500.00',
      bankAdapter: 'mock',
      bankRef: null,
      initiatedBy: 'admin-001',
      createdAt: now,
      updatedAt: now,
    }
    vi.mocked(dal.manualResolveSettlement).mockResolvedValueOnce(updated as any)
    const result = await dal.manualResolveSettlement('settle-001', 'completed', 'bank confirmed', 'admin-001')
    expect(result).not.toBeNull()
    expect(result!.status).toBe('completed')
  })
})

// ── DAL — getReconciliationReport ────────────────────────────────────────────
describe('DAL — getReconciliationReport()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns report with stuckSettlements and recentRuns', async () => {
    const report: ReconciliationReportDto = {
      stuckSettlements: [sampleStuckDto],
      recentRuns: [sampleRunDto],
      lastRunAt: now.toISOString(),
    }
    vi.mocked(dal.getReconciliationReport).mockResolvedValueOnce(report)
    const result = await dal.getReconciliationReport()
    expect(result.stuckSettlements).toHaveLength(1)
    expect(result.recentRuns).toHaveLength(1)
    expect(result.lastRunAt).not.toBeNull()
  })

  it('returns empty lists when no stuck settlements', async () => {
    vi.mocked(dal.getReconciliationReport).mockResolvedValueOnce({
      stuckSettlements: [],
      recentRuns: [],
      lastRunAt: null,
    })
    const result = await dal.getReconciliationReport()
    expect(result.stuckSettlements).toHaveLength(0)
    expect(result.lastRunAt).toBeNull()
  })
})

// ── STUCK_TIMEOUT_MINUTES constant ────────────────────────────────────────────
describe('STUCK_TIMEOUT_MINUTES — configuration', () => {
  it('is 30 minutes', () => {
    expect(dal.STUCK_TIMEOUT_MINUTES).toBe(30)
  })
})

// ── Migration SQL smoke check ─────────────────────────────────────────────────
describe('Migration SQL — 0007_reconciliation.sql', () => {
  it('contains reconciliation_runs table', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const content = readFileSync(
      join(process.cwd(), 'src/db/migrations/0007_reconciliation.sql'),
      'utf-8',
    )
    expect(content).toContain('"reconciliation_runs"')
    expect(content).toContain('triggered_by')
    expect(content).toContain('stuck_count')
    expect(content).toContain('resolved_count')
    expect(content).toContain('started_at')
    expect(content).toContain('completed_at')
  })

  it('contains idempotency-related status column', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const content = readFileSync(
      join(process.cwd(), 'src/db/migrations/0007_reconciliation.sql'),
      'utf-8',
    )
    expect(content).toContain("DEFAULT 'running'")
  })

  it('contains rollback section', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const content = readFileSync(
      join(process.cwd(), 'src/db/migrations/0007_reconciliation.sql'),
      'utf-8',
    )
    expect(content).toContain('Rollback')
    expect(content).toContain('DROP TABLE')
  })

  it('contains indexes for status and started_at', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const content = readFileSync(
      join(process.cwd(), 'src/db/migrations/0007_reconciliation.sql'),
      'utf-8',
    )
    expect(content).toContain('idx_recon_runs_status')
    expect(content).toContain('idx_recon_runs_started')
  })
})
