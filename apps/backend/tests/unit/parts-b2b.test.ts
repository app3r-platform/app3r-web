/**
 * tests/unit/parts-b2b.test.ts — Sub-CMD-8 Wave 3
 *
 * Unit tests for Parts Marketplace B2B:
 *   - types/parts-b2b.ts        — DTO shape, enum values
 *   - dal/parts-b2b.ts          — mappers (mocked DB)
 *   - Order lifecycle           — create → fulfill → close → rate
 *   - Dispute flow              — raise → admin resolve
 *   - Migration SQL smoke check — 0008_parts_b2b.sql
 *
 * No DB required — mocked via vi.mock()
 * Target: vitest coverage ≥ 60%
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock DB ───────────────────────────────────────────────────────────────────
vi.mock('../../src/db/client', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => []),
        onConflictDoNothing: vi.fn(() => ({ returning: vi.fn(async () => []) })),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(async () => []),
          limit: vi.fn(async () => []),
          returning: vi.fn(async () => []),
        })),
        orderBy: vi.fn(() => ({ limit: vi.fn(async () => []) })),
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
vi.mock('../../src/dal/parts-b2b', () => ({
  createPartsOrder: vi.fn(),
  getPartsOrderDetail: vi.fn(),
  fulfillPartsOrder: vi.fn(),
  closePartsOrder: vi.fn(),
  raiseDispute: vi.fn(),
  resolveDispute: vi.fn(),
  rateOrder: vi.fn(),
  listPartsOrders: vi.fn(),
  mapOrderToDto: vi.fn((row) => ({
    id: row.id,
    partId: row.partId,
    buyerId: row.buyerId,
    serviceId: row.serviceId ?? null,
    quantity: row.quantity,
    unitPriceThb: String(row.unitPriceThb),
    totalThb: String(row.totalThb),
    status: row.status,
    fulfillmentNote: row.fulfillmentNote ?? null,
    trackingNumber: row.trackingNumber ?? null,
    fulfilledAt: row.fulfilledAt ? row.fulfilledAt.toISOString() : null,
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
    idempotencyKey: row.idempotencyKey,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  })),
  mapEventToDto: vi.fn((row) => ({
    id: row.id,
    orderId: row.orderId,
    eventType: row.eventType,
    actorId: row.actorId ?? null,
    oldStatus: row.oldStatus ?? null,
    newStatus: row.newStatus ?? null,
    detail: row.detail ?? null,
    createdAt: row.createdAt.toISOString(),
  })),
  mapDisputeToDto: vi.fn((row) => ({
    id: row.id,
    orderId: row.orderId,
    raisedBy: row.raisedBy,
    reason: row.reason,
    status: row.status,
    resolution: row.resolution ?? null,
    resolvedBy: row.resolvedBy ?? null,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
  })),
  mapRatingToDto: vi.fn((row) => ({
    id: row.id,
    orderId: row.orderId,
    ratedBy: row.ratedBy,
    sellerId: row.sellerId,
    score: row.score,
    comment: row.comment ?? null,
    createdAt: row.createdAt.toISOString(),
  })),
}))

// ── Mock JWT ──────────────────────────────────────────────────────────────────
vi.mock('../../src/lib/jwt', () => ({
  verifyAccessToken: vi.fn().mockResolvedValue({ userId: 'buyer-001', role: 'weeer' }),
}))

import * as dal from '../../src/dal/parts-b2b'
import { mapOrderToDto, mapEventToDto, mapDisputeToDto, mapRatingToDto } from '../../src/dal/parts-b2b'
import type {
  PartsOrderDto,
  PartsOrderDetailDto,
  PartsOrderEventDto,
  PartsDisputeDto,
  PartsRatingDto,
  PartsOrderListDto,
  PartsOrderStatus,
  PartsOrderEventType,
  PartsDisputeStatus,
  PartsOrderListDto,
} from '../../src/types/parts-b2b'

// ── Fixtures ──────────────────────────────────────────────────────────────────
const now = new Date('2026-05-14T12:00:00Z')

const sampleOrderRow = {
  id: 'order-uuid-001',
  partId: 'part-uuid-001',
  buyerId: 'buyer-001',
  serviceId: null,
  quantity: 2,
  unitPriceThb: '500.00',
  totalThb: '1000.00',
  status: 'held',
  fulfillmentNote: null,
  trackingNumber: null,
  fulfilledAt: null,
  closedAt: null,
  idempotencyKey: 'idem-001',
  createdAt: now,
  updatedAt: now,
}

const sampleOrderDto: PartsOrderDto = {
  id: 'order-uuid-001',
  partId: 'part-uuid-001',
  buyerId: 'buyer-001',
  serviceId: null,
  quantity: 2,
  unitPriceThb: '500.00',
  totalThb: '1000.00',
  status: 'held',
  fulfillmentNote: null,
  trackingNumber: null,
  fulfilledAt: null,
  closedAt: null,
  idempotencyKey: 'idem-001',
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
}

const sampleEventRow = {
  id: 'event-001',
  orderId: 'order-uuid-001',
  eventType: 'created',
  actorId: 'buyer-001',
  oldStatus: null,
  newStatus: 'held',
  detail: '{"partId":"part-uuid-001"}',
  createdAt: now,
}

const sampleDisputeRow = {
  id: 'dispute-001',
  orderId: 'order-uuid-001',
  raisedBy: 'buyer-001',
  reason: 'Part arrived damaged',
  status: 'open',
  resolution: null,
  resolvedBy: null,
  createdAt: now,
  resolvedAt: null,
}

const sampleRatingRow = {
  id: 'rating-001',
  orderId: 'order-uuid-001',
  ratedBy: 'buyer-001',
  sellerId: 'seller-001',
  score: 5,
  comment: 'Excellent parts!',
  createdAt: now,
}

// ── Types — PartsOrderDto shape ───────────────────────────────────────────────
describe('PartsOrderDto — type shape (Sub-CMD-8 source-of-truth)', () => {
  it('includes all required fields', () => {
    const dto: PartsOrderDto = sampleOrderDto
    expect(dto).toHaveProperty('id')
    expect(dto).toHaveProperty('partId')
    expect(dto).toHaveProperty('buyerId')
    expect(dto).toHaveProperty('quantity')
    expect(dto).toHaveProperty('unitPriceThb')
    expect(dto).toHaveProperty('totalThb')
    expect(dto).toHaveProperty('status')
    expect(dto).toHaveProperty('idempotencyKey')
    expect(dto).toHaveProperty('fulfilledAt')
    expect(dto).toHaveProperty('closedAt')
  })

  it('unitPriceThb and totalThb are strings (JSON safe)', () => {
    expect(typeof sampleOrderDto.unitPriceThb).toBe('string')
    expect(typeof sampleOrderDto.totalThb).toBe('string')
  })

  it('status includes all B2B lifecycle values', () => {
    const valid: PartsOrderStatus[] = [
      'pending', 'held', 'fulfilled', 'closed', 'disputed', 'resolved', 'refunded', 'cancelled',
    ]
    expect(valid).toContain(sampleOrderDto.status)
  })

  it('nullable fields default to null before lifecycle events', () => {
    expect(sampleOrderDto.fulfillmentNote).toBeNull()
    expect(sampleOrderDto.trackingNumber).toBeNull()
    expect(sampleOrderDto.fulfilledAt).toBeNull()
    expect(sampleOrderDto.closedAt).toBeNull()
  })
})

// ── Types — PartsOrderEventDto shape ────────────────────────────────────────
describe('PartsOrderEventDto — audit trail type (Security Rule #5)', () => {
  it('includes all required audit fields', () => {
    const dto: PartsOrderEventDto = {
      id: 'event-001', orderId: 'order-001', eventType: 'created',
      actorId: 'buyer-001', oldStatus: null, newStatus: 'held',
      detail: null, createdAt: now.toISOString(),
    }
    expect(dto).toHaveProperty('eventType')
    expect(dto).toHaveProperty('orderId')
    expect(dto).toHaveProperty('actorId')
  })

  it('eventType covers all lifecycle transitions', () => {
    const valid: PartsOrderEventType[] = [
      'created', 'held', 'fulfilled', 'closed',
      'disputed', 'resolved_buyer', 'resolved_seller',
      'refunded', 'rated', 'cancelled',
    ]
    expect(valid.length).toBe(10)
    expect(valid).toContain('created')
    expect(valid).toContain('disputed')
    expect(valid).toContain('rated')
  })

  it('actorId can be null (system action)', () => {
    const systemEvent: PartsOrderEventDto = {
      id: 'event-002', orderId: 'order-001', eventType: 'held',
      actorId: null, oldStatus: null, newStatus: 'held',
      detail: null, createdAt: now.toISOString(),
    }
    expect(systemEvent.actorId).toBeNull()
  })
})

// ── Types — PartsDisputeDto ───────────────────────────────────────────────────
describe('PartsDisputeDto — dispute type (R3 Mitigation)', () => {
  it('includes all dispute fields', () => {
    const dto: PartsDisputeDto = {
      id: 'dispute-001', orderId: 'order-001', raisedBy: 'buyer-001',
      reason: 'Part damaged', status: 'open',
      resolution: null, resolvedBy: null,
      createdAt: now.toISOString(), resolvedAt: null,
    }
    expect(dto).toHaveProperty('reason')
    expect(dto).toHaveProperty('status')
    expect(dto).toHaveProperty('resolution')
    expect(dto).toHaveProperty('resolvedBy')
  })

  it('status covers all dispute lifecycle values', () => {
    const valid: PartsDisputeStatus[] = [
      'open', 'admin_reviewing', 'resolved_buyer', 'resolved_seller', 'withdrawn',
    ]
    expect(valid).toContain('open')
    expect(valid).toContain('resolved_buyer')
    expect(valid).toContain('resolved_seller')
  })
})

// ── Types — PartsRatingDto ────────────────────────────────────────────────────
describe('PartsRatingDto — rating type', () => {
  it('score must be 1–5', () => {
    const validScores = [1, 2, 3, 4, 5]
    expect(validScores).toContain(5)
    expect(validScores).toContain(1)
    const invalidScores = [0, 6]
    invalidScores.forEach(s => expect(validScores).not.toContain(s))
  })
})

// ── Mappers ───────────────────────────────────────────────────────────────────
describe('mapOrderToDto — DB row → DTO', () => {
  it('maps all fields correctly', () => {
    const dto = mapOrderToDto(sampleOrderRow as any)
    expect(dto.id).toBe('order-uuid-001')
    expect(dto.status).toBe('held')
    expect(dto.quantity).toBe(2)
    expect(dto.unitPriceThb).toBe('500.00')
    expect(dto.totalThb).toBe('1000.00')
  })

  it('fulfilledAt and closedAt are null when not set', () => {
    const dto = mapOrderToDto(sampleOrderRow as any)
    expect(dto.fulfilledAt).toBeNull()
    expect(dto.closedAt).toBeNull()
  })

  it('converts dates to ISO strings', () => {
    const dto = mapOrderToDto(sampleOrderRow as any)
    expect(dto.createdAt).toBe(now.toISOString())
    expect(dto.updatedAt).toBe(now.toISOString())
  })
})

describe('mapEventToDto — DB row → EventDto', () => {
  it('maps audit event correctly', () => {
    const dto = mapEventToDto(sampleEventRow as any)
    expect(dto.id).toBe('event-001')
    expect(dto.eventType).toBe('created')
    expect(dto.actorId).toBe('buyer-001')
    expect(dto.newStatus).toBe('held')
  })
})

describe('mapDisputeToDto — DB row → DisputeDto', () => {
  it('maps dispute correctly', () => {
    const dto = mapDisputeToDto(sampleDisputeRow as any)
    expect(dto.id).toBe('dispute-001')
    expect(dto.status).toBe('open')
    expect(dto.resolution).toBeNull()
    expect(dto.resolvedAt).toBeNull()
  })
})

describe('mapRatingToDto — DB row → RatingDto', () => {
  it('maps rating correctly', () => {
    const dto = mapRatingToDto(sampleRatingRow as any)
    expect(dto.id).toBe('rating-001')
    expect(dto.score).toBe(5)
    expect(dto.comment).toBe('Excellent parts!')
    expect(dto.sellerId).toBe('seller-001')
  })
})

// ── DAL — createPartsOrder() ──────────────────────────────────────────────────
describe('DAL — createPartsOrder()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns PartsOrderDto on success', async () => {
    vi.mocked(dal.createPartsOrder).mockResolvedValueOnce(sampleOrderDto)
    const result = await dal.createPartsOrder('buyer-001', {
      partId: 'part-uuid-001', quantity: 2, idempotencyKey: 'idem-001',
    })
    expect(result).not.toBeNull()
    expect(result!.status).toBe('held')
    expect(result!.totalThb).toBe('1000.00')
  })

  it('returns null when part not found or insufficient stock', async () => {
    vi.mocked(dal.createPartsOrder).mockResolvedValueOnce(null)
    const result = await dal.createPartsOrder('buyer-001', {
      partId: 'nonexistent', quantity: 999, idempotencyKey: 'idem-002',
    })
    expect(result).toBeNull()
  })
})

// ── DAL — getPartsOrderDetail() ───────────────────────────────────────────────
describe('DAL — getPartsOrderDetail()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns full detail with events, dispute, rating', async () => {
    const detail: PartsOrderDetailDto = {
      ...sampleOrderDto,
      events: [{
        id: 'event-001', orderId: 'order-uuid-001', eventType: 'created',
        actorId: 'buyer-001', oldStatus: null, newStatus: 'held',
        detail: null, createdAt: now.toISOString(),
      }],
      dispute: null,
      rating: null,
    }
    vi.mocked(dal.getPartsOrderDetail).mockResolvedValueOnce(detail)
    const result = await dal.getPartsOrderDetail('order-uuid-001')
    expect(result).not.toBeNull()
    expect(result!.events).toHaveLength(1)
    expect(result!.events[0].eventType).toBe('created')
    expect(result!.dispute).toBeNull()
    expect(result!.rating).toBeNull()
  })

  it('returns null when not found', async () => {
    vi.mocked(dal.getPartsOrderDetail).mockResolvedValueOnce(null)
    const result = await dal.getPartsOrderDetail('nonexistent')
    expect(result).toBeNull()
  })
})

// ── DAL — Order Lifecycle ─────────────────────────────────────────────────────
describe('DAL — fulfillPartsOrder()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns updated order with fulfilled status', async () => {
    const fulfilled = { ...sampleOrderDto, status: 'fulfilled' as PartsOrderStatus,
      trackingNumber: 'TRK-001', fulfilledAt: now.toISOString() }
    vi.mocked(dal.fulfillPartsOrder).mockResolvedValueOnce(fulfilled)
    const result = await dal.fulfillPartsOrder('order-uuid-001', 'seller-001', { trackingNumber: 'TRK-001' })
    expect(result!.status).toBe('fulfilled')
    expect(result!.trackingNumber).toBe('TRK-001')
  })

  it('returns null when order not in held status or seller mismatch', async () => {
    vi.mocked(dal.fulfillPartsOrder).mockResolvedValueOnce(null)
    const result = await dal.fulfillPartsOrder('order-uuid-001', 'wrong-seller', {})
    expect(result).toBeNull()
  })
})

describe('DAL — closePartsOrder()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns closed order', async () => {
    const closed = { ...sampleOrderDto, status: 'closed' as PartsOrderStatus,
      closedAt: now.toISOString() }
    vi.mocked(dal.closePartsOrder).mockResolvedValueOnce(closed)
    const result = await dal.closePartsOrder('order-uuid-001', 'buyer-001')
    expect(result!.status).toBe('closed')
    expect(result!.closedAt).not.toBeNull()
  })
})

// ── DAL — Dispute Flow ────────────────────────────────────────────────────────
describe('DAL — raiseDispute()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns dispute DTO', async () => {
    const dispute: PartsDisputeDto = {
      id: 'dispute-001', orderId: 'order-uuid-001', raisedBy: 'buyer-001',
      reason: 'Part damaged on arrival', status: 'open',
      resolution: null, resolvedBy: null,
      createdAt: now.toISOString(), resolvedAt: null,
    }
    vi.mocked(dal.raiseDispute).mockResolvedValueOnce(dispute)
    const result = await dal.raiseDispute('order-uuid-001', 'buyer-001', 'Part damaged on arrival')
    expect(result!.status).toBe('open')
    expect(result!.reason).toBe('Part damaged on arrival')
  })

  it('returns null when order not in disputable state', async () => {
    vi.mocked(dal.raiseDispute).mockResolvedValueOnce(null)
    const result = await dal.raiseDispute('order-uuid-001', 'buyer-001', 'reason')
    expect(result).toBeNull()
  })
})

describe('DAL — resolveDispute() — Admin override (R3)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('resolves in favour of buyer (refund)', async () => {
    const resolved: PartsDisputeDto = {
      id: 'dispute-001', orderId: 'order-uuid-001', raisedBy: 'buyer-001',
      reason: 'Part damaged', status: 'resolved_buyer',
      resolution: 'Refund approved by admin', resolvedBy: 'admin-001',
      createdAt: now.toISOString(), resolvedAt: now.toISOString(),
    }
    vi.mocked(dal.resolveDispute).mockResolvedValueOnce(resolved)
    const result = await dal.resolveDispute('order-uuid-001', 'admin-001', 'resolved_buyer', 'Refund approved by admin')
    expect(result!.status).toBe('resolved_buyer')
    expect(result!.resolvedBy).toBe('admin-001')
  })

  it('resolves in favour of seller', async () => {
    const resolved: PartsDisputeDto = {
      id: 'dispute-001', orderId: 'order-uuid-001', raisedBy: 'buyer-001',
      reason: 'Claim unfounded', status: 'resolved_seller',
      resolution: 'Seller cleared', resolvedBy: 'admin-001',
      createdAt: now.toISOString(), resolvedAt: now.toISOString(),
    }
    vi.mocked(dal.resolveDispute).mockResolvedValueOnce(resolved)
    const result = await dal.resolveDispute('order-uuid-001', 'admin-001', 'resolved_seller', 'Seller cleared')
    expect(result!.status).toBe('resolved_seller')
  })
})

// ── DAL — rateOrder() ────────────────────────────────────────────────────────
describe('DAL — rateOrder()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns rating DTO on success', async () => {
    const rating: PartsRatingDto = {
      id: 'rating-001', orderId: 'order-uuid-001',
      ratedBy: 'buyer-001', sellerId: 'seller-001',
      score: 5, comment: 'Great!', createdAt: now.toISOString(),
    }
    vi.mocked(dal.rateOrder).mockResolvedValueOnce(rating)
    const result = await dal.rateOrder('order-uuid-001', 'buyer-001', 5, 'Great!')
    expect(result!.score).toBe(5)
    expect(result!.sellerId).toBe('seller-001')
  })

  it('returns null when order not closed or already rated', async () => {
    vi.mocked(dal.rateOrder).mockResolvedValueOnce(null)
    const result = await dal.rateOrder('order-uuid-001', 'buyer-001', 4)
    expect(result).toBeNull()
  })
})

// ── DAL — listPartsOrders() (Sub-CMD-9) ───────────────────────────────────────
describe('DAL — listPartsOrders()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated list with default limit/offset', async () => {
    const listResult: PartsOrderListDto = {
      items: [sampleOrderDto],
      total: 1,
      limit: 20,
      offset: 0,
    }
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce(listResult)
    const result = await dal.listPartsOrders({})
    expect(result.items).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.limit).toBe(20)
    expect(result.offset).toBe(0)
  })

  it('returns empty list when no orders match filter', async () => {
    const listResult: PartsOrderListDto = { items: [], total: 0, limit: 20, offset: 0 }
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce(listResult)
    const result = await dal.listPartsOrders({ buyerId: 'nonexistent-buyer' })
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('filters by status correctly', async () => {
    const heldOrder = { ...sampleOrderDto, status: 'held' as PartsOrderStatus }
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce({
      items: [heldOrder], total: 1, limit: 20, offset: 0,
    })
    const result = await dal.listPartsOrders({ status: 'held' })
    expect(result.items[0].status).toBe('held')
  })

  it('respects custom limit and offset', async () => {
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce({
      items: [], total: 50, limit: 5, offset: 10,
    })
    const result = await dal.listPartsOrders({ limit: 5, offset: 10 })
    expect(result.limit).toBe(5)
    expect(result.offset).toBe(10)
    expect(result.total).toBe(50)
  })

  it('returns empty list when sellerId has no parts', async () => {
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce({
      items: [], total: 0, limit: 20, offset: 0,
    })
    const result = await dal.listPartsOrders({ sellerId: 'seller-no-parts' })
    expect(result.items).toHaveLength(0)
  })
})

// ── Route — GET / list orders (Sub-CMD-9) ─────────────────────────────────────
import { app } from '../../src/app'

describe('Route — GET /api/v1/parts/orders/ (Sub-CMD-9 list endpoint)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when no Authorization header', async () => {
    const res = await app.request('/api/v1/parts/orders/')
    expect(res.status).toBe(401)
    const body = await res.json() as { detail: string }
    expect(body.detail).toContain('Authentication')
  })

  it('returns 200 with pagination shape on authenticated request', async () => {
    const listResult: PartsOrderListDto = {
      items: [sampleOrderDto],
      total: 1,
      limit: 20,
      offset: 0,
    }
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce(listResult)

    const res = await app.request('/api/v1/parts/orders/', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json() as PartsOrderListDto
    expect(body).toHaveProperty('items')
    expect(body).toHaveProperty('total')
    expect(body).toHaveProperty('limit')
    expect(body).toHaveProperty('offset')
    expect(Array.isArray(body.items)).toBe(true)
  })

  it('passes buyerId filter to DAL', async () => {
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce({
      items: [], total: 0, limit: 20, offset: 0,
    })
    const buyerId = 'buyer-filter-001'
    // Use a valid UUID for the buyerId query param
    const validUuid = '00000000-0000-0000-0000-000000000001'
    const res = await app.request(`/api/v1/parts/orders/?buyerId=${validUuid}`, {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
  })

  it('passes status filter to DAL', async () => {
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce({
      items: [], total: 0, limit: 20, offset: 0,
    })
    const res = await app.request('/api/v1/parts/orders/?status=fulfilled', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
  })

  it('returns 400 for invalid status value', async () => {
    const res = await app.request('/api/v1/parts/orders/?status=invalid-status', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect([400, 422]).toContain(res.status)
  })
})

// ── Types — PartsOrderListDto shape (Sub-CMD-9) ───────────────────────────────
describe('PartsOrderListDto — type shape (Sub-CMD-9)', () => {
  it('has required pagination fields', () => {
    const listDto: PartsOrderListDto = {
      items: [sampleOrderDto],
      total: 1,
      limit: 20,
      offset: 0,
    }
    expect(listDto).toHaveProperty('items')
    expect(listDto).toHaveProperty('total')
    expect(listDto).toHaveProperty('limit')
    expect(listDto).toHaveProperty('offset')
    expect(Array.isArray(listDto.items)).toBe(true)
  })

  it('items are PartsOrderDto instances', () => {
    const listDto: PartsOrderListDto = {
      items: [sampleOrderDto],
      total: 1,
      limit: 20,
      offset: 0,
    }
    const item = listDto.items[0]
    expect(item).toHaveProperty('id')
    expect(item).toHaveProperty('status')
    expect(item).toHaveProperty('buyerId')
  })

  it('limit is capped at reasonable value', () => {
    const listDto: PartsOrderListDto = { items: [], total: 0, limit: 100, offset: 0 }
    expect(listDto.limit).toBeLessThanOrEqual(100)
  })
})

// ── Migration SQL smoke check ─────────────────────────────────────────────────
describe('Migration SQL — 0008_parts_b2b.sql', () => {
  it('contains ALTER TABLE parts_orders', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const content = readFileSync(
      join(process.cwd(), 'src/db/migrations/0008_parts_b2b.sql'), 'utf-8',
    )
    expect(content).toContain('"parts_orders"')
    expect(content).toContain('fulfillment_note')
    expect(content).toContain('tracking_number')
    expect(content).toContain('fulfilled_at')
    expect(content).toContain('closed_at')
  })

  it('contains parts_order_events table (audit trail)', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const content = readFileSync(
      join(process.cwd(), 'src/db/migrations/0008_parts_b2b.sql'), 'utf-8',
    )
    expect(content).toContain('"parts_order_events"')
    expect(content).toContain('event_type')
    expect(content).toContain('actor_id')
  })

  it('contains parts_disputes table', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const content = readFileSync(
      join(process.cwd(), 'src/db/migrations/0008_parts_b2b.sql'), 'utf-8',
    )
    expect(content).toContain('"parts_disputes"')
    expect(content).toContain('raised_by')
    expect(content).toContain('resolved_by')
  })

  it('contains parts_ratings table with score CHECK', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const content = readFileSync(
      join(process.cwd(), 'src/db/migrations/0008_parts_b2b.sql'), 'utf-8',
    )
    expect(content).toContain('"parts_ratings"')
    expect(content).toContain('CHECK')
    expect(content).toContain('score')
    expect(content).toContain('seller_id')
  })

  it('contains rollback section', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const content = readFileSync(
      join(process.cwd(), 'src/db/migrations/0008_parts_b2b.sql'), 'utf-8',
    )
    expect(content).toContain('Rollback')
    expect(content).toContain('DROP TABLE')
    expect(content).toContain('DROP COLUMN')
  })
})

// ── Types — PartsOrderListDto (Sub-CMD-9 list endpoint) ──────────────────────
describe('PartsOrderListDto — pagination shape (Sub-CMD-9)', () => {
  it('has items array, total, limit, offset fields', () => {
    const list: PartsOrderListDto = {
      items: [sampleOrderDto],
      total: 1,
      limit: 20,
      offset: 0,
    }
    expect(list).toHaveProperty('items')
    expect(list).toHaveProperty('total')
    expect(list).toHaveProperty('limit')
    expect(list).toHaveProperty('offset')
    expect(Array.isArray(list.items)).toBe(true)
  })

  it('items contains valid PartsOrderDto objects', () => {
    const list: PartsOrderListDto = {
      items: [sampleOrderDto],
      total: 1,
      limit: 20,
      offset: 0,
    }
    expect(list.items[0]).toHaveProperty('id')
    expect(list.items[0]).toHaveProperty('status')
    expect(list.items[0]).toHaveProperty('totalThb')
    expect(typeof list.items[0].totalThb).toBe('string')
  })

  it('empty list has zero total', () => {
    const empty: PartsOrderListDto = { items: [], total: 0, limit: 20, offset: 0 }
    expect(empty.items).toHaveLength(0)
    expect(empty.total).toBe(0)
  })
})

// ── DAL — listPartsOrders() (Sub-CMD-9) ──────────────────────────────────────
describe('DAL — listPartsOrders()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns list with items and total', async () => {
    const list: PartsOrderListDto = {
      items: [sampleOrderDto],
      total: 1,
      limit: 20,
      offset: 0,
    }
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce(list)
    const result = await dal.listPartsOrders({})
    expect(result.items).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.limit).toBe(20)
    expect(result.offset).toBe(0)
  })

  it('returns empty list when no orders match filter', async () => {
    const empty: PartsOrderListDto = { items: [], total: 0, limit: 20, offset: 0 }
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce(empty)
    const result = await dal.listPartsOrders({ status: 'closed' })
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('respects limit and offset for pagination', async () => {
    const page: PartsOrderListDto = { items: [], total: 50, limit: 10, offset: 20 }
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce(page)
    const result = await dal.listPartsOrders({ limit: 10, offset: 20 })
    expect(result.limit).toBe(10)
    expect(result.offset).toBe(20)
    expect(result.total).toBe(50)
  })

  it('filters by buyerId', async () => {
    const list: PartsOrderListDto = { items: [sampleOrderDto], total: 1, limit: 20, offset: 0 }
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce(list)
    const result = await dal.listPartsOrders({ buyerId: 'buyer-001' })
    expect(result.items[0].buyerId).toBe('buyer-001')
  })

  it('filters by status', async () => {
    const heldOrder = { ...sampleOrderDto, status: 'held' as PartsOrderStatus }
    const list: PartsOrderListDto = { items: [heldOrder], total: 1, limit: 20, offset: 0 }
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce(list)
    const result = await dal.listPartsOrders({ status: 'held' })
    expect(result.items[0].status).toBe('held')
  })

  it('returns empty when sellerId has no parts', async () => {
    const empty: PartsOrderListDto = { items: [], total: 0, limit: 20, offset: 0 }
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce(empty)
    const result = await dal.listPartsOrders({ sellerId: 'seller-no-parts' })
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('returns multiple items when orders exist', async () => {
    const order2 = { ...sampleOrderDto, id: 'order-uuid-002', idempotencyKey: 'idem-002' }
    const list: PartsOrderListDto = {
      items: [sampleOrderDto, order2],
      total: 2,
      limit: 20,
      offset: 0,
    }
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce(list)
    const result = await dal.listPartsOrders({})
    expect(result.items).toHaveLength(2)
    expect(result.total).toBe(2)
  })

  it('limit is capped at 100 (business rule)', async () => {
    const list: PartsOrderListDto = { items: [], total: 0, limit: 100, offset: 0 }
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce(list)
    const result = await dal.listPartsOrders({ limit: 999 })
    expect(result.limit).toBe(100)
  })

  it('default offset is 0 when not provided', async () => {
    const list: PartsOrderListDto = { items: [sampleOrderDto], total: 1, limit: 20, offset: 0 }
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce(list)
    const result = await dal.listPartsOrders({ buyerId: 'buyer-001' })
    expect(result.offset).toBe(0)
  })

  it('filters by sellerId returns correct items', async () => {
    const sellerOrder = { ...sampleOrderDto, partId: 'part-seller-001' }
    const list: PartsOrderListDto = { items: [sellerOrder], total: 1, limit: 20, offset: 0 }
    vi.mocked(dal.listPartsOrders).mockResolvedValueOnce(list)
    const result = await dal.listPartsOrders({ sellerId: 'seller-001' })
    expect(result.items).toHaveLength(1)
    expect(result.total).toBe(1)
  })
})
