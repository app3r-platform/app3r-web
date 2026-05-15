/**
 * dal/parts-b2b.ts — Sub-CMD-8 Wave 3: Parts B2B DAL
 *
 * Security Rule #5: ทุก order state transition → appendOrderEvent()
 * R1 Mitigation (Escrow): ใช้ pattern เดิมจาก Settlement Sub-6
 *   — escrow_ledger_id @needs-point-review (stub ไว้ก่อน)
 *
 * Business rules:
 *   - Fulfill: seller เท่านั้น (partId.ownerId)
 *   - Close: buyer เท่านั้น (order.buyerId)
 *   - Dispute: buyer เท่านั้น, order ต้องอยู่ใน 'held' | 'fulfilled'
 *   - Resolve: admin เท่านั้น (TODO D-4: role check)
 *   - Rate: buyer เท่านั้น, order ต้องอยู่ใน 'closed'
 */
import { db } from '../db/client'
import { partsOrders } from '../db/schema/parts-orders'
import { partsInventory } from '../db/schema/parts-inventory'
import { partsOrderEvents, partsDisputes, partsRatings } from '../db/schema/parts-b2b'
import { eq, and, desc, sql } from 'drizzle-orm'
import type {
  PartsOrderDto,
  PartsOrderDetailDto,
  PartsOrderEventDto,
  PartsDisputeDto,
  PartsRatingDto,
  PartsOrderStatus,
  PartsOrderEventType,
  PartsOrderListDto,
} from '../types/parts-b2b'

// ── Mappers ───────────────────────────────────────────────────────────────────
export function mapOrderToDto(row: typeof partsOrders.$inferSelect): PartsOrderDto {
  return {
    id: row.id,
    partId: row.partId,
    buyerId: row.buyerId,
    serviceId: row.serviceId ?? null,
    quantity: row.quantity,
    unitPriceThb: String(row.unitPriceThb),
    totalThb: String(row.totalThb),
    status: row.status as PartsOrderStatus,
    fulfillmentNote: (row as any).fulfillmentNote ?? null,
    trackingNumber: (row as any).trackingNumber ?? null,
    fulfilledAt: (row as any).fulfilledAt ? (row as any).fulfilledAt.toISOString() : null,
    closedAt: (row as any).closedAt ? (row as any).closedAt.toISOString() : null,
    idempotencyKey: row.idempotencyKey,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function mapEventToDto(row: typeof partsOrderEvents.$inferSelect): PartsOrderEventDto {
  return {
    id: row.id,
    orderId: row.orderId,
    eventType: row.eventType as PartsOrderEventType,
    actorId: row.actorId ?? null,
    oldStatus: row.oldStatus ?? null,
    newStatus: row.newStatus ?? null,
    detail: row.detail ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

export function mapDisputeToDto(row: typeof partsDisputes.$inferSelect): PartsDisputeDto {
  return {
    id: row.id,
    orderId: row.orderId,
    raisedBy: row.raisedBy,
    reason: row.reason,
    status: row.status as PartsDisputeDto['status'],
    resolution: row.resolution ?? null,
    resolvedBy: row.resolvedBy ?? null,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
  }
}

export function mapRatingToDto(row: typeof partsRatings.$inferSelect): PartsRatingDto {
  return {
    id: row.id,
    orderId: row.orderId,
    ratedBy: row.ratedBy,
    sellerId: row.sellerId,
    score: row.score,
    comment: row.comment ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

// ── Audit helper (Security Rule #5) ──────────────────────────────────────────
async function appendOrderEvent(params: {
  orderId: string
  eventType: PartsOrderEventType
  actorId?: string | null
  oldStatus?: string | null
  newStatus?: string | null
  detail?: unknown
}): Promise<void> {
  await db.insert(partsOrderEvents).values({
    orderId: params.orderId,
    eventType: params.eventType,
    actorId: params.actorId ?? null,
    oldStatus: params.oldStatus ?? null,
    newStatus: params.newStatus ?? null,
    detail: params.detail ? JSON.stringify(params.detail) : null,
  })
}

// ── Create B2B order ──────────────────────────────────────────────────────────
export async function createPartsOrder(
  buyerId: string,
  input: {
    partId: string
    quantity: number
    serviceId?: string
    idempotencyKey: string
  },
): Promise<PartsOrderDto | null> {
  const [part] = await db
    .select()
    .from(partsInventory)
    .where(eq(partsInventory.id, input.partId))

  if (!part) return null
  if (part.stockQuantity < input.quantity) return null

  const unitPrice = parseFloat(String(part.unitPriceThb))
  const total = unitPrice * input.quantity

  const [order] = await db
    .insert(partsOrders)
    .values({
      partId: input.partId,
      buyerId,
      serviceId: input.serviceId ?? null,
      quantity: input.quantity,
      unitPriceThb: String(unitPrice),
      totalThb: String(total),
      status: 'held', // escrow held immediately (R1: @needs-point-review for actual debit)
      idempotencyKey: input.idempotencyKey,
    })
    .onConflictDoNothing()
    .returning()

  if (!order) return null // duplicate idempotencyKey

  // Security Rule #5: audit event
  await appendOrderEvent({
    orderId: order.id,
    eventType: 'created',
    actorId: buyerId,
    newStatus: 'held',
    detail: { partId: input.partId, quantity: input.quantity, totalThb: total },
  })

  return mapOrderToDto(order)
}

// ── Get order detail (with events, dispute, rating) ───────────────────────────
export async function getPartsOrderDetail(
  orderId: string,
): Promise<PartsOrderDetailDto | null> {
  const [order] = await db.select().from(partsOrders).where(eq(partsOrders.id, orderId))
  if (!order) return null

  const events = await db
    .select()
    .from(partsOrderEvents)
    .where(eq(partsOrderEvents.orderId, orderId))
    .orderBy(partsOrderEvents.createdAt)

  const [dispute] = await db
    .select()
    .from(partsDisputes)
    .where(eq(partsDisputes.orderId, orderId))

  const [rating] = await db
    .select()
    .from(partsRatings)
    .where(eq(partsRatings.orderId, orderId))

  return {
    ...mapOrderToDto(order),
    events: events.map(mapEventToDto),
    dispute: dispute ? mapDisputeToDto(dispute) : null,
    rating: rating ? mapRatingToDto(rating) : null,
  }
}

// ── Fulfill order (seller confirms shipment) ──────────────────────────────────
export async function fulfillPartsOrder(
  orderId: string,
  sellerId: string,
  input: { fulfillmentNote?: string; trackingNumber?: string },
): Promise<PartsOrderDto | null> {
  // Verify order exists and is in 'held' status
  const [order] = await db.select().from(partsOrders).where(eq(partsOrders.id, orderId))
  if (!order || order.status !== 'held') return null

  // Verify seller owns the part
  const [part] = await db
    .select()
    .from(partsInventory)
    .where(and(eq(partsInventory.id, order.partId), eq(partsInventory.ownerId, sellerId)))
  if (!part) return null

  const [updated] = await db
    .update(partsOrders)
    .set({
      status: 'fulfilled',
      fulfillmentNote: input.fulfillmentNote ?? null,
      trackingNumber: input.trackingNumber ?? null,
      fulfilledAt: new Date(),
      updatedAt: new Date(),
    } as any)
    .where(eq(partsOrders.id, orderId))
    .returning()

  // Security Rule #5: audit event
  await appendOrderEvent({
    orderId,
    eventType: 'fulfilled',
    actorId: sellerId,
    oldStatus: 'held',
    newStatus: 'fulfilled',
    detail: { trackingNumber: input.trackingNumber, fulfillmentNote: input.fulfillmentNote },
  })

  return mapOrderToDto(updated)
}

// ── Close order (buyer confirms receipt) ──────────────────────────────────────
export async function closePartsOrder(
  orderId: string,
  buyerId: string,
): Promise<PartsOrderDto | null> {
  const [order] = await db.select().from(partsOrders).where(
    and(eq(partsOrders.id, orderId), eq(partsOrders.buyerId, buyerId)),
  )
  if (!order || order.status !== 'fulfilled') return null

  const [updated] = await db
    .update(partsOrders)
    .set({ status: 'closed', closedAt: new Date(), updatedAt: new Date() } as any)
    .where(eq(partsOrders.id, orderId))
    .returning()

  // Security Rule #5: audit event
  await appendOrderEvent({
    orderId,
    eventType: 'closed',
    actorId: buyerId,
    oldStatus: 'fulfilled',
    newStatus: 'closed',
    detail: { closedBy: buyerId },
  })

  return mapOrderToDto(updated)
}

// ── Raise dispute (buyer) ─────────────────────────────────────────────────────
export async function raiseDispute(
  orderId: string,
  buyerId: string,
  reason: string,
): Promise<PartsDisputeDto | null> {
  const [order] = await db.select().from(partsOrders).where(
    and(eq(partsOrders.id, orderId), eq(partsOrders.buyerId, buyerId)),
  )
  if (!order) return null
  if (!['held', 'fulfilled'].includes(order.status)) return null

  // Update order status to 'disputed'
  await db
    .update(partsOrders)
    .set({ status: 'disputed', updatedAt: new Date() })
    .where(eq(partsOrders.id, orderId))

  // Create dispute record
  const [dispute] = await db
    .insert(partsDisputes)
    .values({ orderId, raisedBy: buyerId, reason })
    .returning()

  // Security Rule #5: audit event
  await appendOrderEvent({
    orderId,
    eventType: 'disputed',
    actorId: buyerId,
    oldStatus: order.status,
    newStatus: 'disputed',
    detail: { reason, disputeId: dispute.id },
  })

  return mapDisputeToDto(dispute)
}

// ── Admin resolve dispute ─────────────────────────────────────────────────────
export async function resolveDispute(
  orderId: string,
  adminId: string,
  resolution: 'resolved_buyer' | 'resolved_seller',
  note: string,
): Promise<PartsDisputeDto | null> {
  const [dispute] = await db
    .select()
    .from(partsDisputes)
    .where(and(eq(partsDisputes.orderId, orderId), eq(partsDisputes.status, 'open')))

  if (!dispute) return null

  const [updatedDispute] = await db
    .update(partsDisputes)
    .set({ status: resolution, resolution: note, resolvedBy: adminId, resolvedAt: new Date() })
    .where(eq(partsDisputes.id, dispute.id))
    .returning()

  // Determine final order status
  const orderStatus = resolution === 'resolved_buyer' ? 'refunded' : 'resolved'
  await db
    .update(partsOrders)
    .set({ status: orderStatus, updatedAt: new Date() })
    .where(eq(partsOrders.id, orderId))

  // Security Rule #5: audit event
  await appendOrderEvent({
    orderId,
    eventType: resolution,
    actorId: adminId,
    oldStatus: 'disputed',
    newStatus: orderStatus,
    detail: { resolution, note, disputeId: dispute.id },
  })

  return mapDisputeToDto(updatedDispute)
}

// ── List orders (filter by buyer / seller / status, paginated) ────────────────
export async function listPartsOrders(filters: {
  buyerId?: string
  sellerId?: string
  status?: PartsOrderStatus
  limit?: number
  offset?: number
}): Promise<PartsOrderListDto> {
  const limit = Math.min(filters.limit ?? 20, 100)
  const offset = filters.offset ?? 0

  // Build WHERE conditions dynamically
  const conditions: ReturnType<typeof eq>[] = []
  if (filters.buyerId) conditions.push(eq(partsOrders.buyerId, filters.buyerId))
  if (filters.status) conditions.push(eq(partsOrders.status, filters.status))

  // sellerId filter requires joining parts_inventory.owner_id
  if (filters.sellerId) {
    // subquery: orderId in (SELECT id FROM parts_orders JOIN parts_inventory ON part_id = parts_inventory.id WHERE owner_id = sellerId)
    const sellerPartIds = await db
      .select({ id: partsInventory.id })
      .from(partsInventory)
      .where(eq(partsInventory.ownerId, filters.sellerId))

    const partIds = sellerPartIds.map((r) => r.id)
    if (partIds.length === 0) {
      return { items: [], total: 0, limit, offset }
    }
    conditions.push(sql`${partsOrders.partId} = ANY(${sql.raw(`ARRAY[${partIds.map((id) => `'${id}'`).join(',')}]::uuid[]`)})`)
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(partsOrders)
      .where(whereClause)
      .orderBy(desc(partsOrders.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<string>`COUNT(*)` })
      .from(partsOrders)
      .where(whereClause),
  ])

  return {
    items: rows.map(mapOrderToDto),
    total: parseInt(countResult[0]?.count ?? '0', 10),
    limit,
    offset,
  }
}

// ── Rate order (buyer rates seller after close) ───────────────────────────────
export async function rateOrder(
  orderId: string,
  buyerId: string,
  score: number,
  comment?: string,
): Promise<PartsRatingDto | null> {
  const [order] = await db.select().from(partsOrders).where(
    and(eq(partsOrders.id, orderId), eq(partsOrders.buyerId, buyerId)),
  )
  if (!order || order.status !== 'closed') return null

  // Get seller from part
  const [part] = await db
    .select()
    .from(partsInventory)
    .where(eq(partsInventory.id, order.partId))
  if (!part) return null

  const [rating] = await db
    .insert(partsRatings)
    .values({ orderId, ratedBy: buyerId, sellerId: part.ownerId, score, comment: comment ?? null })
    .onConflictDoNothing()
    .returning()

  if (!rating) return null // already rated

  // Security Rule #5: audit event
  await appendOrderEvent({
    orderId,
    eventType: 'rated',
    actorId: buyerId,
    detail: { score, ratingId: rating.id },
  })

  return mapRatingToDto(rating)
}
