/**
 * offers.ts — W-Round-1 Wave 2.x Part1 (Ruling 1A · D61 verbatim — Advisor Gen 18)
 *
 * ข้อเสนอซื้อบน listing (resell/scrap) · snake_case contract · FK → listing_meta (B6)
 * Flow: buyer ยื่น offer (pending) → seller select-offer → status=selected + listing→offer_selected
 *       → escrow lock (D83 1D) · withdraw → status=withdrawn
 *
 * Migration: 0030_offers_resell.sql
 */
import { pgTable, uuid, text, numeric, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'
import { listingMeta } from './listing-meta'

export const OFFER_STATUSES = ['pending', 'selected', 'rejected', 'withdrawn'] as const
export type OfferStatus = (typeof OFFER_STATUSES)[number]

export const offers = pgTable(
  'offers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingMetaId: uuid('listing_meta_id')
      .notNull()
      .references(() => listingMeta.listingId, { onDelete: 'cascade' }),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    buyerType: text('buyer_type').notNull(), // WeeeU | WeeeR (CHECK in DB)
    offerPrice: numeric('offer_price', { precision: 12, scale: 2 }).notNull(),
    deliveryMethod: text('delivery_method').notNull(),
    message: text('message'),
    status: text('status').notNull().default('pending'), // CHECK in DB
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_offers_listing').on(t.listingMetaId),
    index('idx_offers_buyer').on(t.buyerId),
    index('idx_offers_status').on(t.status),
  ],
)

export type Offer = typeof offers.$inferSelect
export type NewOffer = typeof offers.$inferInsert
