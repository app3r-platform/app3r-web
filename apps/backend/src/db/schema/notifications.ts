/**
 * notifications.ts — D88: in-app notification log
 *
 * บันทึก notification ที่ส่งออกทุกช่องทาง:
 * - websocket (foreground)
 * - fcm (background Android+Web)
 * - apns (background iOS — future)
 * - email_fallback
 *
 * PDPA: ห้ามเก็บ message body เกิน 30 วัน (cleanup job D-5)
 */
import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recipientId: uuid('recipient_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 'weeeu' | 'weeer' | 'weeet' | 'admin'
    recipientApp: text('recipient_app').notNull(),
    // 'chat_message' | 'offer_arrived' | 'status_update' | 'payment_confirm' | 'eta_update'
    type: text('type').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    // flexible payload: { link_url, ref_id, service_id, ... }
    data: jsonb('data'),
    // 'websocket' | 'fcm' | 'apns' | 'email_fallback'
    channel: text('channel').notNull().default('websocket'),
    sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    readAt: timestamp('read_at', { withTimezone: true }),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_notifications_recipient').on(table.recipientApp, table.recipientId, table.sentAt),
    // partial index สำหรับ unread badge count
    index('idx_notifications_unread')
      .on(table.recipientId)
      .where(sql`read_at IS NULL`),
  ],
)

export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
