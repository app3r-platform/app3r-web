/**
 * resell-disputes.ts — D2 Resell Slice · Wave 1 (Advisor ruling G3 · APPROVE shape)
 * Migration: 0041_d2_resell_disputes.sql  ⚠️ DRAFT — ยังไม่ apply (Advisor review ก่อน · ruling G3)
 *
 * resell_disputes = ข้อพิพาท ต่อ transaction (anchor listing_meta · additive · R6/R8/R10/R11)
 *   - 3-way resolution (Admin ตัดสิน): buyer (คืน buyer) | seller (จ่าย seller) | split (แบ่ง)
 *   - raised_by → ผู้เปิด (buyer/seller) · resolved_by → admin (nullable จน resolve)
 *   - evidence = file_uploads ref[] (jsonb)
 *   - listing_meta.state='disputed' = overlay (D83) · ตารางนี้เก็บ detail/evidence/resolution
 */
import { pgTable, uuid, varchar, text, jsonb, timestamp, index, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { listingMeta } from './listing-meta'
import { users } from './users'

export const DISPUTE_TYPES = ['not_as_described', 'damaged', 'not_shipped', 'parcel_damage', 'other'] as const
export type DisputeType = (typeof DISPUTE_TYPES)[number]

export const DISPUTE_STATUSES = ['open', 'under_review', 'resolved', 'rejected'] as const
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number]

// 3-way resolution (ruling G3): buyer=refund | seller=release | split
export const DISPUTE_RESOLUTIONS = ['buyer', 'seller', 'split'] as const
export type DisputeResolution = (typeof DISPUTE_RESOLUTIONS)[number]

export const resellDisputes = pgTable(
  'resell_disputes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // anchor → listing_meta universal id
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listingMeta.listingId, { onDelete: 'cascade' }),
    // ผู้เปิดข้อพิพาท (buyer หรือ seller)
    raisedByUserId: uuid('raised_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    disputeType: varchar('dispute_type', { length: 30 }).notNull(), // CHECK in DB
    reason: text('reason').notNull(),
    evidence: jsonb('evidence'), // file_uploads ref[]
    status: varchar('status', { length: 20 }).notNull().default('open'), // CHECK in DB
    resolution: varchar('resolution', { length: 20 }), // buyer|seller|split (CHECK · null จน resolve)
    resolutionNote: text('resolution_note'),
    // admin ที่ตัดสิน (nullable จน resolve)
    resolvedByUserId: uuid('resolved_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_resell_disputes_listing').on(t.listingId),
    index('idx_resell_disputes_status').on(t.status),
    index('idx_resell_disputes_raised_by').on(t.raisedByUserId),
    check(
      'chk_resell_disputes_type',
      sql`${t.disputeType} IN ('not_as_described', 'damaged', 'not_shipped', 'parcel_damage', 'other')`,
    ),
    check(
      'chk_resell_disputes_status',
      sql`${t.status} IN ('open', 'under_review', 'resolved', 'rejected')`,
    ),
    check(
      'chk_resell_disputes_resolution',
      sql`${t.resolution} IS NULL OR ${t.resolution} IN ('buyer', 'seller', 'split')`,
    ),
  ],
)

export type ResellDispute = typeof resellDisputes.$inferSelect
export type NewResellDispute = typeof resellDisputes.$inferInsert
