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
 * ⚠️ R2: run migration หลัง HUB approve เท่านั้น
 */
import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { services } from './services'
import { users } from './users'

// ── settlements table ─────────────────────────────────────────────────────────
export const settlements = pgTable(
  'settlements',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // service ที่ settlement นี้เกี่ยวข้อง
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),

    // WeeeR ผู้รับเงิน
    weeerUserId: uuid('weeer_user_id')
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
    index('idx_settlements_weeer').on(table.weeerUserId, table.createdAt),
    index('idx_settlements_service').on(table.serviceId),
    index('idx_settlements_status').on(table.status),
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
