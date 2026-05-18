/**
 * repair-master-data.ts — Round 1: D82 Master Data (Admin-managed)
 *
 * 10 tables (9 domain + 1 audit log):
 *   repair_appliance_categories   ← GAP-1: สร้างใหม่, UUID PK
 *   repair_symptoms
 *   repair_worktypes
 *   repair_part_status_options
 *   repair_decline_reasons
 *   repair_tools_required
 *   repair_checklist_templates
 *   repair_checklist_items
 *   repair_electrical_measurements
 *   repair_admin_audit_log        ← BIGSERIAL (append-only)
 *
 * SQL Reference: schemas/repair-domain/gen60-reverse-design/d82_master_data_schema.sql
 * Migration: apps/backend/src/db/migrations/0012_repair_master_data.sql
 * Reconciliation: Gen 58 LOCKED (C1-C8 final)
 *
 * GAP-1 Resolution:
 *   repair_appliance_categories สร้างเป็น UUID PK ใหม่ใน BFF layer
 *   ไม่ FK ไป Python backend's appliance_categories (Integer PK — type mismatch)
 *   Admin seed data ผ่าน Admin UI หรือ migration seed script แยกต่างหาก
 *
 * GAP-2 Resolution (ใช้ใน repair-workflow.ts):
 *   ไม่ใช้ pgEnum — ใช้ varchar/text + comment (codebase convention)
 *   New job states documented ใน repair-workflow.ts header
 */
import {
  pgTable,
  uuid,
  varchar,
  integer,
  bigserial,
  boolean,
  numeric,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'

// ── 1. repair_appliance_categories (GAP-1: new — UUID PK) ────────────────────
// ประเภทเครื่องใช้ไฟฟ้าสำหรับ Repair domain โดยเฉพาะ
// Admin-managed via D82 Admin Master Data Management
export const repairApplianceCategories = pgTable(
  'repair_appliance_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // รหัสประเภท เช่น 'washer', 'ac', 'refrigerator', 'smartphone'
    code: varchar('code', { length: 50 }).notNull().unique(),
    labelTh: varchar('label_th', { length: 100 }).notNull(),
    labelEn: varchar('label_en', { length: 100 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_repair_appliance_categories_active').on(table.isActive, table.sortOrder),
  ],
)

// ── 2. repair_symptoms ────────────────────────────────────────────────────────
// อาการเสียที่เป็นไปได้ต่อประเภทเครื่อง (B3 section 3: symptoms)
// WeeeT/WeeeR เลือกจาก dropdown ที่ Admin กำหนดไว้
export const repairSymptoms = pgTable(
  'repair_symptoms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    applianceCategoryId: uuid('appliance_category_id')
      .notNull()
      .references(() => repairApplianceCategories.id),
    // unique per (appliance_category_id, code)
    code: varchar('code', { length: 50 }).notNull(),
    labelTh: varchar('label_th', { length: 255 }).notNull(),
    labelEn: varchar('label_en', { length: 255 }),
    // ระดับความรุนแรงเบื้องต้น: 'low' | 'medium' | 'high'
    severityHint: varchar('severity_hint', { length: 20 }),
    // สาเหตุที่พบบ่อย (JSON array ของ string)
    commonCauses: jsonb('common_causes'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_repair_symptoms_category_code').on(table.applianceCategoryId, table.code),
    index('idx_repair_symptoms_category').on(table.applianceCategoryId),
    index('idx_repair_symptoms_severity').on(table.severityHint),
  ],
)

// ── 3. repair_worktypes ────────────────────────────────────────────────────────
// ประเภทงานที่ WeeeR ทำ (B3.5 Smart Picker: เลือก worktype ต่อ part)
// Admin seed: REPAIR / REPLACE / CLEAN / REFILL / INSPECT
export const repairWorktypes = pgTable(
  'repair_worktypes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // 'REPAIR' | 'REPLACE' | 'CLEAN' | 'REFILL' | 'INSPECT'
    kind: varchar('kind', { length: 20 }).notNull(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    labelTh: varchar('label_th', { length: 255 }).notNull(),
    labelEn: varchar('label_en', { length: 255 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_repair_worktypes_kind').on(table.kind),
  ],
)

// ── 4. repair_part_status_options ─────────────────────────────────────────────
// สถานะอะไหล่ใน B3.5 Smart Picker
// Admin seed: IN_VAN (มีในรถ) / IN_SHOP (มีในร้าน) / NEED_ORDER (ต้องสั่ง)
export const repairPartStatusOptions = pgTable(
  'repair_part_status_options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // 'IN_VAN' | 'IN_SHOP' | 'NEED_ORDER'
    availability: varchar('availability', { length: 20 }).notNull(),
    labelTh: varchar('label_th', { length: 255 }).notNull(),
    labelEn: varchar('label_en', { length: 255 }),
    // default option ต่อ availability type (partial unique ด้านล่าง)
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Partial unique: 1 default per availability type
    uniqueIndex('idx_repair_part_status_default')
      .on(table.availability)
      .where(sql`is_default = TRUE`),
    index('idx_repair_part_status_availability').on(table.availability),
  ],
)

// ── 5. repair_decline_reasons ─────────────────────────────────────────────────
// เหตุผลปฏิเสธงาน แยกตาม role (WeeeT/WeeeU) และกลุ่ม
// B3 section 6: decision = 'decline' → เลือกเหตุผลจาก dropdown
export const repairDeclineReasons = pgTable(
  'repair_decline_reasons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // 'WEEET' | 'WEEEU'
    role: varchar('role', { length: 20 }).notNull(),
    // 'GROUP_1' | 'GROUP_2' | 'GROUP_3'
    reasonGroup: varchar('reason_group', { length: 20 }).notNull(),
    // unique per (role, code)
    code: varchar('code', { length: 50 }).notNull(),
    labelTh: varchar('label_th', { length: 255 }).notNull(),
    labelEn: varchar('label_en', { length: 255 }),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_repair_decline_reasons_role_code').on(table.role, table.code),
    index('idx_repair_decline_reasons_role_group').on(table.role, table.reasonGroup),
  ],
)

// ── 6. repair_tools_required ──────────────────────────────────────────────────
// เครื่องมือที่จำเป็นในการซ่อม (Admin catalog)
// B3 section 2: pre-check — WeeeT tick เครื่องมือที่เตรียมมา
export const repairToolsRequired = pgTable(
  'repair_tools_required',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    labelTh: varchar('label_th', { length: 255 }).notNull(),
    labelEn: varchar('label_en', { length: 255 }),
    // หมวดเครื่องมือ เช่น 'electrical', 'mechanical', 'diagnostic'
    category: varchar('category', { length: 50 }),
    // เครื่องมือพื้นฐานที่ต้องมีทุกงาน (vs เฉพาะทาง)
    isBasic: boolean('is_basic').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_repair_tools_category').on(table.category),
    index('idx_repair_tools_basic').on(table.isBasic),
  ],
)

// ── 7. repair_checklist_templates ─────────────────────────────────────────────
// Template ของ B3 Pre-repair Checklist ต่อประเภทเครื่อง
// Admin-managed: 1 default + 1 fallback per category
export const repairChecklistTemplates = pgTable(
  'repair_checklist_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    applianceCategoryId: uuid('appliance_category_id')
      .notNull()
      .references(() => repairApplianceCategories.id),
    nameTh: varchar('name_th', { length: 255 }).notNull(),
    nameEn: varchar('name_en', { length: 255 }),
    // version ของ template (เพิ่มเมื่อ update)
    version: integer('version').notNull().default(1),
    // template หลักของประเภทนั้น — 1 ต่อ category (partial unique)
    isDefault: boolean('is_default').notNull().default(false),
    // template สำรอง (ใช้เมื่อไม่มี default ที่ match) — 1 ต่อ category
    isFallback: boolean('is_fallback').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Partial unique: 1 default per category
    uniqueIndex('idx_repair_checklist_templates_default')
      .on(table.applianceCategoryId)
      .where(sql`is_default = TRUE`),
    // Partial unique: 1 fallback per category
    uniqueIndex('idx_repair_checklist_templates_fallback')
      .on(table.applianceCategoryId)
      .where(sql`is_fallback = TRUE`),
    index('idx_repair_checklist_templates_category').on(table.applianceCategoryId),
  ],
)

// ── 8. repair_checklist_items ─────────────────────────────────────────────────
// รายการใน B3 Checklist (7 sections: device_info, prelim_check, symptoms,
//   electrical, parts_inspection, decision, photos)
export const repairChecklistItems = pgTable(
  'repair_checklist_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    templateId: uuid('template_id')
      .notNull()
      .references((): AnyPgColumn => repairChecklistTemplates.id, { onDelete: 'cascade' }),
    // หมวดหมู่ใน checklist เช่น 'device_info', 'prelim_check', 'symptoms'
    section: varchar('section', { length: 100 }).notNull(),
    // unique per (template_id, code)
    code: varchar('code', { length: 50 }).notNull(),
    labelTh: varchar('label_th', { length: 255 }).notNull(),
    labelEn: varchar('label_en', { length: 255 }),
    isRequired: boolean('is_required').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_repair_checklist_items_template_code').on(table.templateId, table.code),
    index('idx_repair_checklist_items_template_section').on(table.templateId, table.section),
  ],
)

// ── 9. repair_electrical_measurements ────────────────────────────────────────
// รายการวัดค่าไฟฟ้าใน B3 section 4: electrical measurements
// nullable appliance_category_id = ใช้ได้กับทุกประเภทเครื่อง
export const repairElectricalMeasurements = pgTable(
  'repair_electrical_measurements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // nullable: null = measure ที่ใช้กับเครื่องทุกประเภท
    applianceCategoryId: uuid('appliance_category_id')
      .references(() => repairApplianceCategories.id),
    code: varchar('code', { length: 50 }).notNull(),
    labelTh: varchar('label_th', { length: 255 }).notNull(),
    labelEn: varchar('label_en', { length: 255 }),
    // หน่วยวัด เช่น 'V', 'A', 'W', 'Ω', '°C', 'Hz'
    unit: varchar('unit', { length: 20 }).notNull(),
    // ช่วงปกติ (สำหรับ auto-flag is_within_normal)
    normalMin: numeric('normal_min', { precision: 10, scale: 4 }),
    normalMax: numeric('normal_max', { precision: 10, scale: 4 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_repair_electrical_measurements_category').on(table.applianceCategoryId),
  ],
)

// ── 10. repair_admin_audit_log ────────────────────────────────────────────────
// Audit trail ของ Admin ที่แก้ไข master data
// BIGSERIAL: append-only, ordering ตาม insert order
export const repairAdminAuditLog = pgTable(
  'repair_admin_audit_log',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    // ชื่อ table ที่ถูกแก้ไข
    tableName: varchar('table_name', { length: 100 }).notNull(),
    // UUID ของ record ที่ถูกแก้ไข
    recordId: uuid('record_id').notNull(),
    // 'INSERT' | 'UPDATE' | 'DELETE'
    action: varchar('action', { length: 20 }).notNull(),
    // before/after diff (JSONB: { before: {...}, after: {...} })
    changes: jsonb('changes'),
    performedBy: uuid('performed_by')
      .notNull()
      .references(() => users.id),
    performedAt: timestamp('performed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_repair_admin_audit_table_record').on(table.tableName, table.recordId),
    index('idx_repair_admin_audit_performer').on(table.performedBy),
    index('idx_repair_admin_audit_at').on(table.performedAt),
  ],
)

// ── Export types ──────────────────────────────────────────────────────────────
export type RepairApplianceCategory = typeof repairApplianceCategories.$inferSelect
export type NewRepairApplianceCategory = typeof repairApplianceCategories.$inferInsert

export type RepairSymptom = typeof repairSymptoms.$inferSelect
export type NewRepairSymptom = typeof repairSymptoms.$inferInsert

export type RepairWorktype = typeof repairWorktypes.$inferSelect
export type NewRepairWorktype = typeof repairWorktypes.$inferInsert

export type RepairPartStatusOption = typeof repairPartStatusOptions.$inferSelect
export type NewRepairPartStatusOption = typeof repairPartStatusOptions.$inferInsert

export type RepairDeclineReason = typeof repairDeclineReasons.$inferSelect
export type NewRepairDeclineReason = typeof repairDeclineReasons.$inferInsert

export type RepairToolRequired = typeof repairToolsRequired.$inferSelect
export type NewRepairToolRequired = typeof repairToolsRequired.$inferInsert

export type RepairChecklistTemplate = typeof repairChecklistTemplates.$inferSelect
export type NewRepairChecklistTemplate = typeof repairChecklistTemplates.$inferInsert

export type RepairChecklistItem = typeof repairChecklistItems.$inferSelect
export type NewRepairChecklistItem = typeof repairChecklistItems.$inferInsert

export type RepairElectricalMeasurement = typeof repairElectricalMeasurements.$inferSelect
export type NewRepairElectricalMeasurement = typeof repairElectricalMeasurements.$inferInsert

export type RepairAdminAuditLogEntry = typeof repairAdminAuditLog.$inferSelect
export type NewRepairAdminAuditLogEntry = typeof repairAdminAuditLog.$inferInsert
