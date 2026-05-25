/**
 * appliance-master.ts — D92: Master 3-Tier Appliance Reference (Generic-First)
 *
 * Tables:
 *   appliance_brands  (NEW) — ยี่ห้อภายใต้ประเภท
 *   appliance_models  (NEW) — รุ่นภายใต้ยี่ห้อ (optional)
 *
 * Note: appliance_categories = repair_appliance_categories (มีอยู่แล้วใน repair-master-data.ts)
 *       appliance_brands.category_id → repair_appliance_categories.id
 *
 * Soft Delete D90: is_active=false · ห้ามลบถ้ามีลูก (enforced in service layer)
 * Generic-First: schema ไม่ hardcode 5 ประเภท — เพิ่มผ่าน Admin UI ได้ทุกประเภท
 *
 * asset_images (D89 canonical implementation):
 *   ใช้แทน D93 ที่ Advisor Gen 84 ยกเลิก — ไม่สร้างตารางใหม่ซ้ำ
 *   Reference images สำหรับ parts/symptoms/checklist/pricing-samples/ui
 *
 * Migration: 0016_appliance_master_d92.sql
 * Spec: D92 (36a813ec-7277-8166-b2cb-d31630a264c8) · D89 (36a813ec-7277-8132-9cb3-de95b1dabc49)
 * Maintain Gen 4 · 2026-05-25
 */

import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  jsonb,
  text,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { repairApplianceCategories } from './repair-master-data'

// ─────────────────────────────────────────────────────────────────────────────
// 1. appliance_brands — ยี่ห้อภายใต้ประเภทเครื่อง (D92)
// category_id FK → repair_appliance_categories.id
// ─────────────────────────────────────────────────────────────────────────────
export const applianceBrands = pgTable(
  'appliance_brands',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // FK → repair_appliance_categories (appliance_categories canonical)
    categoryId: uuid('category_id')
      .notNull()
      .references(() => repairApplianceCategories.id),

    // ชื่อยี่ห้อ เช่น "Daikin", "Samsung", "LG", "Apple"
    name: varchar('name', { length: 100 }).notNull(),

    // Soft Delete D90 — is_active=false แทนการลบ
    isActive: boolean('is_active').notNull().default(true),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // (category_id, name) unique — ยี่ห้อเดียวกันมีได้หลายประเภท
    uniqueIndex('idx_appliance_brands_category_name').on(table.categoryId, table.name),
    index('idx_appliance_brands_category_active').on(table.categoryId, table.isActive),
  ],
)

// ─────────────────────────────────────────────────────────────────────────────
// 2. appliance_models — รุ่นภายใต้ยี่ห้อ (D92, optional)
// brand_id FK → appliance_brands.id
// ─────────────────────────────────────────────────────────────────────────────
export const applianceModels = pgTable(
  'appliance_models',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // FK → appliance_brands
    brandId: uuid('brand_id')
      .notNull()
      .references(() => applianceBrands.id),

    // ชื่อรุ่น เช่น "iPhone 15 Pro", "Galaxy S24", "RXY18"
    name: varchar('name', { length: 200 }).notNull(),

    // สเปคเพิ่มเติม (JSONB) — flexible per appliance type
    // ตัวอย่าง AC: { btu: 18000, inverter: true }
    // ตัวอย่าง smartphone: { storage: 256, color: "black" }
    specAttributes: jsonb('spec_attributes'),

    // Soft Delete D90
    isActive: boolean('is_active').notNull().default(true),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // (brand_id, name) unique per brand
    uniqueIndex('idx_appliance_models_brand_name').on(table.brandId, table.name),
    index('idx_appliance_models_brand_active').on(table.brandId, table.isActive),
  ],
)

// ─────────────────────────────────────────────────────────────────────────────
// 3. asset_images — D89 canonical implementation (แทน D93 ที่ถูกยกเลิก)
// Reference images สำหรับ Admin master data: parts/symptoms/checklist/pricing-samples/ui
// ─────────────────────────────────────────────────────────────────────────────
export const assetImages = pgTable(
  'asset_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // ประเภทภาพ: 'parts' | 'symptoms' | 'checklist' | 'pricing-samples' | 'ui'
    category: varchar('category', { length: 30 }).notNull(),

    // ประเภทเครื่อง (optional) — 'ac' | 'fridge' | 'washer' | 'computer' | 'tv' | NULL
    // NULL = ใช้ได้กับทุกประเภท
    applianceCategory: varchar('appliance_category', { length: 50 }),

    // local dev path (relative to /assets/)
    localPath: text('local_path').notNull(),

    // cloud URL (Cloudflare R2 production — NULL ก่อน deploy)
    cloudUrl: text('cloud_url'),

    // alt text สำหรับ accessibility
    altText: varchar('alt_text', { length: 255 }),

    // link ไป entity ที่รูปนี้อ้างอิง
    // เช่น 'repair_symptoms' | 'repair_part_catalog' | 'repair_checklist_items'
    linkedEntityType: varchar('linked_entity_type', { length: 100 }),
    linkedEntityId: uuid('linked_entity_id'),  // UUID FK (soft ref — ไม่ enforce FK constraint)

    // ไฟล์ต้นฉบับที่ดึงรูปมา เช่น 'repair-ac.docx'
    sourceFile: varchar('source_file', { length: 255 }),

    // ลำดับแสดงผล (1 ชิ้นส่วนมีหลายรูป — sort_order จัดลำดับ)
    sortOrder: integer('sort_order').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_asset_images_category').on(table.category),
    index('idx_asset_images_appliance').on(table.applianceCategory),
    index('idx_asset_images_entity').on(table.linkedEntityType, table.linkedEntityId),
    uniqueIndex('idx_asset_images_local_path').on(table.localPath),
  ],
)

// ─────────────────────────────────────────────────────────────────────────────
// Type exports
// ─────────────────────────────────────────────────────────────────────────────
export type ApplianceBrand = typeof applianceBrands.$inferSelect
export type NewApplianceBrand = typeof applianceBrands.$inferInsert

export type ApplianceModel = typeof applianceModels.$inferSelect
export type NewApplianceModel = typeof applianceModels.$inferInsert

export type AssetImage = typeof assetImages.$inferSelect
export type NewAssetImage = typeof assetImages.$inferInsert
