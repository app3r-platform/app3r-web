-- Migration: 0018_used_pricing_notes
-- TD-W3-02: Fix seed/schema mismatch (pre-existing on main)
--
-- Root cause:
--   Seeds 0019_seed_pricing.sql (D88) + 0024_d5_seed_pricing.sql (D5) INSERT into
--   "used_pricing_models" with a "notes" column in their column list, but neither
--   migration 0014_repair_pricing.sql (CREATE TABLE) nor the Drizzle schema
--   (src/db/schema/repair-pricing.ts) ever defined that column.
--   → `db:migrate:all` fails on a fresh DB at 0019 ("column notes does not exist").
--   The generators (generate-seed-sql.ts L435 / generate-d5-seed.ts L500) emit
--   "notes" but the value is always NULL across all ~591 seed rows.
--
-- Fix (additive · Eng-2): add a nullable "notes" column so migration + schema + seed
--   are consistent. This file is intentionally named to sort AFTER 0018_seed_repair_master.sql
--   and BEFORE 0019_seed_pricing.sql (lexicographic: 'u' > 's'), so the column exists
--   before any seed references it. Idempotent (IF NOT EXISTS) → safe on partially-migrated DBs.
--   Drizzle schema synced: usedPricingModels.notes (text, nullable).

ALTER TABLE "used_pricing_models" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- ── Rollback (manual) ─────────────────────────────────────────────────────────
-- ALTER TABLE "used_pricing_models" DROP COLUMN IF EXISTS "notes";
