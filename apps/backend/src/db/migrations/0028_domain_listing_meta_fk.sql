-- Migration: 0028_domain_listing_meta_fk
-- W-Round-1 Wave 1.2: B2 — domain tables เพิ่ม listing_meta_id FK (integrity 2 ทาง)
--
-- Additive only (ไม่ refactor ทำลาย — Eng-2):
--   - services       (repair/maintain/resell/scrap) ADD listing_meta_id
--   - parts_listings  (parts)                        ADD listing_meta_id
--   nullable FK → listing_meta(listing_id) ON DELETE SET NULL
--
-- Backfill: fresh app3r_dev = ไม่มี row เดิม → no-op (idempotent UPDATE เผื่อ env อื่น)
--
-- Rollback:
--   ALTER TABLE "parts_listings" DROP COLUMN IF EXISTS "listing_meta_id";
--   ALTER TABLE "services"       DROP COLUMN IF EXISTS "listing_meta_id";
--
-- Prereq: 0027 (listing_meta) · Branch: feature/backend-wr1-d87-d84 · 2026-05-29

ALTER TABLE "services"
  ADD COLUMN IF NOT EXISTS "listing_meta_id" UUID
  REFERENCES "listing_meta"("listing_id") ON DELETE SET NULL;

ALTER TABLE "parts_listings"
  ADD COLUMN IF NOT EXISTS "listing_meta_id" UUID
  REFERENCES "listing_meta"("listing_id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_services_listing_meta" ON "services" ("listing_meta_id");
CREATE INDEX IF NOT EXISTS "idx_parts_listings_listing_meta" ON "parts_listings" ("listing_meta_id");

-- Backfill no-op (fresh DB). On envs with legacy rows, link by owner+type would go here.
-- (intentionally empty — no legacy rows in app3r_dev)
