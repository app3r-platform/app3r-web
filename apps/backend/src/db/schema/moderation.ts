/**
 * moderation.ts — W-Round-1 Wave 1.2 [5]: D82 hybrid moderation + audit
 *
 * D82 hybrid policy:
 *   - text post-publish → auto_approved (โพสต์เห็นทันที)
 *   - รูป/คลิป (image|video) → เข้าคิว pending เสมอ
 *   - ผู้โพสต์ใหม่ (new poster) → hold ก่อน (admin review)
 *   - ทุก action บันทึก moderation_audit_log
 *
 * Migration: 0029_downstream_listing.sql
 */
import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'
import { listingMeta } from './listing-meta'

export const MODERATION_CONTENT_TYPES = ['review', 'question', 'reply', 'listing', 'ad'] as const
export type ModerationContentType = (typeof MODERATION_CONTENT_TYPES)[number]

export const MODERATION_MEDIA_TYPES = ['text', 'image', 'video'] as const
export type ModerationMediaType = (typeof MODERATION_MEDIA_TYPES)[number]

export const MODERATION_STATUSES = ['pending', 'approved', 'rejected', 'auto_approved', 'hold'] as const
export type ModerationStatus = (typeof MODERATION_STATUSES)[number]

export const MODERATION_ACTIONS = ['submit', 'approve', 'reject', 'auto_approve', 'hold'] as const
export type ModerationAction = (typeof MODERATION_ACTIONS)[number]

export const moderationQueue = pgTable(
  'moderation_queue',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentType: text('content_type').notNull(), // CHECK in DB
    contentRefId: uuid('content_ref_id').notNull(),
    listingId: uuid('listing_id').references(() => listingMeta.listingId, { onDelete: 'set null' }),
    submitterUserId: uuid('submitter_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    mediaType: text('media_type').notNull().default('text'), // CHECK in DB
    status: text('status').notNull().default('pending'), // CHECK in DB
    reason: text('reason'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_moderation_queue_status').on(t.status),
    index('idx_moderation_queue_content').on(t.contentType, t.contentRefId),
    index('idx_moderation_queue_listing').on(t.listingId),
  ],
)

export const moderationAuditLog = pgTable(
  'moderation_audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    queueId: uuid('queue_id').references(() => moderationQueue.id, { onDelete: 'set null' }),
    action: text('action').notNull(), // CHECK in DB
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_moderation_audit_queue').on(t.queueId)],
)

export type ModerationQueueRow = typeof moderationQueue.$inferSelect
export type NewModerationQueueRow = typeof moderationQueue.$inferInsert
export type ModerationAuditRow = typeof moderationAuditLog.$inferSelect
export type NewModerationAuditRow = typeof moderationAuditLog.$inferInsert
