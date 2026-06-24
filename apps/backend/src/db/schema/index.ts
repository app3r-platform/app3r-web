/**
 * schema/index.ts - export table schemas
 *
 * Phase D-1: users + refresh_tokens
 * Phase D-1 NOTE-2: wallets + point_ledger + point_rounding_log
 *   (Point chat input resolved 2026-05-12)
 *
 * Phase D-2: 13 new tables (mandatory migration order):
 *   services → file_uploads → notifications → push_subscriptions →
 *   payment_intents → webhook_events → locations → service_locations →
 *   distance_cache → email_log → email_preferences →
 *   parts_inventory → parts_orders
 *
 * Total: 5 (D-1) + 13 (D-2) = 18 tables
 */

// Phase D-1 base
export * from './users'
export * from './refresh-tokens'

// Phase D-1 NOTE-2: point system
export * from './wallets'
export * from './point-ledger'
export * from './point-rounding-log'

// Phase D-2: services stub (D90 NOTE-D90-1)
export * from './services'

// Phase D-2: D87 File Upload
export * from './file-uploads'

// Phase D-2: D88 Real-time / Push
export * from './notifications'
export * from './push-subscriptions'

// Phase D-2: D89 Payment
export * from './payment-intents'
export * from './webhook-events'

// Phase D-2: D90 Location
export * from './locations'
export * from './service-locations'
export * from './distance-cache'

// Phase D-2: D91 Email
export * from './email-log'
export * from './email-preferences'

// Phase D-2: NOTE-SUB4 Parts
export * from './parts-inventory'
export * from './parts-orders'

// B5-Backend: Inventory Stock Movements (audit trail)
// Migration: 0020_b5_inventory_extend.sql
export * from './inventory-stock-movements'

// Sub-CMD-2: Manual Bank Transfer Module (อ.PP decision 2026-05-14)
export * from './bank-transfers'

// Sub-CMD-5: Service Progress Tracker (D79 Wave 2)
export * from './service-progress'

// Sub-CMD-6: Settlement API + Audit Log (D-2 Debt #3 Wave 2)
export * from './settlements'

// Sub-CMD-7: Reconciliation Worker (Wave 2)
export * from './reconciliation'

// Sub-CMD-8: Parts B2B Marketplace (Wave 3)
export * from './parts-b2b'

// Phase D-4 Sub-3: Platform Content CMS
export * from './content'

// Phase D-4 Sub-4: Contact Info + Form (D78)
export * from './contact'

// Phase D-4 Sub-2: Testimonials API
export * from './testimonials'

// Repair Domain — Gen 60 Reverse Design (Round 1-3)
// Migration order: 0012 → 0013 → 0014 (→ 0015 trigger)
export * from './repair-master-data'   // Round 1: D82 Master Data (9 domain + 1 audit)
export * from './repair-workflow'      // Round 2: Workflow B3/B3.5/B2.5 (8 tables)
export * from './repair-pricing'       // Round 3: B6 Used Pricing Wizard (8 tables)

// Phase D-5: D92 Appliance Master Reference + D89 asset_images canonical
// Migration: 0016_appliance_master_d92.sql
export * from './appliance-master'    // appliance_brands + appliance_models + asset_images

// Phase D-5: D88 Repair Part Catalog + Symptom↔Part Links
// Migration: 0018_repair_part_catalog.sql
export * from './repair-part-catalog' // repair_part_catalog + repair_symptom_part_links

// D-6: Parts B2B — 6 new tables + is_multi_item column on parts_orders
// Migration: 0021_d6_parts_b2b.sql
export * from './parts-listings'      // parts_listings (public catalog)
export * from './parts-cart'          // parts_cart_items (expire 24h)
export * from './parts-order-items'   // parts_order_items (multi-item additive)
export * from './parts-requests'      // parts_requests + parts_request_quotes (cross-shop)
export * from './parts-returns'       // parts_returns (defective return)

// W-Round-1 Wave 1: D87 Thai location master reference (L1 Static, standalone — no user FK)
// Migration: 0025_d87_location_master.sql
export * from './location-master'     // provinces + amphoes + tambons

// W-Round-1 Wave 1: D84 admin-tunable config + change audit (standalone — no user FK)
// Migration: 0026_d84_admin_config.sql
export * from './admin-config'        // admin_config + admin_config_audit

// W-Round-1 Wave 1.2: B2 universal listing_meta + GR-8 listing_views
// Migration: 0027_listing_meta.sql · domain FK: 0028_domain_listing_meta_fk.sql
export * from './listing-meta'        // listing_meta + listing_views

// W-Round-1 Wave 1.2 [5]: downstream (FK → listing_meta.listing_id)
// Migration: 0029_downstream_listing.sql
export * from './listing-engagement'  // D86 reviews+replies · GR-5 questions+replies
export * from './moderation'          // D82 moderation_queue + moderation_audit_log
export * from './ads'                 // C12 ads (Gold Point D75)

// W-Round-1 Wave 2.x Part1 (Ruling 1A): D59 resell domain + D61 offers
// Migration: 0030_offers_resell.sql
export * from './used-appliance-listings' // D59 used_appliance_listings (resell/scrap)
export * from './offers'                  // D61 offers

// DB-phase D1 (Gen 122): auth/profile core — reconciled from feature/backend-d1-auth-points
// (tables already applied to DEV via HOLD; reuse canonical .ts so app code can type-reference)
// Migration: 0032_d1_profiles.sql + 0033_d1_otp_codes.sql
export * from './user-profiles'  // GET/PUT /users/me profile (1:1 users)
export * from './shop-profiles'  // GET/PUT /shops/me (WeeeR only) — closes GAP-1 shopName
export * from './otp-codes'      // POST /auth/otp-request + /auth/otp-verify

// DB-phase D1 finalize (Gen 122): escrow full-lock + post-transaction profile reviews
// Migration: 0034_d1_escrow_holds.sql + 0035_d1_profile_reviews.sql
export * from './escrow-holds'    // R1c single-source full-lock escrow (all domains)
export * from './profile-reviews' // R3/R4 post-transaction profile review (anchor=listing_meta)

// D2 Resell Slice — Wave 1 (Advisor ruling G3 · DRAFT migration 0040/0041 — ❌ ยังไม่ apply · Advisor review ก่อน)
export * from './resell-fulfillment' // G3: ship/deliver/inspection per transaction (anchor listing_meta 1:1)
export * from './resell-disputes'    // G3: dispute (3-way resolution) per transaction (R6/R8/R10/R11)
