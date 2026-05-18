-- Migration: 0012_repair_master_data
-- Round 1: D82 Admin Master Data (Repair Domain)
-- Drizzle schema: src/db/schema/repair-master-data.ts
-- SQL Reference: schemas/repair-domain/gen60-reverse-design/d82_master_data_schema.sql
-- Prereq: 0011_testimonials (users table must exist)
--
-- GAP-1 Resolution: repair_appliance_categories สร้างใหม่ UUID PK
--   (ไม่ FK ไป Python backend appliance_categories ซึ่ง Integer PK — type mismatch)
--
-- Tables (10): repair_appliance_categories, repair_symptoms, repair_worktypes,
--   repair_part_status_options, repair_decline_reasons, repair_tools_required,
--   repair_checklist_templates, repair_checklist_items,
--   repair_electrical_measurements, repair_admin_audit_log
--
-- Rollback: ดู -- Rollback section ท้ายไฟล์

-- ── 1. repair_appliance_categories ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "repair_appliance_categories" (
  "id"          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "code"        VARCHAR(50) NOT NULL UNIQUE,
  "label_th"    VARCHAR(100) NOT NULL,
  "label_en"    VARCHAR(100),
  "sort_order"  INTEGER     NOT NULL DEFAULT 0,
  "is_active"   BOOLEAN     NOT NULL DEFAULT TRUE,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_repair_appliance_categories_active"
  ON "repair_appliance_categories" ("is_active", "sort_order");

-- ── 2. repair_symptoms ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "repair_symptoms" (
  "id"                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "appliance_category_id"    UUID        NOT NULL
    REFERENCES "repair_appliance_categories"("id"),
  "code"                     VARCHAR(50) NOT NULL,
  "label_th"                 VARCHAR(255) NOT NULL,
  "label_en"                 VARCHAR(255),
  "severity_hint"            VARCHAR(20)
    CHECK ("severity_hint" IN ('low', 'medium', 'high')),
  "common_causes"            JSONB,
  "sort_order"               INTEGER     NOT NULL DEFAULT 0,
  "is_active"                BOOLEAN     NOT NULL DEFAULT TRUE,
  "created_at"               TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("appliance_category_id", "code")
);

CREATE INDEX IF NOT EXISTS "idx_repair_symptoms_category"
  ON "repair_symptoms" ("appliance_category_id");
CREATE INDEX IF NOT EXISTS "idx_repair_symptoms_severity"
  ON "repair_symptoms" ("severity_hint");

-- ── 3. repair_worktypes ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "repair_worktypes" (
  "id"         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "kind"       VARCHAR(20) NOT NULL
    CHECK ("kind" IN ('REPAIR', 'REPLACE', 'CLEAN', 'REFILL', 'INSPECT')),
  "code"       VARCHAR(50) NOT NULL UNIQUE,
  "label_th"   VARCHAR(255) NOT NULL,
  "label_en"   VARCHAR(255),
  "is_active"  BOOLEAN     NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_repair_worktypes_kind"
  ON "repair_worktypes" ("kind");

-- ── 4. repair_part_status_options ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "repair_part_status_options" (
  "id"           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "availability" VARCHAR(20) NOT NULL
    CHECK ("availability" IN ('IN_VAN', 'IN_SHOP', 'NEED_ORDER')),
  "label_th"     VARCHAR(255) NOT NULL,
  "label_en"     VARCHAR(255),
  "is_default"   BOOLEAN     NOT NULL DEFAULT FALSE,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial unique: 1 default per availability type
CREATE UNIQUE INDEX IF NOT EXISTS "idx_repair_part_status_default"
  ON "repair_part_status_options" ("availability")
  WHERE "is_default" = TRUE;

CREATE INDEX IF NOT EXISTS "idx_repair_part_status_availability"
  ON "repair_part_status_options" ("availability");

-- ── 5. repair_decline_reasons ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "repair_decline_reasons" (
  "id"           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "role"         VARCHAR(20) NOT NULL
    CHECK ("role" IN ('WEEET', 'WEEEU')),
  "reason_group" VARCHAR(20) NOT NULL
    CHECK ("reason_group" IN ('GROUP_1', 'GROUP_2', 'GROUP_3')),
  "code"         VARCHAR(50) NOT NULL,
  "label_th"     VARCHAR(255) NOT NULL,
  "label_en"     VARCHAR(255),
  "is_active"    BOOLEAN     NOT NULL DEFAULT TRUE,
  "sort_order"   INTEGER     NOT NULL DEFAULT 0,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("role", "code")
);

CREATE INDEX IF NOT EXISTS "idx_repair_decline_reasons_role_group"
  ON "repair_decline_reasons" ("role", "reason_group");

-- ── 6. repair_tools_required ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "repair_tools_required" (
  "id"         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "code"       VARCHAR(50) NOT NULL UNIQUE,
  "label_th"   VARCHAR(255) NOT NULL,
  "label_en"   VARCHAR(255),
  "category"   VARCHAR(50),
  "is_basic"   BOOLEAN     NOT NULL DEFAULT FALSE,
  "is_active"  BOOLEAN     NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_repair_tools_category"
  ON "repair_tools_required" ("category");
CREATE INDEX IF NOT EXISTS "idx_repair_tools_basic"
  ON "repair_tools_required" ("is_basic");

-- ── 7. repair_checklist_templates ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "repair_checklist_templates" (
  "id"                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "appliance_category_id" UUID        NOT NULL
    REFERENCES "repair_appliance_categories"("id"),
  "name_th"               VARCHAR(255) NOT NULL,
  "name_en"               VARCHAR(255),
  "version"               INTEGER     NOT NULL DEFAULT 1,
  "is_default"            BOOLEAN     NOT NULL DEFAULT FALSE,
  "is_fallback"           BOOLEAN     NOT NULL DEFAULT FALSE,
  "is_active"             BOOLEAN     NOT NULL DEFAULT TRUE,
  "created_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial unique: 1 default per category
CREATE UNIQUE INDEX IF NOT EXISTS "idx_repair_checklist_templates_default"
  ON "repair_checklist_templates" ("appliance_category_id")
  WHERE "is_default" = TRUE;

-- Partial unique: 1 fallback per category
CREATE UNIQUE INDEX IF NOT EXISTS "idx_repair_checklist_templates_fallback"
  ON "repair_checklist_templates" ("appliance_category_id")
  WHERE "is_fallback" = TRUE;

CREATE INDEX IF NOT EXISTS "idx_repair_checklist_templates_category"
  ON "repair_checklist_templates" ("appliance_category_id");

-- ── 8. repair_checklist_items ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "repair_checklist_items" (
  "id"          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "template_id" UUID         NOT NULL
    REFERENCES "repair_checklist_templates"("id") ON DELETE CASCADE,
  "section"     VARCHAR(100) NOT NULL,
  "code"        VARCHAR(50)  NOT NULL,
  "label_th"    VARCHAR(255) NOT NULL,
  "label_en"    VARCHAR(255),
  "is_required" BOOLEAN      NOT NULL DEFAULT TRUE,
  "sort_order"  INTEGER      NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE ("template_id", "code")
);

CREATE INDEX IF NOT EXISTS "idx_repair_checklist_items_template_section"
  ON "repair_checklist_items" ("template_id", "section");

-- ── 9. repair_electrical_measurements ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "repair_electrical_measurements" (
  "id"                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "appliance_category_id" UUID
    REFERENCES "repair_appliance_categories"("id"),
  "code"                  VARCHAR(50)  NOT NULL,
  "label_th"              VARCHAR(255) NOT NULL,
  "label_en"              VARCHAR(255),
  "unit"                  VARCHAR(20)  NOT NULL,
  "normal_min"            NUMERIC(10,4),
  "normal_max"            NUMERIC(10,4),
  "sort_order"            INTEGER      NOT NULL DEFAULT 0,
  "is_active"             BOOLEAN      NOT NULL DEFAULT TRUE,
  "created_at"            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_repair_electrical_measurements_category"
  ON "repair_electrical_measurements" ("appliance_category_id");

-- ── 10. repair_admin_audit_log (BIGSERIAL — append-only) ─────────────────────
CREATE TABLE IF NOT EXISTS "repair_admin_audit_log" (
  "id"           BIGSERIAL   PRIMARY KEY,
  "table_name"   VARCHAR(100) NOT NULL,
  "record_id"    UUID         NOT NULL,
  "action"       VARCHAR(20)  NOT NULL
    CHECK ("action" IN ('INSERT', 'UPDATE', 'DELETE')),
  "changes"      JSONB,
  "performed_by" UUID         NOT NULL REFERENCES "users"("id"),
  "performed_at" TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_repair_admin_audit_table_record"
  ON "repair_admin_audit_log" ("table_name", "record_id");
CREATE INDEX IF NOT EXISTS "idx_repair_admin_audit_performer"
  ON "repair_admin_audit_log" ("performed_by");
CREATE INDEX IF NOT EXISTS "idx_repair_admin_audit_at"
  ON "repair_admin_audit_log" ("performed_at");

-- ── Rollback (manual) ─────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS "repair_admin_audit_log";
-- DROP TABLE IF EXISTS "repair_electrical_measurements";
-- DROP TABLE IF EXISTS "repair_checklist_items";
-- DROP TABLE IF EXISTS "repair_checklist_templates";
-- DROP TABLE IF EXISTS "repair_tools_required";
-- DROP TABLE IF EXISTS "repair_decline_reasons";
-- DROP TABLE IF EXISTS "repair_part_status_options";
-- DROP TABLE IF EXISTS "repair_worktypes";
-- DROP TABLE IF EXISTS "repair_symptoms";
-- DROP TABLE IF EXISTS "repair_appliance_categories";
