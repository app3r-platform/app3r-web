/**
 * inventory-stock-movements.ts — B5-Backend: Stock Movement Audit Log
 *
 * บันทึกการเคลื่อนไหวของ stock ทุกครั้ง (IN/OUT/RESERVE/RELEASE/ADJUST)
 * ใช้สำหรับ audit trail + dashboard + reconciliation
 *
 * movement_type values:
 *   'IN'      — รับ stock เพิ่ม (ซื้อ / รับจากการแยกชิ้นส่วน)
 *   'OUT'     — ใช้ / ขาย stock
 *   'RESERVE' — จอง stock ไว้ให้งานซ่อม (ยังไม่ได้ใช้จริง)
 *   'RELEASE' — ปล่อย reserve คืน (cancel / เปลี่ยนแผน)
 *   'ADJUST'  — ปรับ stock (delta +/- จาก actual count)
 *
 * B5-Backend (2026-05-25) — migration: 0020_b5_inventory_extend.sql
 */
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './users'
import { partsInventory } from './parts-inventory'

export const inventoryStockMovements = pgTable(
  'inventory_stock_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // FK → parts_inventory.id (CASCADE — ถ้าลบ item, ลบ movements ด้วย)
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => partsInventory.id, { onDelete: 'cascade' }),

    // ประเภทการเคลื่อนไหว: 'IN' | 'OUT' | 'RESERVE' | 'RELEASE' | 'ADJUST'
    movementType: text('movement_type').notNull(),

    // จำนวน delta: +บวก = เพิ่ม, -ลบ = ลด
    quantityDelta: integer('quantity_delta').notNull(),

    // บริบทที่เกิด movement: 'repair_job' | 'parts_order' | 'manual' | 'scrap'
    referenceType: text('reference_type'),

    // UUID ของ entity ที่เกี่ยวข้อง (nullable)
    referenceId: uuid('reference_id'),

    // หมายเหตุเพิ่มเติม (สำหรับ ADJUST/MANUAL)
    note: text('note'),

    // ผู้ดำเนินการ (WeeeR owner ที่ทำ action)
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // ค้นหา movements ของ item (primary use case)
    index('idx_stock_movements_item').on(table.inventoryItemId),
    // ค้นหา movements ของ item เรียงตามเวลา (pagination)
    index('idx_stock_movements_item_time').on(table.inventoryItemId, table.createdAt),
    // filter by movement type
    index('idx_stock_movements_type').on(table.movementType),
    // lookup by reference (repair_job / parts_order)
    index('idx_stock_movements_ref').on(table.referenceType, table.referenceId),
    // audit log by user
    index('idx_stock_movements_created_by').on(table.createdBy),
  ],
)

export type InventoryStockMovement = typeof inventoryStockMovements.$inferSelect
export type NewInventoryStockMovement = typeof inventoryStockMovements.$inferInsert
