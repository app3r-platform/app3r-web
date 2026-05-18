/**
 * repair-workflow.ts — Round 2: Workflow Instance (B3 / B3.5 / B2.5)
 *
 * 8 tables:
 *   repair_checklist_results      — B3 header (1 active per job)
 *   repair_checklist_item_results — B3 item-level results
 *   repair_measurement_results    — B3 section 4: electrical measurements
 *   repair_parts_picker_entries   — B3.5 header (1 active per job)
 *   repair_parts_picker_items     — B3.5 part line items
 *   repair_b2_5_packages          — B2.5 PREMIUM/ECONOMY offer packages
 *   repair_b2_5_package_items     — B2.5 line items (parts, labor, transport …)
 *   repair_job_state_transitions  — BIGSERIAL immutable state change log
 *
 * SQL Reference: schemas/repair-domain/gen60-reverse-design/round2_workflow_tables_schema.sql
 * Migration: apps/backend/src/db/migrations/0013_repair_workflow.sql
 * Prereq: 0012_repair_master_data (FK targets)
 *
 * GAP-2 Resolution:
 *   ไม่ใช้ pgEnum (codebase convention = varchar + comment)
 *   New repair job states ที่เพิ่มใน Phase C-4.1b (documented ด้านล่าง):
 *     'checklist_submitted'     — B3 submitted ครบ
 *     'parts_picker_submitted'  — B3.5 submitted ครบ
 *     'packages_offered'        — B2.5 WeeeR ส่ง offer แล้ว
 *     'awaiting_parts'          — รอสั่งอะไหล่ (NEED_ORDER)
 *     'scrap_offered'           — WeeeR เสนอรับซาก (B3 decision)
 *     'scrap_accepted'          — WeeeU ตอบรับซาก
 *     'scrap_rejected'          — WeeeU ปฏิเสธ / ขอรับคืน
 *   (Python backend enum จะเพิ่มค่าใหม่ใน Phase C-4.1b Backend แยก)
 *
 * Design notes:
 *   - repair_job_id → services.id (BFF layer FK; ไม่ FK ข้าม module Python boundary)
 *   - is_current partial unique pattern → ป้องกัน duplicate active record per job
 *   - repair_b2_5_packages.estimated_margin = GENERATED ALWAYS AS STORED
 *     (PostgreSQL ≥ 12 required — Open Question 3 in README)
 */
import {
  pgTable,
  uuid,
  text,
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
import { services } from './services'
import {
  repairChecklistTemplates,
  repairChecklistItems,
  repairElectricalMeasurements,
  repairWorktypes,
  repairPartStatusOptions,
} from './repair-master-data'

// ── 1. repair_checklist_results (B3 header) ───────────────────────────────────
// 1 row per B3 submission; ถ้า resubmit = row ใหม่ + supersedes_id → ของเดิม
// is_current = TRUE สำหรับ row ล่าสุดของแต่ละ job (partial unique)
export const repairChecklistResults = pgTable(
  'repair_checklist_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // FK → services.id (repair job ใน BFF layer)
    repairJobId: uuid('repair_job_id')
      .notNull()
      .references(() => services.id),
    templateId: uuid('template_id')
      .notNull()
      .references(() => repairChecklistTemplates.id),
    // ผู้กรอก: 'WEEET' | 'WEEER'
    submittedBy: varchar('submitted_by', { length: 20 }).notNull(),
    // ผลสรุป: 'ALL_NORMAL' | 'MINOR_ABNORMAL' | 'CRITICAL_ABNORMAL' | 'DECLINED'
    overallResult: varchar('overall_result', { length: 30 }),
    // มูลค่าเสนอรับซาก (กรณี overallResult = 'DECLINED' → scrap path B2.2)
    scrapOfferAmount: numeric('scrap_offer_amount', { precision: 12, scale: 2 }),
    notes: text('notes'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    // self-ref: version chain (supersedes = previous row id)
    supersedesId: uuid('supersedes_id').references((): AnyPgColumn => repairChecklistResults.id),
    // TRUE = version ล่าสุดที่ active
    isCurrent: boolean('is_current').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Partial unique: 1 current checklist per repair job
    uniqueIndex('idx_repair_checklist_results_current')
      .on(table.repairJobId)
      .where(sql`is_current = TRUE`),
    index('idx_repair_checklist_results_job').on(table.repairJobId),
    index('idx_repair_checklist_results_template').on(table.templateId),
    index('idx_repair_checklist_results_submitted_by').on(table.submittedBy),
  ],
)

// ── 2. repair_checklist_item_results ──────────────────────────────────────────
// ผลตรวจรายข้อ (1 row per checklist item per B3 submission)
export const repairChecklistItemResults = pgTable(
  'repair_checklist_item_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    checklistResultId: uuid('checklist_result_id')
      .notNull()
      .references(() => repairChecklistResults.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => repairChecklistItems.id),
    // ผลตรวจ: 'NORMAL' | 'ABNORMAL' | 'NA'
    result: varchar('result', { length: 20 }).notNull(),
    note: text('note'),
    // Array ของ R2 keys สำหรับรูปถ่ายประกอบ (optional)
    photoRef: text('photo_ref').array(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_repair_checklist_item_results_checklist').on(table.checklistResultId),
    index('idx_repair_checklist_item_results_item').on(table.itemId),
    index('idx_repair_checklist_item_results_result').on(table.result),
  ],
)

// ── 3. repair_measurement_results ─────────────────────────────────────────────
// ผลวัดค่าไฟฟ้า B3 section 4 (1 row per measurement per B3 submission)
export const repairMeasurementResults = pgTable(
  'repair_measurement_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    checklistResultId: uuid('checklist_result_id')
      .notNull()
      .references(() => repairChecklistResults.id, { onDelete: 'cascade' }),
    measurementId: uuid('measurement_id')
      .notNull()
      .references(() => repairElectricalMeasurements.id),
    // ค่าตัวเลขที่วัดได้ (เช่น 220.5 V)
    valueNumeric: numeric('value_numeric', { precision: 10, scale: 4 }),
    // ค่าข้อความเสริม (กรณีวัดค่าไม่ได้ หรือหมายเหตุ)
    valueText: text('value_text'),
    // อยู่ในช่วงปกติ (normal_min ≤ value ≤ normal_max) หรือไม่
    isWithinNormal: boolean('is_within_normal'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_repair_measurement_results_checklist').on(table.checklistResultId),
    index('idx_repair_measurement_results_measurement').on(table.measurementId),
  ],
)

// ── 4. repair_parts_picker_entries (B3.5 header) ──────────────────────────────
// B3.5 Smart Picker: WeeeR เลือกอะไหล่ + worktype (zero-typing)
// 1 active entry per job (partial unique)
export const repairPartsPickerEntries = pgTable(
  'repair_parts_picker_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    repairJobId: uuid('repair_job_id')
      .notNull()
      .references(() => services.id),
    // FK → B3 checklist ที่นำมาอ้างอิง (optional — B3.5 อาจทำก่อน B3 ได้)
    checklistResultId: uuid('checklist_result_id')
      .references(() => repairChecklistResults.id),
    // มีอะไหล่ที่ต้องสั่งซื้อ (NEED_ORDER) หรือไม่ — ใช้ flag สถานะ
    hasNeedOrder: boolean('has_need_order').notNull().default(false),
    notes: text('notes'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    isCurrent: boolean('is_current').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Partial unique: 1 current picker per repair job
    uniqueIndex('idx_repair_parts_picker_entries_current')
      .on(table.repairJobId)
      .where(sql`is_current = TRUE`),
    index('idx_repair_parts_picker_entries_job').on(table.repairJobId),
  ],
)

// ── 5. repair_parts_picker_items ──────────────────────────────────────────────
// รายการอะไหล่แต่ละชิ้นใน B3.5 Smart Picker
export const repairPartsPickerItems = pgTable(
  'repair_parts_picker_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pickerEntryId: uuid('picker_entry_id')
      .notNull()
      .references(() => repairPartsPickerEntries.id, { onDelete: 'cascade' }),
    worktypeId: uuid('worktype_id')
      .notNull()
      .references(() => repairWorktypes.id),
    partStatusId: uuid('part_status_id')
      .notNull()
      .references(() => repairPartStatusOptions.id),
    // denormalized จาก part_status_options (สำหรับ query เร็ว ไม่ต้อง join)
    // 'IN_VAN' | 'IN_SHOP' | 'NEED_ORDER'
    availability: varchar('availability', { length: 20 }).notNull(),
    partName: text('part_name'),
    quantity: integer('quantity').notNull().default(1),
    // ราคาอ้างอิงจาก Admin master data (hint — ไม่ใช่ราคาจริง)
    priceHintOem: numeric('price_hint_oem', { precision: 12, scale: 2 }),
    priceHintAftermarket: numeric('price_hint_aftermarket', { precision: 12, scale: 2 }),
    priceHintUsed: numeric('price_hint_used', { precision: 12, scale: 2 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_repair_parts_picker_items_entry').on(table.pickerEntryId),
    index('idx_repair_parts_picker_items_availability').on(table.availability),
    index('idx_repair_parts_picker_items_worktype').on(table.worktypeId),
  ],
)

// ── 6. repair_b2_5_packages (B2.5 Package Offer) ─────────────────────────────
// WeeeR ส่ง 2 package (PREMIUM + ECONOMY) ให้ WeeeU เลือก
// estimated_margin = GENERATED ALWAYS AS STORED (PostgreSQL ≥ 12)
export const repairB25Packages = pgTable(
  'repair_b2_5_packages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    repairJobId: uuid('repair_job_id')
      .notNull()
      .references(() => services.id),
    pickerEntryId: uuid('picker_entry_id')
      .notNull()
      .references(() => repairPartsPickerEntries.id),
    // 'PREMIUM' | 'ECONOMY'
    tier: varchar('tier', { length: 20 }).notNull(),
    // ราคารวมที่เสนอ WeeeU (points)
    totalPrice: numeric('total_price', { precision: 12, scale: 2 }).notNull().default('0'),
    // ต้นทุนรวมของ WeeeR (points — ไม่แสดง WeeeU)
    totalCost: numeric('total_cost', { precision: 12, scale: 2 }).notNull().default('0'),
    // กำไรประมาณ = total_price - total_cost (GENERATED ALWAYS AS STORED)
    // ⚠️ Open Question 3: PostgreSQL ≥ 12 required
    estimatedMargin: numeric('estimated_margin', { precision: 12, scale: 2 })
      .generatedAlwaysAs(sql`total_price - total_cost`),
    // 'offered' | 'accepted' | 'declined' | 'expired'
    status: varchar('status', { length: 30 }).notNull().default('offered'),
    offeredAt: timestamp('offered_at', { withTimezone: true }),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Partial unique: 1 accepted package per job (prevent double-accept)
    uniqueIndex('idx_repair_b2_5_packages_accepted')
      .on(table.repairJobId)
      .where(sql`status = 'accepted'`),
    // Partial unique: 1 PREMIUM + 1 ECONOMY per job (active offers)
    uniqueIndex('idx_repair_b2_5_packages_tier_job')
      .on(table.repairJobId, table.tier)
      .where(sql`status != 'expired'`),
    index('idx_repair_b2_5_packages_job').on(table.repairJobId),
    index('idx_repair_b2_5_packages_picker').on(table.pickerEntryId),
    index('idx_repair_b2_5_packages_status').on(table.status),
  ],
)

// ── 7. repair_b2_5_package_items ──────────────────────────────────────────────
// รายการในแต่ละ package (parts, labor, transport, deposit, discount …)
export const repairB25PackageItems = pgTable(
  'repair_b2_5_package_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    packageId: uuid('package_id')
      .notNull()
      .references(() => repairB25Packages.id, { onDelete: 'cascade' }),
    // 'PART' | 'LABOR' | 'TRANSPORT' | 'DEPOSIT' | 'DISCOUNT' | 'OTHER'
    kind: varchar('kind', { length: 30 }).notNull(),
    labelTh: text('label_th').notNull(),
    // เกรดอะไหล่ (เฉพาะ kind = 'PART'):
    // 'OEM_NEW' | 'AFTERMARKET_NEW' | 'USED_GRADE_A' | 'USED_GRADE_B' | 'REFURBISHED'
    partGrade: varchar('part_grade', { length: 30 }),
    // nullable: ไม่ใช่ทุก item มาจาก B3.5 Parts Picker
    pickerItemId: uuid('picker_item_id')
      .references(() => repairPartsPickerItems.id),
    quantity: integer('quantity').notNull().default(1),
    // ราคาต่อหน่วยที่เสนอ WeeeU (points)
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    // ต้นทุนต่อหน่วยของ WeeeR (points — ไม่แสดง WeeeU)
    unitCost: numeric('unit_cost', { precision: 12, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_repair_b2_5_package_items_package').on(table.packageId),
    index('idx_repair_b2_5_package_items_kind').on(table.kind),
  ],
)

// ── 8. repair_job_state_transitions (BIGSERIAL — immutable log) ───────────────
// บันทึกทุกการเปลี่ยนสถานะของ repair job (append-only, ห้าม UPDATE/DELETE)
// ใช้ BIGSERIAL เพื่อ ordering ตามลำดับ insert ที่แม่นยำ
export const repairJobStateTransitions = pgTable(
  'repair_job_state_transitions',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    repairJobId: uuid('repair_job_id')
      .notNull()
      .references(() => services.id),
    // สถานะก่อนหน้า (null = เริ่มต้น / job ถูกสร้าง)
    fromStatus: varchar('from_status', { length: 50 }),
    // สถานะใหม่
    toStatus: varchar('to_status', { length: 50 }).notNull(),
    // event ที่ trigger การเปลี่ยนสถานะ เช่น 'submit_checklist', 'approve_package'
    triggerEvent: varchar('trigger_event', { length: 100 }),
    // user ที่ทำ action (nullable = system/cron events)
    triggeredBy: uuid('triggered_by')
      .references(() => users.id),
    // context ที่เกี่ยวข้อง เช่น { package_id, reason, notes }
    context: jsonb('context'),
    transitionedAt: timestamp('transitioned_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // timeline query: ดึง state history ของ job เรียง transitioned_at
    index('idx_repair_job_state_transitions_job').on(table.repairJobId, table.transitionedAt),
    index('idx_repair_job_state_transitions_to').on(table.toStatus),
    index('idx_repair_job_state_transitions_trigger').on(table.triggerEvent),
  ],
)

// ── Export types ──────────────────────────────────────────────────────────────
export type RepairChecklistResult = typeof repairChecklistResults.$inferSelect
export type NewRepairChecklistResult = typeof repairChecklistResults.$inferInsert

export type RepairChecklistItemResult = typeof repairChecklistItemResults.$inferSelect
export type NewRepairChecklistItemResult = typeof repairChecklistItemResults.$inferInsert

export type RepairMeasurementResult = typeof repairMeasurementResults.$inferSelect
export type NewRepairMeasurementResult = typeof repairMeasurementResults.$inferInsert

export type RepairPartsPickerEntry = typeof repairPartsPickerEntries.$inferSelect
export type NewRepairPartsPickerEntry = typeof repairPartsPickerEntries.$inferInsert

export type RepairPartsPickerItem = typeof repairPartsPickerItems.$inferSelect
export type NewRepairPartsPickerItem = typeof repairPartsPickerItems.$inferInsert

export type RepairB25Package = typeof repairB25Packages.$inferSelect
export type NewRepairB25Package = typeof repairB25Packages.$inferInsert

export type RepairB25PackageItem = typeof repairB25PackageItems.$inferSelect
export type NewRepairB25PackageItem = typeof repairB25PackageItems.$inferInsert

export type RepairJobStateTransition = typeof repairJobStateTransitions.$inferSelect
export type NewRepairJobStateTransition = typeof repairJobStateTransitions.$inferInsert
