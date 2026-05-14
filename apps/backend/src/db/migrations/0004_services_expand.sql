-- Sub-CMD-4 Wave 2: Services Table Full Expand
-- ⚠️ R2: run migration หลัง HUB approve เท่านั้น
-- Sub-CMD-4: 360813ec-7277-818d-b672-e5e3446e1d20
-- Run after: 0003_bank_transfers.sql

-- ── Forward Migration ────────────────────────────────────────────────────────
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "title" text;
--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "description" text;
--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "point_amount" numeric(12, 2);
--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "deadline" timestamp with time zone;
--> statement-breakpoint

-- Index สำหรับ query ที่จะใช้บ่อย (Sub-5 Progress Tracker)
CREATE INDEX IF NOT EXISTS "idx_services_type" ON "services" ("service_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_services_deadline" ON "services" ("deadline");

-- ── Rollback Migration (เก็บไว้สำหรับ emergency rollback) ────────────────────
-- ALTER TABLE "services" DROP COLUMN IF EXISTS "title";
-- ALTER TABLE "services" DROP COLUMN IF EXISTS "description";
-- ALTER TABLE "services" DROP COLUMN IF EXISTS "point_amount";
-- ALTER TABLE "services" DROP COLUMN IF EXISTS "deadline";
-- DROP INDEX IF EXISTS "idx_services_type";
-- DROP INDEX IF EXISTS "idx_services_deadline";
