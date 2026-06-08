/**
 * otp-codes.ts — D-1 Phase D Sprint: short-lived OTP codes
 * Migration: 0033_d1_otp_codes.sql
 *
 * POST /auth/otp-request → create row
 * POST /auth/otp-verify  → check + mark used_at
 *
 * type: email_verify | phone | 2fa
 * code: 6-digit string (zero-padded)
 */
import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const otpCodes = pgTable(
  'otp_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 6 }).notNull(),
    type: varchar('type', { length: 20 }).notNull().default('email_verify'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_otp_codes_user_id').on(table.userId),
    index('idx_otp_codes_expires_at').on(table.expiresAt),
  ],
)

export type OtpCode = typeof otpCodes.$inferSelect
export type NewOtpCode = typeof otpCodes.$inferInsert
