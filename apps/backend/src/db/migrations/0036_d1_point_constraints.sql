-- Migration: 0036_d1_point_constraints
-- DB-phase D1 (Gen 122 · B-D2/B-D3 · Point CONVERGE LOCKED)
--
-- Add DB-level CHECK guards (previously free-form varchar · no CHECK):
--   wallets.point_type      IN ('cash','bonus')   — Gold='cash' · Silver='bonus' (no other type · Point LOCKED)
--   point_ledger.point_type IN ('cash','bonus')
--   point_ledger.type       IN (7-set)            — earn|spend|adjust|expire|refund|transfer_in|transfer_out (Point frozen)
-- DEV existing rows: point_type=cash · type in {spend,refund} → within allowed sets (ADD CONSTRAINT passes).
-- Idempotent: DROP CONSTRAINT IF EXISTS then ADD (PG has no ADD CONSTRAINT IF NOT EXISTS for CHECK).
--
-- Rollback:
--   ALTER TABLE "wallets" DROP CONSTRAINT IF EXISTS "chk_wallets_point_type";
--   ALTER TABLE "point_ledger" DROP CONSTRAINT IF EXISTS "chk_point_ledger_point_type";
--   ALTER TABLE "point_ledger" DROP CONSTRAINT IF EXISTS "chk_point_ledger_type";
--
-- Prereq: 0001 (wallets/point_ledger) · Branch: feature/db-d1-core-schema

ALTER TABLE "wallets" DROP CONSTRAINT IF EXISTS "chk_wallets_point_type";
ALTER TABLE "wallets"
  ADD CONSTRAINT "chk_wallets_point_type" CHECK ("point_type" IN ('cash','bonus'));

ALTER TABLE "point_ledger" DROP CONSTRAINT IF EXISTS "chk_point_ledger_point_type";
ALTER TABLE "point_ledger"
  ADD CONSTRAINT "chk_point_ledger_point_type" CHECK ("point_type" IN ('cash','bonus'));

ALTER TABLE "point_ledger" DROP CONSTRAINT IF EXISTS "chk_point_ledger_type";
ALTER TABLE "point_ledger"
  ADD CONSTRAINT "chk_point_ledger_type"
  CHECK ("type" IN ('earn','spend','adjust','expire','refund','transfer_in','transfer_out'));
