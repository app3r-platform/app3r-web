-- Migration: 0034_d1_escrow_holds
-- DB-phase D1 (Gen 122 · R1c FULL-LOCK · D-D1RULINGS-Gen122)
--
-- escrow_holds = SINGLE-SOURCE full-lock escrow for ALL domains (listing resell/scrap + parts).
-- NOT two-phase 30/70 (D83 supersede D004 · DROP phase1/phase2 · Point REFINED v2).
--   lock@matched (debit/spend payer) → released@completed (credit/earn recipient · net after fee)
--   | refunded@cancelled (credit/refund payer). platform_fee@release = debit → platform revenue acct.
--   payer/recipient explicit → Scrap reverse (payer=WeeeR → recipient=WeeeU). Gold only (cash).
--   point_ledger link = reverse via reference='escrow:{holdId}' (no FK column here).
--
-- Also converges parts_orders: escrow_ledger_id (FK→point_ledger) → escrow_hold_id (FK→escrow_holds).
--   parts_orders empty in DEV (0 rows · escrow_ledger_id all NULL) → safe drop · @needs-point-review RESOLVED.
--
-- Rollback:
--   ALTER TABLE "parts_orders" DROP COLUMN IF EXISTS "escrow_hold_id";
--   ALTER TABLE "parts_orders" ADD COLUMN IF NOT EXISTS "escrow_ledger_id" uuid REFERENCES "point_ledger"("id");
--   DROP TABLE IF EXISTS "escrow_holds";
--
-- Prereq: 0001 (users/point_ledger/wallets) · 0008 (parts_orders) · Branch: feature/db-d1-core-schema

CREATE TABLE IF NOT EXISTS "escrow_holds" (
  "id"                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "transaction_ref"     uuid        NOT NULL,
  "payer_user_id"       uuid        NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "recipient_user_id"   uuid        NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "point_type"          varchar(20) NOT NULL DEFAULT 'cash',
  "total_amount"        integer     NOT NULL,
  "state"               varchar(20) NOT NULL DEFAULT 'locked',
  "platform_fee_amount" integer     NOT NULL DEFAULT 0,
  "fee_config_snapshot" jsonb,
  "created_at"          timestamptz NOT NULL DEFAULT now(),
  "updated_at"          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "chk_escrow_holds_state"      CHECK ("state" IN ('locked','released','refunded')),
  CONSTRAINT "chk_escrow_holds_point_type" CHECK ("point_type" = 'cash')
);

CREATE INDEX IF NOT EXISTS "idx_escrow_holds_transaction" ON "escrow_holds" ("transaction_ref");
CREATE INDEX IF NOT EXISTS "idx_escrow_holds_payer"       ON "escrow_holds" ("payer_user_id");
CREATE INDEX IF NOT EXISTS "idx_escrow_holds_recipient"   ON "escrow_holds" ("recipient_user_id");
CREATE INDEX IF NOT EXISTS "idx_escrow_holds_state"       ON "escrow_holds" ("state");

COMMENT ON TABLE "escrow_holds"
  IS 'D1 Gen122 R1c: single-source full-lock escrow (all domains). lock@matched/release@completed/refund@cancelled. payer/recipient explicit (Scrap reverse). Gold only.';

-- ── parts_orders converge: escrow_ledger_id → escrow_hold_id (@needs-point-review RESOLVED) ──
ALTER TABLE "parts_orders" ADD COLUMN IF NOT EXISTS "escrow_hold_id" uuid REFERENCES "escrow_holds"("id");
ALTER TABLE "parts_orders" DROP COLUMN IF EXISTS "escrow_ledger_id";
