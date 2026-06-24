-- Migration: 0041_d2_resell_disputes
-- D2 Resell Slice · Wave 1 (Advisor ruling G3 · APPROVE shape)
-- ⚠️ DRAFT — ยังไม่ apply DEV (ruling: "migration 0040+ → ส่ง Advisor review ก่อน apply")
--
-- resell_disputes = ข้อพิพาท ต่อ transaction (anchor listing_meta · additive · R6/R8/R10/R11)
--   3-way resolution (Admin): buyer (คืน buyer) | seller (จ่าย seller) | split (แบ่ง)
--   raised_by → ผู้เปิด · resolved_by → admin (nullable จน resolve) · evidence = file_uploads ref[]
--   listing_meta.state='disputed' = overlay · ตารางนี้เก็บ detail/evidence/resolution · ตารางใหม่ล้วน
--
-- Rollback:
--   DROP TABLE IF EXISTS "resell_disputes";
--
-- Prereq: 0001 (users) · 0027 (listing_meta) · Branch: feature/d2-resell-slice

CREATE TABLE IF NOT EXISTS "resell_disputes" (
  "id"                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "listing_id"          uuid        NOT NULL REFERENCES "listing_meta"("listing_id") ON DELETE CASCADE,
  "raised_by_user_id"   uuid        NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "dispute_type"        varchar(30) NOT NULL,
  "reason"              text        NOT NULL,
  "evidence"            jsonb,
  "status"              varchar(20) NOT NULL DEFAULT 'open',
  "resolution"          varchar(20),
  "resolution_note"     text,
  "resolved_by_user_id" uuid        REFERENCES "users"("id") ON DELETE SET NULL,
  "resolved_at"         timestamptz,
  "created_at"          timestamptz NOT NULL DEFAULT now(),
  "updated_at"          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "chk_resell_disputes_type"       CHECK ("dispute_type" IN ('not_as_described', 'damaged', 'not_shipped', 'parcel_damage', 'other')),
  CONSTRAINT "chk_resell_disputes_status"     CHECK ("status" IN ('open', 'under_review', 'resolved', 'rejected')),
  CONSTRAINT "chk_resell_disputes_resolution" CHECK ("resolution" IS NULL OR "resolution" IN ('buyer', 'seller', 'split'))
);

CREATE INDEX IF NOT EXISTS "idx_resell_disputes_listing"   ON "resell_disputes" ("listing_id");
CREATE INDEX IF NOT EXISTS "idx_resell_disputes_status"    ON "resell_disputes" ("status");
CREATE INDEX IF NOT EXISTS "idx_resell_disputes_raised_by" ON "resell_disputes" ("raised_by_user_id");

COMMENT ON TABLE "resell_disputes"
  IS 'D2 Resell G3: dispute per transaction (anchor listing_meta). 3-way resolution buyer|seller|split. R6/R8/R10/R11.';
