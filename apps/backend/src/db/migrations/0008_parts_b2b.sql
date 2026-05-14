-- Migration: 0008_parts_b2b.sql
-- Sub-CMD-8 Wave 3: Parts Marketplace B2B
-- ⚠️ R2: run หลัง HUB approve เท่านั้น — ห้าม apply ตรง production โดยไม่ผ่าน HUB
--
-- Changes:
--   1. ALTER TABLE parts_orders — เพิ่ม B2B fulfillment columns
--   2. CREATE TABLE parts_order_events — audit trail (Security Rule #5)
--   3. CREATE TABLE parts_disputes — dispute + admin override (R3)
--   4. CREATE TABLE parts_ratings — buyer rates seller after close
--
-- Depends on: NOTE-SUB4 (parts_orders, parts_inventory, users tables must exist)
-- Rollback: see bottom of file

-- ── 1. ALTER parts_orders: add B2B fulfillment fields ────────────────────────
ALTER TABLE "parts_orders"
  ADD COLUMN IF NOT EXISTS "fulfillment_note"  TEXT,
  ADD COLUMN IF NOT EXISTS "tracking_number"   TEXT,
  ADD COLUMN IF NOT EXISTS "fulfilled_at"      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "closed_at"         TIMESTAMPTZ;

-- New status values (TEXT column รองรับอยู่แล้ว — ไม่ต้อง ALTER type):
--   'pending' | 'held' | 'fulfilled' | 'closed'
--   | 'disputed' | 'resolved' | 'refunded' | 'cancelled'

-- ── 2. CREATE TABLE parts_order_events (audit trail) ─────────────────────────
CREATE TABLE IF NOT EXISTS "parts_order_events" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id"    UUID NOT NULL
                  REFERENCES "parts_orders" ("id") ON DELETE CASCADE,
  -- 'created' | 'held' | 'fulfilled' | 'closed'
  -- | 'disputed' | 'resolved_buyer' | 'resolved_seller'
  -- | 'refunded' | 'rated' | 'cancelled'
  "event_type"  TEXT NOT NULL,
  "actor_id"    UUID REFERENCES "users" ("id") ON DELETE SET NULL,
  "old_status"  TEXT,
  "new_status"  TEXT,
  "detail"      TEXT,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_order_events_order"
  ON "parts_order_events" ("order_id", "created_at");

-- ── 3. CREATE TABLE parts_disputes ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "parts_disputes" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id"     UUID NOT NULL
                   REFERENCES "parts_orders" ("id") ON DELETE CASCADE,
  "raised_by"    UUID NOT NULL REFERENCES "users" ("id") ON DELETE RESTRICT,
  "reason"       TEXT NOT NULL,
  -- 'open' | 'admin_reviewing' | 'resolved_buyer' | 'resolved_seller' | 'withdrawn'
  "status"       TEXT NOT NULL DEFAULT 'open',
  "resolution"   TEXT,
  "resolved_by"  UUID REFERENCES "users" ("id") ON DELETE SET NULL,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "resolved_at"  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "idx_disputes_order"
  ON "parts_disputes" ("order_id");

CREATE INDEX IF NOT EXISTS "idx_disputes_status"
  ON "parts_disputes" ("status");

-- ── 4. CREATE TABLE parts_ratings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "parts_ratings" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id"   UUID NOT NULL UNIQUE
                 REFERENCES "parts_orders" ("id") ON DELETE CASCADE,
  "rated_by"   UUID NOT NULL REFERENCES "users" ("id") ON DELETE RESTRICT,
  "seller_id"  UUID NOT NULL REFERENCES "users" ("id") ON DELETE RESTRICT,
  "score"      INTEGER NOT NULL CHECK ("score" >= 1 AND "score" <= 5),
  "comment"    TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_ratings_order_unique"
  ON "parts_ratings" ("order_id");

CREATE INDEX IF NOT EXISTS "idx_ratings_seller"
  ON "parts_ratings" ("seller_id");

-- ── Rollback ───────────────────────────────────────────────────────────────────
-- To rollback this migration (in order — FK dependencies first):
--
-- DROP INDEX IF EXISTS "idx_ratings_seller";
-- DROP INDEX IF EXISTS "idx_ratings_order_unique";
-- DROP TABLE IF EXISTS "parts_ratings";
--
-- DROP INDEX IF EXISTS "idx_disputes_status";
-- DROP INDEX IF EXISTS "idx_disputes_order";
-- DROP TABLE IF EXISTS "parts_disputes";
--
-- DROP INDEX IF EXISTS "idx_order_events_order";
-- DROP TABLE IF EXISTS "parts_order_events";
--
-- ALTER TABLE "parts_orders"
--   DROP COLUMN IF EXISTS "closed_at",
--   DROP COLUMN IF EXISTS "fulfilled_at",
--   DROP COLUMN IF EXISTS "tracking_number",
--   DROP COLUMN IF EXISTS "fulfillment_note";
--
-- Note: does NOT affect parts_orders or parts_inventory base data
