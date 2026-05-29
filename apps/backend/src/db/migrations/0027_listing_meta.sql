-- Migration: 0027_listing_meta
-- W-Round-1 Wave 1.2: B2 universal listing_meta + GR-8 listing_views
--
-- Decision B2 (Advisor Gen 101): listing_meta = universal listing id กลาง
--   state/counter/tambon logic อยู่ที่เดียว · downstream อ้าง listing_meta.listing_id
-- B3: app3r_dev :5433 — UUID FK จริง (owner_id → users) · tambon_id INTEGER → tambons (D87 รหัสไทย)
--
-- New tables (2):
--   1. listing_meta  — universal listing (D83 state + GR-8 counter + GR-9 tambon)
--   2. listing_views — GR-8 unique-view dedupe log (per user/IP per day → increment view_count)
--
-- Rollback:
--   DROP TABLE IF EXISTS "listing_views" CASCADE;
--   DROP TABLE IF EXISTS "listing_meta" CASCADE;
--
-- Migration order (B2): listing_meta ก่อน → domain FK (0028) → downstream (0029)
-- Branch: feature/backend-wr1-d87-d84 · 2026-05-29

-- ── 1. listing_meta ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "listing_meta" (
  "listing_id"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- listing_type: repair | maintain | resell | scrap | parts
  "listing_type"  TEXT NOT NULL
                  CHECK ("listing_type" IN ('repair','maintain','resell','scrap','parts')),
  -- id ในตาราง domain (nullable — resell/scrap ยังไม่มีตาราง domain เฉพาะ)
  "domain_ref_id" UUID,
  "owner_id"      UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  -- D83 state machine: draft → published → has_offer → matched → completed (+ cancelled)
  "state"         TEXT NOT NULL DEFAULT 'draft'
                  CHECK ("state" IN ('draft','published','has_offer','matched','completed','cancelled')),
  -- GR-8 counters
  "view_count"    INTEGER NOT NULL DEFAULT 0,
  "offer_count"   INTEGER NOT NULL DEFAULT 0,
  -- GR-9 location — tambon รหัสไทยทางการ (INTEGER, ไม่ใช่ UUID) → D87 tambons
  "tambon_id"     INTEGER REFERENCES "tambons"("id"),
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_listing_meta_owner" ON "listing_meta" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_listing_meta_type" ON "listing_meta" ("listing_type");
CREATE INDEX IF NOT EXISTS "idx_listing_meta_state" ON "listing_meta" ("state");
CREATE INDEX IF NOT EXISTS "idx_listing_meta_tambon" ON "listing_meta" ("tambon_id");
-- domain back-reference (1 listing_meta ↔ 1 domain row)
CREATE INDEX IF NOT EXISTS "idx_listing_meta_domain_ref" ON "listing_meta" ("listing_type","domain_ref_id");

-- ── 2. listing_views (GR-8 unique-view dedupe) ────────────────────────────────
CREATE TABLE IF NOT EXISTS "listing_views" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "listing_id"     UUID NOT NULL REFERENCES "listing_meta"("listing_id") ON DELETE CASCADE,
  -- ผู้ชม: ถ้า login = viewer_user_id, ถ้า anon = viewer_ip
  "viewer_user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "viewer_ip"      TEXT,
  "view_date"      DATE NOT NULL DEFAULT CURRENT_DATE,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_listing_views_listing" ON "listing_views" ("listing_id");
-- dedupe: 1 view ต่อ (listing, user, วัน) สำหรับ user ที่ login
CREATE UNIQUE INDEX IF NOT EXISTS "uq_listing_views_user_day"
  ON "listing_views" ("listing_id","viewer_user_id","view_date")
  WHERE "viewer_user_id" IS NOT NULL;
-- dedupe: 1 view ต่อ (listing, ip, วัน) สำหรับ anon
CREATE UNIQUE INDEX IF NOT EXISTS "uq_listing_views_ip_day"
  ON "listing_views" ("listing_id","viewer_ip","view_date")
  WHERE "viewer_user_id" IS NULL AND "viewer_ip" IS NOT NULL;
