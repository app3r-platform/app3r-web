/**
 * listing-meta.ts — W-Round-1 Wave 1.2: B2 universal listing_meta + GR-8 listing_views
 *
 * Decision B2 (Advisor Gen 101): listing_meta = universal listing id กลาง
 *   - state (D83) + counter (GR-8) + tambon (GR-9 D87) อยู่ที่เดียว
 *   - domain tables (services/parts_listings) เพิ่ม listing_meta_id FK → integrity 2 ทาง
 *   - downstream (reviews/questions/moderation/ads) FK → listing_meta.listingId
 * B3: app3r_dev :5433 — UUID FK จริง (owner_id → users)
 *
 * Migration: 0027_listing_meta.sql
 */
import { pgTable, uuid, text, integer, date, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { tambons } from './location-master'

// D83 listing states
export const LISTING_STATES = [
  'draft',
  'published',
  'has_offer',
  'matched',
  'completed',
  'cancelled',
] as const
export type ListingState = (typeof LISTING_STATES)[number]

export const LISTING_TYPES = ['repair', 'maintain', 'resell', 'scrap', 'parts'] as const
export type ListingType = (typeof LISTING_TYPES)[number]

export const listingMeta = pgTable(
  'listing_meta',
  {
    listingId: uuid('listing_id').primaryKey().defaultRandom(),
    listingType: text('listing_type').notNull(), // repair|maintain|resell|scrap|parts (CHECK in DB)
    domainRefId: uuid('domain_ref_id'), // id in domain table (nullable)
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    state: text('state').notNull().default('draft'), // D83 (CHECK in DB)
    viewCount: integer('view_count').notNull().default(0),
    offerCount: integer('offer_count').notNull().default(0),
    tambonId: integer('tambon_id').references(() => tambons.id), // GR-9 (Thai code, not UUID)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_listing_meta_owner').on(t.ownerId),
    index('idx_listing_meta_type').on(t.listingType),
    index('idx_listing_meta_state').on(t.state),
    index('idx_listing_meta_tambon').on(t.tambonId),
    index('idx_listing_meta_domain_ref').on(t.listingType, t.domainRefId),
  ],
)

// GR-8 unique-view dedupe log
export const listingViews = pgTable(
  'listing_views',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listingMeta.listingId, { onDelete: 'cascade' }),
    viewerUserId: uuid('viewer_user_id').references(() => users.id, { onDelete: 'set null' }),
    viewerIp: text('viewer_ip'),
    viewDate: date('view_date').notNull().default(sql`CURRENT_DATE`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_listing_views_listing').on(t.listingId),
    uniqueIndex('uq_listing_views_user_day')
      .on(t.listingId, t.viewerUserId, t.viewDate)
      .where(sql`viewer_user_id IS NOT NULL`),
    uniqueIndex('uq_listing_views_ip_day')
      .on(t.listingId, t.viewerIp, t.viewDate)
      .where(sql`viewer_user_id IS NULL AND viewer_ip IS NOT NULL`),
  ],
)

export type ListingMeta = typeof listingMeta.$inferSelect
export type NewListingMeta = typeof listingMeta.$inferInsert
export type ListingView = typeof listingViews.$inferSelect
export type NewListingView = typeof listingViews.$inferInsert
