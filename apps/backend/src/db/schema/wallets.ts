/**
 * wallets.ts — user balance snapshots per point_type
 *
 * Backend wallet decision (2026-05-12):
 * ใช้ wallets table แยก (ไม่เพิ่ม columns ใน users)
 *
 * เหตุผล:
 * 1. รองรับ multi point_type per user (cash + bonus + future types)
 * 2. point_ledger.balance_after = snapshot ทุก row อยู่แล้ว
 *    → wallets = latest balance per (user, point_type) สำหรับ query เร็ว
 * 3. Separation of concerns: users = identity, wallets = point state
 *
 * Update pattern: wallets.balance อัพเดตทุกครั้งที่ insert point_ledger
 * (ทำใน transaction เดียวกัน — atomic)
 */
import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const wallets = pgTable(
  'wallets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // cash | bonus | ...
    pointType: varchar('point_type', { length: 20 }).notNull(),
    // current balance (updated on every point_ledger insert atomically)
    balance: integer('balance').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // 1 wallet per (user, point_type)
    uniqueIndex('idx_wallets_user_point_type').on(table.userId, table.pointType),
    index('idx_wallets_user_id').on(table.userId),
  ],
)

export type Wallet = typeof wallets.$inferSelect
export type NewWallet = typeof wallets.$inferInsert
