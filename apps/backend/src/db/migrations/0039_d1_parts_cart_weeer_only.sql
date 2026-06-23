-- Migration: 0039_d1_parts_cart_weeer_only
-- DB-phase D1 (Gen 122 · R7: Parts B2B = WeeeR↔WeeeR)
--
-- Remove 'weeet' from parts_cart_items.buyer_role — no WeeeT payment path.
-- (WeeeT เลือกอะไหล่ได้ แต่ ร้าน WeeeR เป็นผู้ชำระ · Advisor Gen 118 ruling ข · ต่อยอด #117-F)
-- parts_cart_items empty in DEV (0 rows · 0 weeet) → safe tighten.
-- Idempotent: DROP CONSTRAINT IF EXISTS + ADD.
--
-- Rollback:
--   ALTER TABLE "parts_cart_items" DROP CONSTRAINT IF EXISTS "chk_parts_cart_buyer_role";
--   ALTER TABLE "parts_cart_items" ADD CONSTRAINT "chk_parts_cart_buyer_role" CHECK ("buyer_role" IN ('weeer','weeet'));
--
-- Prereq: 0021 (parts_cart_items) · Branch: feature/db-d1-core-schema

ALTER TABLE "parts_cart_items" DROP CONSTRAINT IF EXISTS "chk_parts_cart_buyer_role";
ALTER TABLE "parts_cart_items"
  ADD CONSTRAINT "chk_parts_cart_buyer_role" CHECK ("buyer_role" IN ('weeer'));
