/**
 * repair-pricing.ts — Round 3: B6 Used Pricing Wizard
 *
 * 8 tables:
 *   used_pricing_categories       — หมวดหมู่สินค้ามือสอง
 *   used_pricing_models           — รุ่นเครื่องใช้ไฟฟ้า (spec_attributes JSONB)
 *   used_pricing_dimensions       — มิติที่กำหนดราคา (เช่น ความจุ, อายุ, สภาพ)
 *   used_pricing_dimension_values — ค่าที่เป็นไปได้ต่อ dimension
 *   used_pricing_price_points     — ราคาต่อ dimension combo (dimensions_hash fast lookup)
 *   used_pricing_deductions       — ตัวหักลด (condition/missing parts/age …)
 *   used_pricing_reject_rules     — เกณฑ์ปฏิเสธรับซื้อ
 *   used_pricing_wizard_sessions  — session ที่ WeeeU/Admin กรอก B6 Wizard
 *
 * SQL Reference: schemas/repair-domain/gen60-reverse-design/round3_used_pricing_schema.sql
 * Migration: apps/backend/src/db/migrations/0014_repair_pricing.sql
 * Prereq: 0012_repair_master_data (repair_appliance_categories FK)
 *
 * Design notes:
 *   - dimensions_hash VARCHAR(64) = SHA-256 ของ JSON.stringify(dimensions sorted)
 *     → fast lookup แทน JSONB containment scan ที่ช้ากว่า
 *   - GIN indexes บน JSONB columns สำหรับ containment queries (@>, ?)
 *   - applied_deductions UUID[] = array ของ deduction ids ที่ใช้ใน session นั้น
 */
import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  numeric,
  jsonb,
  text,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { repairApplianceCategories } from './repair-master-data'

// ── 1. used_pricing_categories ────────────────────────────────────────────────
// หมวดหมู่สินค้าสำหรับ B6 Wizard (อาจ map ตรงหรือไม่ตรงกับ repair categories)
export const usedPricingCategories = pgTable(
  'used_pricing_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    labelTh: varchar('label_th', { length: 100 }).notNull(),
    labelEn: varchar('label_en', { length: 100 }),
    // nullable: pricing category อาจไม่ map ตรงกับ repair appliance category
    applianceCategoryId: uuid('appliance_category_id')
      .references(() => repairApplianceCategories.id),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_used_pricing_categories_active').on(table.isActive, table.sortOrder),
  ],
)

// ── 2. used_pricing_models ────────────────────────────────────────────────────
// รุ่นเครื่องใช้ไฟฟ้า (Admin-managed catalog)
// spec_attributes JSONB: { capacity: '7kg', inverter: true, series: 'XX-3000' }
export const usedPricingModels = pgTable(
  'used_pricing_models',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => usedPricingCategories.id),
    // unique per (category_id, code)
    code: varchar('code', { length: 50 }).notNull(),
    labelTh: varchar('label_th', { length: 255 }).notNull(),
    labelEn: varchar('label_en', { length: 255 }),
    brand: varchar('brand', { length: 100 }),
    // ข้อมูล spec ที่ใช้ filter/match รุ่น (GIN indexed)
    specAttributes: jsonb('spec_attributes').notNull().default(sql`'{}'::jsonb`),
    // ราคาตลาดอ้างอิง (base ก่อนหัก deductions)
    baseMarketPrice: numeric('base_market_price', { precision: 12, scale: 2 }),
    // TD-W3-02: nullable admin note — synced with seeds 0019/0024 + migration 0018_used_pricing_notes
    notes: text('notes'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_used_pricing_models_category_code').on(table.categoryId, table.code),
    index('idx_used_pricing_models_category').on(table.categoryId),
    // GIN index สำหรับ spec_attributes JSONB containment queries
    index('idx_used_pricing_models_specs').using('gin', table.specAttributes),
  ],
)

// ── 3. used_pricing_dimensions ────────────────────────────────────────────────
// มิติที่กำหนดราคา เช่น 'condition', 'capacity', 'age_years', 'color'
// kind: ENUM (dropdown) / NUMERIC / BOOLEAN / TEXT
export const usedPricingDimensions = pgTable(
  'used_pricing_dimensions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => usedPricingCategories.id, { onDelete: 'cascade' }),
    // unique per (category_id, code)
    code: varchar('code', { length: 50 }).notNull(),
    labelTh: varchar('label_th', { length: 100 }).notNull(),
    labelEn: varchar('label_en', { length: 100 }),
    // 'ENUM' | 'NUMERIC' | 'BOOLEAN' | 'TEXT'
    kind: varchar('kind', { length: 20 }).notNull(),
    // dimension นี้ใช้กำหนดราคาหลักหรือไม่ (เช่น ความจุ = price axis)
    isPriceAxis: boolean('is_price_axis').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_used_pricing_dimensions_category_code').on(table.categoryId, table.code),
    index('idx_used_pricing_dimensions_category').on(table.categoryId),
  ],
)

// ── 4. used_pricing_dimension_values ─────────────────────────────────────────
// ค่าที่เป็นไปได้ของ dimension ประเภท ENUM (dropdown choices)
export const usedPricingDimensionValues = pgTable(
  'used_pricing_dimension_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    dimensionId: uuid('dimension_id')
      .notNull()
      .references(() => usedPricingDimensions.id, { onDelete: 'cascade' }),
    // unique per (dimension_id, code)
    code: varchar('code', { length: 50 }).notNull(),
    labelTh: varchar('label_th', { length: 100 }).notNull(),
    labelEn: varchar('label_en', { length: 100 }),
    // ค่าตัวเลข (สำหรับ NUMERIC dimension หรือ range comparison)
    numericValue: numeric('numeric_value', { precision: 12, scale: 4 }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [
    uniqueIndex('idx_used_pricing_dimension_values_dim_code').on(table.dimensionId, table.code),
    index('idx_used_pricing_dimension_values_dim').on(table.dimensionId),
  ],
)

// ── 5. used_pricing_price_points ──────────────────────────────────────────────
// ราคาต่อ dimension combination ของ model
// dimensions_hash: SHA-256 ของ JSON.stringify(sorted dimensions)
//   → fast lookup: WHERE model_id = ? AND dimensions_hash = ? (index scan)
//   → แทน JSONB @> operator ที่ช้ากว่า
export const usedPricingPricePoints = pgTable(
  'used_pricing_price_points',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    modelId: uuid('model_id')
      .notNull()
      .references(() => usedPricingModels.id, { onDelete: 'cascade' }),
    // { dimension_code: value_code, ... } — full dimension state ที่ใช้ lookup
    dimensions: jsonb('dimensions').notNull().default(sql`'{}'::jsonb`),
    // SHA-256 hash ของ JSON dimensions (64 hex chars)
    dimensionsHash: varchar('dimensions_hash', { length: 64 }).notNull(),
    // ราคา multi-issue (หลายปัญหาพร้อมกัน) vs single-issue
    isMultiIssue: boolean('is_multi_issue').notNull().default(false),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // UNIQUE: 1 price per (model, dimension hash, multi-issue flag)
    uniqueIndex('idx_used_pricing_price_points_lookup')
      .on(table.modelId, table.dimensionsHash, table.isMultiIssue),
    index('idx_used_pricing_price_points_model').on(table.modelId),
    // GIN index สำหรับ dimensions JSONB containment queries (fallback หาก hash miss)
    index('idx_used_pricing_price_points_dims').using('gin', table.dimensions),
  ],
)

// ── 6. used_pricing_deductions ────────────────────────────────────────────────
// ตัวหักลดราคา (สภาพ, อุปกรณ์ขาด, ปัญหา, อายุ …)
// CHECK constraint: ต้องมีค่าที่ตรงกับ deduction_type
// model_id nullable: null = ใช้กับทุก model ใน category นั้น
export const usedPricingDeductions = pgTable(
  'used_pricing_deductions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => usedPricingCategories.id),
    // nullable: null = deduction ใช้กับทุก model ใน category
    modelId: uuid('model_id')
      .references(() => usedPricingModels.id),
    // 'CONDITION' | 'MISSING_ACCESSORY' | 'PROBLEM' | 'AGE' | 'OTHER'
    kind: varchar('kind', { length: 30 }).notNull(),
    // 'FIXED' | 'PERCENT' | 'RANGE'
    deductionType: varchar('deduction_type', { length: 20 }).notNull(),
    labelTh: varchar('label_th', { length: 255 }).notNull(),
    labelEn: varchar('label_en', { length: 255 }),
    // ใช้ตาม deduction_type (CHECK constraint ใน migration SQL):
    //   FIXED   → fixed_amount NOT NULL
    //   PERCENT → percent_amount NOT NULL
    //   RANGE   → range_min + range_max NOT NULL
    fixedAmount: numeric('fixed_amount', { precision: 12, scale: 2 }),
    percentAmount: numeric('percent_amount', { precision: 5, scale: 2 }),
    rangeMin: numeric('range_min', { precision: 12, scale: 2 }),
    rangeMax: numeric('range_max', { precision: 12, scale: 2 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    // B6 Gap #1: applies_when — condition JSON สำหรับ conditional deduction
    // NULL = apply เสมอ (backward compatible)
    // { "dimension": "accessory", "value": "no_charger" }
    // { "and": [{"dimension":"x","value":"y"}, {...}] }
    // pattern เดียวกับ triggers_when (additive migration 0017)
    appliesWhen: jsonb('applies_when').default(sql`NULL`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_used_pricing_deductions_category').on(table.categoryId),
    index('idx_used_pricing_deductions_model').on(table.modelId),
    index('idx_used_pricing_deductions_kind').on(table.kind),
    index('idx_used_pricing_deductions_type').on(table.deductionType),
    // GIN index สำหรับ applies_when JSONB containment queries (@>, ?)
    index('idx_upd_applies_when').using('gin', table.appliesWhen),
    // CHECK constraint: ตรวจสอบว่ามีค่าตรงกับ deduction_type
    check(
      'chk_deduction_amounts',
      sql`
        (deduction_type = 'FIXED' AND fixed_amount IS NOT NULL)
        OR (deduction_type = 'PERCENT' AND percent_amount IS NOT NULL)
        OR (deduction_type = 'RANGE' AND range_min IS NOT NULL AND range_max IS NOT NULL)
      `,
    ),
  ],
)

// ── 7. used_pricing_reject_rules ──────────────────────────────────────────────
// เกณฑ์ที่ทำให้ Wizard ปฏิเสธรับซื้อ (เช่น สภาพแย่เกิน, อุปกรณ์ขาดมาก)
// triggers_when JSONB: rule expression ที่ eval ต่อ selected dimensions
export const usedPricingRejectRules = pgTable(
  'used_pricing_reject_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => usedPricingCategories.id),
    labelTh: varchar('label_th', { length: 255 }).notNull(),
    labelEn: varchar('label_en', { length: 255 }),
    // rule expression เช่น: { "dimension": "condition", "value": "beyond_repair" }
    // หรือ complex: { "and": [...] }
    triggersWhen: jsonb('triggers_when').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_used_pricing_reject_rules_category').on(table.categoryId),
    // GIN index สำหรับ rule expression queries
    index('idx_used_pricing_reject_rules_triggers').using('gin', table.triggersWhen),
  ],
)

// ── 8. used_pricing_wizard_sessions ──────────────────────────────────────────
// Session ที่ WeeeU กรอก B6 Wizard (multi-step, savable)
// applied_deductions: UUID[] ของ deduction ที่เลือก
export const usedPricingWizardSessions = pgTable(
  'used_pricing_wizard_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    modelId: uuid('model_id')
      .notNull()
      .references(() => usedPricingModels.id),
    // { dimension_code: selected_value_code, ... }
    selectedDimensions: jsonb('selected_dimensions').notNull().default(sql`'{}'::jsonb`),
    // UUID[] ของ deductions ที่ apply (empty array = ไม่มีการหัก)
    appliedDeductions: uuid('applied_deductions').array().notNull().default(sql`ARRAY[]::uuid[]`),
    // ราคา base ก่อนหัก (จาก price_points lookup)
    basePrice: numeric('base_price', { precision: 12, scale: 2 }),
    // ยอดหักรวม
    totalDeduction: numeric('total_deduction', { precision: 12, scale: 2 }),
    // ราคาสุดท้าย = base_price - total_deduction
    finalPrice: numeric('final_price', { precision: 12, scale: 2 }),
    // ถูก reject โดย reject_rules หรือไม่ (final_price = null ถ้า rejected)
    rejected: boolean('rejected').notNull().default(false),
    // 'in_progress' | 'completed' | 'abandoned'
    status: varchar('status', { length: 30 }).notNull().default('in_progress'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_used_pricing_wizard_sessions_user').on(table.userId),
    index('idx_used_pricing_wizard_sessions_model').on(table.modelId),
    index('idx_used_pricing_wizard_sessions_status').on(table.status),
    index('idx_used_pricing_wizard_sessions_created').on(table.createdAt),
  ],
)

// ── Export types ──────────────────────────────────────────────────────────────
export type UsedPricingCategory = typeof usedPricingCategories.$inferSelect
export type NewUsedPricingCategory = typeof usedPricingCategories.$inferInsert

export type UsedPricingModel = typeof usedPricingModels.$inferSelect
export type NewUsedPricingModel = typeof usedPricingModels.$inferInsert

export type UsedPricingDimension = typeof usedPricingDimensions.$inferSelect
export type NewUsedPricingDimension = typeof usedPricingDimensions.$inferInsert

export type UsedPricingDimensionValue = typeof usedPricingDimensionValues.$inferSelect
export type NewUsedPricingDimensionValue = typeof usedPricingDimensionValues.$inferInsert

export type UsedPricingPricePoint = typeof usedPricingPricePoints.$inferSelect
export type NewUsedPricingPricePoint = typeof usedPricingPricePoints.$inferInsert

export type UsedPricingDeduction = typeof usedPricingDeductions.$inferSelect
export type NewUsedPricingDeduction = typeof usedPricingDeductions.$inferInsert

export type UsedPricingRejectRule = typeof usedPricingRejectRules.$inferSelect
export type NewUsedPricingRejectRule = typeof usedPricingRejectRules.$inferInsert

export type UsedPricingWizardSession = typeof usedPricingWizardSessions.$inferSelect
export type NewUsedPricingWizardSession = typeof usedPricingWizardSessions.$inferInsert
