-- Migration: 0038_d1_shop_approval_status
-- DB-phase D1 (Gen 122 · R5)
--
-- shop_profiles.approval_status — WeeeR Admin-approval state (canon: WeeeR ต้องอนุมัติก่อนใช้งาน).
-- D1 = COLUMN ONLY · approval workflow + Admin UI defer → Admin slice (D2+).
-- shop_profiles empty in DEV (0 rows) · default 'pending' safe.
-- Idempotent: ADD COLUMN IF NOT EXISTS + DROP/ADD CONSTRAINT.
--
-- Rollback:
--   ALTER TABLE "shop_profiles" DROP CONSTRAINT IF EXISTS "chk_shop_profiles_approval_status";
--   ALTER TABLE "shop_profiles" DROP COLUMN IF EXISTS "approval_status";
--
-- Prereq: 0032 (shop_profiles) · Branch: feature/db-d1-core-schema

ALTER TABLE "shop_profiles"
  ADD COLUMN IF NOT EXISTS "approval_status" varchar(20) NOT NULL DEFAULT 'pending';

ALTER TABLE "shop_profiles" DROP CONSTRAINT IF EXISTS "chk_shop_profiles_approval_status";
ALTER TABLE "shop_profiles"
  ADD CONSTRAINT "chk_shop_profiles_approval_status"
  CHECK ("approval_status" IN ('pending','approved','rejected','suspended'));
