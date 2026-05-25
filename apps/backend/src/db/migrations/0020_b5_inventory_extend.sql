-- Migration: 0020_b5_inventory_extend
-- B5-Backend: Extend Inventory Schema + Stock Movements Table
--
-- Changes:
--   1. ALTER TABLE parts_inventory — add source_type, reserved_quantity, scrap_source_id
--   2. CREATE TABLE inventory_stock_movements
--
-- Prereq: 0002_same_the_fury.sql (parts_inventory must exist)
-- Branch: backend/b5-inventory · 2026-05-25
--
-- Rollback:
--   DROP TABLE IF EXISTS "inventory_stock_movements";
--   ALTER TABLE "parts_inventory"
--     DROP COLUMN IF EXISTS "source_type",
--     DROP COLUMN IF EXISTS "reserved_quantity",
--     DROP COLUMN IF EXISTS "scrap_source_id";

-- ── 1. Extend parts_inventory ─────────────────────────────────────────────────

ALTER TABLE "parts_inventory"
  ADD COLUMN IF NOT EXISTS "source_type"        TEXT        NOT NULL DEFAULT 'NEW',
  ADD COLUMN IF NOT EXISTS "reserved_quantity"  INTEGER     NOT NULL DEFAULT 0,
  -- scrap_source_id: FK → scrap_jobs.id จะเพิ่ม FK constraint เมื่อ scrap module พร้อม
  ADD COLUMN IF NOT EXISTS "scrap_source_id"    UUID;

-- source_type CHECK constraint: 'NEW' | 'USED' | 'DISASSEMBLED'
ALTER TABLE "parts_inventory"
  DROP CONSTRAINT IF EXISTS "chk_parts_inventory_source_type";
ALTER TABLE "parts_inventory"
  ADD CONSTRAINT "chk_parts_inventory_source_type"
  CHECK ("source_type" IN ('NEW', 'USED', 'DISASSEMBLED'));

-- reserved_quantity ต้องไม่ติดลบ และ ≤ stock_quantity
ALTER TABLE "parts_inventory"
  DROP CONSTRAINT IF EXISTS "chk_parts_inventory_reserved_lte_stock";
ALTER TABLE "parts_inventory"
  ADD CONSTRAINT "chk_parts_inventory_reserved_lte_stock"
  CHECK ("reserved_quantity" >= 0 AND "reserved_quantity" <= "stock_quantity");

-- Index สำหรับ filter by source_type
CREATE INDEX IF NOT EXISTS "idx_parts_inventory_source_type"
  ON "parts_inventory" ("source_type");

COMMENT ON COLUMN "parts_inventory"."source_type"
  IS 'แหล่งที่มา: NEW=ซื้อใหม่, USED=ถอดจากเครื่อง, DISASSEMBLED=แยกจากซาก';
COMMENT ON COLUMN "parts_inventory"."reserved_quantity"
  IS 'จำนวนที่จองไว้ — available = stock_quantity - reserved_quantity';
COMMENT ON COLUMN "parts_inventory"."scrap_source_id"
  IS 'FK → scrap_jobs.id (DISASSEMBLED only) — FK constraint เพิ่มเมื่อ scrap module พร้อม';

-- ── 2. Create inventory_stock_movements ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS "inventory_stock_movements" (
  "id"                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- FK → parts_inventory (CASCADE: ลบ item → ลบ movements ด้วย)
  "inventory_item_id" UUID        NOT NULL
                      REFERENCES "parts_inventory"("id") ON DELETE CASCADE,

  -- ประเภทการเคลื่อนไหว
  "movement_type"     TEXT        NOT NULL,

  -- delta: +บวก = เพิ่ม, -ลบ = ลด
  "quantity_delta"    INTEGER     NOT NULL,

  -- บริบท: 'repair_job' | 'parts_order' | 'manual' | 'scrap'
  "reference_type"    TEXT,

  -- UUID ของ entity ที่เกี่ยวข้อง (nullable)
  "reference_id"      UUID,

  -- หมายเหตุ (ADJUST/MANUAL)
  "note"              TEXT,

  -- ผู้ทำ action
  "created_by"        UUID        NOT NULL
                      REFERENCES "users"("id") ON DELETE RESTRICT,

  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CHECK constraint สำหรับ movement_type
ALTER TABLE "inventory_stock_movements"
  DROP CONSTRAINT IF EXISTS "chk_stock_movements_type";
ALTER TABLE "inventory_stock_movements"
  ADD CONSTRAINT "chk_stock_movements_type"
  CHECK ("movement_type" IN ('IN', 'OUT', 'RESERVE', 'RELEASE', 'ADJUST'));

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_stock_movements_item"
  ON "inventory_stock_movements" ("inventory_item_id");

CREATE INDEX IF NOT EXISTS "idx_stock_movements_type"
  ON "inventory_stock_movements" ("movement_type");

CREATE INDEX IF NOT EXISTS "idx_stock_movements_ref"
  ON "inventory_stock_movements" ("reference_type", "reference_id");

CREATE INDEX IF NOT EXISTS "idx_stock_movements_created_by"
  ON "inventory_stock_movements" ("created_by");

-- created_at DESC สำหรับ audit log pagination
CREATE INDEX IF NOT EXISTS "idx_stock_movements_item_time"
  ON "inventory_stock_movements" ("inventory_item_id", "created_at" DESC);

COMMENT ON TABLE "inventory_stock_movements"
  IS 'B5-Backend: Stock movement audit log — IN/OUT/RESERVE/RELEASE/ADJUST';
COMMENT ON COLUMN "inventory_stock_movements"."quantity_delta"
  IS '+บวก = เพิ่ม stock, -ลบ = ลด stock';
