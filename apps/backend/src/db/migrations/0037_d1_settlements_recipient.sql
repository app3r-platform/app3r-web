-- Migration: 0037_d1_settlements_recipient
-- DB-phase D1 (Gen 122 · C-2 · Point REFINED v2 item 5)
--
-- settlements.weeer_user_id (hardcoded WeeeR recipient) → recipient_user_id (generic).
-- source = escrow_holds.recipient_user_id → รองรับ Scrap reverse (recipient = WeeeU).
-- settlements empty in DEV (0 rows) · rename is data-preserving regardless.
-- Idempotent: DO-block guard (rename only if old col exists and new col absent).
--
-- Rollback:
--   ALTER INDEX IF EXISTS "idx_settlements_recipient" RENAME TO "idx_settlements_weeer";
--   ALTER TABLE "settlements" RENAME COLUMN "recipient_user_id" TO "weeer_user_id";
--
-- Prereq: 0006 (settlements) · Branch: feature/db-d1-core-schema

DO $$
BEGIN
  IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'settlements' AND column_name = 'weeer_user_id'
      )
     AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'settlements' AND column_name = 'recipient_user_id'
      )
  THEN
    ALTER TABLE "settlements" RENAME COLUMN "weeer_user_id" TO "recipient_user_id";
  END IF;
END $$;

ALTER INDEX IF EXISTS "idx_settlements_weeer" RENAME TO "idx_settlements_recipient";
