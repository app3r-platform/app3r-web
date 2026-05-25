/**
 * parts-returns.ts — D-6 Parts B2B: Defective Returns
 *
 * parts_returns — คืนสินค้าชำรุด (แยกจาก dispute ซึ่งใช้ parts_disputes ใน Sub-8)
 *
 * ความต่าง:
 *   parts_disputes (Sub-8) — buyer โต้แย้งทั่วไป (ของไม่มา / ไม่ตรงปก)
 *   parts_returns  (D-6)   — สินค้าชำรุด / ผิดสเปค → ขอคืน/เปลี่ยน/เครดิต
 *
 * Flow:
 *   buyer (WeeeR/WeeeT) รายงาน defective → seller (WeeeR) รีวิว
 *   → อนุมัติ: refund | replace | credit
 *   → ปฏิเสธ: rejected + reason
 *
 * Migration: 0021_d6_parts_b2b.sql
 */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { partsOrders } from './parts-orders'

export const partsReturns = pgTable(
  'parts_returns',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // order ที่ต้องการคืน
    orderId: uuid('order_id')
      .notNull()
      .references(() => partsOrders.id, { onDelete: 'cascade' }),

    // ผู้รายงาน (buyer — WeeeR หรือ WeeeT)
    reportedBy: uuid('reported_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    // เหตุผลหลัก: 'defective' | 'wrong_part' | 'mismatch' | 'quality'
    reason: text('reason').notNull(),

    // คำอธิบายรายละเอียด
    defectDescription: text('defect_description').notNull(),

    // หลักฐาน: [r2_key, ...] (อัปโหลดผ่าน file API)
    evidencePhotos: text('evidence_photos').array(),

    // สถานะ: 'pending' | 'approved' | 'rejected' | 'completed'
    status: text('status').notNull().default('pending'),

    // วิธีแก้ไข: 'refund' | 'replace' | 'credit' (set เมื่อ approved)
    resolutionType: text('resolution_type'),

    // admin/seller ที่ resolve (null = pending)
    resolvedBy: uuid('resolved_by')
      .references(() => users.id, { onDelete: 'set null' }),

    resolvedAt: timestamp('resolved_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_parts_returns_order').on(table.orderId),
    index('idx_parts_returns_reporter').on(table.reportedBy),
    index('idx_parts_returns_status').on(table.status),
    check(
      'chk_parts_returns_reason',
      sql`${table.reason} IN ('defective', 'wrong_part', 'mismatch', 'quality')`,
    ),
    check(
      'chk_parts_returns_status',
      sql`${table.status} IN ('pending', 'approved', 'rejected', 'completed')`,
    ),
    check(
      'chk_parts_returns_resolution_type',
      sql`${table.resolutionType} IS NULL OR ${table.resolutionType} IN ('refund', 'replace', 'credit')`,
    ),
  ],
)

export type PartsReturn = typeof partsReturns.$inferSelect
export type NewPartsReturn = typeof partsReturns.$inferInsert
