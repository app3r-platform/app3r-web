/**
 * resell-fulfillment.ts — D2 Resell Slice · Wave 1 (Advisor ruling G3 · APPROVE shape)
 * Migration: 0040_d2_resell_fulfillment.sql  ⚠️ DRAFT — ยังไม่ apply (Advisor review ก่อน · ruling G3)
 *
 * resell_fulfillment = ข้อมูลส่ง/ตรวจรับ ต่อ 1 transaction (anchor listing_meta · 1:1 · additive)
 *   ครอบ flow step 6-8: ส่ง (in_progress) → ถึง (delivered) → ตรวจรับ (inspection_period)
 *   - evidence = file_uploads ref[] (jsonb) บังคับ: seller pre-ship (R6) + buyer on-receipt (R8)
 *   - inspection_deadline → R7 auto-complete job (Backend deadline · ไม่มี screen · Advisor Gen 86)
 *   - additive: ไม่แตะ listing_meta / used_appliance_listings เดิม
 */
import { pgTable, uuid, varchar, jsonb, timestamp, index, uniqueIndex, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { listingMeta } from './listing-meta'

export const FULFILLMENT_DELIVERY_METHODS = ['parcel', 'on_site'] as const
export type FulfillmentDeliveryMethod = (typeof FULFILLMENT_DELIVERY_METHODS)[number]

export const resellFulfillment = pgTable(
  'resell_fulfillment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // anchor → listing_meta universal id (1:1 ต่อ transaction)
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listingMeta.listingId, { onDelete: 'cascade' }),
    deliveryMethod: varchar('delivery_method', { length: 20 }), // parcel | on_site (CHECK in DB)
    carrier: varchar('carrier', { length: 50 }), // ผู้ขนส่ง (parcel) | null (on_site)
    trackingNo: varchar('tracking_no', { length: 100 }), // เลขพัสดุ (parcel)
    shipAt: timestamp('ship_at', { withTimezone: true }), // seller ส่ง → delivered
    deliverAt: timestamp('deliver_at', { withTimezone: true }), // ถึง buyer
    inspectionDeadline: timestamp('inspection_deadline', { withTimezone: true }), // R7 auto-complete
    shipEvidence: jsonb('ship_evidence'), // file_uploads ref[] — seller pre-ship (R6)
    receiptEvidence: jsonb('receipt_evidence'), // file_uploads ref[] — buyer on-receipt (R8)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('uq_resell_fulfillment_listing').on(t.listingId),
    index('idx_resell_fulfillment_deadline').on(t.inspectionDeadline),
    check(
      'chk_resell_fulfillment_delivery',
      sql`${t.deliveryMethod} IS NULL OR ${t.deliveryMethod} IN ('parcel', 'on_site')`,
    ),
  ],
)

export type ResellFulfillment = typeof resellFulfillment.$inferSelect
export type NewResellFulfillment = typeof resellFulfillment.$inferInsert
