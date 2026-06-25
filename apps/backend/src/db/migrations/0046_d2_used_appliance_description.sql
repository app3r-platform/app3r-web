-- Migration: 0046_d2_used_appliance_description
-- D2 Resell (W4-pre precondition #3) · used_appliance_listings.description
--   user content (FE ส่ง description) เดิม BE drop = silent data-loss → ต้อง column (Advisor Gen123 GREENLIGHT)
-- ⚠️ DRAFT — ❌ Backend ไม่ apply เอง (HUB precheck + apply DEV · migration sub-gate)
--   precheck: ADD COLUMN IF NOT EXISTS = idempotent · nullable · ไม่กระทบ existing row
-- Rollback:
--   ALTER TABLE "used_appliance_listings" DROP COLUMN IF EXISTS "description";
-- Prereq: 0030 (used_appliance_listings) · Branch: feature/d2-resell-slice

ALTER TABLE "used_appliance_listings" ADD COLUMN IF NOT EXISTS "description" text;
