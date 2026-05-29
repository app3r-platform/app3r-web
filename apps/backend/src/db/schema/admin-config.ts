/**
 * admin-config.ts — D84 W-Round-1 Wave 1: admin-tunable config + change audit
 *
 * ★ Standalone — NO FK to users (กัน B3 FK-conflict กับ Python DB)
 *   changed_by/updated_by เก็บเป็น TEXT (admin identifier) ไม่ FK → users
 *
 * D84 Bad Record Policy (admin-tunable threshold/window/cool-down):
 *   key='bad_record_policy' value=JSON {
 *     tiers: [{ count, windowDays, action, durationDays }],
 *     lifetimeEscalateAt
 *   }
 *   Default: ≥3/30d → suspend 7d · ≥5/30d → suspend 30d · ≥10 lifetime → escalate
 *
 * admin_config       — key/value JSON config (generic, namespaced)
 * admin_config_audit — every change logged (old/new value + changed_by + when)
 *
 * Decision: D84 (W-Round-1 Wave 1)
 */
import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'

// ── admin_config (key/value config store) ─────────────────────────────────────
export const adminConfig = pgTable('admin_config', {
  key: text('key').primaryKey(), // e.g. 'bad_record_policy'
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedBy: text('updated_by'), // admin identifier (no FK — B3-safe)
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ── admin_config_audit (change history) ───────────────────────────────────────
export const adminConfigAudit = pgTable(
  'admin_config_audit',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    configKey: text('config_key').notNull(),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value').notNull(),
    changedBy: text('changed_by'), // admin identifier (no FK — B3-safe)
    changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_admin_config_audit_key').on(t.configKey)],
)

export type AdminConfig = typeof adminConfig.$inferSelect
export type NewAdminConfig = typeof adminConfig.$inferInsert
export type AdminConfigAudit = typeof adminConfigAudit.$inferSelect
export type NewAdminConfigAudit = typeof adminConfigAudit.$inferInsert
