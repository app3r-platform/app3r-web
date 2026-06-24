/**
 * settlements.ts — Sub-CMD-6 Wave 2: Settlement API (D-2 Debt #3)
 *
 * Flow: service เสร็จ → WeeeR ขอถอน → admin สร้าง settlement
 *       → bank adapter โอนเงิน → audit log ทุก step
 *
 * R1 Mitigation: bank_adapter field รอ swap เมื่อ contract จริงมา
 *   'mock' → สำหรับ dev/test | 'scb' | 'kbank' → future swap
 *
 * Security Rule #5: ทุก settlement action บันทึกใน settlement_audit_log
 *
 * Migration: 0006_settlement.sql
 *   + 0042_d2_settlements_polymorphic.sql (D2 G4 · DRAFT): service_id nullable + source enum + transaction_ref
 * ⚠️ R2: run migration หลัง HUB approve เท่านั้น
 */
import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { services } from './services'
import { users } from './users'

// ── settlements table ─────────────────────────────────────────────────────────
export const settlements = pgTable(
  'settlements',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // service ที่ settlement นี้เกี่ยวข้อง
    // G4 (D2): nullable — resell settlement ไม่มี services row (source='resell' ใช้ transactionRef→listing_meta)
    serviceId: uuid('service_id').references(() => services.id, { onDelete: 'cascade' }),

    // G4 (D2): discriminator — 'service' (FK service_id) | 'resell' (transactionRef→listing_meta) · CHECK in DB
    source: text('source').notNull().default('service'),

    // G4 (D2): resell linkage (polymorphic · ref listing_meta · no hard FK เหมือน escrow_holds.transaction_ref)
    //   point-layer≠THB · U↔U ไม่ over-engineer (U↔U จบใน Gold wallet · ไม่มี settlement row)
    transactionRef: uuid('transaction_ref'),

    // ผู้รับเงิน (generic · source = escrow_holds.recipient_user_id · Gen 122 R1c/C-2)
    // generalized from weeer_user_id → รองรับ Scrap reverse (recipient = WeeeU)
    recipientUserId: uuid('recipient_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    // จำนวนเงินที่โอน (THB)
    amountThb: numeric('amount_thb', { precision: 12, scale: 2 }).notNull(),

    // สถานะ settlement
    // 'pending' | 'processing' | 'completed' | 'failed'
    status: text('status').notNull().default('pending'),

    // Bank adapter ที่ใช้ (R1: swap-ready)
    // 'mock' = dev/test | 'scb' | 'kbank' = future
    bankAdapter: text('bank_adapter').notNull().default('mock'),

    // Reference จากธนาคาร (ได้หลัง initiateTransfer สำเร็จ)
    bankRef: text('bank_ref'),

    // JSON response จากธนาคาร (audit trail)
    bankResponse: text('bank_response'),

    // admin/system ที่สร้าง settlement นี้
    initiatedBy: uuid('initiated_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_settlements_recipient').on(table.recipientUserId, table.createdAt),
    index('idx_settlements_service').on(table.serviceId),
    index('idx_settlements_status').on(table.status),
    index('idx_settlements_transaction_ref').on(table.transactionRef),
    // G4 (D2): source enum + discriminator (service→service_id | resell→transaction_ref)
    check('chk_settlements_source', sql`${table.source} IN ('service', 'resell')`),
    check(
      'chk_settlements_ref',
      sql`(${table.source} = 'service' AND ${table.serviceId} IS NOT NULL) OR (${table.source} = 'resell' AND ${table.transactionRef} IS NOT NULL)`,
    ),
  ],
)

// ── settlement_audit_log table (Security Rule #5) ─────────────────────────────
export const settlementAuditLog = pgTable(
  'settlement_audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // FK → settlements (cascade — ลบ settlement = ลบ log ด้วย)
    settlementId: uuid('settlement_id')
      .notNull()
      .references(() => settlements.id, { onDelete: 'cascade' }),

    // 'created' | 'status_changed' | 'bank_response' | 'error'
    action: text('action').notNull(),

    // null = system action (no human actor)
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),

    // สถานะก่อน/หลัง (สำหรับ status_changed)
    oldStatus: text('old_status'),
    newStatus: text('new_status'),

    // JSON metadata (bank response, error detail, etc.)
    detail: text('detail'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_audit_log_settlement').on(table.settlementId, table.createdAt),
  ],
)

export type Settlement = typeof settlements.$inferSelect
export type NewSettlement = typeof settlements.$inferInsert
export type SettlementAuditLog = typeof settlementAuditLog.$inferSelect
export type NewSettlementAuditLog = typeof settlementAuditLog.$inferInsert
