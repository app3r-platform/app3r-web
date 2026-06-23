/**
 * parts-cart.ts — D-6 Parts B2B: Cart Items
 *
 * parts_cart_items — ตะกร้าสินค้าชั่วคราว (expire 24 ชั่วโมง)
 *
 * ผู้ใช้: WeeeR เท่านั้น (Gen 122 R7: Parts B2B = WeeeR↔WeeeR · ❌ WeeeU/WeeeT ไม่มีสิทธิ์)
 * กฎ:
 *   - max 50 ชิ้น/order (business rule ใน route layer)
 *   - 1 buyer = 1 cart (per listing, qty ปรับได้)
 *   - expires_at = added_at + 24h
 *   - stock หมด → auto-remove (cleanup job / checkout validation)
 *
 * Migration: 0021_d6_parts_b2b.sql
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
import { partsListings } from './parts-listings'

export const partsCartItems = pgTable(
  'parts_cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // ผู้ซื้อ (WeeeR หรือ WeeeT)
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // role ผู้ซื้อ: 'weeer' (Gen 122 R7 — ลบ 'weeet' · ไม่มี WeeeT payment path)
    buyerRole: text('buyer_role').notNull(),

    // listing ที่ต้องการซื้อ
    listingId: uuid('listing_id')
      .notNull()
      .references(() => partsListings.id, { onDelete: 'cascade' }),

    // จำนวนที่ต้องการ
    qty: integer('qty').notNull().default(1),

    // เวลาเพิ่มลงตะกร้า
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),

    // หมดอายุ 24 ชั่วโมงหลัง addedAt
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    // 1 buyer = 1 cart item per listing (ปรับ qty แทนที่จะซ้ำ)
    uniqueIndex('idx_parts_cart_buyer_listing').on(table.buyerId, table.listingId),
    index('idx_parts_cart_buyer').on(table.buyerId),
    index('idx_parts_cart_expires').on(table.expiresAt),
    check(
      'chk_parts_cart_buyer_role',
      sql`${table.buyerRole} IN ('weeer')`,
    ),
    check(
      'chk_parts_cart_qty_positive',
      sql`${table.qty} > 0 AND ${table.qty} <= 50`,
    ),
  ],
)

export type PartsCartItem = typeof partsCartItems.$inferSelect
export type NewPartsCartItem = typeof partsCartItems.$inferInsert
