/**
 * parts-inventory.ts — NOTE-SUB4: WeeeR อะไหล่ stock tracking
 *
 * เพิ่มจาก NOTE-SUB4 (HUB Verdict Sub-CMDs Phase D-2)
 * เพราะ Sub-CMD-P4 WeeeR ต้องการ backend endpoints สำหรับ parts CRUD
 *
 * B5-Backend (2026-05-25): Extended with source_type, reserved_quantity, scrap_source_id
 * Migration: 0020_b5_inventory_extend.sql
 *
 * Endpoints (NOTE-SUB4 — 4 ใน 7):
 * GET    /api/parts/inventory       — list ของ WeeeR owner
 * POST   /api/parts/inventory       — create item
 * PATCH  /api/parts/inventory/:id   — update (name/price/stock)
 * DELETE /api/parts/inventory/:id   — soft delete (ถ้า active orders ปฏิเสธ)
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
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const partsInventory = pgTable(
  'parts_inventory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // WeeeR ที่เป็นเจ้าของ stock
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    // รหัสอะไหล่ (optional — WeeeR กำหนดเอง)
    sku: text('sku'),
    unitPriceThb: numeric('unit_price_thb', { precision: 10, scale: 2 }).notNull(),
    stockQuantity: integer('stock_quantity').notNull().default(0),
    // B5: จำนวนที่จองแต่ยังไม่ได้ใช้ — available = stock_quantity - reserved_quantity
    reservedQuantity: integer('reserved_quantity').notNull().default(0),
    // 'piece' | 'set' | 'meter' | 'kg' | ...
    unit: text('unit').notNull().default('piece'),
    // 'motor' | 'compressor' | 'filter' | 'wire' | 'other' | ...
    category: text('category'),
    // B5: แหล่งที่มา — 'NEW' | 'USED' | 'DISASSEMBLED'
    sourceType: text('source_type').notNull().default('NEW'),
    // B5: FK → scrap_jobs.id (DISASSEMBLED only) — nullable, FK constraint รอ scrap module
    scrapSourceId: uuid('scrap_source_id'),
    // R2 key สำหรับรูปอะไหล่ (optional)
    imageR2Key: text('image_r2_key'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_parts_inventory_owner').on(table.ownerId),
    index('idx_parts_inventory_source_type').on(table.sourceType),
  ],
)

export type PartsInventoryItem = typeof partsInventory.$inferSelect
export type NewPartsInventoryItem = typeof partsInventory.$inferInsert
