-- Migration: 0013_repair_workflow
-- Round 2: Repair Workflow Instance (B3 / B3.5 / B2.5)
-- Drizzle schema: src/db/schema/repair-workflow.ts
-- SQL Reference: schemas/repair-domain/gen60-reverse-design/round2_workflow_tables_schema.sql
-- Prereq: 0012_repair_master_data (repair_checklist_templates, repair_checklist_items,
--         repair_electrical_measurements, repair_worktypes, repair_part_status_options)
--
-- GAP-2 Resolution: ไม่ใช้ PostgreSQL enum type — ใช้ VARCHAR + CHECK constraint
--   New repair job states (enforced in app layer, documented ใน schema header):
--     checklist_submitted, parts_picker_submitted, packages_offered,
--     awaiting_parts, scrap_offered, scrap_accepted, scrap_rejected
--
-- Tables (8): repair_checklist_results, repair_checklist_item_results,
--   repair_measurement_results, repair_parts_picker_entries, repair_parts_picker_items,
--   repair_b2_5_packages, repair_b2_5_package_items, repair_job_state_transitions
--
-- ⚠️ Open Question 3: estimated_margin GENERATED ALWAYS AS STORED — requires PostgreSQL ≥ 12

-- ── 1. repair_checklist_results (B3 header) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS "repair_checklist_results" (
  "id"                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "repair_job_id"       UUID        NOT NULL REFERENCES "services"("id"),
  "template_id"         UUID        NOT NULL
    REFERENCES "repair_checklist_templates"("id"),
  "submitted_by"        VARCHAR(20) NOT NULL
    CHECK ("submitted_by" IN ('WEEET', 'WEEER')),
  "overall_result"      VARCHAR(30)
    CHECK ("overall_result" IN ('ALL_NORMAL', 'MINOR_ABNORMAL', 'CRITICAL_ABNORMAL', 'DECLINED')),
  "scrap_offer_amount"  NUMERIC(12,2),
  "notes"               TEXT,
  "submitted_at"        TIMESTAMPTZ,
  "supersedes_id"       UUID REFERENCES "repair_checklist_results"("id"),
  "is_current"          BOOLEAN     NOT NULL DEFAULT TRUE,
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial unique: 1 current checklist per repair job
CREATE UNIQUE INDEX IF NOT EXISTS "idx_repair_checklist_results_current"
  ON "repair_checklist_results" ("repair_job_id")
  WHERE "is_current" = TRUE;

CREATE INDEX IF NOT EXISTS "idx_repair_checklist_results_job"
  ON "repair_checklist_results" ("repair_job_id");
CREATE INDEX IF NOT EXISTS "idx_repair_checklist_results_template"
  ON "repair_checklist_results" ("template_id");
CREATE INDEX IF NOT EXISTS "idx_repair_checklist_results_submitted_by"
  ON "repair_checklist_results" ("submitted_by");

-- ── 2. repair_checklist_item_results ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "repair_checklist_item_results" (
  "id"                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "checklist_result_id"  UUID        NOT NULL
    REFERENCES "repair_checklist_results"("id") ON DELETE CASCADE,
  "item_id"              UUID        NOT NULL
    REFERENCES "repair_checklist_items"("id"),
  "result"               VARCHAR(20) NOT NULL
    CHECK ("result" IN ('NORMAL', 'ABNORMAL', 'NA')),
  "note"                 TEXT,
  "photo_ref"            TEXT[],
  "created_at"           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_repair_checklist_item_results_checklist"
  ON "repair_checklist_item_results" ("checklist_result_id");
CREATE INDEX IF NOT EXISTS "idx_repair_checklist_item_results_item"
  ON "repair_checklist_item_results" ("item_id");
CREATE INDEX IF NOT EXISTS "idx_repair_checklist_item_results_result"
  ON "repair_checklist_item_results" ("result");

-- ── 3. repair_measurement_results ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "repair_measurement_results" (
  "id"                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "checklist_result_id"  UUID         NOT NULL
    REFERENCES "repair_checklist_results"("id") ON DELETE CASCADE,
  "measurement_id"       UUID         NOT NULL
    REFERENCES "repair_electrical_measurements"("id"),
  "value_numeric"        NUMERIC(10,4),
  "value_text"           TEXT,
  "is_within_normal"     BOOLEAN,
  "created_at"           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_repair_measurement_results_checklist"
  ON "repair_measurement_results" ("checklist_result_id");
CREATE INDEX IF NOT EXISTS "idx_repair_measurement_results_measurement"
  ON "repair_measurement_results" ("measurement_id");

-- ── 4. repair_parts_picker_entries (B3.5 header) ──────────────────────────────
CREATE TABLE IF NOT EXISTS "repair_parts_picker_entries" (
  "id"                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "repair_job_id"        UUID        NOT NULL REFERENCES "services"("id"),
  "checklist_result_id"  UUID
    REFERENCES "repair_checklist_results"("id"),
  "has_need_order"       BOOLEAN     NOT NULL DEFAULT FALSE,
  "notes"                TEXT,
  "submitted_at"         TIMESTAMPTZ,
  "is_current"           BOOLEAN     NOT NULL DEFAULT TRUE,
  "created_at"           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial unique: 1 current picker per repair job
CREATE UNIQUE INDEX IF NOT EXISTS "idx_repair_parts_picker_entries_current"
  ON "repair_parts_picker_entries" ("repair_job_id")
  WHERE "is_current" = TRUE;

CREATE INDEX IF NOT EXISTS "idx_repair_parts_picker_entries_job"
  ON "repair_parts_picker_entries" ("repair_job_id");

-- ── 5. repair_parts_picker_items ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "repair_parts_picker_items" (
  "id"                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "picker_entry_id"      UUID        NOT NULL
    REFERENCES "repair_parts_picker_entries"("id") ON DELETE CASCADE,
  "worktype_id"          UUID        NOT NULL
    REFERENCES "repair_worktypes"("id"),
  "part_status_id"       UUID        NOT NULL
    REFERENCES "repair_part_status_options"("id"),
  "availability"         VARCHAR(20) NOT NULL
    CHECK ("availability" IN ('IN_VAN', 'IN_SHOP', 'NEED_ORDER')),
  "part_name"            TEXT,
  "quantity"             INTEGER     NOT NULL DEFAULT 1,
  "price_hint_oem"       NUMERIC(12,2),
  "price_hint_aftermarket" NUMERIC(12,2),
  "price_hint_used"      NUMERIC(12,2),
  "notes"                TEXT,
  "created_at"           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_repair_parts_picker_items_entry"
  ON "repair_parts_picker_items" ("picker_entry_id");
CREATE INDEX IF NOT EXISTS "idx_repair_parts_picker_items_availability"
  ON "repair_parts_picker_items" ("availability");
CREATE INDEX IF NOT EXISTS "idx_repair_parts_picker_items_worktype"
  ON "repair_parts_picker_items" ("worktype_id");

-- ── 6. repair_b2_5_packages (B2.5 Package Offer) ─────────────────────────────
-- ⚠️ estimated_margin: GENERATED ALWAYS AS STORED — PostgreSQL ≥ 12 required
CREATE TABLE IF NOT EXISTS "repair_b2_5_packages" (
  "id"               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "repair_job_id"    UUID        NOT NULL REFERENCES "services"("id"),
  "picker_entry_id"  UUID        NOT NULL
    REFERENCES "repair_parts_picker_entries"("id"),
  "tier"             VARCHAR(20) NOT NULL
    CHECK ("tier" IN ('PREMIUM', 'ECONOMY')),
  "total_price"      NUMERIC(12,2) NOT NULL DEFAULT 0,
  "total_cost"       NUMERIC(12,2) NOT NULL DEFAULT 0,
  "estimated_margin" NUMERIC(12,2) GENERATED ALWAYS AS ("total_price" - "total_cost") STORED,
  "status"           VARCHAR(30) NOT NULL DEFAULT 'offered'
    CHECK ("status" IN ('offered', 'accepted', 'declined', 'expired')),
  "offered_at"       TIMESTAMPTZ,
  "responded_at"     TIMESTAMPTZ,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial unique: 1 accepted package per job
CREATE UNIQUE INDEX IF NOT EXISTS "idx_repair_b2_5_packages_accepted"
  ON "repair_b2_5_packages" ("repair_job_id")
  WHERE "status" = 'accepted';

-- Partial unique: 1 PREMIUM + 1 ECONOMY per job (non-expired)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_repair_b2_5_packages_tier_job"
  ON "repair_b2_5_packages" ("repair_job_id", "tier")
  WHERE "status" != 'expired';

CREATE INDEX IF NOT EXISTS "idx_repair_b2_5_packages_job"
  ON "repair_b2_5_packages" ("repair_job_id");
CREATE INDEX IF NOT EXISTS "idx_repair_b2_5_packages_picker"
  ON "repair_b2_5_packages" ("picker_entry_id");
CREATE INDEX IF NOT EXISTS "idx_repair_b2_5_packages_status"
  ON "repair_b2_5_packages" ("status");

-- ── 7. repair_b2_5_package_items ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "repair_b2_5_package_items" (
  "id"             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "package_id"     UUID        NOT NULL
    REFERENCES "repair_b2_5_packages"("id") ON DELETE CASCADE,
  "kind"           VARCHAR(30) NOT NULL
    CHECK ("kind" IN ('PART', 'LABOR', 'TRANSPORT', 'DEPOSIT', 'DISCOUNT', 'OTHER')),
  "label_th"       TEXT        NOT NULL,
  "part_grade"     VARCHAR(30)
    CHECK ("part_grade" IN ('OEM_NEW', 'AFTERMARKET_NEW', 'USED_GRADE_A', 'USED_GRADE_B', 'REFURBISHED')),
  "picker_item_id" UUID REFERENCES "repair_parts_picker_items"("id"),
  "quantity"       INTEGER     NOT NULL DEFAULT 1,
  "unit_price"     NUMERIC(12,2) NOT NULL,
  "unit_cost"      NUMERIC(12,2),
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_repair_b2_5_package_items_package"
  ON "repair_b2_5_package_items" ("package_id");
CREATE INDEX IF NOT EXISTS "idx_repair_b2_5_package_items_kind"
  ON "repair_b2_5_package_items" ("kind");

-- ── 8. repair_job_state_transitions (BIGSERIAL — immutable) ──────────────────
-- Append-only state change log: ห้าม UPDATE/DELETE
CREATE TABLE IF NOT EXISTS "repair_job_state_transitions" (
  "id"              BIGSERIAL    PRIMARY KEY,
  "repair_job_id"   UUID         NOT NULL REFERENCES "services"("id"),
  "from_status"     VARCHAR(50),
  "to_status"       VARCHAR(50)  NOT NULL,
  "trigger_event"   VARCHAR(100),
  "triggered_by"    UUID REFERENCES "users"("id"),
  "context"         JSONB,
  "transitioned_at" TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_repair_job_state_transitions_job"
  ON "repair_job_state_transitions" ("repair_job_id", "transitioned_at");
CREATE INDEX IF NOT EXISTS "idx_repair_job_state_transitions_to"
  ON "repair_job_state_transitions" ("to_status");
CREATE INDEX IF NOT EXISTS "idx_repair_job_state_transitions_trigger"
  ON "repair_job_state_transitions" ("trigger_event");

-- ── Rollback (manual) ─────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS "repair_job_state_transitions";
-- DROP TABLE IF EXISTS "repair_b2_5_package_items";
-- DROP TABLE IF EXISTS "repair_b2_5_packages";
-- DROP TABLE IF EXISTS "repair_parts_picker_items";
-- DROP TABLE IF EXISTS "repair_parts_picker_entries";
-- DROP TABLE IF EXISTS "repair_measurement_results";
-- DROP TABLE IF EXISTS "repair_checklist_item_results";
-- DROP TABLE IF EXISTS "repair_checklist_results";
