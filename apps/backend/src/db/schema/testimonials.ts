/**
 * db/schema/testimonials.ts — Sub-2 D-4: Testimonials API
 *
 * Table: testimonials (10 columns)
 * Master CMD: 363813ec-7277-81ae-94e8-e0e79b492eb6
 * Schema Plan: 363813ec-7277-81dc-ac96-fd41d4fcdabf (T+0.6 APPROVED)
 *
 * status enum: 'draft' | 'published' (OBS-1 resolved — Advisor Gen 49)
 */
import { pgTable, uuid, text, smallint, integer, timestamp, boolean, index } from 'drizzle-orm/pg-core'

export const testimonials = pgTable(
  'testimonials',
  {
    id:           uuid('id').primaryKey().defaultRandom(),
    name:         text('name').notNull(),
    role:         text('role').notNull(),
    starsRating:  smallint('stars_rating').notNull(),           // 1–5; CHECK enforced in migration
    text:         text('text').notNull(),
    avatar:       text('avatar').notNull(),
    sortOrder:    integer('sort_order').notNull().default(0),
    status:       text('status').notNull().default('draft'),    // 'draft' | 'published'
    publishedAt:  timestamp('published_at', { withTimezone: true }),
    createdAt:    timestamp('created_at',  { withTimezone: true }).defaultNow().notNull(),
    updatedAt:    timestamp('updated_at',  { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_testimonials_status_sort').on(t.status, t.sortOrder),
    index('idx_testimonials_stars').on(t.starsRating),
  ],
)
