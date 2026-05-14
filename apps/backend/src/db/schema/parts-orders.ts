/**
 * parts-orders.ts — NOTE-SUB4: WeeeR อะไหล่ escrow order tracking
 *
 * เพิ่มจาก NOTE-SUB4 (HUB Verdict Sub-CMDs Phase D-2)
 * Escrow flow:
 * 1. WeeeU/WeeeR สั่งซื้อ → status='pending' → hold ยอด (debit point_ledger)
 * 2. WeeeR ยืนยันส่ง → status='confirmed' → release escrow (credit WeeeR point_ledger)
 * 3. ถ้าปัญหา → status='refunded' → คืน point ให้ผู้ซื้อ
 *
 * Endpoints (NOTE-SUB4 — 3 ที่เหลือ):
 * POST   /api/parts/order              — create order + hold escrow
 * POST   /api/parts/order/:id/confirm  — release escrow → WeeeR รับเงิน
 * POST   /api/parts/order/:id/refund   — คืน escrow → ผู้ซื้อ
 *
 * escrow_ledger_id: FK ไป point_ledger — @needs-point-review
 * (รอ Point chat ยืนยัน sync logic ก่อน implement จริง)
 */
import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './users'
import { partsInventory } from './parts-inventory'
import { services } from './services'
import { pointLedger } from './point-ledger'

export const partsOrders = pgTable(
  'parts_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // อะไหล่ที่สั่ง
    partId: uuid('part_id')
      .notNull()
      .references(() => partsInventory.id),
    // ผู้ซื้อ (WeeeU หรือ WeeeR ที่สั่งให้งาน)
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // งานที่อะไหล่นี้ใช้สำหรับ (nullable — อาจสั่งสต็อกไว้ก่อน)
    serviceId: uuid('service_id').references(() => services.id),
    quantity: integer('quantity').notNull(),
    // ราคาต่อหน่วย ณ เวลาสั่ง (snapshot — ไม่ขึ้นกับ parts_inventory.unit_price_thb ในอนาคต)
    unitPriceThb: numeric('unit_price_thb', { precision: 10, scale: 2 }).notNull(),
    totalThb: numeric('total_thb', { precision: 12, scale: 2 }).notNull(),
    // 'pending' | 'held' | 'confirmed' | 'refunded' | 'cancelled'
    status: text('status').notNull().default('pending'),
    // FK ไป point_ledger row ที่ hold escrow — @needs-point-review
    // รอ Point chat ยืนยัน sync logic ก่อน finalize
    escrowLedgerId: uuid('escrow_ledger_id').references(() => pointLedger.id),
    // idempotency key กัน double-order
    idempotencyKey: text('idempotency_key').notNull(),
    metadata: jsonb('metadata'),

    // ── Sub-CMD-8 Wave 3: B2B Fulfillment fields ──────────────────────────────
    // เพิ่มผ่าน Migration 0008_parts_b2b.sql (⚠️ R2 pending)
    // status เพิ่ม: 'fulfilled' | 'closed' | 'disputed' | 'resolved'
    fulfillmentNote: text('fulfillment_note'),
    trackingNumber: text('tracking_number'),
    fulfilledAt: timestamp('fulfilled_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_parts_orders_idempotency').on(table.idempotencyKey),
    index('idx_parts_orders_buyer').on(table.buyerId, table.createdAt),
    index('idx_parts_orders_part').on(table.partId),
    index('idx_parts_orders_status').on(table.status),
  ],
)

export type PartsOrder = typeof partsOrders.$inferSelect
export type NewPartsOrder = typeof partsOrders.$inferInsert
