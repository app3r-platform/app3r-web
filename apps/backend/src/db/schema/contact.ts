/**
 * db/schema/contact.ts — Sub-4 D78: Contact Info + Form
 *
 * Tables: contact_messages (13 cols) + contact_info (singleton JSONB)
 * Schema Plan: 363813ec-7277-81c2-b7b4-d9111d0b3427
 * Master CMD:  363813ec-7277-813c-ba73-e56b9695d828 (v4.2)
 */
import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'

// ── Table A: contact_messages ─────────────────────────────────────────────────
export const contactMessages = pgTable(
  'contact_messages',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    category:  text('category').notNull(),   // ContactCategory enum (8 values)
    name:      text('name').notNull(),
    email:     text('email').notNull(),
    phone:     text('phone'),                // optional
    subject:   text('subject').notNull(),
    body:      text('body').notNull(),
    status:    text('status').notNull().default('new'),  // ContactStatus enum
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    repliedAt: timestamp('replied_at', { withTimezone: true }),
    repliedBy: uuid('replied_by').references(() => users.id, { onDelete: 'set null' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),  // soft delete — NULL = active
  },
  (t) => [
    index('idx_contact_status_created').on(t.status, t.createdAt),
    index('idx_contact_category_status').on(t.category, t.status),
  ],
)

// ── Table B: contact_info (singleton) ─────────────────────────────────────────
// Singleton enforced by UNIQUE key = 'platform' (only 1 row)
// data JSONB stores full ContactInfoDto
export const contactInfo = pgTable(
  'contact_info',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    key:       text('key').notNull().unique().default('platform'),  // enforce singleton
    data:      jsonb('data').notNull(),  // ContactInfoDto
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
)
