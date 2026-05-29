/**
 * used-appliance-listings.ts — W-Round-1 Wave 2.x Part1 (Ruling 1A · D59 domain)
 *
 * resell/scrap listing domain (D59 verbatim — App3R-Advisor Gen 18) · snake_case contract
 * ทุก row ผูก listing_meta (B6 single-source) → state/counter/tambon/reviews/questions ใช้ร่วม
 *
 * appliance_id / scrap_item_id: UUID ไม่ผูก FK — appliance/scrap module ยังไม่พร้อม
 *   (pattern เดียวกับ parts_listings.source_scrap_id)
 *
 * Migration: 0030_offers_resell.sql
 */
import { pgTable, uuid, text, numeric, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'
import { listingMeta } from './listing-meta'

export const SELLER_TYPES = ['WeeeU', 'WeeeR'] as const
export type SellerType = (typeof SELLER_TYPES)[number]

export const USED_LISTING_TYPES = ['used_appliance', 'scrap'] as const
export type UsedListingType = (typeof USED_LISTING_TYPES)[number]

export const usedApplianceListings = pgTable(
  'used_appliance_listings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // B6: universal listing id (1:1)
    listingMetaId: uuid('listing_meta_id')
      .notNull()
      .references(() => listingMeta.listingId, { onDelete: 'cascade' }),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sellerType: text('seller_type').notNull(), // WeeeU | WeeeR (CHECK in DB)
    listingType: text('listing_type').notNull(), // used_appliance | scrap (CHECK in DB)
    applianceId: uuid('appliance_id'), // no FK — appliance module pending
    warranty: jsonb('warranty'), // { sourceWarranty, additionalWarranty } | null
    scrapItemId: uuid('scrap_item_id'), // no FK — scrap module pending
    conditionGrade: text('condition_grade'), // grade_A | grade_B | grade_C | null
    workingParts: jsonb('working_parts'), // string[] | null
    price: numeric('price', { precision: 12, scale: 2 }).notNull().default('0'),
    deliveryMethods: jsonb('delivery_methods').notNull().default('[]'),
    status: text('status').notNull().default('draft'), // D59 enum (CHECK in DB)
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_used_listings_meta').on(t.listingMetaId),
    index('idx_used_listings_seller').on(t.sellerId),
    index('idx_used_listings_type_status').on(t.listingType, t.status),
  ],
)

export type UsedApplianceListing = typeof usedApplianceListings.$inferSelect
export type NewUsedApplianceListing = typeof usedApplianceListings.$inferInsert
