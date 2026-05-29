-- Migration: 0026_d84_admin_config
-- D84 W-Round-1 Wave 1: admin-tunable config + change audit (Bad Record Policy)
--
-- Standalone — NO FK to users (กัน B3 FK-conflict กับ Python DB)
--   updated_by / changed_by = TEXT admin identifier (ไม่ FK → users)
--
-- New tables (2):
--   1. admin_config       — key/value JSON config (generic, namespaced)
--   2. admin_config_audit — change history (old/new value + changed_by)
--
-- Seed (separate): key='bad_record_policy' — ≥3/30d suspend 7d · ≥5/30d 30d · ≥10 lifetime escalate
--
-- Rollback:
--   DROP TABLE IF EXISTS "admin_config_audit" CASCADE;
--   DROP TABLE IF EXISTS "admin_config" CASCADE;
--
-- Decision: D84 · Branch: feature/backend-wr1-d87-d84 · 2026-05-29

-- ── 1. admin_config ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "admin_config" (
  "key"         TEXT PRIMARY KEY,
  "value"       JSONB NOT NULL,
  "description" TEXT,
  "updated_by"  TEXT,
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. admin_config_audit ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "admin_config_audit" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "config_key" TEXT NOT NULL,
  "old_value"  JSONB,
  "new_value"  JSONB NOT NULL,
  "changed_by" TEXT,
  "changed_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_admin_config_audit_key" ON "admin_config_audit" ("config_key");
