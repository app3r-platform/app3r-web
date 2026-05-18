-- Migration: 0014_repair_pricing
-- Round 3: B6 Used Pricing Wizard
-- Drizzle schema: src/db/schema/repair-pricing.ts
-- SQL Reference: schemas/repair-domain/gen60-reverse-design/round3_used_pricing_schema.sql
-- Prereq: 0012_repair_master_data (repair_appliance_categories FK)
--
-- Tables (8): used_pricing_categories, used_pricing_models, used_pricing_dimensions,
--   used_pricing_dimension_values, used_pricing_price_points, used_pricing_deductions,
--   used_pricing_reject_rules, used_pricing_wizard_sessions
--
-- Design: dimensions_hash VARCHAR(64) = SHA-256 ของ JSON dimensions
--   → fast lookup แทน JSONB containment scan
--   → computed ใน app layer ก่อน INSERT/SELECT

-- ── 1. used_pricing_categories ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "used_pricing_categories" (
  "id"                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "code"                  VARCHAR(50)  NOT NULL UNIQUE,
  "label_th"              VARCHAR(100) NOT NULL,
  "label_en"              VARCHAR(100),
  "appliance_category_id" UUID
    REFERENCES "repair_appliance_categories"("id"),
  "sort_order"            INTEGER      NOT NULL DEFAULT 0,
  "is_active"             BOOLEAN      NOT NULL DEFAULT TRUE,
  "created_at"            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_used_pricing_categories_active"
  ON "used_pricing_categories" ("is_active", "sort_order");

-- ── 2. used_pricing_models ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "used_pricing_models" (
  "id"                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "category_id"       UUID         NOT NULL
    REFERENCES "used_pricing_categories"("id"),
  "code"              VARCHAR(50)  NOT NULL,
  "label_th"          VARCHAR(255) NOT NULL,
  "label_en"          VARCHAR(255),
  "brand"             VARCHAR(100),
  "spec_attributes"   JSONB        NOT NULL DEFAULT '{}',
  "base_market_price" NUMERIC(12,2),
  "is_active"         BOOLEAN      NOT NULL DEFAULT TRUE,
  "created_at"        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE ("category_id", "code")
);

CREATE INDEX IF NOT EXISTS "idx_used_pricing_models_category"
  ON "used_pricing_models" ("category_id");

-- GIN index สำหรับ spec_attributes JSONB containment queries
CREATE INDEX IF NOT EXISTS "idx_used_pricing_models_specs"
  ON "used_pricing_models" USING GIN ("spec_attributes");

-- ── 3. used_pricing_dimensions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "used_pricing_dimensions" (
  "id"             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "category_id"    UUID         NOT NULL
    REFERENCES "used_pricing_categories"("id") ON DELETE CASCADE,
  "code"           VARCHAR(50)  NOT NULL,
  "label_th"       VARCHAR(100) NOT NULL,
  "label_en"       VARCHAR(100),
  "kind"           VARCHAR(20)  NOT NULL
    CHECK ("kind" IN ('ENUM', 'NUMERIC', 'BOOLEAN', 'TEXT')),
  "is_price_axis"  BOOLEAN      NOT NULL DEFAULT FALSE,
  "sort_order"     INTEGER      NOT NULL DEFAULT 0,
  "created_at"     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE ("category_id", "code")
);

CREATE INDEX IF NOT EXISTS "idx_used_pricing_dimensions_category"
  ON "used_pricing_dimensions" ("category_id");

-- ── 4. used_pricing_dimension_values ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "used_pricing_dimension_values" (
  "id"            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "dimension_id"  UUID         NOT NULL
    REFERENCES "used_pricing_dimensions"("id") ON DELETE CASCADE,
  "code"          VARCHAR(50)  NOT NULL,
  "label_th"      VARCHAR(100) NOT NULL,
  "label_en"      VARCHAR(100),
  "numeric_value" NUMERIC(12,4),
  "sort_order"    INTEGER      NOT NULL DEFAULT 0,
  UNIQUE ("dimension_id", "code")
);

CREATE INDEX IF NOT EXISTS "idx_used_pricing_dimension_values_dim"
  ON "used_pricing_dimension_values" ("dimension_id");

-- ── 5. used_pricing_price_points ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "used_pricing_price_points" (
  "id"               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "model_id"         UUID        NOT NULL
    REFERENCES "used_pricing_models"("id") ON DELETE CASCADE,
  "dimensions"       JSONB       NOT NULL DEFAULT '{}',
  "dimensions_hash"  VARCHAR(64) NOT NULL,
  "is_multi_issue"   BOOLEAN     NOT NULL DEFAULT FALSE,
  "price"            NUMERIC(12,2) NOT NULL,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("model_id", "dimensions_hash", "is_multi_issue")
);

CREATE INDEX IF NOT EXISTS "idx_used_pricing_price_points_model"
  ON "used_pricing_price_points" ("model_id");

-- GIN index สำหรับ dimensions JSONB containment queries (fallback)
CREATE INDEX IF NOT EXISTS "idx_used_pricing_price_points_dims"
  ON "used_pricing_price_points" USING GIN ("dimensions");

-- ── 6. used_pricing_deductions ────────────────────────────────────────────────
-- CHECK constraint: ต้องมีค่าที่ตรงกับ deduction_type
CREATE TABLE IF NOT EXISTS "used_pricing_deductions" (
  "id"               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "category_id"      UUID         NOT NULL
    REFERENCES "used_pricing_categories"("id"),
  "model_id"         UUID
    REFERENCES "used_pricing_models"("id"),
  "kind"             VARCHAR(30)  NOT NULL
    CHECK ("kind" IN ('CONDITION', 'MISSING_ACCESSORY', 'PROBLEM', 'AGE', 'OTHER')),
  "deduction_type"   VARCHAR(20)  NOT NULL
    CHECK ("deduction_type" IN ('FIXED', 'PERCENT', 'RANGE')),
  "label_th"         VARCHAR(255) NOT NULL,
  "label_en"         VARCHAR(255),
  "fixed_amount"     NUMERIC(12,2),
  "percent_amount"   NUMERIC(5,2),
  "range_min"        NUMERIC(12,2),
  "range_max"        NUMERIC(12,2),
  "sort_order"       INTEGER      NOT NULL DEFAULT 0,
  "is_active"        BOOLEAN      NOT NULL DEFAULT TRUE,
  "created_at"       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  -- CHECK: ต้องมีค่าตรงกับ deduction_type
  CONSTRAINT "chk_deduction_amounts" CHECK (
    ("deduction_type" = 'FIXED'   AND "fixed_amount"   IS NOT NULL)
    OR ("deduction_type" = 'PERCENT' AND "percent_amount" IS NOT NULL)
    OR ("deduction_type" = 'RANGE'
        AND "range_min" IS NOT NULL AND "range_max" IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS "idx_used_pricing_deductions_category"
  ON "used_pricing_deductions" ("category_id");
CREATE INDEX IF NOT EXISTS "idx_used_pricing_deductions_model"
  ON "used_pricing_deductions" ("model_id");
CREATE INDEX IF NOT EXISTS "idx_used_pricing_deductions_kind"
  ON "used_pricing_deductions" ("kind");
CREATE INDEX IF NOT EXISTS "idx_used_pricing_deductions_type"
  ON "used_pricing_deductions" ("deduction_type");

-- ── 7. used_pricing_reject_rules ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "used_pricing_reject_rules" (
  "id"            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "category_id"   UUID         NOT NULL
    REFERENCES "used_pricing_categories"("id"),
  "label_th"      VARCHAR(255) NOT NULL,
  "label_en"      VARCHAR(255),
  "triggers_when" JSONB        NOT NULL,
  "is_active"     BOOLEAN      NOT NULL DEFAULT TRUE,
  "created_at"    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_used_pricing_reject_rules_category"
  ON "used_pricing_reject_rules" ("category_id");

-- GIN index สำหรับ rule expression queries
CREATE INDEX IF NOT EXISTS "idx_used_pricing_reject_rules_triggers"
  ON "used_pricing_reject_rules" USING GIN ("triggers_when");

-- ── 8. used_pricing_wizard_sessions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "used_pricing_wizard_sessions" (
  "id"                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"              UUID        NOT NULL REFERENCES "users"("id"),
  "model_id"             UUID        NOT NULL
    REFERENCES "used_pricing_models"("id"),
  "selected_dimensions"  JSONB       NOT NULL DEFAULT '{}',
  "applied_deductions"   UUID[]      NOT NULL DEFAULT ARRAY[]::uuid[],
  "base_price"           NUMERIC(12,2),
  "total_deduction"      NUMERIC(12,2),
  "final_price"          NUMERIC(12,2),
  "rejected"             BOOLEAN     NOT NULL DEFAULT FALSE,
  "status"               VARCHAR(30) NOT NULL DEFAULT 'in_progress'
    CHECK ("status" IN ('in_progress', 'completed', 'abandoned')),
  "completed_at"         TIMESTAMPTZ,
  "created_at"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_used_pricing_wizard_sessions_user"
  ON "used_pricing_wizard_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_used_pricing_wizard_sessions_model"
  ON "used_pricing_wizard_sessions" ("model_id");
CREATE INDEX IF NOT EXISTS "idx_used_pricing_wizard_sessions_status"
  ON "used_pricing_wizard_sessions" ("status");
CREATE INDEX IF NOT EXISTS "idx_used_pricing_wizard_sessions_created"
  ON "used_pricing_wizard_sessions" ("created_at");

-- ── Rollback (manual) ─────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS "used_pricing_wizard_sessions";
-- DROP TABLE IF EXISTS "used_pricing_reject_rules";
-- DROP TABLE IF EXISTS "used_pricing_deductions";
-- DROP TABLE IF EXISTS "used_pricing_price_points";
-- DROP TABLE IF EXISTS "used_pricing_dimension_values";
-- DROP TABLE IF EXISTS "used_pricing_dimensions";
-- DROP TABLE IF EXISTS "used_pricing_models";
-- DROP TABLE IF EXISTS "used_pricing_categories";
