/**
 * parts-listings.ts — D-6 Parts B2B: Public Catalog Listings
 *
 * parts_listings — catalog สาธารณะ (แยกจาก parts_inventory ที่เป็น private stock)
 *
 * Flow: WeeeR สร้าง listing จาก inventory_item → WeeeT/WeeeR เห็นใน catalog
 *       buyer เพิ่มลงตะกร้า → checkout → parts_orders
 *
 * source_scrap_id: UUID ไม่ผูก FK — scrap_jobs ยังไม่มี module พร้อม
 *   (pattern เดียวกับ 0020_b5_inventory_extend: FK รอ scrap module)
 *
 * Migration: 0021_d6_parts_b2b.sql
 */
import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  jsonb,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { partsInventory } from './parts-inventory'

export const partsListings = pgTable(
  'parts_listings',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // WeeeR ที่ลงขาย
    weeerUserId: uuid('weeer_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // link ไปยัง stock item (WeeeR ต้องมี inventory ก่อนลงขาย)
    inventoryItemId: uuid('inventory_item_id')
      .references(() => partsInventory.id, { onDelete: 'set null' }),

    // แหล่งที่มา: 'new' | 'used' | 'disassembled'
    sourceType: text('source_type').notNull().default('new'),

    // scrap_source_id: UUID ไม่ผูก FK — รอ scrap module พร้อม
    sourceScrapId: uuid('source_scrap_id'),

    // ข้อมูลสินค้า
    partName: text('part_name').notNull(),
    partNumber: text('part_number'),
    manufacturer: text('manufacturer'),

    // OEM compatibility: [{brand, model, year}]
    oemCompatibility: jsonb('oem_compatibility').default('[]'),

    // คะแนนสภาพ 1-10 (1=แย่ / 10=ใหม่เอี่ยม)
    conditionScore: integer('condition_score').notNull().default(7),

    // ราคาต่อหน่วย (THB)
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),

    // tier pricing: [{minQty: 2, maxQty: 5, discount: 0.05}, ...]
    tierPricing: jsonb('tier_pricing').default('[]'),

    // stock ที่พร้อมขาย / ที่จองไว้แล้ว
    qtyAvailable: integer('qty_available').notNull().default(0),
    qtyReserved: integer('qty_reserved').notNull().default(0),

    // รูปสินค้า: [r2_key, ...]
    photos: jsonb('photos').default('[]'),

    // ประกันสินค้า (วัน, default 7 วัน)
    warrantyDays: integer('warranty_days').notNull().default(7),

    // สถานะ listing: 'active' | 'inactive' | 'sold_out' | 'deleted'
    status: text('status').notNull().default('active'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_parts_listings_seller').on(table.weeerUserId, table.status),
    index('idx_parts_listings_status').on(table.status),
    index('idx_parts_listings_part_name').on(table.partName),
    index('idx_parts_listings_part_number').on(table.partNumber),
    check(
      'chk_parts_listings_source_type',
      sql`${table.sourceType} IN ('new', 'used', 'disassembled')`,
    ),
    check(
      'chk_parts_listings_condition_score',
      sql`${table.conditionScore} >= 1 AND ${table.conditionScore} <= 10`,
    ),
    check(
      'chk_parts_listings_status',
      sql`${table.status} IN ('active', 'inactive', 'sold_out', 'deleted')`,
    ),
    check(
      'chk_parts_listings_qty_non_negative',
      sql`${table.qtyAvailable} >= 0 AND ${table.qtyReserved} >= 0`,
    ),
  ],
)

export type PartsListing = typeof partsListings.$inferSelect
export type NewPartsListing = typeof partsListings.$inferInsert
