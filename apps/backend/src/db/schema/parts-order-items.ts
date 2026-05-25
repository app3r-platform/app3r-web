/**
 * parts-order-items.ts — D-6 Parts B2B: Multi-item Order Items (Additive)
 *
 * parts_order_items — line items สำหรับ multi-item order (additive ไม่ riio Sub-8)
 *
 * Design: Cart additive (ไม่แตะ Sub-8 single-item flow)
 *   - Sub-8 legacy: parts_orders (single item, part_id in orders table)
 *   - D-6 new: parts_orders + parts_order_items (multi-item via cart checkout)
 *   - ต่างกันด้วย parts_orders.is_multi_item flag (เพิ่มใน migration SQL)
 *
 * ⚠️ ห้ามแตะ parts-orders.ts (Engineering Protocol ข้อ 2 + 10)
 *    is_multi_item column เพิ่มใน migration SQL เท่านั้น
 *
 * Migration: 0021_d6_parts_b2b.sql
 */
import {
  pgTable,
  uuid,
  numeric,
  integer,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { partsOrders } from './parts-orders'
import { partsListings } from './parts-listings'

export const partsOrderItems = pgTable(
  'parts_order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // FK → parts_orders.id (CASCADE — ลบ order = ลบ items ด้วย)
    orderId: uuid('order_id')
      .notNull()
      .references(() => partsOrders.id, { onDelete: 'cascade' }),

    // FK → parts_listings.id (SET NULL — listing ลบแล้วยัง track ได้)
    listingId: uuid('listing_id')
      .references(() => partsListings.id, { onDelete: 'set null' }),

    // จำนวนที่สั่ง
    qty: integer('qty').notNull(),

    // ราคา snapshot ณ เวลาสั่ง (ไม่ขึ้นกับ listing ในอนาคต)
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),

    // subtotal = qty × unit_price (หักส่วนลด tier pricing แล้ว)
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_parts_order_items_order').on(table.orderId),
    index('idx_parts_order_items_listing').on(table.listingId),
    check(
      'chk_parts_order_items_qty_positive',
      sql`${table.qty} > 0`,
    ),
  ],
)

export type PartsOrderItem = typeof partsOrderItems.$inferSelect
export type NewPartsOrderItem = typeof partsOrderItems.$inferInsert
