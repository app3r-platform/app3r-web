-- Migration: 0043_d2_offer_funding_window
-- D2 Resell Slice · Wave 2 (Advisor ruling 1A · funding window)
-- ⚠️ DRAFT — ยังไม่ apply DEV (sub-gate เดิม: migration → ส่ง Advisor review ก่อน apply)
--
-- offers: selected_at + funding_deadline (1A 24h funding window · R4 auto-revert).
--   seller เลือก → selected_at=now · funding_deadline=now+24h · เงินล็อก@buyer_confirmed.
--   R4 timeout job query: status='selected' AND funding_deadline < now AND listing.state='offer_selected'.
-- offers อาจมี row ใน DEV → ADD COLUMN nullable ปลอดภัย · idempotent (IF NOT EXISTS).
--
-- Rollback:
--   DROP INDEX IF EXISTS "idx_offers_funding_deadline";
--   ALTER TABLE "offers" DROP COLUMN IF EXISTS "funding_deadline";
--   ALTER TABLE "offers" DROP COLUMN IF EXISTS "selected_at";
--
-- Prereq: 0030 (offers) · Branch: feature/d2-resell-slice

ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "selected_at"      timestamptz;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "funding_deadline" timestamptz;

CREATE INDEX IF NOT EXISTS "idx_offers_funding_deadline" ON "offers" ("funding_deadline");
