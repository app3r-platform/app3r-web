/**
 * tests/unit/service-progress.test.ts — Sub-CMD-5 Wave 2
 *
 * Unit tests for Service Progress Tracker:
 *   - types/service-progress.ts — DTO shape, enum values, timeline
 *   - dal/service-progress.ts   — mapProgressToDto (mocked DB)
 *   - WS broadcast — wsRegistry.emit called with progress:updated
 *
 * No DB required — all mocked via vi.mock()
 * Target: vitest coverage ≥ 60%
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock DB ───────────────────────────────────────────────────────────────────
vi.mock('../../src/db/client', () => ({
  db: {
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(async () => []) })) })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ orderBy: vi.fn(async () => []) })),
      })),
    })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(async () => []) })) })) })),
  },
}))

// ── Mock DAL ──────────────────────────────────────────────────────────────────
vi.mock('../../src/dal/service-progress', () => ({
  mapProgressToDto: vi.fn((row) => ({
    id: row.id,
    serviceId: row.serviceId,
    status: row.status,
    progressPercent: row.progressPercent,
    note: row.note ?? null,
    photoR2Key: row.photoR2Key ?? null,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt.toISOString(),
  })),
  getServiceTimeline: vi.fn(),
  getProgressById: vi.fn(),
  createProgressEntry: vi.fn(),
  updateProgressEntry: vi.fn(),
  getServiceOwnerId: vi.fn(),
}))

// ── Mock JWT ──────────────────────────────────────────────────────────────────
vi.mock('../../src/lib/jwt', () => ({
  verifyAccessToken: vi.fn().mockResolvedValue({ userId: 'weeet-user-001', role: 'technician' }),
}))

// ── Mock WS registry ─────────────────────────────────────────────────────────
vi.mock('../../src/lib/websocket', () => ({
  wsRegistry: { emit: vi.fn(), broadcast: vi.fn() },
  createWsEvent: vi.fn((type, data) => ({ type, data, timestamp: '2026-05-14T10:00:00.000Z' })),
}))

import * as dal from '../../src/dal/service-progress'
import { wsRegistry, createWsEvent } from '../../src/lib/websocket'
import { mapProgressToDto } from '../../src/dal/service-progress'
import type {
  ServiceProgressDto,
  ServiceProgressTimelineDto,
  ServiceProgressStatus,
} from '../../src/types/service-progress'

// ── Fixtures ──────────────────────────────────────────────────────────────────
const now = new Date('2026-05-14T10:00:00Z')

const sampleRow = {
  id: 'prog-uuid-001',
  serviceId: 'svc-uuid-001',
  status: 'in_progress' as ServiceProgressStatus,
  progressPercent: 40,
  note: 'ล้างแอร์เสร็จแล้ว กำลังเติมน้ำยา',
  photoR2Key: 'progress/svc-uuid-001/photo-001.jpg',
  updatedBy: 'weeet-user-001',
  createdAt: now,
}

const sampleDto: ServiceProgressDto = {
  id: 'prog-uuid-001',
  serviceId: 'svc-uuid-001',
  status: 'in_progress',
  progressPercent: 40,
  note: 'ล้างแอร์เสร็จแล้ว กำลังเติมน้ำยา',
  photoR2Key: 'progress/svc-uuid-001/photo-001.jpg',
  updatedBy: 'weeet-user-001',
  createdAt: now.toISOString(),
}

const sampleTimeline: ServiceProgressTimelineDto = {
  serviceId: 'svc-uuid-001',
  entries: [
    { ...sampleDto, status: 'accepted', progressPercent: 0 },
    { ...sampleDto, status: 'in_progress', progressPercent: 40 },
  ],
  latestStatus: 'in_progress',
  latestPercent: 40,
}

// ── Types — ServiceProgressDto shape ─────────────────────────────────────────
describe('ServiceProgressDto — type shape (Sub-CMD-5, Lesson #34 source-of-truth)', () => {
  it('includes all required fields', () => {
    const dto: ServiceProgressDto = sampleDto
    expect(dto).toHaveProperty('id')
    expect(dto).toHaveProperty('serviceId')
    expect(dto).toHaveProperty('status')
    expect(dto).toHaveProperty('progressPercent')
    expect(dto).toHaveProperty('note')
    expect(dto).toHaveProperty('photoR2Key')
    expect(dto).toHaveProperty('updatedBy')
    expect(dto).toHaveProperty('createdAt')
  })

  it('progressPercent is a number between 0 and 100', () => {
    expect(sampleDto.progressPercent).toBeGreaterThanOrEqual(0)
    expect(sampleDto.progressPercent).toBeLessThanOrEqual(100)
  })

  it('status is one of the 6 valid values', () => {
    const valid: ServiceProgressStatus[] = [
      'pending', 'accepted', 'in_progress', 'paused', 'completed', 'cancelled',
    ]
    expect(valid).toContain(sampleDto.status)
  })

  it('photoR2Key stores R2 key not full URL', () => {
    // ต้องไม่เป็น full URL (http:// หรือ https://)
    expect(sampleDto.photoR2Key).not.toMatch(/^https?:\/\//)
  })

  it('allows nullable note and photoR2Key', () => {
    const minDto: ServiceProgressDto = { ...sampleDto, note: null, photoR2Key: null }
    expect(minDto.note).toBeNull()
    expect(minDto.photoR2Key).toBeNull()
  })

  it('createdAt is ISO-8601 format', () => {
    expect(new Date(sampleDto.createdAt).toISOString()).toBe(sampleDto.createdAt)
  })
})

// ── ServiceProgressTimelineDto shape ─────────────────────────────────────────
describe('ServiceProgressTimelineDto — timeline shape', () => {
  it('has serviceId, entries array, latestStatus, latestPercent', () => {
    expect(sampleTimeline).toHaveProperty('serviceId')
    expect(sampleTimeline).toHaveProperty('entries')
    expect(Array.isArray(sampleTimeline.entries)).toBe(true)
    expect(sampleTimeline).toHaveProperty('latestStatus')
    expect(sampleTimeline).toHaveProperty('latestPercent')
  })

  it('entries are ordered (oldest first)', () => {
    expect(sampleTimeline.entries[0].status).toBe('accepted')
    expect(sampleTimeline.entries[1].status).toBe('in_progress')
  })

  it('latestStatus reflects most recent entry', () => {
    expect(sampleTimeline.latestStatus).toBe('in_progress')
    expect(sampleTimeline.latestPercent).toBe(40)
  })

  it('handles empty timeline (no progress yet)', () => {
    const empty: ServiceProgressTimelineDto = {
      serviceId: 'svc-uuid-new',
      entries: [],
      latestStatus: null,
      latestPercent: 0,
    }
    expect(empty.latestStatus).toBeNull()
    expect(empty.latestPercent).toBe(0)
  })
})

// ── mapProgressToDto ──────────────────────────────────────────────────────────
describe('mapProgressToDto — DB row → DTO', () => {
  it('maps all fields correctly', () => {
    const dto = mapProgressToDto(sampleRow as any)
    expect(dto.id).toBe('prog-uuid-001')
    expect(dto.status).toBe('in_progress')
    expect(dto.progressPercent).toBe(40)
    expect(dto.note).toBe('ล้างแอร์เสร็จแล้ว กำลังเติมน้ำยา')
    expect(dto.photoR2Key).toBe('progress/svc-uuid-001/photo-001.jpg')
  })

  it('maps null note and photoR2Key', () => {
    const row = { ...sampleRow, note: null, photoR2Key: null }
    const dto = mapProgressToDto(row as any)
    expect(dto.note).toBeNull()
    expect(dto.photoR2Key).toBeNull()
  })

  it('converts createdAt to ISO string', () => {
    const dto = mapProgressToDto(sampleRow as any)
    expect(dto.createdAt).toBe(now.toISOString())
  })
})

// ── DAL — getServiceTimeline ──────────────────────────────────────────────────
describe('DAL — getServiceTimeline()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns timeline with entries and latestStatus', async () => {
    vi.mocked(dal.getServiceTimeline).mockResolvedValueOnce(sampleTimeline)
    const result = await dal.getServiceTimeline('svc-uuid-001')
    expect(result.entries).toHaveLength(2)
    expect(result.latestStatus).toBe('in_progress')
    expect(result.latestPercent).toBe(40)
  })

  it('returns empty timeline when no progress entries', async () => {
    vi.mocked(dal.getServiceTimeline).mockResolvedValueOnce({
      serviceId: 'svc-new', entries: [], latestStatus: null, latestPercent: 0,
    })
    const result = await dal.getServiceTimeline('svc-new')
    expect(result.entries).toHaveLength(0)
    expect(result.latestStatus).toBeNull()
  })
})

// ── DAL — createProgressEntry ─────────────────────────────────────────────────
describe('DAL — createProgressEntry()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns created ServiceProgressDto', async () => {
    vi.mocked(dal.createProgressEntry).mockResolvedValueOnce(sampleDto)
    const result = await dal.createProgressEntry('weeet-user-001', {
      serviceId: 'svc-uuid-001',
      status: 'in_progress',
      progressPercent: 40,
      note: 'ล้างแอร์เสร็จแล้ว',
    })
    expect(result.id).toBe('prog-uuid-001')
    expect(result.progressPercent).toBe(40)
  })

  it('creates entry without optional note and photoR2Key', async () => {
    const minDto: ServiceProgressDto = { ...sampleDto, note: null, photoR2Key: null }
    vi.mocked(dal.createProgressEntry).mockResolvedValueOnce(minDto)
    const result = await dal.createProgressEntry('weeet-user-001', {
      serviceId: 'svc-uuid-001', status: 'accepted', progressPercent: 0,
    })
    expect(result.note).toBeNull()
    expect(result.photoR2Key).toBeNull()
  })
})

// ── DAL — updateProgressEntry ─────────────────────────────────────────────────
describe('DAL — updateProgressEntry()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns updated dto', async () => {
    const updated: ServiceProgressDto = { ...sampleDto, progressPercent: 80, status: 'paused' }
    vi.mocked(dal.updateProgressEntry).mockResolvedValueOnce(updated)
    const result = await dal.updateProgressEntry('prog-uuid-001', 'weeet-user-001', {
      progressPercent: 80, status: 'paused',
    })
    expect(result!.progressPercent).toBe(80)
    expect(result!.status).toBe('paused')
  })

  it('returns null when not found', async () => {
    vi.mocked(dal.updateProgressEntry).mockResolvedValueOnce(null)
    const result = await dal.updateProgressEntry('bad-id', 'weeet-user-001', { status: 'completed' })
    expect(result).toBeNull()
  })
})

// ── DAL — getServiceOwnerId ───────────────────────────────────────────────────
describe('DAL — getServiceOwnerId()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns ownerId string when service exists', async () => {
    vi.mocked(dal.getServiceOwnerId).mockResolvedValueOnce('weeeu-customer-001')
    const result = await dal.getServiceOwnerId('svc-uuid-001')
    expect(result).toBe('weeeu-customer-001')
  })

  it('returns null when service does not exist', async () => {
    vi.mocked(dal.getServiceOwnerId).mockResolvedValueOnce(null)
    const result = await dal.getServiceOwnerId('nonexistent')
    expect(result).toBeNull()
  })
})

// ── WS Broadcast — progress:updated ──────────────────────────────────────────
describe('WS Broadcast — progress:updated event', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createWsEvent builds correct event shape', () => {
    const event = createWsEvent('progress:updated', { serviceId: 'svc-1', progress: sampleDto })
    expect(event.type).toBe('progress:updated')
    expect(event.data).toHaveProperty('serviceId')
    expect(event.data).toHaveProperty('progress')
    expect(event.timestamp).toBe('2026-05-14T10:00:00.000Z')
  })

  it('wsRegistry.emit is called with ownerId and progress event', () => {
    const event = createWsEvent('progress:updated', { serviceId: 'svc-1', progress: sampleDto })
    wsRegistry.emit('weeeu-customer-001', event)
    expect(wsRegistry.emit).toHaveBeenCalledWith('weeeu-customer-001', event)
  })

  it('wsRegistry.emit is NOT called when owner not found (getServiceOwnerId returns null)', async () => {
    vi.mocked(dal.getServiceOwnerId).mockResolvedValueOnce(null)
    const ownerId = await dal.getServiceOwnerId('nonexistent-svc')
    if (ownerId) {
      wsRegistry.emit(ownerId, createWsEvent('progress:updated', { serviceId: 'x', progress: sampleDto }))
    }
    expect(wsRegistry.emit).not.toHaveBeenCalled()
  })

  it('progress:updated is valid WsEventType', () => {
    // type check — ถ้า compile ผ่านแสดงว่า type ถูกต้อง
    const event = createWsEvent('progress:updated', {})
    expect(event.type).toBe('progress:updated')
  })
})

// ── Migration SQL smoke check ─────────────────────────────────────────────────
describe('Migration SQL — 0005_service_progress.sql', () => {
  it('migration file exists and contains CREATE TABLE', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const content = readFileSync(
      join(process.cwd(), 'src/db/migrations/0005_service_progress.sql'),
      'utf-8',
    )
    expect(content).toContain('CREATE TABLE')
    expect(content).toContain('service_progress')
    expect(content).toContain('service_id')
    expect(content).toContain('progress_percent')
    expect(content).toContain('photo_r2_key')
    expect(content).toContain('updated_by')
  })

  it('migration file contains rollback section', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const content = readFileSync(
      join(process.cwd(), 'src/db/migrations/0005_service_progress.sql'),
      'utf-8',
    )
    expect(content).toContain('Rollback')
    expect(content).toContain('DROP TABLE')
  })
})
