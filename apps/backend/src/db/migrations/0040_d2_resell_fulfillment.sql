-- Migration: 0040_d2_resell_fulfillment
-- D2 Resell Slice · Wave 1 (Advisor ruling G3 · APPROVE shape)
-- ⚠️ DRAFT — ยังไม่ apply DEV (ruling: "migration 0040+ → ส่ง Advisor review ก่อน apply")
--
-- resell_fulfillment = ส่ง/ตรวจรับ ต่อ 1 transaction (anchor listing_meta · 1:1 · additive)
--   flow step 6-8: in_progress (ship) → delivered → inspection_period
--   evidence = file_uploads ref[] (jsonb) · inspection_deadline → R7 auto-complete job (Gen 86)
--   additive: ไม่แตะ listing_meta / used_appliance_listings เดิม · ตารางใหม่ล้วน
--
-- Rollback:
--   DROP TABLE IF EXISTS "resell_fulfillment";
--
-- Prereq: 0027 (listing_meta) · Branch: feature/d2-resell-slice

CREATE TABLE IF NOT EXISTS "resell_fulfillment" (
  "id"                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "listing_id"          uuid        NOT NULL REFERENCES "listing_meta"("listing_id") ON DELETE CASCADE,
  "delivery_method"     varchar(20),
  "carrier"             varchar(50),
  "tracking_no"         varchar(100),
  "ship_at"             timestamptz,
  "deliver_at"          timestamptz,
  "inspection_deadline" timestamptz,
  "ship_evidence"       jsonb,
  "receipt_evidence"    jsonb,
  "created_at"          timestamptz NOT NULL DEFAULT now(),
  "updated_at"          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "chk_resell_fulfillment_delivery"
    CHECK ("delivery_method" IS NULL OR "delivery_method" IN ('parcel', 'on_site'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_resell_fulfillment_listing"  ON "resell_fulfillment" ("listing_id");
CREATE INDEX        IF NOT EXISTS "idx_resell_fulfillment_deadline" ON "resell_fulfillment" ("inspection_deadline");

COMMENT ON TABLE "resell_fulfillment"
  IS 'D2 Resell G3: ship/deliver/inspection per transaction (anchor listing_meta 1:1). evidence=file_uploads ref[]. inspection_deadline -> R7 auto-complete.';
