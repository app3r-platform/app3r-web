/**
 * offers.ts — W-Round-1 Wave 2.x Part1 (Ruling 1A · D61 verbatim — Advisor Gen 18)
 *
 * ข้อเสนอซื้อบน listing (resell/scrap) · snake_case contract · FK → listing_meta (B6)
 * Flow: buyer ยื่น offer (pending) → seller select-offer → status=selected + listing→offer_selected
 *       → escrow lock (D83 1D) · withdraw → status=withdrawn
 *
 * Migration: 0030_offers_resell.sql
 */
import { pgTable, uuid, text, numeric, timestamp, index, uniqueIndex, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
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
    // D2 W2 (1A funding window): seller เลือก → selectedAt set · เงินล็อกภายใน 24h (fundingDeadline) · R4 timeout
    // Migration: 0043_d2_offer_funding_window.sql (DRAFT)
    selectedAt: timestamp('selected_at', { withTimezone: true }),
    fundingDeadline: timestamp('funding_deadline', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_offers_listing').on(t.listingMetaId),
    index('idx_offers_buyer').on(t.buyerId),
    index('idx_offers_status').on(t.status),
    index('idx_offers_funding_deadline').on(t.fundingDeadline),
    // S2 (W2.1 · migration 0044): DB safety net — ≤1 selected offer ต่อ listing (กัน double-select split-brain)
    uniqueIndex('idx_offers_one_selected').on(t.listingMetaId).where(sql`${t.status} = 'selected'`),
    // W3c (F7 · migration 0045 DRAFT): GAP-2 offer_price > 0 · GAP-4 ≤1 pending offer ต่อ (listing, buyer)
    check('chk_offers_price_positive', sql`${t.offerPrice} > 0`),
    uniqueIndex('idx_offers_one_pending_per_buyer')
      .on(t.listingMetaId, t.buyerId)
      .where(sql`${t.status} = 'pending'`),
  ],
)

export type Offer = typeof offers.$inferSelect
export type NewOffer = typeof offers.$inferInsert
