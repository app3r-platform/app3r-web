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

// Sub-CMD-2: Manual Bank Transfer Module (อ.PP decision 2026-05-14)
export * from './bank-transfers'

// Sub-CMD-5: Service Progress Tracker (D79 Wave 2)
export * from './service-progress'

// Sub-CMD-6: Settlement API + Audit Log (D-2 Debt #3 Wave 2)
export * from './settlements'
