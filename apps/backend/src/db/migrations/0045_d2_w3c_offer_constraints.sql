-- Migration: 0045_d2_w3c_offer_constraints
-- D2 Resell Slice · Wave 3c (F7 · GAP-2 + GAP-4)
-- ⚠️ DRAFT — ❌ ยังไม่ apply DEV (sub-gate: HUB Two-eyes verify-NOT-applied → Advisor review → greenlight → apply)
--
-- precheck (ต้อง CLEAN ก่อน apply · กัน existing-row violation):
--   • SELECT count(*) FROM offers       WHERE offer_price <= 0                                            = 0 rows
--   • SELECT count(*) FROM escrow_holds  WHERE total_amount <= 0                                           = 0 rows
--   • SELECT listing_meta_id, buyer_id, count(*) FROM offers WHERE status='pending'
--       GROUP BY 1,2 HAVING count(*) > 1                                                                  = empty
--
-- (a) GAP-2: offers.offer_price > 0          (Gold positive · เสริม zod app-layer z.int().positive())
-- (b) GAP-2: escrow_holds.total_amount > 0   (money positivity · เสริม wallets balance>=0 ของ 0044)
-- (c) GAP-4: ≤1 pending offer ต่อ (listing_meta_id, buyer_id) — dedupe (กัน buyer spam offer ซ้ำ listing เดียว)
-- idempotent ทั้งหมด (pg_constraint guard / IF NOT EXISTS).
--
-- Rollback:
--   DROP INDEX IF EXISTS "idx_offers_one_pending_per_buyer";
--   ALTER TABLE "escrow_holds" DROP CONSTRAINT IF EXISTS "chk_escrow_holds_total_positive";
--   ALTER TABLE "offers"       DROP CONSTRAINT IF EXISTS "chk_offers_price_positive";
--
-- Prereq: 0030 (offers) · 0034 (escrow_holds) · 0043/0044 (W2/W2.1) · Branch: feature/d2-resell-slice

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_offers_price_positive') THEN
    ALTER TABLE "offers" ADD CONSTRAINT "chk_offers_price_positive" CHECK ("offer_price" > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_escrow_holds_total_positive') THEN
    ALTER TABLE "escrow_holds" ADD CONSTRAINT "chk_escrow_holds_total_positive" CHECK ("total_amount" > 0);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_offers_one_pending_per_buyer"
  ON "offers" ("listing_meta_id", "buyer_id")
  WHERE "status" = 'pending';
