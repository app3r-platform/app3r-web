/**
 * generate-seed-sql.ts — D88 Full Import: Seed SQL Generator
 *
 * Runs repair doc parsers + Excel parsers → generates SQL seed migrations:
 *   0018_seed_repair_master.sql   — symptoms, parts, worktypes, tools, checklist_templates
 *   0019_seed_pricing.sql         — used_pricing categories, models, dimensions, price_points
 *
 * Also extracts images from all .docx → /assets/parts/
 *
 * Usage:
 *   npx tsx src/scripts/import/generate-seed-sql.ts
 *     --import-dir "D:/ClaudeCode/App3R/App3R-System/import-data"
 *     --assets-dir "./public/assets"
 *     --out-dir "./src/db/migrations"
 *
 * Spec: D88 Import Spec (36a813ec-7277-8166-b2cb-d31630a264c8)
 * Backend D88 Full Import · 2026-05-25
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

import { parseRepairDocsDir, type RepairDocResult, type RepairPart, type RepairSymptom } from './parse-repair-docs'
import { parsePricingExcel, parsePricingExcelDir, type PricingSheetResult } from './parse-pricing-excel'
import { extractDocImagesDir } from './extract-doc-images'

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Generate deterministic UUID-like hex from a string (for stable seed IDs) */
function stableUuid(input: string): string {
  const hash = crypto.createHash('sha256').update(input).digest('hex')
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),   // version 4
    (parseInt(hash.slice(16, 18), 16) & 0x3f | 0x80).toString(16) + hash.slice(18, 20),
    hash.slice(20, 32),
  ].join('-')
}

/** SQL-escape single-quoted string */
function sqlStr(s: string | null | undefined): string {
  if (s == null) return 'NULL'
  return `'${s.replace(/'/g, "''")}'`
}

function sqlInt(n: number): string { return String(n) }
function sqlBool(b: boolean): string { return b ? 'TRUE' : 'FALSE' }

/** Slug from Thai+ASCII text → lowercase kebab (for code fields) */
function slugify(s: string, maxLen = 50): string {
  return s
    .toLowerCase()
    .replace(/[^฀-๿a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLen)
}

// ── Appliance category ID map (matches migration 0016 seed) ───────────────────

// Stable UUIDs derived from category code — must match what 0016 seeds via
// ON CONFLICT (code) DO NOTHING. We generate stable IDs for seed cross-references.
// NOTE: In practice the DB assigns real UUIDs. For the seed SQL, we use
// placeholders resolved via subquery: (SELECT id FROM repair_appliance_categories WHERE code='ac')

type ApplianceCode = 'ac' | 'refrigerator' | 'washer' | 'computer' | 'tv' |
                     'smartphone' | 'notebook' | 'monitor' | 'printer' | 'tablet' |
                     'microwave' | 'fan'

const APPLIANCE_TO_CODE: Record<string, ApplianceCode> = {
  ac: 'ac',
  refrigerator: 'refrigerator',
  washer: 'washer',
  computer: 'computer',
  tv: 'tv',
  smartphone: 'smartphone',
  notebook: 'notebook',
  monitor: 'monitor',
  printer: 'printer',
  tablet: 'tablet',
  microwave: 'microwave',
  fan: 'fan',
}

/** SQL subquery to resolve category ID from code */
function catIdSql(applianceType: string): string {
  const code = APPLIANCE_TO_CODE[applianceType] ?? applianceType
  return `(SELECT id FROM repair_appliance_categories WHERE code=${sqlStr(code)})`
}

// ── Section 1: Repair Master Seed (0018) ──────────────────────────────────────

interface SeedContext {
  worktypeInserts: string[]
  toolInserts: string[]
  symptomInserts: string[]
  partInserts: string[]
  templateInserts: string[]
  checklistItemInserts: string[]
  assetImageInserts: string[]
  counts: { worktypes: number; tools: number; symptoms: number; parts: number; checklist: number; images: number }
}

// Standard worktypes — seeded once (not per file)
const WORKTYPES = [
  { code: 'REPAIR',   kind: 'REPAIR',   labelTh: 'ซ่อมแซม',       labelEn: 'Repair' },
  { code: 'REPLACE',  kind: 'REPLACE',  labelTh: 'เปลี่ยนใหม่',    labelEn: 'Replace' },
  { code: 'CLEAN',    kind: 'CLEAN',    labelTh: 'ทำความสะอาด',    labelEn: 'Clean' },
  { code: 'REFILL',   kind: 'REFILL',   labelTh: 'เติม/เพิ่ม',     labelEn: 'Refill' },
  { code: 'INSPECT',  kind: 'INSPECT',  labelTh: 'ตรวจสอบ',        labelEn: 'Inspect' },
]

/** Extract tools mentioned in part steps */
function extractTools(parts: RepairPart[]): string[] {
  const toolSet = new Set<string>()
  for (const part of parts) {
    for (const step of part.steps) {
      // Common tool keywords
      const toolMatches = step.match(/(?:มัลติมิเตอร์|ไขควง|คีม|ประแจ|เครื่องวัด|ปั๊ม|เกจ|แวคคั่ม|ไนโตรเจน|คอมเพรสเซอร์|ชุดเครื่องมือ)/g)
      if (toolMatches) {
        toolMatches.forEach(t => toolSet.add(t.trim()))
      }
    }
  }
  return [...toolSet]
}

function generateRepairMasterSql(docs: RepairDocResult[], assetImages: string[]): string {
  const ctx: SeedContext = {
    worktypeInserts: [],
    toolInserts: [],
    symptomInserts: [],
    partInserts: [],
    templateInserts: [],
    checklistItemInserts: [],
    assetImageInserts: [...assetImages],
    counts: { worktypes: 0, tools: 0, symptoms: 0, parts: 0, checklist: 0, images: assetImages.length },
  }

  // ── Seed worktypes ─────────────────────────────────────────────────────────
  for (const wt of WORKTYPES) {
    ctx.worktypeInserts.push(
      `  (${sqlStr(wt.kind)}, ${sqlStr(wt.code)}, ${sqlStr(wt.labelTh)}, ${sqlStr(wt.labelEn)}, TRUE)`
    )
    ctx.counts.worktypes++
  }

  // ── Per-document: symptoms + parts ────────────────────────────────────────
  // Deduplicate tools across all docs
  const allToolNames = new Set<string>()

  for (const doc of docs) {
    // Skip non-repair files
    if (doc.applianceType === 'unknown') continue
    if (doc.sourceFile.startsWith('อาการเสียเครื่อง')) continue  // stats file (ขั้น 5 only)

    const catSql = catIdSql(doc.applianceType)

    // ── Symptoms ──────────────────────────────────────────────────────────
    for (let i = 0; i < doc.symptoms.length; i++) {
      const sym = doc.symptoms[i]
      const code = `${doc.applianceType}-${String(i + 1).padStart(3, '0')}`
      ctx.symptomInserts.push(
        `  (gen_random_uuid(), ${catSql}, ${sqlStr(code)}, ${sqlStr(sym.description)}, NULL, NULL, ${sqlInt(i)}, TRUE, NOW(), NOW())`
      )
      ctx.counts.symptoms++
    }

    // ── Parts ─────────────────────────────────────────────────────────────
    let currentGroup: string | undefined
    for (let i = 0; i < doc.parts.length; i++) {
      const part = doc.parts[i]
      if (part.partGroup && part.partGroup !== currentGroup) {
        currentGroup = part.partGroup
      }
      const groupSql = currentGroup ? sqlStr(currentGroup) : 'NULL'
      const partNumSql = part.partNumber ? sqlStr(part.partNumber) : 'NULL'
      ctx.partInserts.push(
        `  (gen_random_uuid(), ${catSql}, ${partNumSql}, ${groupSql}, ${sqlStr(part.partName)}, ${sqlStr(doc.sourceFile)}, ${sqlInt(i)}, TRUE, NOW(), NOW())`
      )
      ctx.counts.parts++
    }

    // ── Checklist template per category (1 per doc) ───────────────────────
    if (doc.checklist.length > 0) {
      const tplCode = `${doc.applianceType}-default`
      ctx.templateInserts.push(
        `  (gen_random_uuid(), ${catSql}, ${sqlStr('ชุดตรวจสอบ ' + doc.applianceType)}, NULL, 1, TRUE, FALSE, TRUE, NOW(), NOW())`
      )
      for (let j = 0; j < doc.checklist.length; j++) {
        const item = doc.checklist[j]
        const itemCode = `${tplCode}-${String(j + 1).padStart(3, '0')}`
        ctx.checklistItemInserts.push(
          `  (gen_random_uuid(),\n   (SELECT id FROM repair_checklist_templates WHERE name_th=${sqlStr('ชุดตรวจสอบ ' + doc.applianceType)} LIMIT 1),\n   ${sqlStr('parts_inspection')}, ${sqlStr(itemCode)}, ${sqlStr(item.item)}, NULL, TRUE, ${sqlInt(j)}, NOW())`
        )
        ctx.counts.checklist++
      }
    }

    // ── Tools extraction ──────────────────────────────────────────────────
    const docTools = extractTools(doc.parts)
    docTools.forEach(t => allToolNames.add(t))
  }

  // ── Tool inserts ──────────────────────────────────────────────────────────
  let toolIdx = 0
  for (const toolName of allToolNames) {
    const code = `tool-${String(toolIdx + 1).padStart(3, '0')}`
    ctx.toolInserts.push(
      `  (gen_random_uuid(), ${sqlStr(code)}, ${sqlStr(toolName)}, NULL, NULL, FALSE, TRUE, NOW())`
    )
    ctx.counts.tools++
    toolIdx++
  }

  // ── Build SQL ─────────────────────────────────────────────────────────────
  const lines: string[] = []
  lines.push(`-- Migration: 0018_seed_repair_master`)
  lines.push(`-- D88: Repair Master Data Seed (symptoms + parts + worktypes + tools + checklist)`)
  lines.push(`--`)
  lines.push(`-- Generated by generate-seed-sql.ts · ${new Date().toISOString()}`)
  lines.push(`-- Parsed from: ${docs.map(d => d.sourceFile).join(', ')}`)
  lines.push(`--`)
  lines.push(`-- Counts: worktypes=${ctx.counts.worktypes} tools=${ctx.counts.tools}`)
  lines.push(`--         symptoms=${ctx.counts.symptoms} parts=${ctx.counts.parts}`)
  lines.push(`--         checklist_items=${ctx.counts.checklist} asset_images=${ctx.counts.images}`)
  lines.push(`--`)
  lines.push(`-- Prereq: 0012_repair_master_data, 0016_appliance_master_d92, 0018_repair_part_catalog`)
  lines.push(`--`)
  lines.push(`-- Rollback: DELETE FROM repair_symptom_part_links;`)
  lines.push(`--           DELETE FROM repair_part_catalog;`)
  lines.push(`--           DELETE FROM repair_symptoms WHERE source_file IS NOT NULL;`)
  lines.push(`--           DELETE FROM repair_worktypes;`)
  lines.push(`--           DELETE FROM repair_tools_required WHERE code LIKE 'tool-%';`)
  lines.push(`--           DELETE FROM asset_images WHERE source_file IS NOT NULL;`)
  lines.push(``)

  // Worktypes
  if (ctx.worktypeInserts.length > 0) {
    lines.push(`-- ── 1. repair_worktypes ──────────────────────────────────────────────────────`)
    lines.push(`INSERT INTO "repair_worktypes" ("kind", "code", "label_th", "label_en", "is_active")`)
    lines.push(`VALUES`)
    lines.push(ctx.worktypeInserts.join(',\n'))
    lines.push(`ON CONFLICT ("code") DO NOTHING;`)
    lines.push(``)
  }

  // Tools
  if (ctx.toolInserts.length > 0) {
    lines.push(`-- ── 2. repair_tools_required ─────────────────────────────────────────────────`)
    lines.push(`INSERT INTO "repair_tools_required" ("id", "code", "label_th", "label_en", "category", "is_basic", "is_active", "created_at")`)
    lines.push(`VALUES`)
    lines.push(ctx.toolInserts.join(',\n'))
    lines.push(`ON CONFLICT ("code") DO NOTHING;`)
    lines.push(``)
  }

  // Symptoms
  if (ctx.symptomInserts.length > 0) {
    lines.push(`-- ── 3. repair_symptoms ───────────────────────────────────────────────────────`)
    lines.push(`INSERT INTO "repair_symptoms"`)
    lines.push(`  ("id", "appliance_category_id", "code", "label_th", "label_en", "severity_hint", "sort_order", "is_active", "created_at", "updated_at")`)
    lines.push(`VALUES`)
    lines.push(ctx.symptomInserts.join(',\n'))
    lines.push(`ON CONFLICT ("appliance_category_id", "code") DO NOTHING;`)
    lines.push(``)
  }

  // Parts
  if (ctx.partInserts.length > 0) {
    lines.push(`-- ── 4. repair_part_catalog ───────────────────────────────────────────────────`)
    lines.push(`INSERT INTO "repair_part_catalog"`)
    lines.push(`  ("id", "appliance_category_id", "part_number", "part_group", "name_th", "source_file", "sort_order", "is_active", "created_at", "updated_at")`)
    lines.push(`VALUES`)
    lines.push(ctx.partInserts.join(',\n'))
    lines.push(`ON CONFLICT ("appliance_category_id", "name_th") DO NOTHING;`)
    lines.push(``)
  }

  // Checklist templates
  if (ctx.templateInserts.length > 0) {
    lines.push(`-- ── 5. repair_checklist_templates ───────────────────────────────────────────`)
    lines.push(`INSERT INTO "repair_checklist_templates"`)
    lines.push(`  ("id", "appliance_category_id", "name_th", "name_en", "version", "is_default", "is_fallback", "is_active", "created_at", "updated_at")`)
    lines.push(`VALUES`)
    lines.push(ctx.templateInserts.join(',\n'))
    lines.push(`ON CONFLICT DO NOTHING;`)
    lines.push(``)
    if (ctx.checklistItemInserts.length > 0) {
      lines.push(`INSERT INTO "repair_checklist_items"`)
      lines.push(`  ("id", "template_id", "section", "code", "label_th", "label_en", "is_required", "sort_order", "created_at")`)
      lines.push(`VALUES`)
      lines.push(ctx.checklistItemInserts.join(',\n'))
      lines.push(`ON CONFLICT ("template_id", "code") DO NOTHING;`)
      lines.push(``)
    }
  }

  // Asset images
  if (ctx.assetImageInserts.length > 0) {
    lines.push(`-- ── 6. asset_images ──────────────────────────────────────────────────────────`)
    lines.push(`INSERT INTO "asset_images"`)
    lines.push(`  ("id", "category", "appliance_category", "local_path", "cloud_url", "alt_text", "linked_entity_type", "linked_entity_id", "source_file", "sort_order", "created_at")`)
    lines.push(`VALUES`)
    lines.push(ctx.assetImageInserts.join(',\n'))
    lines.push(`ON CONFLICT ("local_path") DO NOTHING;`)
    lines.push(``)
  }

  return lines.join('\n')
}

// ── Section 2: Pricing Seed (0019) ────────────────────────────────────────────

function generatePricingSql(pricingResults: PricingSheetResult[]): string {
  const catInserts: string[] = []
  const modelInserts: string[] = []
  const pricePointInserts: string[] = []

  const counts = { categories: 0, models: 0, pricePoints: 0 }

  // Iterate over each file result → each importWorthy sheet
  for (const fileResult of pricingResults) {
    for (const sheet of fileResult.sheets) {
      if (!sheet.importWorthy) continue

      const catCode = slugify(sheet.sheetName, 30) || 'unknown'
      const catLabelTh = sheet.sheetName

      // Category
      catInserts.push(
        `  (gen_random_uuid(), ${sqlStr(catCode)}, ${sqlStr(catLabelTh)}, NULL, NULL, ${sqlInt(counts.categories)}, TRUE, NOW())`
      )
      counts.categories++

      const modelsSeen = new Map<string, boolean>()

      // ── Pattern A (iPhone/Smartphone): model + symptom + scratchLevel → cost ──
      if (sheet.pattern === 'A' && sheet.rowsA) {
        for (const row of sheet.rowsA) {
          if (!row.model) continue
          const modelKey = `${catCode}:${row.model}`
          if (!modelsSeen.has(modelKey)) {
            modelsSeen.set(modelKey, true)
            const modelCode = slugify(row.model, 45)
            modelInserts.push(
              `  (gen_random_uuid(),\n` +
              `   (SELECT id FROM used_pricing_categories WHERE code=${sqlStr(catCode)} LIMIT 1),\n` +
              `   ${sqlStr(modelCode)}, ${sqlStr(row.model)}, NULL,\n` +
              `   NULL, '{}', NULL, NULL, TRUE, NOW())`
            )
            counts.models++
          }

          // Price point: dimensions = {scratchLevel, symptom}
          const dims = JSON.stringify({ scratchLevel: row.scratchLevel, symptom: row.symptom })
          const dimsHash = crypto.createHash('sha256').update(dims + catCode + row.model).digest('hex').slice(0, 64)
          const cost = row.totalCost ?? row.laborCost ?? 0
          pricePointInserts.push(
            `  (gen_random_uuid(),\n` +
            `   (SELECT id FROM used_pricing_models WHERE category_id=(SELECT id FROM used_pricing_categories WHERE code=${sqlStr(catCode)}) AND code=${sqlStr(slugify(row.model, 45))} LIMIT 1),\n` +
            `   '${dims.replace(/'/g, "''")}', ${sqlStr(dimsHash)},\n` +
            `   ${sqlStr(String(cost))}, NOW())`
          )
          counts.pricePoints++
        }
      }

      // ── Pattern B (Notebook/Desktop): brand + model + specs → cost ────────────
      if (sheet.pattern === 'B' && sheet.rowsB) {
        for (const row of sheet.rowsB) {
          if (!row.model) continue
          const modelKey = `${catCode}:${row.model}`
          if (!modelsSeen.has(modelKey)) {
            modelsSeen.set(modelKey, true)
            const modelCode = slugify(row.model, 45)
            const specAttrs = JSON.stringify({
              screenSize: row.screenSize ?? null,
              ram: row.ram ?? null,
              storage: row.storage ?? null,
            })
            modelInserts.push(
              `  (gen_random_uuid(),\n` +
              `   (SELECT id FROM used_pricing_categories WHERE code=${sqlStr(catCode)} LIMIT 1),\n` +
              `   ${sqlStr(modelCode)}, ${sqlStr(row.model)}, NULL,\n` +
              `   ${sqlStr(row.brand ?? null)}, '${specAttrs.replace(/'/g, "''")}', NULL, NULL, TRUE, NOW())`
            )
            counts.models++
          }

          // Price point: dimensions = {serviceType}
          const dims = JSON.stringify({ serviceType: row.serviceType })
          const dimsHash = crypto.createHash('sha256').update(dims + catCode + row.model).digest('hex').slice(0, 64)
          pricePointInserts.push(
            `  (gen_random_uuid(),\n` +
            `   (SELECT id FROM used_pricing_models WHERE category_id=(SELECT id FROM used_pricing_categories WHERE code=${sqlStr(catCode)}) AND code=${sqlStr(slugify(row.model, 45))} LIMIT 1),\n` +
            `   '${dims.replace(/'/g, "''")}', ${sqlStr(dimsHash)},\n` +
            `   ${sqlStr(String(row.cost))}, NOW())`
          )
          counts.pricePoints++
        }
      }
    }
  }

  const lines: string[] = []
  lines.push(`-- Migration: 0019_seed_pricing`)
  lines.push(`-- D88: Used Pricing Seed (iPhone Pattern A + Notebook Pattern B)`)
  lines.push(`--`)
  lines.push(`-- Generated by generate-seed-sql.ts · ${new Date().toISOString()}`)
  lines.push(`--`)
  lines.push(`-- Counts: categories=${counts.categories} models=${counts.models}`)
  lines.push(`--         price_points=${counts.pricePoints}`)
  lines.push(`--`)
  lines.push(`-- Prereq: 0014_repair_pricing, 0012_repair_master_data`)
  lines.push(`--`)
  lines.push(`-- Rollback: DELETE FROM used_pricing_price_points;`)
  lines.push(`--           DELETE FROM used_pricing_models;`)
  lines.push(`--           DELETE FROM used_pricing_categories WHERE code NOT LIKE 'system-%';`)
  lines.push(``)

  if (catInserts.length > 0) {
    lines.push(`-- ── 1. used_pricing_categories ──────────────────────────────────────────────`)
    lines.push(`INSERT INTO "used_pricing_categories" ("id", "code", "label_th", "label_en", "appliance_category_id", "sort_order", "is_active", "created_at")`)
    lines.push(`VALUES`)
    lines.push(catInserts.join(',\n'))
    lines.push(`ON CONFLICT ("code") DO NOTHING;`)
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
    lines.push(`INSERT INTO "used_pricing_price_points" ("id", "model_id", "dimensions", "dimensions_hash", "price", "created_at")`)
    lines.push(`VALUES`)
    lines.push(pricePointInserts.join(',\n'))
    lines.push(`ON CONFLICT ("model_id", "dimensions_hash", "is_multi_issue") DO NOTHING;`)
    lines.push(``)
  }

  return lines.join('\n')
}

// ── Asset image SQL generator ──────────────────────────────────────────────────

function generateAssetImageInserts(results: import('./extract-doc-images').DocImageExtractResult[]): string[] {
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

// ── Seed frequency (ขั้น 5) ────────────────────────────────────────────────────
// Read อาการเสียเครื่องใช้ไฟฟ้า.docx stats → update repair_symptoms sort_order
// Handled via SQL UPDATE in the generated migration

function generateSeedFrequencySql(docs: RepairDocResult[]): string {
  // Find the stats doc
  const statsDoc = docs.find(d => d.sourceFile.includes('อาการเสียเครื่อง'))
  if (!statsDoc || statsDoc.symptoms.length === 0) {
    return '-- ขั้น 5: seed_frequency — ไม่พบข้อมูลสถิติในไฟล์ที่ parse\n'
  }

  const lines: string[] = []
  lines.push(`-- ── ขั้น 5: seed_frequency — จัดลำดับ dropdown อาการตามสถิติ ────────────────────`)
  lines.push(`-- อัพเดต sort_order ของ repair_symptoms ตามความถี่จากไฟล์สถิติ`)
  lines.push(`-- (ค่ายิ่งน้อย = แสดงก่อน = พบบ่อยกว่า)`)
  lines.push(`-- ไฟล์สถิติ: อาการเสียเครื่องใช้ไฟฟ้า.docx (${statsDoc.symptoms.length} อาการ)`)
  lines.push(``)
  for (let i = 0; i < statsDoc.symptoms.length; i++) {
    const sym = statsDoc.symptoms[i]
    lines.push(
      `UPDATE "repair_symptoms" SET "sort_order" = ${i} WHERE "label_th" ILIKE ${sqlStr('%' + sym.description.slice(0, 20) + '%')};`
    )
  }
  lines.push(``)
  return lines.join('\n')
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)

  const importDirIdx = args.indexOf('--import-dir')
  const assetsDirIdx = args.indexOf('--assets-dir')
  const outDirIdx    = args.indexOf('--out-dir')

  if (importDirIdx < 0 || assetsDirIdx < 0 || outDirIdx < 0) {
    console.error('Usage: generate-seed-sql.ts --import-dir <path> --assets-dir <path> --out-dir <path>')
    process.exit(1)
  }

  const importDir = args[importDirIdx + 1]
  const assetsDir = args[assetsDirIdx + 1]
  const outDir    = args[outDirIdx + 1]

  console.error('📄 Step 1: Parsing repair documents...')
  const docs = await parseRepairDocsDir(importDir)

  // Only 5 core repair docs (skip stats file and extra info for parts/symptoms)
  const coreDocs = docs.filter(d =>
    d.sourceFile.match(/^\d\./) && d.applianceType !== 'unknown'
  )
  console.error(`   → ${coreDocs.length} core docs: ${coreDocs.map(d => d.applianceType).join(', ')}`)
  console.error(`   → Total: ${coreDocs.reduce((s,d)=>s+d.parts.length,0)} parts, ${coreDocs.reduce((s,d)=>s+d.symptoms.length,0)} symptoms`)

  console.error('🖼️  Step 2: Extracting images from .docx...')
  const imageResults = await extractDocImagesDir(importDir, assetsDir)
  const assetImageInserts = generateAssetImageInserts(imageResults)
  const totalImages = imageResults.reduce((s,r)=>s+r.extractedCount,0)
  console.error(`   → ${totalImages} images extracted → ${assetsDir}/parts/`)

  console.error('💰 Step 3: Parsing Excel pricing...')
  const excelFiles = [
    path.join(importDir, 'ราคารับซื้อ I PHONE  มือสอง.xlsx'),
    path.join(importDir, 'ราคารับซื้อ Notebook มือสอง.xlsx'),
  ]
  const pricingResults: PricingSheetResult[] = []
  for (const f of excelFiles) {
    if (fs.existsSync(f)) {
      const result = await parsePricingExcel(f)
      if (Array.isArray(result)) {
        pricingResults.push(...result)
      } else {
        pricingResults.push(result)
      }
      console.error(`   → ${path.basename(f)}: ${Array.isArray(result) ? result.length : 1} sheet(s)`)
    } else {
      console.error(`   ⚠️  Not found: ${f}`)
    }
  }

  console.error('📝 Step 4: Generating seed SQL...')

  // 0018: repair master seed
  const allDocs = docs  // include stats file for seed_frequency
  const freqSql = generateSeedFrequencySql(allDocs)
  const masterSql = generateRepairMasterSql(coreDocs, assetImageInserts) + '\n' + freqSql

  const masterFile = path.join(outDir, '0018_seed_repair_master.sql')
  fs.writeFileSync(masterFile, masterSql, 'utf8')
  console.error(`   ✅ ${masterFile}`)

  // 0019: pricing seed
  const pricingSql = generatePricingSql(pricingResults)
  const pricingFile = path.join(outDir, '0019_seed_pricing.sql')
  fs.writeFileSync(pricingFile, pricingSql, 'utf8')
  console.error(`   ✅ ${pricingFile}`)

  // ── Summary report ────────────────────────────────────────────────────────
  console.error('\n')
  console.error('═══════════════════════════════════════════════════════════')
  console.error('📊 D88 Full Import — Seed Generation Report')
  console.error('═══════════════════════════════════════════════════════════')
  console.error(`ขั้น 2 — appliance_categories seed: in migration 0016 (12 types)`)
  console.error(`ขั้น 3 — Word parser:`)
  for (const d of coreDocs) {
    console.error(`  ${d.applianceType.padEnd(12)} | parts: ${d.parts.length} | symptoms: ${d.symptoms.length} | errors: ${d.parseErrors.length}`)
  }
  console.error(`  TOTAL parts: ${coreDocs.reduce((s,d)=>s+d.parts.length,0)} | symptoms: ${coreDocs.reduce((s,d)=>s+d.symptoms.length,0)}`)
  console.error(`ขั้น 4 — Image extraction:`)
  for (const r of imageResults) {
    console.error(`  ${r.applianceCategory.padEnd(12)} | images: ${r.extractedCount} | skipped: ${r.skippedCount} | errors: ${r.errors.length}`)
  }
  console.error(`  TOTAL images: ${totalImages}`)
  console.error(`ขั้น 5 — seed_frequency: included in 0018_seed_repair_master.sql`)
  console.error(`ขั้น 6 — Excel pricing:`)
  const pricingRows = pricingResults.reduce((s,r)=>s+(r.totalImportRows??0),0)
  console.error(`  sheets: ${pricingResults.length} | import rows: ${pricingRows}`)
  console.error(`ขั้น 7 — Output files:`)
  console.error(`  ${masterFile}`)
  console.error(`  ${pricingFile}`)
  console.error('═══════════════════════════════════════════════════════════')
}

// CJS guard: only run as CLI, not when imported as a module
if (require.main === module) {
  main().catch(e => {
    console.error('Fatal:', e)
    process.exit(1)
  })
}
