/**
 * generate-d5-seed.ts — D-5 Full Import: Seed SQL Generator
 *
 * Runs repair doc parsers + Excel parsers → generates SQL seed migrations:
 *   0022_d5_seed_categories.sql     — appliance_categories idempotent seed
 *   0023_d5_seed_repair_master.sql  — symptoms + parts + asset_images + frequency
 *   0024_d5_seed_pricing.sql        — used_pricing (iPhone D-5 dims + NB 4 sheets)
 *
 * D-5 improvements over D88 (generate-seed-sql.ts):
 *   - iPhone JSONB: {boot_state, accessory, problem, scratch_level}
 *   - is_multi_issue=true for "งานตำหนิมากกว่า 1 จุด"
 *   - Notebook: import NB/Desktop PC/MONITOR LED/HP Printer; skip others
 *   - Images: /assets/parts/, /assets/symptoms/, /assets/checklist/ subfolders
 *   - Categories: 0022 explicit seed (idempotent via ON CONFLICT DO NOTHING)
 *
 * Usage:
 *   npx tsx src/scripts/import/generate-d5-seed.ts
 *     --import-dir "D:/ClaudeCode/App3R/App3R-System/import-data"
 *     --assets-dir "./public/assets"
 *     --out-dir "./src/db/migrations"
 *
 * Spec: D-5 (36a813ec-7277-8166-b2cb-d31630a264c8)
 * Branch: backend/d5-import-full · 2026-05-25
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

import { parseRepairDocsDir, type RepairDocResult, type RepairPart } from './parse-repair-docs'
import { parsePricingExcel, type PricingSheetResult, type PricingRowA } from './parse-pricing-excel'
import { extractDocImages, type DocImageExtractResult, type AssetImageSeedRecord } from './extract-doc-images'

// ── Helpers ────────────────────────────────────────────────────────────────────

function sqlStr(s: string | null | undefined): string {
  if (s == null) return 'NULL'
  return `'${s.replace(/'/g, "''")}'`
}

function sqlInt(n: number): string { return String(n) }
function sqlBool(b: boolean): string { return b ? 'TRUE' : 'FALSE' }

function slugify(s: string, maxLen = 50): string {
  return s
    .toLowerCase()
    .replace(/[^฀-๿a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLen)
}

/** SHA-256 of sorted-key JSONB string (matches DB dimensions_hash pattern) */
function dimsHash(dims: Record<string, string | null>): string {
  const sorted = Object.fromEntries(Object.entries(dims).sort())
  return crypto.createHash('sha256').update(JSON.stringify(sorted)).digest('hex').slice(0, 64)
}

/** SQL subquery to resolve category UUID by code */
function catIdSql(code: string): string {
  return `(SELECT id FROM repair_appliance_categories WHERE code=${sqlStr(code)} LIMIT 1)`
}

/** SQL subquery to resolve used_pricing_categories UUID by code */
function pricingCatIdSql(code: string): string {
  return `(SELECT id FROM used_pricing_categories WHERE code=${sqlStr(code)} LIMIT 1)`
}

/** Classify image category from nearby text */
function classifyImageCategory(nearbyText: string): 'parts' | 'symptoms' | 'checklist' {
  const t = nearbyText.toLowerCase()
  if (t.includes('ตรวจสอบ') || t.includes('checklist') || t.includes('รายการตรวจ')) return 'checklist'
  if (t.includes('อาการ') || t.includes('symptom') || t.includes('เสีย') || t.includes('ปัญหา')) return 'symptoms'
  return 'parts'
}

// ── D-5 Notebook sheet whitelist ───────────────────────────────────────────────

const NB_IMPORT_WHITELIST = ['nb', 'notebook', 'desktop pc', 'desktop', 'monitor led', 'monitor', 'hp printer', 'printer']
const NB_SKIP_LIST = ['diy pc', 'i phone', 'iphone', 'i pad', 'ipad', 'samsung', 'android']

/** D-5 specific import-worthy check for Notebook sheets */
function isNbSheetImportWorthy(sheetName: string, rows: string[][]): boolean {
  const name = sheetName.toLowerCase().trim()

  // Explicit skip list
  if (NB_SKIP_LIST.some(skip => name.includes(skip))) {
    console.error(`   ⛔ Skip sheet: "${sheetName}" (NB_SKIP_LIST)`)
    return false
  }

  // Explicit whitelist
  if (NB_IMPORT_WHITELIST.some(allow => name.includes(allow))) {
    if (rows.length > 2) return true
  }

  // General skip: reference/lookup sheets
  const skipKeywords = ['lookup', 'ref', 'reference', 'สูตร', 'dropdown', 'list', 'ดัชนี', 'index']
  if (skipKeywords.some(kw => name.includes(kw))) return false

  return rows.length > 2
}

// Sheet name → category code mapping for Notebook pricing
const NB_SHEET_TO_CAT: Record<string, string> = {
  'nb': 'notebook',
  'notebook': 'notebook',
  'desktop pc': 'desktop_pc',
  'desktop': 'desktop_pc',
  'monitor led': 'monitor',
  'monitor': 'monitor',
  'hp printer': 'printer',
  'printer': 'printer',
}

function nbSheetToCatCode(sheetName: string): string {
  const name = sheetName.toLowerCase().trim()
  for (const [key, code] of Object.entries(NB_SHEET_TO_CAT)) {
    if (name.includes(key)) return code
  }
  return slugify(sheetName, 30) || 'unknown'
}

// ── D-5 standard worktypes ─────────────────────────────────────────────────────

const WORKTYPES = [
  { code: 'REPAIR',   kind: 'REPAIR',   labelTh: 'ซ่อมแซม',       labelEn: 'Repair' },
  { code: 'REPLACE',  kind: 'REPLACE',  labelTh: 'เปลี่ยนใหม่',    labelEn: 'Replace' },
  { code: 'CLEAN',    kind: 'CLEAN',    labelTh: 'ทำความสะอาด',    labelEn: 'Clean' },
  { code: 'REFILL',   kind: 'REFILL',   labelTh: 'เติม/เพิ่ม',     labelEn: 'Refill' },
  { code: 'INSPECT',  kind: 'INSPECT',  labelTh: 'ตรวจสอบ',        labelEn: 'Inspect' },
]

// ── D-5 appliance categories (full list) ──────────────────────────────────────

const D5_CATEGORIES = [
  { code: 'ac',         labelTh: 'แอร์',                   labelEn: 'Air Conditioner',  sort: 1  },
  { code: 'refrigerator', labelTh: 'ตู้เย็น',             labelEn: 'Refrigerator',     sort: 2  },
  { code: 'washer',     labelTh: 'เครื่องซักผ้า',         labelEn: 'Washing Machine',  sort: 3  },
  { code: 'computer',   labelTh: 'คอมพิวเตอร์',           labelEn: 'Computer/PC',      sort: 4  },
  { code: 'tv',         labelTh: 'โทรทัศน์',              labelEn: 'Television',       sort: 5  },
  { code: 'smartphone', labelTh: 'สมาร์ทโฟน/มือถือ',     labelEn: 'Smartphone',       sort: 6  },
  { code: 'notebook',   labelTh: 'โน้ตบุ๊ก/แล็ปท็อป',    labelEn: 'Notebook/Laptop',  sort: 7  },
  { code: 'monitor',    labelTh: 'มอนิเตอร์',             labelEn: 'Monitor',          sort: 8  },
  { code: 'printer',    labelTh: 'เครื่องพิมพ์',          labelEn: 'Printer',          sort: 9  },
  { code: 'tablet',     labelTh: 'แท็บเล็ต',              labelEn: 'Tablet',           sort: 10 },
  { code: 'microwave',  labelTh: 'ไมโครเวฟ',              labelEn: 'Microwave Oven',   sort: 11 },
  { code: 'fan',        labelTh: 'พัดลม',                 labelEn: 'Electric Fan',     sort: 12 },
  // D-5 additions
  { code: 'desktop_pc', labelTh: 'คอมพิวเตอร์ตั้งโต๊ะ',  labelEn: 'Desktop PC',       sort: 13 },
]

// ── Section 1: 0022_d5_seed_categories.sql ────────────────────────────────────

function generate0022CategoriesSql(): string {
  const lines: string[] = []
  lines.push(`-- Migration: 0022_d5_seed_categories`)
  lines.push(`-- D-5 Full Import: Appliance Categories Seed (idempotent)`)
  lines.push(`--`)
  lines.push(`-- Generated by generate-d5-seed.ts · ${new Date().toISOString()}`)
  lines.push(`--`)
  lines.push(`-- Prereq: 0012_repair_master_data (repair_appliance_categories must exist)`)
  lines.push(`-- Rollback: DELETE FROM repair_appliance_categories WHERE code IN ('desktop_pc');`)
  lines.push(`--           (other categories seeded in 0016 — leave as-is)`)
  lines.push(``)

  const inserts = D5_CATEGORIES.map(cat =>
    `  (${sqlStr(cat.code)}, ${sqlStr(cat.labelTh)}, ${sqlStr(cat.labelEn)}, ${sqlInt(cat.sort)}, TRUE)`
  )

  lines.push(`INSERT INTO "repair_appliance_categories" ("code", "label_th", "label_en", "sort_order", "is_active")`)
  lines.push(`VALUES`)
  lines.push(inserts.join(',\n'))
  lines.push(`ON CONFLICT ("code") DO UPDATE SET`)
  lines.push(`  "label_th"   = EXCLUDED."label_th",`)
  lines.push(`  "label_en"   = EXCLUDED."label_en",`)
  lines.push(`  "sort_order" = EXCLUDED."sort_order",`)
  lines.push(`  "updated_at" = NOW();`)
  lines.push(``)

  return lines.join('\n')
}

// ── Section 2: 0023_d5_seed_repair_master.sql ─────────────────────────────────

function generateRepairMasterSql(docs: RepairDocResult[], imageInserts: string[]): string {
  const worktypeInserts: string[] = []
  const symptomInserts: string[] = []
  const partInserts: string[] = []
  const templateInserts: string[] = []
  const checklistItemInserts: string[] = []

  const counts = { worktypes: 0, symptoms: 0, parts: 0, checklist: 0, images: imageInserts.length }

  // Worktypes
  for (const wt of WORKTYPES) {
    worktypeInserts.push(
      `  (${sqlStr(wt.kind)}, ${sqlStr(wt.code)}, ${sqlStr(wt.labelTh)}, ${sqlStr(wt.labelEn)}, TRUE)`
    )
    counts.worktypes++
  }

  // Per-doc: symptoms + parts + checklist
  for (const doc of docs) {
    if (doc.applianceType === 'unknown') continue
    // Skip the stats file (handled in ขั้น 5 frequency updates)
    if (doc.sourceFile.toLowerCase().includes('อาการเสียเครื่อง') && !doc.sourceFile.match(/^\d\./)) continue

    const catSql = catIdSql(doc.applianceType)

    // Symptoms
    for (let i = 0; i < doc.symptoms.length; i++) {
      const sym = doc.symptoms[i]
      const code = `${doc.applianceType}-${String(i + 1).padStart(3, '0')}`
      symptomInserts.push(
        `  (gen_random_uuid(), ${catSql}, ${sqlStr(code)}, ${sqlStr(sym.description)}, NULL, NULL, ${sqlInt(i)}, TRUE, NOW(), NOW())`
      )
      counts.symptoms++
    }

    // Parts
    let currentGroup: string | undefined
    for (let i = 0; i < doc.parts.length; i++) {
      const part = doc.parts[i]
      if (part.partGroup && part.partGroup !== currentGroup) {
        currentGroup = part.partGroup
      }
      const groupSql = currentGroup ? sqlStr(currentGroup) : 'NULL'
      const partNumSql = part.partNumber ? sqlStr(part.partNumber) : 'NULL'
      partInserts.push(
        `  (gen_random_uuid(), ${catSql}, ${partNumSql}, ${groupSql}, ${sqlStr(part.partName)}, ${sqlStr(doc.sourceFile)}, ${sqlInt(i)}, TRUE, NOW(), NOW())`
      )
      counts.parts++
    }

    // Checklist template per category
    if (doc.checklist.length > 0) {
      const tplNameTh = `ชุดตรวจสอบ ${doc.applianceType}`
      templateInserts.push(
        `  (gen_random_uuid(), ${catSql}, ${sqlStr(tplNameTh)}, NULL, 1, TRUE, FALSE, TRUE, NOW(), NOW())`
      )
      for (let j = 0; j < doc.checklist.length; j++) {
        const item = doc.checklist[j]
        const tplCode = `${doc.applianceType}-default-${String(j + 1).padStart(3, '0')}`
        checklistItemInserts.push(
          `  (gen_random_uuid(),\n` +
          `   (SELECT id FROM repair_checklist_templates WHERE name_th=${sqlStr(tplNameTh)} LIMIT 1),\n` +
          `   ${sqlStr('parts_inspection')}, ${sqlStr(tplCode)}, ${sqlStr(item.item)}, NULL, TRUE, ${sqlInt(j)}, NOW())`
        )
        counts.checklist++
      }
    }
  }

  const lines: string[] = []
  lines.push(`-- Migration: 0023_d5_seed_repair_master`)
  lines.push(`-- D-5 Full Import: Repair Master Seed (worktypes + symptoms + parts + images + frequency)`)
  lines.push(`--`)
  lines.push(`-- Generated by generate-d5-seed.ts · ${new Date().toISOString()}`)
  lines.push(`-- Parsed from: ${docs.filter(d => d.sourceFile.match(/^\d\./)).map(d => d.sourceFile).join(', ')}`)
  lines.push(`--`)
  lines.push(`-- Counts: worktypes=${counts.worktypes} symptoms=${counts.symptoms} parts=${counts.parts}`)
  lines.push(`--         checklist_items=${counts.checklist} asset_images=${counts.images}`)
  lines.push(`--`)
  lines.push(`-- Prereq: 0022_d5_seed_categories, 0018_repair_part_catalog`)
  lines.push(`-- Rollback: DELETE FROM repair_worktypes; DELETE FROM repair_symptoms WHERE source_file IS NOT NULL;`)
  lines.push(`--           DELETE FROM repair_part_catalog WHERE source_file IS NOT NULL;`)
  lines.push(`--           DELETE FROM asset_images WHERE source_file IS NOT NULL;`)
  lines.push(``)

  // 1. Worktypes
  if (worktypeInserts.length > 0) {
    lines.push(`-- ── 1. repair_worktypes ──────────────────────────────────────────────────────`)
    lines.push(`INSERT INTO "repair_worktypes" ("kind", "code", "label_th", "label_en", "is_active")`)
    lines.push(`VALUES`)
    lines.push(worktypeInserts.join(',\n'))
    lines.push(`ON CONFLICT ("code") DO NOTHING;`)
    lines.push(``)
  }

  // 2. Symptoms
  if (symptomInserts.length > 0) {
    lines.push(`-- ── 2. repair_symptoms ───────────────────────────────────────────────────────`)
    lines.push(`INSERT INTO "repair_symptoms"`)
    lines.push(`  ("id", "appliance_category_id", "code", "label_th", "label_en", "severity_hint", "sort_order", "is_active", "created_at", "updated_at")`)
    lines.push(`VALUES`)
    lines.push(symptomInserts.join(',\n'))
    lines.push(`ON CONFLICT ("appliance_category_id", "code") DO NOTHING;`)
    lines.push(``)
  }

  // 3. Parts
  if (partInserts.length > 0) {
    lines.push(`-- ── 3. repair_part_catalog ───────────────────────────────────────────────────`)
    lines.push(`INSERT INTO "repair_part_catalog"`)
    lines.push(`  ("id", "appliance_category_id", "part_number", "part_group", "name_th", "source_file", "sort_order", "is_active", "created_at", "updated_at")`)
    lines.push(`VALUES`)
    lines.push(partInserts.join(',\n'))
    lines.push(`ON CONFLICT ("appliance_category_id", "name_th") DO NOTHING;`)
    lines.push(``)
  }

  // 4. Checklist templates
  if (templateInserts.length > 0) {
    lines.push(`-- ── 4. repair_checklist_templates ───────────────────────────────────────────`)
    lines.push(`INSERT INTO "repair_checklist_templates"`)
    lines.push(`  ("id", "appliance_category_id", "name_th", "name_en", "version", "is_default", "is_fallback", "is_active", "created_at", "updated_at")`)
    lines.push(`VALUES`)
    lines.push(templateInserts.join(',\n'))
    lines.push(`ON CONFLICT DO NOTHING;`)
    lines.push(``)
    if (checklistItemInserts.length > 0) {
      lines.push(`INSERT INTO "repair_checklist_items"`)
      lines.push(`  ("id", "template_id", "section", "code", "label_th", "label_en", "is_required", "sort_order", "created_at")`)
      lines.push(`VALUES`)
      lines.push(checklistItemInserts.join(',\n'))
      lines.push(`ON CONFLICT ("template_id", "code") DO NOTHING;`)
      lines.push(``)
    }
  }

  // 5. Asset images
  if (imageInserts.length > 0) {
    lines.push(`-- ── 5. asset_images (D89 canonical) ──────────────────────────────────────────`)
    lines.push(`INSERT INTO "asset_images"`)
    lines.push(`  ("id", "category", "appliance_category", "local_path", "cloud_url", "alt_text", "linked_entity_type", "linked_entity_id", "source_file", "sort_order", "created_at")`)
    lines.push(`VALUES`)
    lines.push(imageInserts.join(',\n'))
    lines.push(`ON CONFLICT ("local_path") DO NOTHING;`)
    lines.push(``)
  }

  return lines.join('\n')
}

// ── Section 3: 0024_d5_seed_pricing.sql ───────────────────────────────────────

function generatePricingSql(
  iphoneResults: PricingSheetResult[],
  notebookResults: PricingSheetResult[],
): string {
  const catInserts: string[] = []
  const modelInserts: string[] = []
  const pricePointInserts: string[] = []
  const counts = { categories: 0, models: 0, pricePoints: 0 }

  // ── iPhone: Pattern A — D-5 dimensions {boot_state, accessory, problem, scratch_level} ──

  // Seed iPhone/smartphone pricing category first
  catInserts.push(
    `  (gen_random_uuid(), ${sqlStr('smartphone')}, ${sqlStr('สมาร์ทโฟน/มือถือ')},\n` +
    `   NULL, ${catIdSql('smartphone')}, 0, TRUE, NOW())`
  )
  counts.categories++

  for (const fileResult of iphoneResults) {
    for (const sheet of fileResult.sheets) {
      if (!sheet.importWorthy || sheet.pattern !== 'A' || !sheet.rowsA) continue

      const modelsSeen = new Map<string, boolean>()

      for (const row of sheet.rowsA) {
        if (!row.model) continue

        const catCode = 'smartphone'
        const modelCode = slugify(row.model, 45)
        const modelKey = `${catCode}:${modelCode}`

        if (!modelsSeen.has(modelKey)) {
          modelsSeen.set(modelKey, true)
          modelInserts.push(
            `  (gen_random_uuid(),\n` +
            `   ${pricingCatIdSql(catCode)},\n` +
            `   ${sqlStr(modelCode)}, ${sqlStr(row.model)}, NULL,\n` +
            `   NULL, '{}', NULL, NULL, TRUE, NOW())`
          )
          counts.models++
        }

        // D-5 dimensions: {boot_state, accessory, problem, scratch_level}
        const dims = {
          boot_state: row.bootState ?? '',
          accessory: row.accessory ?? '',
          problem: row.symptom ?? '',
          scratch_level: String(row.scratchLevel ?? ''),
        }
        const dHash = dimsHash(dims)
        const dimsJson = JSON.stringify(dims)
        const cost = row.totalCost ?? row.laborCost ?? 0
        const isMulti = row.isMultiIssue ?? false

        pricePointInserts.push(
          `  (gen_random_uuid(),\n` +
          `   (SELECT id FROM used_pricing_models\n` +
          `    WHERE category_id=${pricingCatIdSql(catCode)}\n` +
          `    AND code=${sqlStr(modelCode)} LIMIT 1),\n` +
          `   '${dimsJson.replace(/'/g, "''")}', ${sqlStr(dHash)},\n` +
          `   ${sqlStr(String(cost))}, NULL, NULL, ${sqlBool(isMulti)}, TRUE, NOW())`
        )
        counts.pricePoints++
      }
    }
  }

  // ── Notebook: Pattern B — D-5 sheet whitelist (NB/Desktop PC/MONITOR LED/HP Printer) ──

  // Collect unique category codes from Notebook sheets
  const nbCatCodes = new Set<string>()

  for (const fileResult of notebookResults) {
    for (const sheet of fileResult.sheets) {
      if (!sheet.importWorthy || sheet.pattern !== 'B' || !sheet.rowsB) continue

      const catCode = nbSheetToCatCode(sheet.sheetName)
      if (!nbCatCodes.has(catCode)) {
        nbCatCodes.add(catCode)
        // Resolve label from D5_CATEGORIES or use sheet name
        const catDef = D5_CATEGORIES.find(c => c.code === catCode)
        const labelTh = catDef?.labelTh ?? sheet.sheetName
        const sortOrd = catDef?.sort ?? 99
        catInserts.push(
          `  (gen_random_uuid(), ${sqlStr(catCode)}, ${sqlStr(labelTh)},\n` +
          `   NULL, ${catIdSql(catCode)}, ${sqlInt(sortOrd)}, TRUE, NOW())`
        )
        counts.categories++
      }

      const modelsSeen = new Map<string, boolean>()

      for (const row of sheet.rowsB) {
        if (!row.model) continue

        const modelCode = slugify(row.model, 45)
        const modelKey = `${catCode}:${modelCode}`

        if (!modelsSeen.has(modelKey)) {
          modelsSeen.set(modelKey, true)
          const specAttrs = JSON.stringify({
            screenSize: row.screenSize ?? null,
            ram: row.ram ?? null,
            storage: row.storage ?? null,
          })
          modelInserts.push(
            `  (gen_random_uuid(),\n` +
            `   ${pricingCatIdSql(catCode)},\n` +
            `   ${sqlStr(modelCode)}, ${sqlStr(row.model)}, NULL,\n` +
            `   ${sqlStr(row.brand ?? null)}, '${specAttrs.replace(/'/g, "''")}', NULL, NULL, TRUE, NOW())`
          )
          counts.models++
        }

        // Pattern B dimensions: {service_type}
        const dims = { service_type: row.serviceType ?? '' }
        const dHash = dimsHash(dims)
        const dimsJson = JSON.stringify(dims)

        pricePointInserts.push(
          `  (gen_random_uuid(),\n` +
          `   (SELECT id FROM used_pricing_models\n` +
          `    WHERE category_id=${pricingCatIdSql(catCode)}\n` +
          `    AND code=${sqlStr(modelCode)} LIMIT 1),\n` +
          `   '${dimsJson.replace(/'/g, "''")}', ${sqlStr(dHash)},\n` +
          `   ${sqlStr(String(row.cost))}, NULL, NULL, FALSE, TRUE, NOW())`
        )
        counts.pricePoints++
      }
    }
  }

  const lines: string[] = []
  lines.push(`-- Migration: 0024_d5_seed_pricing`)
  lines.push(`-- D-5 Full Import: Used Pricing Seed`)
  lines.push(`--   iPhone Pattern A: dimensions {boot_state, accessory, problem, scratch_level}`)
  lines.push(`--   Notebook Pattern B: NB / Desktop PC / MONITOR LED / HP Printer`)
  lines.push(`--`)
  lines.push(`-- Generated by generate-d5-seed.ts · ${new Date().toISOString()}`)
  lines.push(`--`)
  lines.push(`-- Counts: categories=${counts.categories} models=${counts.models}`)
  lines.push(`--         price_points=${counts.pricePoints}`)
  lines.push(`--`)
  lines.push(`-- Prereq: 0022_d5_seed_categories, 0014_repair_pricing`)
  lines.push(`-- Rollback: DELETE FROM used_pricing_price_points;`)
  lines.push(`--           DELETE FROM used_pricing_models;`)
  lines.push(`--           DELETE FROM used_pricing_categories WHERE code IN ('smartphone','notebook','desktop_pc','monitor','printer');`)
  lines.push(``)

  if (catInserts.length > 0) {
    lines.push(`-- ── 1. used_pricing_categories ──────────────────────────────────────────────`)
    lines.push(`INSERT INTO "used_pricing_categories" ("id", "code", "label_th", "label_en", "appliance_category_id", "sort_order", "is_active", "created_at")`)
    lines.push(`VALUES`)
    lines.push(catInserts.join(',\n'))
    lines.push(`ON CONFLICT ("code") DO UPDATE SET`)
    lines.push(`  "label_th"          = EXCLUDED."label_th",`)
    lines.push(`  "appliance_category_id" = EXCLUDED."appliance_category_id";`)
    lines.push(``)
  }

  if (modelInserts.length > 0) {
    lines.push(`-- ── 2. used_pricing_models (${counts.models} rows) ───────────────────────────`)
    lines.push(`INSERT INTO "used_pricing_models" ("id", "category_id", "code", "label_th", "label_en", "brand", "spec_attributes", "base_market_price", "notes", "is_active", "created_at")`)
    lines.push(`VALUES`)
    lines.push(modelInserts.join(',\n'))
    lines.push(`ON CONFLICT ("category_id", "code") DO NOTHING;`)
    lines.push(``)
  }

  if (pricePointInserts.length > 0) {
    lines.push(`-- ── 3. used_pricing_price_points (${counts.pricePoints} rows) ────────────────`)
    lines.push(`INSERT INTO "used_pricing_price_points" ("id", "model_id", "dimensions", "dimensions_hash", "base_price", "min_price", "max_price", "is_multi_issue", "is_active", "created_at")`)
    lines.push(`VALUES`)
    lines.push(pricePointInserts.join(',\n'))
    lines.push(`ON CONFLICT ("dimensions_hash") DO NOTHING;`)
    lines.push(``)
  }

  return lines.join('\n')
}

// ── Asset image SQL generator (D-5: 3 subfolders) ─────────────────────────────

function generateAssetImageInserts(results: DocImageExtractResult[]): string[] {
  const inserts: string[] = []
  for (const result of results) {
    for (const img of result.images) {
      inserts.push(
        `  (gen_random_uuid(), ${sqlStr(img.category)}, ${sqlStr(img.appliance_category)},\n` +
        `   ${sqlStr(img.local_path)}, NULL, ${sqlStr(img.alt_text)},\n` +
        `   ${sqlStr(img.linked_entity_type)}, NULL, ${sqlStr(img.source_file)}, ${sqlInt(img.sort_order)}, NOW())`
      )
    }
  }
  return inserts
}

// ── Seed frequency SQL (ขั้น 5) ────────────────────────────────────────────────

function generateFrequencySql(docs: RepairDocResult[]): string {
  const statsDoc = docs.find(d =>
    d.sourceFile.toLowerCase().includes('อาการเสียเครื่อง') && !d.sourceFile.match(/^\d\./)
  )
  if (!statsDoc || statsDoc.symptoms.length === 0) {
    return '-- ขั้น 5: seed_frequency — ไม่พบข้อมูลสถิติ\n'
  }

  const lines: string[] = []
  lines.push(`-- ── ขั้น 5: seed_frequency ─────────────────────────────────────────────────────`)
  lines.push(`-- อัพเดต sort_order ตามความถี่จากไฟล์สถิติ (${statsDoc.symptoms.length} อาการ)`)
  lines.push(``)
  for (let i = 0; i < statsDoc.symptoms.length; i++) {
    const sym = statsDoc.symptoms[i]
    const snippet = sym.description.slice(0, 20)
    lines.push(
      `UPDATE "repair_symptoms" SET "sort_order" = ${i} WHERE "label_th" ILIKE ${sqlStr('%' + snippet + '%')};`
    )
  }
  lines.push(``)
  return lines.join('\n')
}

// ── D-5 image extraction (3 subfolders: parts/symptoms/checklist) ──────────────

async function extractImagesWithD5Classification(
  importDir: string,
  assetsDir: string,
): Promise<DocImageExtractResult[]> {
  const files = fs.readdirSync(importDir)
    .filter(f => f.toLowerCase().endsWith('.docx'))
    .sort()

  const results: DocImageExtractResult[] = []

  for (const file of files) {
    const filePath = path.join(importDir, file)
    console.error(`🖼️  Extracting images: ${file}`)

    // Extract to a temp dir first, then classify
    const tempDir = path.join(assetsDir, '_tmp_d5')
    const result = await extractDocImages(filePath, tempDir)

    // Re-classify images into proper subfolders
    const reclassified: typeof result.images = []
    for (const img of result.images) {
      const cat = classifyImageCategory(img.alt_text ?? '')
      const subDir = cat  // 'parts' | 'symptoms' | 'checklist'

      const outDir = path.join(assetsDir, subDir)
      fs.mkdirSync(outDir, { recursive: true })

      // Move file from temp to correct subfolder
      const filename = path.basename(img.local_path)
      const oldPath = path.join(tempDir, filename)
      const newPath = path.join(outDir, filename)

      if (fs.existsSync(oldPath)) {
        try {
          fs.renameSync(oldPath, newPath)
        } catch {
          // If rename fails (cross-device), copy+delete
          fs.copyFileSync(oldPath, newPath)
          fs.unlinkSync(oldPath)
        }
      }

      // Determine linked_entity_type from category
      const entityType = cat === 'parts' ? 'repair_part_catalog'
        : cat === 'symptoms' ? 'repair_symptoms'
        : 'repair_checklist_items'

      reclassified.push({
        ...img,
        category: cat,
        local_path: `/assets/${subDir}/${filename}`,
        linked_entity_type: entityType,
      })
    }

    // Clean up temp dir if empty
    try {
      const remaining = fs.readdirSync(tempDir)
      if (remaining.length === 0) fs.rmdirSync(tempDir)
    } catch { /* ignore */ }

    results.push({ ...result, images: reclassified })
  }

  return results
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)

  const importDirIdx = args.indexOf('--import-dir')
  const assetsDirIdx = args.indexOf('--assets-dir')
  const outDirIdx    = args.indexOf('--out-dir')

  if (importDirIdx < 0 || assetsDirIdx < 0 || outDirIdx < 0) {
    console.error('Usage: generate-d5-seed.ts --import-dir <path> --assets-dir <path> --out-dir <path>')
    process.exit(1)
  }

  const importDir = args[importDirIdx + 1]
  const assetsDir = args[assetsDirIdx + 1]
  const outDir    = args[outDirIdx + 1]

  // ── ขั้น 2: Categories SQL ───────────────────────────────────────────────────
  console.error('\n📁 ขั้น 2: Generating appliance categories seed SQL...')
  const categoriesSql = generate0022CategoriesSql()
  const categoriesFile = path.join(outDir, '0022_d5_seed_categories.sql')
  fs.writeFileSync(categoriesFile, categoriesSql, 'utf8')
  console.error(`   ✅ ${categoriesFile} (${D5_CATEGORIES.length} categories)`)

  // ── ขั้น 3: Parse repair docs ────────────────────────────────────────────────
  console.error('\n📄 ขั้น 3: Parsing repair documents...')
  const allDocs = await parseRepairDocsDir(importDir)
  const coreDocs = allDocs.filter(d =>
    d.sourceFile.match(/^\d\./) && d.applianceType !== 'unknown'
  )
  console.error(`   → ${coreDocs.length} core docs: ${coreDocs.map(d => d.applianceType).join(', ')}`)
  for (const d of coreDocs) {
    const errInfo = d.parseErrors.length > 0 ? ` ⚠️ ${d.parseErrors.length} parse errors` : ''
    console.error(`   ${d.applianceType.padEnd(14)} parts: ${d.parts.length} | symptoms: ${d.symptoms.length} | checklist: ${d.checklist.length}${errInfo}`)
  }

  // ── ขั้น 4: Extract images (D-5: 3 subfolders) ───────────────────────────────
  console.error('\n🖼️  ขั้น 4: Extracting images (parts/symptoms/checklist subfolders)...')
  const imageResults = await extractImagesWithD5Classification(importDir, assetsDir)
  const imageInserts = generateAssetImageInserts(imageResults)
  const totalImages = imageResults.reduce((s, r) => s + r.extractedCount, 0)
  console.error(`   → ${totalImages} images extracted`)
  for (const r of imageResults) {
    const byCategory = r.images.reduce((acc, img) => {
      acc[img.category] = (acc[img.category] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
    const cats = Object.entries(byCategory).map(([k, v]) => `${k}:${v}`).join(' ')
    console.error(`   ${r.applianceCategory.padEnd(14)} ${r.extractedCount} images [${cats}] skipped:${r.skippedCount}`)
  }

  // ── ขั้น 5: Seed frequency ───────────────────────────────────────────────────
  console.error('\n📊 ขั้น 5: Generating seed_frequency SQL from stats file...')
  const freqSql = generateFrequencySql(allDocs)
  const statsDoc = allDocs.find(d => d.sourceFile.toLowerCase().includes('อาการเสียเครื่อง') && !d.sourceFile.match(/^\d\./))
  console.error(`   → ${statsDoc ? statsDoc.symptoms.length : 0} frequency entries`)

  // ── Generate 0023: Repair master ─────────────────────────────────────────────
  console.error('\n📝 Generating 0023_d5_seed_repair_master.sql...')
  const masterSql = generateRepairMasterSql(coreDocs, imageInserts) + '\n' + freqSql
  const masterFile = path.join(outDir, '0023_d5_seed_repair_master.sql')
  fs.writeFileSync(masterFile, masterSql, 'utf8')
  console.error(`   ✅ ${masterFile}`)

  // ── ขั้น 6: Parse Excel pricing ──────────────────────────────────────────────
  console.error('\n💰 ขั้น 6: Parsing Excel pricing files...')

  const iphoneFile = path.join(importDir, 'ราคารับซื้อ I PHONE  มือสอง.xlsx')
  const notebookFile = path.join(importDir, 'ราคารับซื้อ Notebook มือสอง.xlsx')

  // iPhone: Pattern A
  const iphoneResults: PricingSheetResult[] = []
  if (fs.existsSync(iphoneFile)) {
    const r = await parsePricingExcel(iphoneFile, 'A')
    iphoneResults.push(r)
    const importRows = r.sheets.filter(s => s.importWorthy).reduce((s, sh) => s + (sh.rowsA?.length ?? 0), 0)
    console.error(`   iPhone.xlsx: ${r.sheets.length} sheets, ${importRows} import rows`)
    const multiIssueCount = r.sheets.flatMap(s => s.rowsA ?? []).filter(row => row.isMultiIssue).length
    if (multiIssueCount > 0) console.error(`   → is_multi_issue=true: ${multiIssueCount} rows`)
  } else {
    console.error(`   ⚠️  Not found: ${iphoneFile}`)
  }

  // Notebook: Pattern B with D-5 whitelist
  const notebookResults: PricingSheetResult[] = []
  if (fs.existsSync(notebookFile)) {
    const r = await parsePricingExcel(notebookFile, 'B')
    // Apply D-5 whitelist filter
    const originalSheets = r.sheets
    r.sheets = r.sheets.map(sheet => {
      const rows2d: string[][] = []  // not needed for importWorthy check
      const worthy = isNbSheetImportWorthy(sheet.sheetName, new Array(sheet.rowCount + 1).fill([]))
      return { ...sheet, importWorthy: worthy }
    })
    notebookResults.push(r)
    const importSheets = r.sheets.filter(s => s.importWorthy)
    const skipSheets = originalSheets.filter(s => !r.sheets.find(rs => rs.sheetName === s.sheetName)?.importWorthy)
    console.error(`   Notebook.xlsx: ${r.sheets.length} sheets total`)
    console.error(`   → Import: ${importSheets.map(s => `"${s.sheetName}"`).join(', ')}`)
    console.error(`   → Skip: ${skipSheets.map(s => `"${s.sheetName}"`).join(', ')}`)
    const importRows = importSheets.reduce((s, sh) => s + (sh.rowsB?.length ?? 0), 0)
    console.error(`   → ${importRows} import rows`)
  } else {
    console.error(`   ⚠️  Not found: ${notebookFile}`)
  }

  // Generate 0024: Pricing
  console.error('\n📝 Generating 0024_d5_seed_pricing.sql...')
  const pricingSql = generatePricingSql(iphoneResults, notebookResults)
  const pricingFile = path.join(outDir, '0024_d5_seed_pricing.sql')
  fs.writeFileSync(pricingFile, pricingSql, 'utf8')
  console.error(`   ✅ ${pricingFile}`)

  // ── ขั้น 7: Summary report ────────────────────────────────────────────────────
  console.error('\n')
  console.error('═══════════════════════════════════════════════════════════════')
  console.error('📊 D-5 Full Import — Seed Generation Report')
  console.error('═══════════════════════════════════════════════════════════════')
  console.error(`ขั้น 2 — appliance_categories: ${D5_CATEGORIES.length} categories → ${categoriesFile}`)
  console.error(`ขั้น 3 — Word parser (5 docs):`)
  for (const d of coreDocs) {
    console.error(`  ${d.applianceType.padEnd(14)} | parts: ${d.parts.length} | symptoms: ${d.symptoms.length} | checklist: ${d.checklist.length}`)
  }
  console.error(`  TOTAL: parts=${coreDocs.reduce((s,d)=>s+d.parts.length,0)} symptoms=${coreDocs.reduce((s,d)=>s+d.symptoms.length,0)}`)
  console.error(`ขั้น 4 — Image extraction (3 subfolders):`)
  const bySubfolder: Record<string, number> = {}
  for (const r of imageResults) {
    for (const img of r.images) {
      bySubfolder[img.category] = (bySubfolder[img.category] ?? 0) + 1
    }
  }
  console.error(`  parts: ${bySubfolder.parts ?? 0} | symptoms: ${bySubfolder.symptoms ?? 0} | checklist: ${bySubfolder.checklist ?? 0}`)
  console.error(`  TOTAL: ${totalImages} images`)
  console.error(`ขั้น 5 — seed_frequency: included in ${masterFile}`)
  console.error(`ขั้น 6 — Excel pricing:`)
  const iphoneRows = iphoneResults.reduce((s,r) => s + r.totalImportRows, 0)
  const nbRows = notebookResults.reduce((s,r) => s + r.sheets.filter(sh=>sh.importWorthy).reduce((ss,sh)=>ss+(sh.rowsB?.length??0),0), 0)
  console.error(`  iPhone: ${iphoneRows} rows | Notebook: ${nbRows} rows`)
  console.error(`ขั้น 7 — Output migrations:`)
  console.error(`  ${categoriesFile}`)
  console.error(`  ${masterFile}`)
  console.error(`  ${pricingFile}`)
  console.error('═══════════════════════════════════════════════════════════════')
  console.error('\n✅ D-5 Full Import complete — please verify SQL files before committing')
}

// CJS guard: only run as CLI, not when imported as a module
if (require.main === module) {
  main().catch(e => {
    console.error('Fatal:', e)
    process.exit(1)
  })
}
