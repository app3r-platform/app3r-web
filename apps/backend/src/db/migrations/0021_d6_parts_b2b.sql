-- Migration: 0021_d6_parts_b2b
-- D-6 Parts B2B: 6 new tables + additive column on parts_orders
--
-- New tables (6):
--   1. parts_listings       — public catalog (แยกจาก parts_inventory)
--   2. parts_cart_items     — ตะกร้า buyer (expire 24h)
--   3. parts_order_items    — line items multi-item order (additive)
--   4. parts_requests       — cross-shop broadcast request
--   5. parts_request_quotes — ตอบ quote ใน parts_requests
--   6. parts_returns        — defective return (แยกจาก dispute)
--
-- Altered tables (1):
--   parts_orders — ADD COLUMN is_multi_item BOOLEAN DEFAULT false
--
-- Prerequisites:
--   0002 (parts_inventory + users), 0003 (services), 0008 (parts_orders + parts_b2b)
--
-- Rollback:
--   DROP TABLE IF EXISTS "parts_returns" CASCADE;
--   DROP TABLE IF EXISTS "parts_request_quotes" CASCADE;
--   DROP TABLE IF EXISTS "parts_requests" CASCADE;
--   DROP TABLE IF EXISTS "parts_order_items" CASCADE;
--   DROP TABLE IF EXISTS "parts_cart_items" CASCADE;
--   DROP TABLE IF EXISTS "parts_listings" CASCADE;
--   ALTER TABLE "parts_orders" DROP COLUMN IF EXISTS "is_multi_item";
--
-- Branch: parts/d6-parts-b2b · 2026-05-25

-- ── 1. parts_listings (catalog สาธารณะ) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS "parts_listings" (
  "id"                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- WeeeR ที่ลงขาย
  "weeer_user_id"     UUID          NOT NULL
                      REFERENCES "users"("id") ON DELETE CASCADE,

  -- link ไปยัง stock item (nullable — อาจยังไม่มี inventory เชื่อมก็ลงได้)
  "inventory_item_id" UUID
                      REFERENCES "parts_inventory"("id") ON DELETE SET NULL,

  -- source_scrap_id: UUID ไม่ผูก FK — รอ scrap module พร้อม
  -- pattern เดียวกับ 0020_b5_inventory_extend
  "source_scrap_id"   UUID,

  -- แหล่งที่มา: 'new' | 'used' | 'disassembled'
  "source_type"       TEXT          NOT NULL DEFAULT 'new',

  -- ข้อมูลสินค้า
  "part_name"         TEXT          NOT NULL,
  "part_number"       TEXT,
  "manufacturer"      TEXT,

  -- OEM compatibility: [{brand, model, year}]
  "oem_compatibility" JSONB         NOT NULL DEFAULT '[]',

  -- คะแนนสภาพ 1-10
  "condition_score"   INTEGER       NOT NULL DEFAULT 7,

  -- ราคาต่อหน่วย (THB)
  "unit_price"        NUMERIC(10,2) NOT NULL,

  -- tier pricing: [{minQty, maxQty, discount}]
  "tier_pricing"      JSONB         NOT NULL DEFAULT '[]',

  -- stock
  "qty_available"     INTEGER       NOT NULL DEFAULT 0,
  "qty_reserved"      INTEGER       NOT NULL DEFAULT 0,

  -- รูปสินค้า (r2 keys)
  "photos"            JSONB         NOT NULL DEFAULT '[]',

  -- ประกัน (วัน)
  "warranty_days"     INTEGER       NOT NULL DEFAULT 7,

  -- สถานะ: 'active' | 'inactive' | 'sold_out' | 'deleted'
  "status"            TEXT          NOT NULL DEFAULT 'active',

  "created_at"        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE "parts_listings"
  DROP CONSTRAINT IF EXISTS "chk_parts_listings_source_type";
ALTER TABLE "parts_listings"
  ADD CONSTRAINT "chk_parts_listings_source_type"
  CHECK ("source_type" IN ('new', 'used', 'disassembled'));

ALTER TABLE "parts_listings"
  DROP CONSTRAINT IF EXISTS "chk_parts_listings_condition_score";
ALTER TABLE "parts_listings"
  ADD CONSTRAINT "chk_parts_listings_condition_score"
  CHECK ("condition_score" >= 1 AND "condition_score" <= 10);

ALTER TABLE "parts_listings"
  DROP CONSTRAINT IF EXISTS "chk_parts_listings_status";
ALTER TABLE "parts_listings"
  ADD CONSTRAINT "chk_parts_listings_status"
  CHECK ("status" IN ('active', 'inactive', 'sold_out', 'deleted'));

ALTER TABLE "parts_listings"
  DROP CONSTRAINT IF EXISTS "chk_parts_listings_qty";
ALTER TABLE "parts_listings"
  ADD CONSTRAINT "chk_parts_listings_qty"
  CHECK ("qty_available" >= 0 AND "qty_reserved" >= 0);

CREATE INDEX IF NOT EXISTS "idx_parts_listings_seller"
  ON "parts_listings" ("weeer_user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_parts_listings_status"
  ON "parts_listings" ("status");
CREATE INDEX IF NOT EXISTS "idx_parts_listings_part_name"
  ON "parts_listings" ("part_name");
CREATE INDEX IF NOT EXISTS "idx_parts_listings_part_number"
  ON "parts_listings" ("part_number");

COMMENT ON TABLE "parts_listings" IS 'D-6: Public catalog listings (ซื้อขาย B2B)';
COMMENT ON COLUMN "parts_listings"."source_scrap_id"
  IS 'FK → scrap_jobs.id (DISASSEMBLED only) — FK constraint เพิ่มเมื่อ scrap module พร้อม';

-- ── 2. parts_cart_items (ตะกร้า) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "parts_cart_items" (
  "id"          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ผู้ซื้อ (WeeeR หรือ WeeeT)
  "buyer_id"    UUID        NOT NULL
                REFERENCES "users"("id") ON DELETE CASCADE,

  -- role: 'weeer' | 'weeet'
  "buyer_role"  TEXT        NOT NULL,

  -- listing ที่ต้องการ
  "listing_id"  UUID        NOT NULL
                REFERENCES "parts_listings"("id") ON DELETE CASCADE,

  -- จำนวน
  "qty"         INTEGER     NOT NULL DEFAULT 1,

  -- เวลา
  "added_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expires_at"  TIMESTAMPTZ NOT NULL
);

ALTER TABLE "parts_cart_items"
  DROP CONSTRAINT IF EXISTS "chk_parts_cart_buyer_role";
ALTER TABLE "parts_cart_items"
  ADD CONSTRAINT "chk_parts_cart_buyer_role"
  CHECK ("buyer_role" IN ('weeer', 'weeet'));

ALTER TABLE "parts_cart_items"
  DROP CONSTRAINT IF EXISTS "chk_parts_cart_qty";
ALTER TABLE "parts_cart_items"
  ADD CONSTRAINT "chk_parts_cart_qty"
  CHECK ("qty" > 0 AND "qty" <= 50);

-- 1 buyer = 1 cart item per listing
CREATE UNIQUE INDEX IF NOT EXISTS "idx_parts_cart_buyer_listing"
  ON "parts_cart_items" ("buyer_id", "listing_id");
CREATE INDEX IF NOT EXISTS "idx_parts_cart_buyer"
  ON "parts_cart_items" ("buyer_id");
CREATE INDEX IF NOT EXISTS "idx_parts_cart_expires"
  ON "parts_cart_items" ("expires_at");

COMMENT ON TABLE "parts_cart_items" IS 'D-6: Cart items (expire 24h)';

-- ── 3. Additive column: parts_orders.is_multi_item ───────────────────────────
--
-- Sub-8 legacy: single-item (is_multi_item = false, default)
-- D-6 new: multi-item via cart checkout (is_multi_item = true)
-- ไม่กระทบ Sub-8 flow เพราะ default = false

ALTER TABLE "parts_orders"
  ADD COLUMN IF NOT EXISTS "is_multi_item" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "idx_parts_orders_multi"
  ON "parts_orders" ("is_multi_item")
  WHERE "is_multi_item" = true;

COMMENT ON COLUMN "parts_orders"."is_multi_item"
  IS 'D-6: true = cart checkout (parts_order_items), false = Sub-8 legacy single-item';

-- ── 4. parts_order_items (multi-item line items) ──────────────────────────────

CREATE TABLE IF NOT EXISTS "parts_order_items" (
  "id"          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- FK → parts_orders (CASCADE)
  "order_id"    UUID          NOT NULL
                REFERENCES "parts_orders"("id") ON DELETE CASCADE,

  -- FK → parts_listings (SET NULL — listing อาจลบทีหลัง แต่ record ยังอยู่)
  "listing_id"  UUID
                REFERENCES "parts_listings"("id") ON DELETE SET NULL,

  -- จำนวน
  "qty"         INTEGER       NOT NULL,

  -- ราคา snapshot ณ เวลาสั่ง
  "unit_price"  NUMERIC(10,2) NOT NULL,

  -- subtotal = qty × unit_price (หักส่วนลดแล้ว)
  "subtotal"    NUMERIC(12,2) NOT NULL,

  "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE "parts_order_items"
  DROP CONSTRAINT IF EXISTS "chk_parts_order_items_qty";
ALTER TABLE "parts_order_items"
  ADD CONSTRAINT "chk_parts_order_items_qty"
  CHECK ("qty" > 0);

CREATE INDEX IF NOT EXISTS "idx_parts_order_items_order"
  ON "parts_order_items" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_parts_order_items_listing"
  ON "parts_order_items" ("listing_id");

COMMENT ON TABLE "parts_order_items" IS 'D-6: Multi-item order line items (additive)';

-- ── 5. parts_requests (cross-shop broadcast) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS "parts_requests" (
  "id"                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- WeeeR ที่ส่ง broadcast
  "requester_weeer_user_id" UUID          NOT NULL
                            REFERENCES "users"("id") ON DELETE CASCADE,

  -- งานซ่อมที่รออะไหล่ (FK → services.id ไม่ใช่ repair_jobs)
  "for_repair_job_id"       UUID
                            REFERENCES "services"("id") ON DELETE SET NULL,

  -- ร้านที่ต้องการส่งให้โดยตรง (broadcast_scope = 'specific')
  "specific_shop_id"        UUID
                            REFERENCES "users"("id") ON DELETE SET NULL,

  -- order ที่ match แล้ว (เมื่อ accept quote)
  "matched_order_id"        UUID
                            REFERENCES "parts_orders"("id") ON DELETE SET NULL,

  -- ข้อมูลอะไหล่
  "appliance_brand"         TEXT          NOT NULL,
  "appliance_model"         TEXT          NOT NULL,
  "part_name"               TEXT          NOT NULL,
  "part_number"             TEXT,

  -- จำนวน
  "qty_needed"              INTEGER       NOT NULL DEFAULT 1,

  -- ความเร่งด่วน: 'normal' | 'urgent' | 'emergency'
  "urgency"                 TEXT          NOT NULL DEFAULT 'normal',

  -- วันที่ต้องการ
  "needed_by"               TIMESTAMPTZ,

  -- สภาพที่ต้องการ (nullable)
  "preferred_condition"     TEXT,

  -- ราคาสูงสุดต่อหน่วย
  "max_price_per_unit"      NUMERIC(10,2),

  -- ขอบเขต broadcast: 'nearby' | 'all' | 'specific'
  "broadcast_scope"         TEXT          NOT NULL DEFAULT 'all',

  -- สถานะ: 'open' | 'quoted' | 'matched' | 'expired'
  "status"                  TEXT          NOT NULL DEFAULT 'open',

  -- หมดอายุ
  "expires_at"              TIMESTAMPTZ   NOT NULL,

  "created_at"              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE "parts_requests"
  DROP CONSTRAINT IF EXISTS "chk_parts_requests_urgency";
ALTER TABLE "parts_requests"
  ADD CONSTRAINT "chk_parts_requests_urgency"
  CHECK ("urgency" IN ('normal', 'urgent', 'emergency'));

ALTER TABLE "parts_requests"
  DROP CONSTRAINT IF EXISTS "chk_parts_requests_scope";
ALTER TABLE "parts_requests"
  ADD CONSTRAINT "chk_parts_requests_scope"
  CHECK ("broadcast_scope" IN ('nearby', 'all', 'specific'));

ALTER TABLE "parts_requests"
  DROP CONSTRAINT IF EXISTS "chk_parts_requests_status";
ALTER TABLE "parts_requests"
  ADD CONSTRAINT "chk_parts_requests_status"
  CHECK ("status" IN ('open', 'quoted', 'matched', 'expired'));

CREATE INDEX IF NOT EXISTS "idx_parts_requests_requester"
  ON "parts_requests" ("requester_weeer_user_id");
CREATE INDEX IF NOT EXISTS "idx_parts_requests_status"
  ON "parts_requests" ("status");
CREATE INDEX IF NOT EXISTS "idx_parts_requests_expires"
  ON "parts_requests" ("expires_at");
CREATE INDEX IF NOT EXISTS "idx_parts_requests_urgency"
  ON "parts_requests" ("urgency");

COMMENT ON TABLE "parts_requests" IS 'D-6: Cross-shop broadcast request (WeeeR ขออะไหล่จากร้านอื่น)';
COMMENT ON COLUMN "parts_requests"."for_repair_job_id"
  IS 'FK → services.id (ไม่ใช่ repair_jobs) — repair workflow ใช้ services เป็น canonical entity';

-- ── 6. parts_request_quotes (ตอบ quote) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS "parts_request_quotes" (
  "id"                       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- request ที่ตอบ
  "request_id"               UUID          NOT NULL
                             REFERENCES "parts_requests"("id") ON DELETE CASCADE,

  -- WeeeR ที่เสนอราคา
  "responder_weeer_user_id"  UUID          NOT NULL
                             REFERENCES "users"("id") ON DELETE CASCADE,

  -- listing ที่จะขาย (nullable — อาจ quote ก่อนมี listing)
  "listing_id"               UUID
                             REFERENCES "parts_listings"("id") ON DELETE SET NULL,

  -- ราคาที่เสนอ
  "quoted_price_per_unit"    NUMERIC(10,2) NOT NULL,

  -- จำนวนที่พร้อมขาย
  "available_qty"            INTEGER       NOT NULL,

  -- วันส่ง (วัน)
  "estimated_delivery_days"  INTEGER,

  -- หมายเหตุ
  "notes"                    TEXT,

  -- สถานะ: 'pending' | 'accepted' | 'rejected' | 'expired'
  "status"                   TEXT          NOT NULL DEFAULT 'pending',

  "created_at"               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE "parts_request_quotes"
  DROP CONSTRAINT IF EXISTS "chk_parts_request_quotes_status";
ALTER TABLE "parts_request_quotes"
  ADD CONSTRAINT "chk_parts_request_quotes_status"
  CHECK ("status" IN ('pending', 'accepted', 'rejected', 'expired'));

CREATE INDEX IF NOT EXISTS "idx_parts_request_quotes_request"
  ON "parts_request_quotes" ("request_id");
CREATE INDEX IF NOT EXISTS "idx_parts_request_quotes_responder"
  ON "parts_request_quotes" ("responder_weeer_user_id");
CREATE INDEX IF NOT EXISTS "idx_parts_request_quotes_status"
  ON "parts_request_quotes" ("status");

COMMENT ON TABLE "parts_request_quotes" IS 'D-6: Quote responses to cross-shop broadcast requests';

-- ── 7. parts_returns (defective return) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS "parts_returns" (
  "id"                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- order ที่ขอคืน
  "order_id"          UUID        NOT NULL
                      REFERENCES "parts_orders"("id") ON DELETE CASCADE,

  -- ผู้รายงาน (buyer: WeeeR หรือ WeeeT)
  "reported_by"       UUID        NOT NULL
                      REFERENCES "users"("id") ON DELETE RESTRICT,

  -- เหตุผล: 'defective' | 'wrong_part' | 'mismatch' | 'quality'
  "reason"            TEXT        NOT NULL,

  -- คำอธิบาย
  "defect_description" TEXT       NOT NULL,

  -- หลักฐาน (r2 keys)
  "evidence_photos"   TEXT[],

  -- สถานะ: 'pending' | 'approved' | 'rejected' | 'completed'
  "status"            TEXT        NOT NULL DEFAULT 'pending',

  -- วิธีแก้ไข: 'refund' | 'replace' | 'credit' (set เมื่อ approved)
  "resolution_type"   TEXT,

  -- ผู้ resolve (null = pending)
  "resolved_by"       UUID
                      REFERENCES "users"("id") ON DELETE SET NULL,

  "resolved_at"       TIMESTAMPTZ,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "parts_returns"
  DROP CONSTRAINT IF EXISTS "chk_parts_returns_reason";
ALTER TABLE "parts_returns"
  ADD CONSTRAINT "chk_parts_returns_reason"
  CHECK ("reason" IN ('defective', 'wrong_part', 'mismatch', 'quality'));

ALTER TABLE "parts_returns"
  DROP CONSTRAINT IF EXISTS "chk_parts_returns_status";
ALTER TABLE "parts_returns"
  ADD CONSTRAINT "chk_parts_returns_status"
  CHECK ("status" IN ('pending', 'approved', 'rejected', 'completed'));

ALTER TABLE "parts_returns"
  DROP CONSTRAINT IF EXISTS "chk_parts_returns_resolution_type";
ALTER TABLE "parts_returns"
  ADD CONSTRAINT "chk_parts_returns_resolution_type"
  CHECK ("resolution_type" IS NULL
      OR "resolution_type" IN ('refund', 'replace', 'credit'));

CREATE INDEX IF NOT EXISTS "idx_parts_returns_order"
  ON "parts_returns" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_parts_returns_reporter"
  ON "parts_returns" ("reported_by");
CREATE INDEX IF NOT EXISTS "idx_parts_returns_status"
  ON "parts_returns" ("status");

COMMENT ON TABLE "parts_returns" IS 'D-6: Defective return requests (แยกจาก parts_disputes)';
