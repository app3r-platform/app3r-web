-- Migration: 0030_offers_resell
-- W-Round-1 Wave 2.x Part1 (Advisor Gen 101 Structural Ruling 1A/1B) — additive
--
-- (1B) State enum = D59 canonical + `draft` (เติมหน้า) · snake_case lowercase
--      D83 (มุมกฎ lock/bad_record/escrow) = ชั้น overlay ใน lib/listing-state.ts (ไม่ใช่ enum แยก)
--      remap แถวเดิม (D83 → D59) ก่อน widen CHECK เพื่อไม่ให้ constraint ใหม่ชนข้อมูลเก่า
--        published → announced · has_offer → receiving_offers · matched → offer_selected
--        (draft/completed/cancelled คงเดิม)
-- (1A) ตารางใหม่ 2:
--      used_appliance_listings — D59 resell/scrap domain (FK → listing_meta · B6)
--      offers                  — D61 ข้อเสนอซื้อ (FK → listing_meta · buyer)
--
-- Additive only: ไม่แตะ schema เดิม (0025–0029) · ไม่ลบ column/ตาราง · idempotent
--
-- Rollback:
--   DROP TABLE IF EXISTS "offers" CASCADE;
--   DROP TABLE IF EXISTS "used_appliance_listings" CASCADE;
--   (state CHECK ไม่ rollback อัตโนมัติ — D59 superset ของ D83 ที่ remap แล้ว)
--
-- Prereq: 0027 (listing_meta) · Branch: feature/backend-wr1-wave2x · 2026-05-29

-- ── 1B. widen state CHECK (D83 → D59) ─────────────────────────────────────────────
-- ลำดับสำคัญ: DROP constraint เก่าก่อน → remap (ไม่งั้น UPDATE เป็น state ใหม่ชน CHECK เดิม) → ADD ใหม่
ALTER TABLE "listing_meta" DROP CONSTRAINT IF EXISTS "listing_meta_state_check";

UPDATE "listing_meta" SET "state" = 'announced'        WHERE "state" = 'published';
UPDATE "listing_meta" SET "state" = 'receiving_offers' WHERE "state" = 'has_offer';
UPDATE "listing_meta" SET "state" = 'offer_selected'   WHERE "state" = 'matched';

ALTER TABLE "listing_meta" ADD CONSTRAINT "listing_meta_state_check"
  CHECK ("state" IN (
    'draft','announced','receiving_offers','offer_selected','buyer_confirmed',
    'in_progress','delivered','inspection_period','completed','cancelled','disputed'
  ));

-- ── 1A(ก). used_appliance_listings (D59 resell/scrap domain) ──────────────────────
CREATE TABLE IF NOT EXISTS "used_appliance_listings" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- B6 single-source: ผูก listing_meta (1:1)
  "listing_meta_id"  UUID NOT NULL REFERENCES "listing_meta"("listing_id") ON DELETE CASCADE,
  "seller_id"        UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "seller_type"      TEXT NOT NULL CHECK ("seller_type" IN ('WeeeU','WeeeR')),
  "listing_type"     TEXT NOT NULL CHECK ("listing_type" IN ('used_appliance','scrap')),
  -- appliance_id / scrap_item_id: UUID ไม่ผูก FK — module ยังไม่พร้อม (pattern parts.source_scrap_id)
  "appliance_id"     UUID,
  "warranty"         JSONB,            -- { sourceWarranty, additionalWarranty }
  "scrap_item_id"    UUID,
  "condition_grade"  TEXT,             -- grade_A | grade_B | grade_C
  "working_parts"    JSONB,            -- string[]
  "price"            NUMERIC(12,2) NOT NULL DEFAULT 0,
  "delivery_methods" JSONB NOT NULL DEFAULT '[]',
  "status"           TEXT NOT NULL DEFAULT 'draft'
                     CHECK ("status" IN (
                       'draft','announced','receiving_offers','offer_selected','buyer_confirmed',
                       'in_progress','delivered','inspection_period','completed','cancelled','disputed'
                     )),
  "expires_at"       TIMESTAMPTZ,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_used_listings_meta"        ON "used_appliance_listings" ("listing_meta_id");
CREATE INDEX IF NOT EXISTS "idx_used_listings_seller"      ON "used_appliance_listings" ("seller_id");
CREATE INDEX IF NOT EXISTS "idx_used_listings_type_status" ON "used_appliance_listings" ("listing_type","status");

-- ── 1A(ข). offers (D61 ข้อเสนอซื้อ) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "offers" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "listing_meta_id" UUID NOT NULL REFERENCES "listing_meta"("listing_id") ON DELETE CASCADE,
  "buyer_id"        UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "buyer_type"      TEXT NOT NULL CHECK ("buyer_type" IN ('WeeeU','WeeeR')),
  "offer_price"     NUMERIC(12,2) NOT NULL,
  "delivery_method" TEXT NOT NULL,
  "message"         TEXT,
  "status"          TEXT NOT NULL DEFAULT 'pending'
                    CHECK ("status" IN ('pending','selected','rejected','withdrawn')),
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_offers_listing" ON "offers" ("listing_meta_id");
CREATE INDEX IF NOT EXISTS "idx_offers_buyer"   ON "offers" ("buyer_id");
CREATE INDEX IF NOT EXISTS "idx_offers_status"  ON "offers" ("status");

-- ── Ruling 2: parts_listings.category (additive nullable · ประเภทอะไหล่) ──────────
-- catalog = ราคาอ้างอิง THB (unit_price คงเดิม) · marketplace price=Gold Point แยกชั้น (D81)
-- category = ประเภทอะไหล่ (compressor/motor/pcb/…) — free text รอ confirm enum กับ reference data
ALTER TABLE "parts_listings" ADD COLUMN IF NOT EXISTS "category" TEXT;
CREATE INDEX IF NOT EXISTS "idx_parts_listings_category" ON "parts_listings" ("category");
