/**
 * escrow-holds.ts — DB-phase D1 (Gen 122 · R1c full-lock)
 * Migration: 0034_d1_escrow_holds.sql
 *
 * escrow_holds = SINGLE-SOURCE full-lock escrow for ALL domains
 *   (listing resell/scrap + parts-orders). NOT two-phase 30/70
 *   (D83 supersede D004 two-phase · DROP phase1/phase2 · Point REFINED v2).
 *
 * Lifecycle (state names = D83 canonical · mapped from code states in service layer):
 *   lock@matched      → debit/type=spend (payer)          state='locked'
 *   release@completed → credit/type=earn (recipient · net after fee) state='released'
 *   refund@cancelled  → credit/type=refund (payer)        state='refunded'
 *   platform_fee@release = debit out of escrow → platform revenue account (NOT user wallet)
 *
 * payer/recipient explicit (NOT inferred from owner/buyer) → Scrap reverse:
 *   resell/repair/maintain: payer=WeeeU/buyer → recipient=WeeeR/seller
 *   scrap:                  payer=WeeeR       → recipient=WeeeU  (Gold flows WeeeR→WeeeU)
 *
 * Gold only (point_type='cash'). point_ledger link = REVERSE via reference='escrow:{holdId}'
 *   (audit rows: debit lock + credit release/refund) — no FK column here.
 */
import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'

export const escrowHolds = pgTable(
  'escrow_holds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // polymorphic ref → listing_meta.listing_id (resell/scrap) OR parts_orders.id (parts)
    // no hard FK (cross-domain single source). parts link is reverse via parts_orders.escrow_hold_id.
    transactionRef: uuid('transaction_ref').notNull(),
    // explicit payer/recipient (Scrap reverse: payer=WeeeR → recipient=WeeeU)
    payerUserId: uuid('payer_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    recipientUserId: uuid('recipient_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    // Gold only — escrow locks Gold (cash). 1 Gold = 1 THB.
    pointType: varchar('point_type', { length: 20 }).notNull().default('cash'),
    // full-lock amount (Gold integer — no decimals, D75)
    totalAmount: integer('total_amount').notNull(),
    // lifecycle state: locked@matched → released@completed | refunded@cancelled
    state: varchar('state', { length: 20 }).notNull().default('locked'),
    // platform fee deducted at release (Gold integer · D75 Math.round · point_rounding_log)
    platformFeeAmount: integer('platform_fee_amount').notNull().default(0),
    // fee config snapshot at matched (e.g. { platform_fee_percent: 3 }) — read from admin_config
    feeConfigSnapshot: jsonb('fee_config_snapshot'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_escrow_holds_transaction').on(t.transactionRef),
    index('idx_escrow_holds_payer').on(t.payerUserId),
    index('idx_escrow_holds_recipient').on(t.recipientUserId),
    index('idx_escrow_holds_state').on(t.state),
    check('chk_escrow_holds_state', sql`${t.state} IN ('locked', 'released', 'refunded')`),
    check('chk_escrow_holds_point_type', sql`${t.pointType} = 'cash'`),
    // W2.1 (migration 0044): DB safety net — ≤1 active locked hold ต่อ transaction (กัน double-lock)
    uniqueIndex('idx_escrow_holds_one_locked').on(t.transactionRef).where(sql`${t.state} = 'locked'`),
    // W3c (F7 · migration 0045 DRAFT): GAP-2 money positivity — total_amount > 0
    check('chk_escrow_holds_total_positive', sql`${t.totalAmount} > 0`),
  ],
)

export type EscrowHold = typeof escrowHolds.$inferSelect
export type NewEscrowHold = typeof escrowHolds.$inferInsert
