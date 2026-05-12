/**
 * email-log.ts — D91: outbound email delivery audit log
 *
 * log ทุก email ที่ส่ง — audit + delivery tracking + bounce/complaint handling
 * PDPA: เก็บ email content 90 วัน จากนั้น hash sender/recipient (cleanup job D-5)
 *
 * Resend webhook callback:
 * POST /api/webhooks/email → update delivered_at / bounced_at / complained_at
 *
 * Email queue worker (PG polling):
 * SELECT * FROM email_log WHERE status='pending' LIMIT 20 ทุก 30s (D-2)
 * Y2+: BullMQ + Redis worker
 */
import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const emailLog = pgTable(
  'email_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recipientEmail: text('recipient_email').notNull(),
    // nullable ถ้า unregistered email (เช่น contact form)
    recipientUserId: uuid('recipient_user_id').references(() => users.id),
    // 'signup_verify' | 'password_reset' | 'payment_receipt' | 'withdrawal_confirm' | ...
    templateName: text('template_name').notNull(),
    subject: text('subject').notNull(),
    // 'resend' | 'ses'
    provider: text('provider').notNull(),
    // message ID จาก provider สำหรับ track delivery
    providerMessageId: text('provider_message_id'),
    sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    openedAt: timestamp('opened_at', { withTimezone: true }),
    clickedAt: timestamp('clicked_at', { withTimezone: true }),
    bouncedAt: timestamp('bounced_at', { withTimezone: true }),
    bounceReason: text('bounce_reason'),
    complainedAt: timestamp('complained_at', { withTimezone: true }),
    metadata: jsonb('metadata'),
  },
  (table) => [
    index('idx_email_log_recipient').on(table.recipientEmail, table.sentAt),
    index('idx_email_log_template').on(table.templateName, table.sentAt),
  ],
)

export type EmailLog = typeof emailLog.$inferSelect
export type NewEmailLog = typeof emailLog.$inferInsert
