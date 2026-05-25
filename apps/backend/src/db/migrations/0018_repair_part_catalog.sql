-- Migration: 0018_repair_part_catalog
-- D88: Static Repair Part Catalog + Symptom↔Part Links
--
-- Tables:
--   repair_part_catalog       — static parts per appliance category (from docx import)
--   repair_symptom_part_links — many-to-many: repair_symptoms ↔ repair_part_catalog
--
-- Prereq: 0012_repair_master_data (repair_appliance_categories, repair_symptoms must exist)
-- Spec: D88 Import Spec (36a813ec-7277-8166-b2cb-d31630a264c8)
-- Backend D88 Full Import · 2026-05-25

-- ── 1. repair_part_catalog ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "repair_part_catalog" (
  "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "appliance_category_id" UUID NOT NULL
                          REFERENCES "repair_appliance_categories"("id") ON DELETE RESTRICT,
  -- Part number (optional — e.g., "9.1", "14")
  "part_number"           VARCHAR(20),
  -- Group/section header (Variant 4: "ส่วนคอยล์เย็น")
  "part_group"            VARCHAR(100),
  -- Thai part name
  "name_th"               VARCHAR(500) NOT NULL,
  -- Source docx file (audit trail)
  "source_file"           VARCHAR(255),
  "sort_order"            INTEGER NOT NULL DEFAULT 0,
  "is_active"             BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_repair_part_catalog_category"
  ON "repair_part_catalog" ("appliance_category_id");

CREATE INDEX IF NOT EXISTS "idx_repair_part_catalog_category_active"
  ON "repair_part_catalog" ("appliance_category_id", "is_active");

-- (category_id, name_th) unique per category
CREATE UNIQUE INDEX IF NOT EXISTS "idx_repair_part_catalog_category_name"
  ON "repair_part_catalog" ("appliance_category_id", "name_th");

COMMENT ON TABLE "repair_part_catalog"
  IS 'D88: Static repair parts catalog imported from Word repair docs';
COMMENT ON COLUMN "repair_part_catalog"."part_group"
  IS 'Section header from docx e.g. "ส่วนคอยล์เย็น" (Variant 4 group rows)';

-- ── 2. repair_symptom_part_links ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "repair_symptom_part_links" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "symptom_id"  UUID NOT NULL
                REFERENCES "repair_symptoms"("id") ON DELETE CASCADE,
  "part_id"     UUID NOT NULL
                REFERENCES "repair_part_catalog"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_repair_symptom_part_links_unique"
  ON "repair_symptom_part_links" ("symptom_id", "part_id");

CREATE INDEX IF NOT EXISTS "idx_repair_symptom_part_links_symptom"
  ON "repair_symptom_part_links" ("symptom_id");

CREATE INDEX IF NOT EXISTS "idx_repair_symptom_part_links_part"
  ON "repair_symptom_part_links" ("part_id");

COMMENT ON TABLE "repair_symptom_part_links"
  IS 'D88: Many-to-many link: repair_symptoms ↔ repair_part_catalog (from Table 0 in docx)';

-- ── Rollback ───────────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS "repair_symptom_part_links";
-- DROP TABLE IF EXISTS "repair_part_catalog";
