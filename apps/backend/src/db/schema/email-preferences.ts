/**
 * email-preferences.ts — D91: user email opt-in/out preferences
 *
 * PK = user_id (1 user = 1 preference row)
 * ตรวจก่อนส่งทุก email:
 * - marketing_opt_in=false → ไม่ส่ง marketing/newsletter
 * - transactional_only=true → ส่งแค่ transactional (signup verify, payment receipt)
 * - unsubscribed_at IS NOT NULL → หยุดส่งทุกประเภท (ยกเว้น critical system email)
 *
 * CAN-SPAM (US) / PDPA (TH): unsubscribe link required สำหรับ marketing Y2+
 */
import { pgTable, uuid, boolean, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const emailPreferences = pgTable('email_preferences', {
  // PK = user_id (one-to-one กับ users)
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  marketingOptIn: boolean('marketing_opt_in').notNull().default(false),
  // user สามารถ opt out marketing แต่ยังรับ transactional
  transactionalOnly: boolean('transactional_only').notNull().default(false),
  // หยุดส่งทุกประเภท (ยกเว้น critical)
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  unsubscribeReason: text('unsubscribe_reason'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type EmailPreference = typeof emailPreferences.$inferSelect
export type NewEmailPreference = typeof emailPreferences.$inferInsert
