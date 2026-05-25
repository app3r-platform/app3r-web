/**
 * repair-part-catalog.ts — D88: Static Repair Part Catalog
 *
 * Admin-managed catalog of appliance parts imported from repair Word documents.
 * Provides the part reference data that WeeeT/WeeeR select from during B3.5 Smart Picker.
 *
 * Tables:
 *   repair_part_catalog       — static parts per appliance category (from docx import)
 *   repair_symptom_part_links — many-to-many: symptom ↔ part (from Table 0 in docx)
 *
 * Migration: 0018_repair_part_catalog.sql
 * Spec: D88 Import Spec (36a813ec-7277-8166-b2cb-d31630a264c8)
 * Backend D88 Full Import · 2026-05-25
 */

import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { repairApplianceCategories, repairSymptoms } from './repair-master-data'

// ── 1. repair_part_catalog ─────────────────────────────────────────────────────
// Static catalog of appliance parts (Admin-managed via import or Admin UI)
// FK → repair_appliance_categories (per category — Generic-First D92)
export const repairPartCatalog = pgTable(
  'repair_part_catalog',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // FK → repair_appliance_categories
    applianceCategoryId: uuid('appliance_category_id')
      .notNull()
      .references(() => repairApplianceCategories.id),

    // Part number from docx (e.g., "9.1", "14", "01") — nullable (some docs don't number)
    partNumber: varchar('part_number', { length: 20 }),

    // Section/group header (Variant 4: "ส่วนคอยล์เย็น", "ส่วนคอยล์ร้อน")
    partGroup: varchar('part_group', { length: 100 }),

    // Thai part name (e.g., "แหล่งจ่ายไฟของชุดคอยล์เย็น", "คอมเพรสเซอร์")
    nameTh: varchar('name_th', { length: 500 }).notNull(),

    // Source file for audit (e.g., "1.อาการเสียแนวทางการการซ่อมเครื่องปรับอากาศ.docx")
    sourceFile: varchar('source_file', { length: 255 }),

    // Display order within category
    sortOrder: integer('sort_order').notNull().default(0),

    // Soft Delete D90
    isActive: boolean('is_active').notNull().default(true),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_repair_part_catalog_category').on(table.applianceCategoryId),
    index('idx_repair_part_catalog_category_active').on(table.applianceCategoryId, table.isActive),
    // (category_id, name_th) soft unique — same name may exist across categories
    uniqueIndex('idx_repair_part_catalog_category_name').on(
      table.applianceCategoryId,
      table.nameTh,
    ),
  ],
)

// ── 2. repair_symptom_part_links ───────────────────────────────────────────────
// Many-to-many: repair_symptoms ↔ repair_part_catalog
// Populated from Table 0 in repair docs (อาการเสีย ↔ ชิ้นส่วน mapping)
export const repairSymptomPartLinks = pgTable(
  'repair_symptom_part_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    symptomId: uuid('symptom_id')
      .notNull()
      .references(() => repairSymptoms.id),

    partId: uuid('part_id')
      .notNull()
      .references(() => repairPartCatalog.id),
  },
  (table) => [
    uniqueIndex('idx_repair_symptom_part_links_unique').on(table.symptomId, table.partId),
    index('idx_repair_symptom_part_links_symptom').on(table.symptomId),
    index('idx_repair_symptom_part_links_part').on(table.partId),
  ],
)

// ── Type exports ───────────────────────────────────────────────────────────────
export type RepairPartCatalog = typeof repairPartCatalog.$inferSelect
export type NewRepairPartCatalog = typeof repairPartCatalog.$inferInsert

export type RepairSymptomPartLink = typeof repairSymptomPartLinks.$inferSelect
export type NewRepairSymptomPartLink = typeof repairSymptomPartLinks.$inferInsert
