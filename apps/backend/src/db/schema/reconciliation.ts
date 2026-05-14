/**
 * reconciliation.ts — Sub-CMD-7 Wave 2: Reconciliation Worker schema
 *
 * reconciliation_runs — เก็บประวัติการ run Reconciliation Worker ทุกครั้ง
 *   (cron อัตโนมัติ + manual trigger โดย admin)
 *
 * R3 Mitigation: ใช้ status='running' เป็น idempotency lock
 *   → ป้องกัน double-reconcile ถ้า cron ซ้อนกัน
 *
 * Security Rule #5: resolve action ทุกตัว → บันทึกใน settlement_audit_log
 *
 * Migration: 0007_reconciliation.sql
 * ⚠️ R2: run migration หลัง HUB approve เท่านั้น
 */
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './users'

// ── reconciliation_runs table ──────────────────────────────────────────────────
export const reconciliationRuns = pgTable(
  'reconciliation_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // null = cron job อัตโนมัติ | UUID = admin ที่กด manual trigger
    triggeredBy: uuid('triggered_by').references(() => users.id, { onDelete: 'set null' }),

    // 'running' = กำลัง reconcile (idempotency lock)
    // 'completed' = เสร็จสมบูรณ์
    // 'failed' = worker error (ไม่ใช่ settlement failed)
    status: text('status').notNull().default('running'),

    // สถิติจาก run นี้
    stuckCount: integer('stuck_count').notNull().default(0),    // settlement ค้างที่พบ
    resolvedCount: integer('resolved_count').notNull().default(0), // auto-resolved สำเร็จ
    failedCount: integer('failed_count').notNull().default(0),  // resolve ไม่ได้

    // JSON: { resolvedIds, errors, summary } หรือ error message
    detail: text('detail'),

    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_recon_runs_status').on(table.status),
    index('idx_recon_runs_started').on(table.startedAt),
  ],
)

export type ReconciliationRun = typeof reconciliationRuns.$inferSelect
export type NewReconciliationRun = typeof reconciliationRuns.$inferInsert
