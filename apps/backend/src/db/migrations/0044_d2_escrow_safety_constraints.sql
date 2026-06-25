-- Migration: 0044_d2_escrow_safety_constraints
-- D2 Resell Slice · Wave 2.1 (security · Point verdict B3 + partial-unique-index + S2 adversarial)
-- ⚠️ DRAFT — ยังไม่ apply DEV (sub-gate · HUB Two-eyes → Advisor review → approve → apply)
--
-- DEV precheck (CLEAN · 2026-06-25 · เงื่อนไขก่อนเขียน constraint):
--   • SELECT count(*) FROM wallets WHERE balance < 0                                       = 0 rows  ✓
--   • escrow_holds duplicate locked (transaction_ref,count>1 WHERE state='locked')          = empty   ✓
--   • offers duplicate selected   (listing_meta_id,count>1 WHERE status='selected')         = empty   ✓
--
-- (a) escrow_holds partial unique idx: ≤1 active locked escrow ต่อ transaction (กัน double-lock
--     · รับประกัน findLockedHold() "1 active")
-- (b) offers partial unique idx: ≤1 selected offer ต่อ listing (S2 · กัน double-select split-brain)
-- (c) wallets balance >= 0 (B3 · DB net กัน TOCTOU mint Gold · เสริม app-layer check ใน debitGold)
-- idempotent ทั้งหมด (IF NOT EXISTS / pg_constraint guard).
--
-- Rollback:
--   ALTER TABLE "wallets" DROP CONSTRAINT IF EXISTS "chk_wallets_balance_nonneg";
--   DROP INDEX IF EXISTS "idx_offers_one_selected";
--   DROP INDEX IF EXISTS "idx_escrow_holds_one_locked";
--
-- Prereq: 0001 (wallets) · 0030 (offers) · 0034 (escrow_holds) · Branch: feature/d2-resell-slice

CREATE UNIQUE INDEX IF NOT EXISTS "idx_escrow_holds_one_locked"
  ON "escrow_holds" ("transaction_ref")
  WHERE "state" = 'locked';

CREATE UNIQUE INDEX IF NOT EXISTS "idx_offers_one_selected"
  ON "offers" ("listing_meta_id")
  WHERE "status" = 'selected';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_wallets_balance_nonneg') THEN
    ALTER TABLE "wallets" ADD CONSTRAINT "chk_wallets_balance_nonneg" CHECK ("balance" >= 0);
  END IF;
END $$;
