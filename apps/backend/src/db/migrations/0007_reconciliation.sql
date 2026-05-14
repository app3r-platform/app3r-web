-- Migration: 0007_reconciliation.sql
-- Sub-CMD-7 Wave 2: Reconciliation Worker
-- ⚠️ R2: run หลัง HUB approve เท่านั้น — ห้าม apply ตรง production โดยไม่ผ่าน HUB
--
-- New table: reconciliation_runs
--   เก็บประวัติการ run Reconciliation Worker (cron + manual)
--   R3 Mitigation: status='running' = idempotency lock ป้องกัน double-reconcile
--
-- Depends on: 0006_settlement.sql (users table must exist)
-- Rollback:   DROP TABLE IF EXISTS reconciliation_runs;

-- ── Forward ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "reconciliation_runs" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- null = cron job | UUID = admin ที่กด manual trigger
  "triggered_by"   UUID REFERENCES "users" ("id") ON DELETE SET NULL,

  -- running = กำลัง reconcile (idempotency lock)
  -- completed = เสร็จ | failed = worker error
  "status"         TEXT NOT NULL DEFAULT 'running',

  -- สถิติจาก run
  "stuck_count"    INTEGER NOT NULL DEFAULT 0,
  "resolved_count" INTEGER NOT NULL DEFAULT 0,
  "failed_count"   INTEGER NOT NULL DEFAULT 0,

  -- JSON: { resolvedIds: [], errors: [], summary: "..." }
  "detail"         TEXT,

  "started_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completed_at"   TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_recon_runs_status"
  ON "reconciliation_runs" ("status");

CREATE INDEX IF NOT EXISTS "idx_recon_runs_started"
  ON "reconciliation_runs" ("started_at" DESC);

-- ── Rollback ───────────────────────────────────────────────────────────────────
-- To rollback this migration:
--
-- DROP INDEX IF EXISTS "idx_recon_runs_started";
-- DROP INDEX IF EXISTS "idx_recon_runs_status";
-- DROP TABLE IF EXISTS "reconciliation_runs";
--
-- Note: does NOT affect settlements or settlement_audit_log tables
