/**
 * payment-intents.ts — D89: payment lifecycle tracking
 *
 * Multi-provider: 2C2P (primary Thai) + TrueMoney (e-wallet) + Stripe (international/subscription)
 * PCI-DSS SAQ-A: hosted checkout เท่านั้น — บัตรไม่แตะ server เรา
 *
 * NOTE-M3 (Reconciliation D-2 simplified):
 * cron daily 02:00 → flag status='pending'|'authorized' นาน >24h → status='stale' + alert admin
 * settlement report API (2C2P/TrueMoney/Stripe) เลื่อนไป D-5
 *
 * NOTE-D89-2: D-2 ไม่มี withdrawal UI — WeeeR/WeeeT ถอนเงิน = manual process Phase D-5
 *
 * payment_intents ↔ wallets/point_ledger sync: @needs-point-review
 * (Backend ส่ง consultation ให้ Point chat ผ่าน HUB ก่อน finalize logic)
 */
import {
  pgTable,
  uuid,
  text,
  numeric,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const paymentIntents = pgTable(
  'payment_intents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userApp: text('user_app').notNull(),
    // '2c2p' | 'truemoney' | 'stripe'
    provider: text('provider').notNull(),
    // reference จาก provider (เติมหลังสร้าง checkout session)
    providerRef: text('provider_ref'),
    // D89: DECIMAL(12,2) สำหรับ THB amount
    amountThb: numeric('amount_thb', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('THB'),
    // 'service_payment' | 'subscription' | 'topup' | 'withdrawal'
    purpose: text('purpose').notNull(),
    // 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'disputed' | 'stale'
    // 'stale' = NOTE-M3: pending/authorized นาน >24h → flagged by reconciliation cron
    status: text('status').notNull().default('pending'),
    // idempotency key — unique ต่อ intent
    idempotencyKey: text('idempotency_key').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_pi_idempotency_key').on(table.idempotencyKey),
    index('idx_pi_user').on(table.userApp, table.userId, table.createdAt),
    index('idx_pi_status').on(table.status, table.createdAt),
    index('idx_pi_provider_ref').on(table.provider, table.providerRef),
  ],
)

export type PaymentIntent = typeof paymentIntents.$inferSelect
export type NewPaymentIntent = typeof paymentIntents.$inferInsert
