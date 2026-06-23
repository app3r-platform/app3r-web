/**
 * profile-reviews.ts — DB-phase D1 (Gen 122 · R3/R4)
 * Migration: 0035_d1_profile_reviews.sql
 *
 * profile_reviews = POST-TRANSACTION review of a PERSON/SHOP (counterparty),
 *   canonical Gen 121. NEW table (NOT extend listing_reviews — precedent parts_ratings).
 *   - listing_reviews (D86) = listing-scoped (review of an ANNOUNCEMENT) → coexists, untouched.
 *   - profile_reviews        = profile-scoped (review of reviewee user/shop after a transaction).
 *
 * Anchor: listing_meta universal id (R4). Eligibility gate: anchor state='completed'
 *   (= escrow released event · transition→completed) — enforced app-layer at write (D2+),
 *   not a DB constraint (cross-table). Supports 2-way buyer↔seller via reviewer+reviewee.
 *
 * WeeeT is NOT a reviewee (no wallet · service fee → WeeeR) — reviewee = WeeeR/seller/buyer.
 */
import {
  pgTable,
  uuid,
  integer,
  text,
  boolean,
  timestamp,
  index,
  unique,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { listingMeta } from './listing-meta'

export const profileReviews = pgTable(
  'profile_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // transaction anchor → listing_meta universal id (gate state='completed' at write, app-layer)
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listingMeta.listingId, { onDelete: 'cascade' }),
    // who writes the review
    reviewerUserId: uuid('reviewer_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // who is reviewed (counterparty person/shop)
    revieweeUserId: uuid('reviewee_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(), // 1-5 (CHECK in DB)
    comment: text('comment'),
    isVisible: boolean('is_visible').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    // one review per (transaction, reviewer, reviewee) — supports 2-way buyer↔seller
    unique('profile_reviews_listing_reviewer_reviewee_key').on(
      t.listingId,
      t.reviewerUserId,
      t.revieweeUserId,
    ),
    index('idx_profile_reviews_listing').on(t.listingId),
    index('idx_profile_reviews_reviewer').on(t.reviewerUserId),
    index('idx_profile_reviews_reviewee').on(t.revieweeUserId),
    check('profile_reviews_rating_check', sql`${t.rating} >= 1 AND ${t.rating} <= 5`),
  ],
)

export type ProfileReview = typeof profileReviews.$inferSelect
export type NewProfileReview = typeof profileReviews.$inferInsert
