/**
 * point-rounding-log.ts — D75: audit log สำหรับ rounding operations
 *
 * บันทึกทุกครั้งที่ระบบ round point (decimal → integer)
 * เพื่อ audit trail + ตรวจสอบ formula ย้อนหลัง
 *
 * ข้อมูลจาก Point chat (2026-05-12 — NOTE-2):
 * - original_value: DECIMAL (ค่าก่อน round)
 * - rounded_value: INTEGER (ค่าหลัง round)
 * - delta: DECIMAL (ผลต่าง = rounded - original)
 */
import {
  pgTable,
  uuid,
  numeric,
  integer,
  varchar,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { pointLedger } from './point-ledger'

export const pointRoundingLog = pgTable(
  'point_rounding_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // ค่า decimal ก่อน round (เช่น 12.75 points)
    originalValue: numeric('original_value', { precision: 15, scale: 4 }).notNull(),
    // ค่า integer หลัง round (เช่น 13)
    roundedValue: integer('rounded_value').notNull(),
    // delta = rounded_value - original_value (อาจ +/-)
    delta: numeric('delta', { precision: 15, scale: 4 }).notNull(),
    // up | down
    direction: varchar('direction', { length: 10 }).notNull(),
    // FK ไปยัง point_ledger row ที่เกิด rounding นี้
    ledgerId: uuid('ledger_id')
      .notNull()
      .references(() => pointLedger.id, { onDelete: 'cascade' }),
    // ประเภท fee/ค่าธรรมเนียม ที่ถูก round
    feeType: varchar('fee_type', { length: 50 }),
    // app ที่เกิด rounding: weeeu | weeer | weeet | admin
    app: varchar('app', { length: 20 }).notNull(),
    // สูตรที่ใช้ round (เช่น "Math.round(x)", "Math.ceil(x*0.95)")
    formula: text('formula'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_point_rounding_log_ledger_id').on(table.ledgerId),
    index('idx_point_rounding_log_created_at').on(table.createdAt),
  ],
)

export type PointRoundingLogRow = typeof pointRoundingLog.$inferSelect
export type NewPointRoundingLogRow = typeof pointRoundingLog.$inferInsert
