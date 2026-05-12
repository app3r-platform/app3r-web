/**
 * webhook-events.ts — D89: provider webhook idempotency log
 *
 * raw log ทุก webhook ที่ provider ส่งเข้ามา + idempotency dedup
 * UNIQUE (provider_event_id) — กัน duplicate delivery
 *
 * Webhook security: verify HMAC signature ก่อน process ทุก provider
 * Retry logic: exponential (1m → 5m → 30m → 2h → 5h) — ฝั่ง provider
 */
import { pgTable, uuid, text, boolean, jsonb, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { paymentIntents } from './payment-intents'

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // '2c2p' | 'truemoney' | 'stripe'
    provider: text('provider').notNull(),
    // 'payment.succeeded' | 'payment.failed' | 'refund.created' | ...
    eventType: text('event_type').notNull(),
    // unique event ID จาก provider — กัน duplicate
    providerEventId: text('provider_event_id').notNull(),
    signature: text('signature').notNull(),
    signatureVerified: boolean('signature_verified').notNull().default(false),
    payload: jsonb('payload').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    // FK ไป payment_intents (nullable — บาง webhook ไม่มี intent ตรงๆ)
    relatedIntentId: uuid('related_intent_id').references(() => paymentIntents.id),
    receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_wh_provider_event_id').on(table.providerEventId),
    // partial index สำหรับ worker ที่ต้องประมวลผล webhook ค้าง
    index('idx_wh_unprocessed')
      .on(table.provider, table.receivedAt)
      .where(sql`processed_at IS NULL`),
  ],
)

export type WebhookEvent = typeof webhookEvents.$inferSelect
export type NewWebhookEvent = typeof webhookEvents.$inferInsert
