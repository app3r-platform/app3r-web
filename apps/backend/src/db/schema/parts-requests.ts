/**
 * parts-requests.ts — D-6 Parts B2B: Cross-Shop Broadcast Requests + Quotes
 *
 * 2 tables:
 *   parts_requests      — WeeeR broadcast ขออะไหล่จากร้านอื่น
 *   parts_request_quotes — ร้านอื่น (WeeeR) ตอบ quote
 *
 * ⚠️ ห้ามชน in-shop Parts Request (B5 — WeeeT ขอจาก stock ร้านตัวเอง)
 *    flow นี้: WeeeR ขอจากร้านอื่น (broadcast cross-shop)
 *
 * for_repair_job_id → services.id (ไม่ใช่ repair_jobs)
 *   เพราะ repair workflow ใช้ services table เป็น canonical job entity
 *
 * Migration: 0021_d6_parts_b2b.sql
 */
import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { services } from './services'
import { partsOrders } from './parts-orders'
import { partsListings } from './parts-listings'

// ── parts_requests ─────────────────────────────────────────────────────────────
export const partsRequests = pgTable(
  'parts_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // WeeeR ที่ส่ง broadcast
    requesterWeeerUserId: uuid('requester_weeer_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // งานซ่อมที่รออะไหล่ (nullable — อาจขอสต็อกล่วงหน้า)
    // → services.id (canonical job entity, ตาม D-6 Blueprint)
    forRepairJobId: uuid('for_repair_job_id')
      .references(() => services.id, { onDelete: 'set null' }),

    // ถ้า broadcast_scope = 'specific' → ร้านที่ต้องการจะส่งให้โดยตรง
    specificShopId: uuid('specific_shop_id')
      .references(() => users.id, { onDelete: 'set null' }),

    // order ที่ match กับ request นี้ (เมื่อ accept quote แล้ว)
    matchedOrderId: uuid('matched_order_id')
      .references(() => partsOrders.id, { onDelete: 'set null' }),

    // ข้อมูลอะไหล่ที่ต้องการ
    applianceBrand: text('appliance_brand').notNull(),
    applianceModel: text('appliance_model').notNull(),
    partName: text('part_name').notNull(),
    partNumber: text('part_number'),

    // จำนวนที่ต้องการ
    qtyNeeded: integer('qty_needed').notNull().default(1),

    // ความเร่งด่วน: 'normal' | 'urgent' | 'emergency'
    urgency: text('urgency').notNull().default('normal'),

    // วันที่ต้องการภายใน (nullable)
    neededBy: timestamp('needed_by', { withTimezone: true }),

    // สภาพที่ต้องการ (nullable — ถ้าระบุ filter ผู้ขาย)
    preferredCondition: text('preferred_condition'),

    // ราคาสูงสุดที่รับได้ต่อหน่วย (nullable)
    maxPricePerUnit: numeric('max_price_per_unit', { precision: 10, scale: 2 }),

    // ขอบเขตการ broadcast: 'nearby' | 'all' | 'specific'
    broadcastScope: text('broadcast_scope').notNull().default('all'),

    // สถานะ request: 'open' | 'quoted' | 'matched' | 'expired'
    status: text('status').notNull().default('open'),

    // วันหมดอายุ request (default: +24h, urgency = emergency = +2h)
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_parts_requests_requester').on(table.requesterWeeerUserId),
    index('idx_parts_requests_status').on(table.status),
    index('idx_parts_requests_expires').on(table.expiresAt),
    index('idx_parts_requests_urgency').on(table.urgency),
    check(
      'chk_parts_requests_urgency',
      sql`${table.urgency} IN ('normal', 'urgent', 'emergency')`,
    ),
    check(
      'chk_parts_requests_scope',
      sql`${table.broadcastScope} IN ('nearby', 'all', 'specific')`,
    ),
    check(
      'chk_parts_requests_status',
      sql`${table.status} IN ('open', 'quoted', 'matched', 'expired')`,
    ),
  ],
)

// ── parts_request_quotes ───────────────────────────────────────────────────────
export const partsRequestQuotes = pgTable(
  'parts_request_quotes',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // request ที่ตอบ
    requestId: uuid('request_id')
      .notNull()
      .references(() => partsRequests.id, { onDelete: 'cascade' }),

    // WeeeR ที่เสนอราคา
    responderWeeerUserId: uuid('responder_weeer_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // listing ที่จะขาย (nullable — อาจยังไม่มี listing ตอน quote)
    listingId: uuid('listing_id')
      .references(() => partsListings.id, { onDelete: 'set null' }),

    // ราคาที่เสนอ
    quotedPricePerUnit: numeric('quoted_price_per_unit', { precision: 10, scale: 2 }).notNull(),

    // จำนวนที่พร้อมขาย
    availableQty: integer('available_qty').notNull(),

    // วันส่งโดยประมาณ (วัน)
    estimatedDeliveryDays: integer('estimated_delivery_days'),

    // หมายเหตุ
    notes: text('notes'),

    // สถานะ: 'pending' | 'accepted' | 'rejected' | 'expired'
    status: text('status').notNull().default('pending'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_parts_request_quotes_request').on(table.requestId),
    index('idx_parts_request_quotes_responder').on(table.responderWeeerUserId),
    index('idx_parts_request_quotes_status').on(table.status),
    check(
      'chk_parts_request_quotes_status',
      sql`${table.status} IN ('pending', 'accepted', 'rejected', 'expired')`,
    ),
  ],
)

export type PartsRequest = typeof partsRequests.$inferSelect
export type NewPartsRequest = typeof partsRequests.$inferInsert
export type PartsRequestQuote = typeof partsRequestQuotes.$inferSelect
export type NewPartsRequestQuote = typeof partsRequestQuotes.$inferInsert
