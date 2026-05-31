-- Migration: 0031_ads_cancel
-- C12 Ad System — cancel-refund support
--
-- Changes:
--   1. Widen ads.status CHECK → add 'cancelled' state
--   2. ADD cancelled_at TIMESTAMPTZ (audit trail เมื่อ user/admin ยกเลิก)
--
-- Rollback:
--   ALTER TABLE "ads" DROP CONSTRAINT IF EXISTS "ads_status_check";
--   ALTER TABLE "ads" ADD CONSTRAINT "ads_status_check"
--     CHECK ("status" IN ('pending','approved','active','rejected','expired'));
--   ALTER TABLE "ads" DROP COLUMN IF EXISTS "cancelled_at";
--
-- Prereq: 0029 (ads table) · Branch: feature/backend-c12-ads · 2026-05-30

-- ── 1. Widen status CHECK (ต้อง DROP ก่อน เพราะ PostgreSQL ไม่ให้ ALTER inline) ───
ALTER TABLE "ads" DROP CONSTRAINT IF EXISTS "ads_status_check";
ALTER TABLE "ads"
  ADD CONSTRAINT "ads_status_check"
  CHECK ("status" IN ('pending','approved','active','rejected','expired','cancelled'));

-- ── 2. Add cancelled_at column ────────────────────────────────────────────────────
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMPTZ;
