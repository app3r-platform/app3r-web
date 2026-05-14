-- Sub-CMD-5 Wave 2: Service Progress Tracker (D79)
-- ⚠️ R2: run migration หลัง HUB approve เท่านั้น
-- Sub-CMD-5: 360813ec-7277-8157-bc00-c47bc62b256e
-- Run after: 0004_services_expand.sql (services table must exist)

-- ── Forward Migration ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "service_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "service_id" uuid NOT NULL,
  "status" text NOT NULL,
  "progress_percent" integer NOT NULL DEFAULT 0,
  "note" text,
  "photo_r2_key" text,
  "updated_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "service_progress"
    ADD CONSTRAINT "service_progress_service_id_fk"
    FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "service_progress"
    ADD CONSTRAINT "service_progress_updated_by_fk"
    FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_service_progress_service" ON "service_progress" ("service_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_service_progress_status" ON "service_progress" ("status");

-- ── Rollback Migration ───────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS "service_progress";
