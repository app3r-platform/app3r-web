-- Migration: 0042_d2_settlements_polymorphic
-- D2 Resell Slice · Wave 1 (Advisor ruling G4)
-- ⚠️ DRAFT — ยังไม่ apply DEV (ruling: "migration 0040+ → ส่ง Advisor review ก่อน apply")
--
-- settlements รองรับ Resell: service_id → nullable + source enum (service|resell)
--   + transaction_ref (resell → listing_meta · polymorphic แบบเดียวกับ escrow_holds.transaction_ref)
--   point-layer≠THB · U↔U ไม่ over-engineer (U↔U จบใน Gold wallet · settlement = WeeeR→THB เท่านั้น)
-- settlements empty in DEV (0 rows) → ALTER ปลอดภัย · idempotent (DROP NOT NULL + ADD IF NOT EXISTS + guard)
--
-- ⚠️ NOTE Advisor: G4 literal = "service_id nullable + source enum". `transaction_ref` + chk_settlements_ref
--   = ส่วนเพิ่ม (resell linkage ขั้นต่ำ) → ขอ Advisor confirm/ตัดออกได้ใน review (additive · nullable)
--
-- Rollback:
--   ALTER TABLE "settlements" DROP CONSTRAINT IF EXISTS "chk_settlements_ref";
--   ALTER TABLE "settlements" DROP CONSTRAINT IF EXISTS "chk_settlements_source";
--   DROP INDEX IF EXISTS "idx_settlements_transaction_ref";
--   ALTER TABLE "settlements" DROP COLUMN IF EXISTS "transaction_ref";
--   ALTER TABLE "settlements" DROP COLUMN IF EXISTS "source";
--   ALTER TABLE "settlements" ALTER COLUMN "service_id" SET NOT NULL;
--
-- Prereq: 0006 (settlements) · 0027 (listing_meta) · Branch: feature/d2-resell-slice

ALTER TABLE "settlements" ALTER COLUMN "service_id" DROP NOT NULL;
ALTER TABLE "settlements" ADD COLUMN IF NOT EXISTS "source"          text NOT NULL DEFAULT 'service';
ALTER TABLE "settlements" ADD COLUMN IF NOT EXISTS "transaction_ref" uuid;

CREATE INDEX IF NOT EXISTS "idx_settlements_transaction_ref" ON "settlements" ("transaction_ref");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_settlements_source') THEN
    ALTER TABLE "settlements"
      ADD CONSTRAINT "chk_settlements_source" CHECK ("source" IN ('service', 'resell'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_settlements_ref') THEN
    ALTER TABLE "settlements"
      ADD CONSTRAINT "chk_settlements_ref"
        CHECK ( ("source" = 'service' AND "service_id"      IS NOT NULL)
             OR ("source" = 'resell'  AND "transaction_ref" IS NOT NULL) );
  END IF;
END $$;
