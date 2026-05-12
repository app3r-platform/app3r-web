/**
 * point-ledger.ts — D75: append-only point transaction ledger
 *
 * Design notes (Point chat input 2026-05-12 — NOTE-2 resolved):
 * - amount: INTEGER (not DECIMAL) — points are always whole numbers
 * - idempotency: UNIQUE (idempotency_key, point_type) ← NOT single-key
 *   เหตุผล: mixed-currency = 2 rows per key (e.g. cash + bonus in one operation)
 * - Append-only: ห้าม UPDATE/DELETE rows (business rule, enforced in app layer)
 * - balance_after: snapshot balance หลัง transaction (ไม่ต้อง sum ทุกครั้ง)
 */
import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const pointLedger = pgTable(
  'point_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // transaction type: earn | spend | adjust | expire | refund | transfer_in | transfer_out
    type: varchar('type', { length: 50 }).notNull(),
    // point currency: cash | bonus | ...
    pointType: varchar('point_type', { length: 20 }).notNull(),
    // D75: INTEGER — points ไม่มีทศนิยม
    amount: integer('amount').notNull(),
    // credit (เพิ่ม) | debit (ลด)
    direction: varchar('direction', { length: 10 }).notNull(),
    // snapshot balance หลัง transaction (per userId + pointType)
    balanceAfter: integer('balance_after').notNull(),
    // reference ไปยัง source: เช่น "repair:uuid", "listing:uuid"
    reference: varchar('reference', { length: 255 }),
    // idempotency key สำหรับ dedup (nullable — operations ไม่จำเป็นต้องมีทุกตัว)
    idempotencyKey: varchar('idempotency_key', { length: 255 }),
    // flexible metadata (e.g. module-specific data, admin note)
    metadata: jsonb('metadata'),
    // append-only timestamp
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // D75: UNIQUE (idempotency_key, point_type) — NULL values allowed (do not conflict)
    // mixed-currency: same idempotency_key → 2 rows (cash row + bonus row)
    uniqueIndex('idx_point_ledger_idempotency').on(table.idempotencyKey, table.pointType),
    index('idx_point_ledger_user_id').on(table.userId),
    index('idx_point_ledger_user_point_type').on(table.userId, table.pointType),
    index('idx_point_ledger_created_at').on(table.createdAt),
  ],
)

export type PointLedgerRow = typeof pointLedger.$inferSelect
export type NewPointLedgerRow = typeof pointLedger.$inferInsert
