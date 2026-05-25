-- Migration: 0016_appliance_master_d92
-- D92: Master 3-Tier Appliance Reference + D89 asset_images canonical
--
-- Tables created:
--   appliance_brands  — ยี่ห้อ (FK → repair_appliance_categories)
--   appliance_models  — รุ่น (FK → appliance_brands) + spec_attributes JSONB
--   asset_images      — D89 canonical (แทน D93 ที่ถูกยกเลิก Advisor Gen 84)
--
-- Soft Delete D90: is_active=false · CHECK constraint กันลบถ้ามีลูก (service layer)
-- Generic-First: ห้าม hardcode 5 ประเภท — เพิ่มผ่าน Admin UI
--
-- Prereq: 0012_repair_master_data (repair_appliance_categories must exist)
-- Spec: D92 (36a813ec-7277-8166-b2cb-d31630a264c8)
-- Maintain Gen 4 · 2026-05-25

-- ── 1. appliance_brands ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "appliance_brands" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "category_id" UUID NOT NULL
                REFERENCES "repair_appliance_categories"("id") ON DELETE RESTRICT,
  "name"        VARCHAR(100) NOT NULL,
  "is_active"   BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- (category_id, name) unique — ยี่ห้อชื่อเดียวกันได้ในคนละประเภท
CREATE UNIQUE INDEX IF NOT EXISTS "idx_appliance_brands_category_name"
  ON "appliance_brands" ("category_id", "name");

CREATE INDEX IF NOT EXISTS "idx_appliance_brands_category_active"
  ON "appliance_brands" ("category_id", "is_active");

COMMENT ON TABLE "appliance_brands"  IS 'D92: ยี่ห้อเครื่องใช้ไฟฟ้า (generic — ทุกประเภท)';
COMMENT ON COLUMN "appliance_brands"."is_active" IS 'Soft Delete D90 — false = ซ่อน ไม่ลบจริง';

-- ── 2. appliance_models ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "appliance_models" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "brand_id"         UUID NOT NULL
                     REFERENCES "appliance_brands"("id") ON DELETE RESTRICT,
  "name"             VARCHAR(200) NOT NULL,
  "spec_attributes"  JSONB,
  "is_active"        BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_appliance_models_brand_name"
  ON "appliance_models" ("brand_id", "name");

CREATE INDEX IF NOT EXISTS "idx_appliance_models_brand_active"
  ON "appliance_models" ("brand_id", "is_active");

COMMENT ON TABLE "appliance_models"    IS 'D92: รุ่นเครื่องใช้ไฟฟ้า (optional — ถ้าไม่ระบุรุ่น = ใช้ทั้งยี่ห้อ)';
COMMENT ON COLUMN "appliance_models"."spec_attributes" IS 'JSONB สเปคเพิ่มเติม เช่น {btu,inverter} สำหรับ AC';
COMMENT ON COLUMN "appliance_models"."is_active" IS 'Soft Delete D90';

-- ── 3. asset_images (D89 canonical — แทน D93 ที่ถูกยกเลิก) ──────────────────
CREATE TABLE IF NOT EXISTS "asset_images" (
  "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 'parts' | 'symptoms' | 'checklist' | 'pricing-samples' | 'ui'
  "category"            VARCHAR(30) NOT NULL,
  -- 'ac' | 'fridge' | 'washer' | 'computer' | 'tv' | NULL
  "appliance_category"  VARCHAR(50),
  "local_path"          TEXT NOT NULL,
  "cloud_url"           TEXT,
  "alt_text"            VARCHAR(255),
  -- soft FK — ไม่ enforce constraint (entity อาจหลายตาราง)
  "linked_entity_type"  VARCHAR(100),
  "linked_entity_id"    UUID,
  -- ไฟล์ต้นฉบับที่ดึงรูปมา เช่น 'repair-ac.docx'
  "source_file"         VARCHAR(255),
  -- 1 ชิ้นส่วนมีหลายรูป — sort_order จัดลำดับ
  "sort_order"          INTEGER NOT NULL DEFAULT 0,
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_asset_images_category"
  ON "asset_images" ("category");

CREATE INDEX IF NOT EXISTS "idx_asset_images_appliance"
  ON "asset_images" ("appliance_category");

CREATE INDEX IF NOT EXISTS "idx_asset_images_entity"
  ON "asset_images" ("linked_entity_type", "linked_entity_id");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_asset_images_local_path"
  ON "asset_images" ("local_path");

COMMENT ON TABLE "asset_images" IS 'D89 canonical: reference images สำหรับ Admin master data (parts/symptoms/checklist/pricing-samples/ui)';
COMMENT ON COLUMN "asset_images"."category" IS 'parts|symptoms|checklist|pricing-samples|ui';
COMMENT ON COLUMN "asset_images"."appliance_category" IS 'ac|fridge|washer|computer|tv|NULL (NULL=ใช้ได้ทุกประเภท)';

-- ── Seed: appliance_categories ใน repair_appliance_categories ────────────────
-- Generic-First: seed 9 ประเภทจากไฟล์จริง + Monitor/Desktop/Printer
-- ไม่ใช่ขอบเขตระบบ — Admin เพิ่มประเภทใหม่ผ่าน UI ได้ทุกเมื่อ
INSERT INTO "repair_appliance_categories" ("code", "label_th", "label_en", "sort_order", "is_active")
VALUES
  ('ac',           'แอร์',                   'Air Conditioner',  1,  TRUE),
  ('refrigerator', 'ตู้เย็น',               'Refrigerator',     2,  TRUE),
  ('washer',       'เครื่องซักผ้า',         'Washing Machine',  3,  TRUE),
  ('computer',     'คอมพิวเตอร์',           'Computer/PC',      4,  TRUE),
  ('tv',           'โทรทัศน์',              'Television',       5,  TRUE),
  ('smartphone',   'สมาร์ทโฟน/มือถือ',     'Smartphone',       6,  TRUE),
  ('notebook',     'โน้ตบุ๊ก/แล็ปท็อป',    'Notebook/Laptop',  7,  TRUE),
  ('monitor',      'มอนิเตอร์',             'Monitor',          8,  TRUE),
  ('printer',      'เครื่องพิมพ์',          'Printer',          9,  TRUE),
  ('tablet',       'แท็บเล็ต',              'Tablet',           10, TRUE),
  ('microwave',    'ไมโครเวฟ',              'Microwave Oven',   11, TRUE),
  ('fan',          'พัดลม',                 'Electric Fan',     12, TRUE)
ON CONFLICT ("code") DO NOTHING;
