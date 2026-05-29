-- Migration: 0025_d87_location_master
-- D87 W-Round-1 Wave 1: Thai administrative location reference dataset (L1 Static)
--
-- Standalone reference tables — NO FK to users/services (กัน B3 FK-conflict กับ Python DB)
-- Source: kongvut/thai-province-data — official Thai admin codes = natural key (integer PK)
--   province id = 2 หลัก · amphoe id = 4 หลัก · tambon id = 6 หลัก
--
-- New tables (3):
--   1. provinces (จังหวัด, ~77)
--   2. amphoes   (อำเภอ/เขต, ~928)   FK → provinces
--   3. tambons   (ตำบล/แขวง, ~7,400) FK → amphoes  + zipcode (GR-9 auto-fill)
--
-- Usage: GR-9 dropdown cascade + zipcode auto-fill · GR-10 "ใกล้ฉัน" Haversine บน lat/lng
--
-- Rollback:
--   DROP TABLE IF EXISTS "tambons" CASCADE;
--   DROP TABLE IF EXISTS "amphoes" CASCADE;
--   DROP TABLE IF EXISTS "provinces" CASCADE;
--
-- Decision: D87 (36e813ec-7277-81ec-8d00-dc3e3fee8816) · Branch: feature/backend-wr1-d87-d84 · 2026-05-29

-- ── 1. provinces (จังหวัด) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "provinces" (
  "id"      INTEGER PRIMARY KEY,            -- official province code (2-digit)
  "name_th" TEXT    NOT NULL,
  "name_en" TEXT,
  "region"  TEXT,                           -- ภาค (เหนือ/อีสาน/กลาง/...)
  "lat"     DOUBLE PRECISION,               -- centroid (geo search fallback)
  "lng"     DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS "idx_provinces_name_th" ON "provinces" ("name_th");

-- ── 2. amphoes (อำเภอ/เขต) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "amphoes" (
  "id"          INTEGER PRIMARY KEY,        -- official amphoe code (4-digit)
  "province_id" INTEGER NOT NULL
                REFERENCES "provinces"("id") ON DELETE CASCADE,
  "name_th"     TEXT    NOT NULL,
  "name_en"     TEXT,
  "lat"         DOUBLE PRECISION,
  "lng"         DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS "idx_amphoes_province" ON "amphoes" ("province_id");
CREATE INDEX IF NOT EXISTS "idx_amphoes_name_th" ON "amphoes" ("name_th");

-- ── 3. tambons (ตำบล/แขวง) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "tambons" (
  "id"        INTEGER PRIMARY KEY,          -- official tambon code (6-digit)
  "amphoe_id" INTEGER NOT NULL
              REFERENCES "amphoes"("id") ON DELETE CASCADE,
  "name_th"   TEXT    NOT NULL,
  "name_en"   TEXT,
  "lat"       DOUBLE PRECISION,
  "lng"       DOUBLE PRECISION,
  "zipcode"   TEXT                          -- GR-9 auto-fill
);

CREATE INDEX IF NOT EXISTS "idx_tambons_amphoe" ON "tambons" ("amphoe_id");
CREATE INDEX IF NOT EXISTS "idx_tambons_zipcode" ON "tambons" ("zipcode");
CREATE INDEX IF NOT EXISTS "idx_tambons_name_th" ON "tambons" ("name_th");
