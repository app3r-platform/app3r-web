/**
 * push-subscriptions.ts — D88: FCM/APNs token registry
 *
 * NOTE-D88-1 + NOTE-SUB1 applied:
 * UNIQUE INDEX ใช้ expression column (4 columns) — ไม่ใช่ partial index
 * ON (user_id, app, platform, COALESCE(fcm_token, apns_token, ''))
 *
 * semantics:
 * - .where() = partial index WHERE clause (filter rows) — ผิด
 * - .on() with SQL expression = 4-column unique key — ถูก
 *
 * ถ้า Drizzle version ไม่รองรับ expression column ใน .on()
 * → drizzle-kit generate จะออก SQL โดยไม่ใส่ expression → ต้อง manual migration SQL:
 * CREATE UNIQUE INDEX uq_push_sub_user_app_platform_token
 *   ON push_subscriptions (user_id, app, platform, COALESCE(fcm_token, apns_token, ''));
 */
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 'weeeu' | 'weeer' | 'weeet' | 'admin'
    app: text('app').notNull(),
    // 'web' | 'android' | 'ios' (ios = future Mobile Memory #11)
    platform: text('platform').notNull(),
    fcmToken: text('fcm_token'),
    apnsToken: text('apns_token'),
    userAgent: text('user_agent'),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // NOTE-SUB1 fix: expression column ใน .on() (ไม่ใช่ .where())
    // สร้าง 4-column unique key ครอบคลุมทุก row
    uniqueIndex('uq_push_sub_user_app_platform_token').on(
      table.userId,
      table.app,
      table.platform,
      sql`COALESCE(${table.fcmToken}, ${table.apnsToken}, '')`,
    ),
    index('idx_push_sub_user').on(table.userId, table.app),
  ],
)

export type PushSubscription = typeof pushSubscriptions.$inferSelect
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert
