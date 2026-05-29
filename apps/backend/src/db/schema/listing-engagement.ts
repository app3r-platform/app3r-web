/**
 * listing-engagement.ts — W-Round-1 Wave 1.2 [5]: D86 reviews + GR-5 questions
 *
 * downstream ของ listing_meta (FK → listing_meta.listing_id):
 *   D86  : listing_reviews + listing_review_replies (รีวิว + เจ้าของตอบ)
 *   GR-5 : listing_questions + listing_question_replies
 *          visibility: ผู้ถามเห็นเธรดตัวเอง / เจ้าของเห็นหมด / ปิด (is_closed) เมื่อ matched
 *
 * Migration: 0029_downstream_listing.sql
 */
import { pgTable, uuid, text, integer, boolean, timestamp, index, unique, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { listingMeta } from './listing-meta'

// ── D86: reviews ────────────────────────────────────────────────────────────────
export const listingReviews = pgTable(
  'listing_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listingMeta.listingId, { onDelete: 'cascade' }),
    reviewerUserId: uuid('reviewer_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(), // 1-5 (CHECK in DB)
    comment: text('comment'),
    isVisible: boolean('is_visible').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique('listing_reviews_listing_id_reviewer_user_id_key').on(t.listingId, t.reviewerUserId),
    index('idx_listing_reviews_listing').on(t.listingId),
    index('idx_listing_reviews_reviewer').on(t.reviewerUserId),
    check('listing_reviews_rating_check', sql`${t.rating} >= 1 AND ${t.rating} <= 5`),
  ],
)

export const listingReviewReplies = pgTable(
  'listing_review_replies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reviewId: uuid('review_id')
      .notNull()
      .references(() => listingReviews.id, { onDelete: 'cascade' }),
    replierUserId: uuid('replier_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_listing_review_replies_review').on(t.reviewId)],
)

// ── GR-5: questions ──────────────────────────────────────────────────────────────
export const listingQuestions = pgTable(
  'listing_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listingMeta.listingId, { onDelete: 'cascade' }),
    askerUserId: uuid('asker_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    isClosed: boolean('is_closed').notNull().default(false), // ปิดเมื่อ matched
    isVisible: boolean('is_visible').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_listing_questions_listing').on(t.listingId),
    index('idx_listing_questions_asker').on(t.askerUserId),
  ],
)

export const listingQuestionReplies = pgTable(
  'listing_question_replies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => listingQuestions.id, { onDelete: 'cascade' }),
    replierUserId: uuid('replier_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_listing_question_replies_question').on(t.questionId)],
)

export type ListingReview = typeof listingReviews.$inferSelect
export type NewListingReview = typeof listingReviews.$inferInsert
export type ListingReviewReply = typeof listingReviewReplies.$inferSelect
export type NewListingReviewReply = typeof listingReviewReplies.$inferInsert
export type ListingQuestion = typeof listingQuestions.$inferSelect
export type NewListingQuestion = typeof listingQuestions.$inferInsert
export type ListingQuestionReply = typeof listingQuestionReplies.$inferSelect
export type NewListingQuestionReply = typeof listingQuestionReplies.$inferInsert
