/**
 * ads.ts — W-Round-1 Wave 1.2 [5] / C12: โฆษณา + ตัด Gold Point (D75)
 *
 * Ad Spec (Advisor):
 *   2 ประเภท: own_listing (ตัด Gold Point จากผู้ลง) | external_banner (ผ่านฟอร์มติดต่อ)
 *   ตำแหน่ง: home_first_row | module_first_row | sidebar
 *   Flow: buy → admin approval queue → approve (ตัด Gold D75 ปัดเต็ม + audit) → active
 *          / reject → refund
 *   เรต default (admin ปรับได้ผ่าน admin_config): home_first_row=5, module_first_row=3, sidebar=3 Gold/วัน
 *
 * Migration: 0029_downstream_listing.sql
 */
import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'
import { listingMeta } from './listing-meta'

export const AD_TYPES = ['own_listing', 'external_banner'] as const
export type AdType = (typeof AD_TYPES)[number]

export const AD_POSITIONS = ['home_first_row', 'module_first_row', 'sidebar'] as const
export type AdPosition = (typeof AD_POSITIONS)[number]

export const AD_STATUSES = ['pending', 'approved', 'active', 'rejected', 'expired'] as const
export type AdStatus = (typeof AD_STATUSES)[number]

export const ads = pgTable(
  'ads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    advertiserUserId: uuid('advertiser_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    adType: text('ad_type').notNull(), // CHECK in DB
    listingId: uuid('listing_id').references(() => listingMeta.listingId, { onDelete: 'set null' }),
    position: text('position').notNull(), // CHECK in DB
    bannerImage: text('banner_image'),
    targetUrl: text('target_url'),
    goldCost: integer('gold_cost').notNull().default(0), // D75 ปัดเต็ม
    durationDays: integer('duration_days').notNull().default(1),
    status: text('status').notNull().default('pending'), // CHECK in DB
    rejectReason: text('reject_reason'),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_ads_advertiser').on(t.advertiserUserId),
    index('idx_ads_status').on(t.status),
    index('idx_ads_position_active').on(t.position, t.status),
    index('idx_ads_listing').on(t.listingId),
  ],
)

export type Ad = typeof ads.$inferSelect
export type NewAd = typeof ads.$inferInsert
