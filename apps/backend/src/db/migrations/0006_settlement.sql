-- Sub-CMD-6 Wave 2: Settlement API + Audit Log (D-2 Debt #3)
-- ⚠️ R2: run migration หลัง HUB approve เท่านั้น
-- Sub-CMD-6: 360813ec72778187a1b4f38a11cb8539
-- Run after: 0005_service_progress.sql

-- ── Forward Migration ────────────────────────────────────────────────────────

-- Table 1: settlements
CREATE TABLE IF NOT EXISTS "settlements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "service_id" uuid NOT NULL,
  "weeer_user_id" uuid NOT NULL,
  "amount_thb" numeric(12, 2) NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "bank_adapter" text NOT NULL DEFAULT 'mock',
  "bank_ref" text,
  "bank_response" text,
  "initiated_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Table 2: settlement_audit_log (Security Rule #5 — บังคับ)
CREATE TABLE IF NOT EXISTS "settlement_audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "settlement_id" uuid NOT NULL,
  "action" text NOT NULL,
  "actor_id" uuid,
  "old_status" text,
  "new_status" text,
  "detail" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- FK: settlements
DO $$ BEGIN
  ALTER TABLE "settlements"
    ADD CONSTRAINT "settlements_service_id_fk"
    FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "settlements"
    ADD CONSTRAINT "settlements_weeer_user_id_fk"
    FOREIGN KEY ("weeer_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "settlements"
    ADD CONSTRAINT "settlements_initiated_by_fk"
    FOREIGN KEY ("initiated_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

-- FK: settlement_audit_log
DO $$ BEGIN
  ALTER TABLE "settlement_audit_log"
    ADD CONSTRAINT "audit_log_settlement_id_fk"
    FOREIGN KEY ("settlement_id") REFERENCES "public"."settlements"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "settlement_audit_log"
    ADD CONSTRAINT "audit_log_actor_id_fk"
    FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_settlements_weeer" ON "settlements" ("weeer_user_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_settlements_service" ON "settlements" ("service_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_settlements_status" ON "settlements" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_log_settlement" ON "settlement_audit_log" ("settlement_id", "created_at");

-- ── Rollback Migration ───────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS "settlement_audit_log";
-- DROP TABLE IF EXISTS "settlements";
