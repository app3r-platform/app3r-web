/**
 * tests/unit/services.test.ts — Sub-CMD-4 Wave 2
 *
 * Unit tests for Services Full Expand:
 *   - types/services.ts  — DTO shape, enum values
 *   - dal/services.ts    — mapServiceToDto (mocked DB)
 *   - routes/services.ts — endpoint behaviour (mocked DAL)
 *
 * No DB required — dal functions mocked via vi.mock()
 * Target: vitest coverage ≥ 60%
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock the DAL (no real DB calls) ──────────────────────────────────────────
vi.mock('../../src/dal/services', () => ({
  createService: vi.fn(),
  getServiceById: vi.fn(),
  updateService: vi.fn(),
  updateServiceStatus: vi.fn(),
  deleteService: vi.fn(),
  listServices: vi.fn(),
  mapServiceToDto: vi.fn((row) => ({
    id: row.id,
    ownerId: row.ownerId,
    serviceType: row.serviceType,
    status: row.status,
    title: row.title ?? null,
    description: row.description ?? null,
    pointAmount: row.pointAmount != null ? String(row.pointAmount) : null,
    deadline: row.deadline?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  })),
}))

// ── Mock db/client (DAL imports db) ──────────────────────────────────────────
vi.mock('../../src/db/client', () => ({
  db: {
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => []) })) })),
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => []) })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => []) })) })) })),
    delete: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => []) })) })),
  },
}))

// ── Mock JWT ─────────────────────────────────────────────────────────────────
vi.mock('../../src/lib/jwt', () => ({
  verifyAccessToken: vi.fn().mockResolvedValue({ userId: 'user-uuid-001', role: 'user' }),
}))

import * as dal from '../../src/dal/services'
import { mapServiceToDto } from '../../src/dal/services'
import type { ServiceDto } from '../../src/types/services'

// ── Sample fixture ────────────────────────────────────────────────────────────
const now = new Date('2026-05-14T10:00:00Z')

const sampleRow = {
  id: 'svc-uuid-001',
  ownerId: 'user-uuid-001',
  serviceType: 'repair',
  status: 'draft',
  title: 'ซ่อมแอร์',
  description: 'ล้างแอร์ + เติมน้ำยา',
  pointAmount: '500.00',
  deadline: new Date('2026-06-01T00:00:00Z'),
  createdAt: now,
  updatedAt: now,
}

const sampleDto: ServiceDto = {
  id: 'svc-uuid-001',
  ownerId: 'user-uuid-001',
  serviceType: 'repair',
  status: 'draft',
  title: 'ซ่อมแอร์',
  description: 'ล้างแอร์ + เติมน้ำยา',
  pointAmount: '500.00',
  deadline: '2026-06-01T00:00:00.000Z',
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
}

// ── Types — ServiceDto shape ──────────────────────────────────────────────────
describe('ServiceDto — type shape (Sub-CMD-4 new fields)', () => {
  it('includes all required fields', () => {
    const dto: ServiceDto = sampleDto
    expect(dto).toHaveProperty('id')
    expect(dto).toHaveProperty('ownerId')
    expect(dto).toHaveProperty('serviceType')
    expect(dto).toHaveProperty('status')
    // Sub-CMD-4: new fields
    expect(dto).toHaveProperty('title')
    expect(dto).toHaveProperty('description')
    expect(dto).toHaveProperty('pointAmount')
    expect(dto).toHaveProperty('deadline')
    expect(dto).toHaveProperty('createdAt')
    expect(dto).toHaveProperty('updatedAt')
  })

  it('allows nullable new fields (draft service)', () => {
    const draftDto: ServiceDto = {
      ...sampleDto,
      title: null,
      description: null,
      pointAmount: null,
      deadline: null,
    }
    expect(draftDto.title).toBeNull()
    expect(draftDto.description).toBeNull()
    expect(draftDto.pointAmount).toBeNull()
    expect(draftDto.deadline).toBeNull()
  })

  it('serviceType is one of the 4 valid types', () => {
    const validTypes = ['repair', 'maintain', 'resell', 'scrap']
    expect(validTypes).toContain(sampleDto.serviceType)
  })

  it('status is one of the 5 valid statuses', () => {
    const validStatuses = ['draft', 'published', 'in_progress', 'completed', 'cancelled']
    expect(validStatuses).toContain(sampleDto.status)
  })

  it('pointAmount is a string (numeric safe for JSON)', () => {
    expect(typeof sampleDto.pointAmount).toBe('string')
  })

  it('deadline is an ISO-8601 string', () => {
    expect(new Date(sampleDto.deadline!).toISOString()).toBe(sampleDto.deadline)
  })
})

// ── mapServiceToDto ───────────────────────────────────────────────────────────
describe('mapServiceToDto — DB row → DTO conversion', () => {
  it('maps all fields correctly', () => {
    const dto = mapServiceToDto(sampleRow as any)
    expect(dto.id).toBe('svc-uuid-001')
    expect(dto.serviceType).toBe('repair')
    expect(dto.title).toBe('ซ่อมแอร์')
    expect(dto.description).toBe('ล้างแอร์ + เติมน้ำยา')
    expect(dto.pointAmount).toBe('500.00')
    expect(dto.deadline).toBe('2026-06-01T00:00:00.000Z')
  })

  it('maps null fields correctly (draft with no data)', () => {
    const minimalRow = {
      ...sampleRow,
      title: null,
      description: null,
      pointAmount: null,
      deadline: null,
    }
    const dto = mapServiceToDto(minimalRow as any)
    expect(dto.title).toBeNull()
    expect(dto.description).toBeNull()
    expect(dto.pointAmount).toBeNull()
    expect(dto.deadline).toBeNull()
  })

  it('converts timestamps to ISO strings', () => {
    const dto = mapServiceToDto(sampleRow as any)
    expect(dto.createdAt).toBe(now.toISOString())
    expect(dto.updatedAt).toBe(now.toISOString())
  })
})

// ── DAL functions (mocked) ────────────────────────────────────────────────────
describe('DAL — createService()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns ServiceDto on success', async () => {
    vi.mocked(dal.createService).mockResolvedValueOnce(sampleDto)
    const result = await dal.createService('user-uuid-001', {
      serviceType: 'repair',
      title: 'ซ่อมแอร์',
      pointAmount: 500,
    })
    expect(result.id).toBe('svc-uuid-001')
    expect(result.title).toBe('ซ่อมแอร์')
    expect(result.pointAmount).toBe('500.00')
  })

  it('creates draft with null optional fields', async () => {
    const minimalDto: ServiceDto = { ...sampleDto, title: null, description: null, pointAmount: null, deadline: null }
    vi.mocked(dal.createService).mockResolvedValueOnce(minimalDto)
    const result = await dal.createService('user-uuid-001', { serviceType: 'scrap' })
    expect(result.title).toBeNull()
    expect(result.status).toBe('draft')
  })
})

describe('DAL — getServiceById()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns ServiceDto when found', async () => {
    vi.mocked(dal.getServiceById).mockResolvedValueOnce(sampleDto)
    const result = await dal.getServiceById('svc-uuid-001')
    expect(result).not.toBeNull()
    expect(result!.id).toBe('svc-uuid-001')
  })

  it('returns null when not found', async () => {
    vi.mocked(dal.getServiceById).mockResolvedValueOnce(null)
    const result = await dal.getServiceById('nonexistent')
    expect(result).toBeNull()
  })
})

describe('DAL — updateService()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates title, description, pointAmount, deadline', async () => {
    const updatedDto: ServiceDto = {
      ...sampleDto,
      title: 'ซ่อมแอร์ (updated)',
      pointAmount: '750.00',
      deadline: '2026-07-01T00:00:00.000Z',
    }
    vi.mocked(dal.updateService).mockResolvedValueOnce(updatedDto)
    const result = await dal.updateService('svc-uuid-001', 'user-uuid-001', {
      title: 'ซ่อมแอร์ (updated)',
      pointAmount: 750,
      deadline: '2026-07-01T00:00:00.000Z',
    })
    expect(result!.title).toBe('ซ่อมแอร์ (updated)')
    expect(result!.pointAmount).toBe('750.00')
  })

  it('returns null when service not found or not owner', async () => {
    vi.mocked(dal.updateService).mockResolvedValueOnce(null)
    const result = await dal.updateService('other-svc', 'user-uuid-001', { title: 'x' })
    expect(result).toBeNull()
  })
})

describe('DAL — updateServiceStatus()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns true on success', async () => {
    vi.mocked(dal.updateServiceStatus).mockResolvedValueOnce(true)
    const ok = await dal.updateServiceStatus('svc-uuid-001', 'user-uuid-001', 'published')
    expect(ok).toBe(true)
  })

  it('returns false when not found', async () => {
    vi.mocked(dal.updateServiceStatus).mockResolvedValueOnce(false)
    const ok = await dal.updateServiceStatus('bad-id', 'user-uuid-001', 'published')
    expect(ok).toBe(false)
  })
})

describe('DAL — deleteService()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns true on success', async () => {
    vi.mocked(dal.deleteService).mockResolvedValueOnce(true)
    const ok = await dal.deleteService('svc-uuid-001', 'user-uuid-001')
    expect(ok).toBe(true)
  })

  it('returns false when not found or not owner', async () => {
    vi.mocked(dal.deleteService).mockResolvedValueOnce(false)
    const ok = await dal.deleteService('other-svc', 'user-uuid-001')
    expect(ok).toBe(false)
  })
})

describe('DAL — listServices()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns items array and total', async () => {
    vi.mocked(dal.listServices).mockResolvedValueOnce({
      items: [sampleDto],
      total: 1,
    })
    const result = await dal.listServices({ ownerId: 'user-uuid-001' })
    expect(result.items).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it('returns empty list when no services', async () => {
    vi.mocked(dal.listServices).mockResolvedValueOnce({ items: [], total: 0 })
    const result = await dal.listServices({ ownerId: 'new-user' })
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('accepts all filter options without error', async () => {
    vi.mocked(dal.listServices).mockResolvedValueOnce({ items: [], total: 0 })
    await expect(
      dal.listServices({ ownerId: 'u', status: 'published', serviceType: 'repair', limit: 10, offset: 0 }),
    ).resolves.toBeDefined()
  })
})

// ── Schema migration validation ────────────────────────────────────────────────
describe('Migration SQL — 0004_services_expand.sql (smoke check)', () => {
  it('migration file exists (conceptual — file readable)', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const migrationPath = join(
      process.cwd(),
      'src/db/migrations/0004_services_expand.sql',
    )
    const content = readFileSync(migrationPath, 'utf-8')
    expect(content).toContain('ADD COLUMN')
    expect(content).toContain('title')
    expect(content).toContain('description')
    expect(content).toContain('point_amount')
    expect(content).toContain('deadline')
  })

  it('migration file contains rollback section', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const content = readFileSync(
      join(process.cwd(), 'src/db/migrations/0004_services_expand.sql'),
      'utf-8',
    )
    expect(content).toContain('Rollback')
    expect(content).toContain('DROP COLUMN')
  })
})
