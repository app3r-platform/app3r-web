/**
 * parts-b2b.ts — Sub-CMD-8 Wave 3: Parts Marketplace B2B tables
 *
 * 3 new tables extending NOTE-SUB4 parts_orders for full B2B order lifecycle:
 *
 *   parts_order_events — audit trail (Security Rule #5 pattern)
 *   parts_disputes     — buyer dispute + admin override (R3 Mitigation)
 *   parts_ratings      — buyer rates seller after order closed
 *
 * Order flow (B2B):
 *   pending → held → fulfilled → closed [→ rated]
 *                 ↘ disputed → resolved_buyer | resolved_seller [→ refunded]
 *
 * Migration: 0008_parts_b2b.sql
 * ⚠️ R2: run migration หลัง HUB approve เท่านั้น
 */
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  check,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { partsOrders } from './parts-orders'

// ── parts_order_events — B2B audit trail (Security Rule #5) ──────────────────
export const partsOrderEvents = pgTable(
  'parts_order_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // FK → parts_orders (cascade — ลบ order = ลบ events ด้วย)
    orderId: uuid('order_id')
      .notNull()
      .references(() => partsOrders.id, { onDelete: 'cascade' }),

    // 'created' | 'held' | 'fulfilled' | 'closed'
    // | 'disputed' | 'resolved_buyer' | 'resolved_seller'
    // | 'refunded' | 'rated' | 'cancelled'
    eventType: text('event_type').notNull(),

    // null = system event
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),

    oldStatus: text('old_status'),
    newStatus: text('new_status'),

    // JSON metadata (tracking number, rating score, dispute reason, etc.)
    detail: text('detail'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_order_events_order').on(table.orderId, table.createdAt),
  ],
)

// ── parts_disputes — buyer dispute + admin override ───────────────────────────
export const partsDisputes = pgTable(
  'parts_disputes',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // 1 order = 1 active dispute (unique enforced by business logic)
    orderId: uuid('order_id')
      .notNull()
      .references(() => partsOrders.id, { onDelete: 'cascade' }),

    // buyer ที่แจ้งปัญหา
    raisedBy: uuid('raised_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    reason: text('reason').notNull(),

    // 'open' | 'admin_reviewing' | 'resolved_buyer' | 'resolved_seller' | 'withdrawn'
    status: text('status').notNull().default('open'),

    // admin note เมื่อ resolve
    resolution: text('resolution'),

    // null = not yet resolved
    resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'set null' }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_disputes_order').on(table.orderId),
    index('idx_disputes_status').on(table.status),
  ],
)

// ── parts_ratings — buyer rates seller after close ────────────────────────────
export const partsRatings = pgTable(
  'parts_ratings',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // 1 order = 1 rating (unique)
    orderId: uuid('order_id')
      .notNull()
      .references(() => partsOrders.id, { onDelete: 'cascade' }),

    // buyer ที่ให้คะแนน
    ratedBy: uuid('rated_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    // seller ที่รับคะแนน (WeeeR)
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    // 1–5 stars
    score: integer('score').notNull(),

    comment: text('comment'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_ratings_order_unique').on(table.orderId),
    index('idx_ratings_seller').on(table.sellerId),
  ],
)

export type PartsOrderEvent = typeof partsOrderEvents.$inferSelect
export type NewPartsOrderEvent = typeof partsOrderEvents.$inferInsert
export type PartsDispute = typeof partsDisputes.$inferSelect
export type NewPartsDispute = typeof partsDisputes.$inferInsert
export type PartsRating = typeof partsRatings.$inferSelect
export type NewPartsRating = typeof partsRatings.$inferInsert
