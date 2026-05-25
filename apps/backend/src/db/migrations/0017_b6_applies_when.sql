-- Migration: 0017_b6_applies_when
-- B6 Gap #1: เพิ่ม applies_when JSONB ใน used_pricing_deductions
--
-- Additive migration — ไม่กระทบ Repair domain หรือ schema เดิม
-- Column nullable DEFAULT NULL = backward compatible (existing rows = apply เสมอ)
--
-- applies_when JSONB pattern (เหมือน triggers_when ใน used_pricing_reject_rules):
--   NULL                                          = apply เสมอ (unconditional)
--   { "dimension": "accessory", "value": "no_charger" }  = single condition
--   { "and": [{"dimension":"x","value":"y"}, {...}] }     = compound AND
--   { "or":  [{"dimension":"x","value":"y"}, {...}] }     = compound OR
--
-- Decision: 36b813ec-7277-8121-920e-c5fdc5d4a860
-- Prereq: 0014_repair_pricing (used_pricing_deductions must exist)
-- Maintain Gen 4 · 2026-05-25

ALTER TABLE "used_pricing_deductions"
  ADD COLUMN IF NOT EXISTS "applies_when" jsonb DEFAULT NULL;

-- GIN index สำหรับ JSONB containment queries (@>, ?)
-- ใช้ USING gin เพื่อ support @> operator ใน conditional deduction lookup
CREATE INDEX IF NOT EXISTS "idx_upd_applies_when"
  ON "used_pricing_deductions" USING gin ("applies_when");

COMMENT ON COLUMN "used_pricing_deductions"."applies_when"
  IS 'B6 Gap #1: condition JSON สำหรับ conditional deduction — NULL = apply เสมอ (backward compat)';
