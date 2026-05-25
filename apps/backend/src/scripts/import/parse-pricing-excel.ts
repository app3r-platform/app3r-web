/**
 * parse-pricing-excel.ts — D92 Excel Pricing Parser (Generic-First)
 *
 * Parses Excel (.xlsx) pricing files into structured JSON
 * for seeding repair pricing data (used by Repair B6 Used Pricing Wizard).
 *
 * Supports 2 known patterns:
 *
 * Pattern A — Smartphone/iPhone pricing:
 *   - ~1147 iPhone rows + ~554 Android/other rows
 *   - 7 columns: [Model, Symptom, ScratchLevel, LaborCost, PartCost, Total, Remark]
 *   - Scratch levels: 3 tiers (A/B/C or 1/2/3 or เล็กน้อย/ปานกลาง/หนัก)
 *   - Multiple sheets (one per brand family or year)
 *
 * Pattern B — Notebook/Laptop pricing:
 *   - 8 sheets, 4 import-worthy (others are lookup/reference)
 *   - Columns vary per sheet: [Brand, Model, Screen, RAM, Storage, Service, Cost, Remark]
 *   - Some sheets have merged header cells (skip first N rows)
 *
 * Output: PricingSheetResult[] written to stdout or file
 *
 * Usage:
 *   npx tsx src/scripts/import/parse-pricing-excel.ts <file.xlsx> [--pattern A|B] [--out result.json]
 *   npx tsx src/scripts/import/parse-pricing-excel.ts --dir ./pricing/ [--out results.json]
 *
 * Note: Pure TypeScript xlsx parser — reads XLSX binary without external deps
 *       Uses a lightweight xml-in-zip approach (same as parse-repair-docs.ts)
 *       For production with large files, replace with 'exceljs' or 'xlsx' package
 *
 * Spec: D92 (36a813ec-7277-8166-b2cb-d31630a264c8)
 * Maintain Gen 4 · 2026-05-25
 */

import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'

// ── Type definitions ───────────────────────────────────────────────────────────

export type ScratchLevel = 'A' | 'B' | 'C' | '1' | '2' | '3' | 'เล็กน้อย' | 'ปานกลาง' | 'หนัก' | string

export interface PricingRowA {
  /** ยี่ห้อ/รุ่น เช่น "iPhone 15 Pro" */
  model: string
  /** อาการ/งานซ่อม */
  symptom: string
  /** ระดับรอย/ความเสียหาย (3 tiers) */
  scratchLevel: ScratchLevel
  /** ค่าแรง */
  laborCost: number
  /** ค่าอะไหล่ */
  partCost: number
  /** รวม */
  totalCost: number
  /** หมายเหตุ */
  remark?: string
}

export interface PricingRowB {
  /** ยี่ห้อ */
  brand?: string
  /** รุ่น */
  model: string
  /** ขนาดหน้าจอ */
  screenSize?: string
  /** RAM */
  ram?: string
  /** Storage */
  storage?: string
  /** ประเภทงาน/บริการ */
  serviceType: string
  /** ค่าบริการ */
  cost: number
  /** หมายเหตุ */
  remark?: string
}

export interface PricingSheet {
  /** ชื่อ sheet */
  sheetName: string
  /** pattern ที่ detect */
  pattern: 'A' | 'B' | 'unknown'
  /** จำนวน rows */
  rowCount: number
  /** import-worthy (false = reference/lookup sheet) */
  importWorthy: boolean
  /** ข้อมูล Pattern A */
  rowsA?: PricingRowA[]
  /** ข้อมูล Pattern B */
  rowsB?: PricingRowB[]
  /** errors */
  errors: string[]
}

export interface PricingSheetResult {
  sourceFile: string
  applianceType: string
  detectedPattern: 'A' | 'B' | 'mixed' | 'unknown'
  sheets: PricingSheet[]
  totalImportRows: number
  parseErrors: string[]
}

// ── Minimal XLSX reader (zip-based) ───────────────────────────────────────────

function extractFileFromZip(buf: Buffer, targetName: string): string | null {
  let offset = 0
  const PK_LOCAL = 0x04034b50

  while (offset < buf.length - 30) {
    const sig = buf.readUInt32LE(offset)
    if (sig !== PK_LOCAL) {
      offset++
      continue
    }

    const compression = buf.readUInt16LE(offset + 8)
    const compressedSize = buf.readUInt32LE(offset + 18)
    const fileNameLen = buf.readUInt16LE(offset + 26)
    const extraLen = buf.readUInt16LE(offset + 28)
    const fileName = buf.toString('utf8', offset + 30, offset + 30 + fileNameLen)
    const dataStart = offset + 30 + fileNameLen + extraLen
    const dataEnd = dataStart + compressedSize

    if (fileName === targetName) {
      const data = buf.slice(dataStart, dataEnd)
      if (compression === 0) return data.toString('utf8')
      if (compression === 8) {
        try { return zlib.inflateRawSync(data).toString('utf8') } catch { return null }
      }
    }

    offset = dataEnd
  }
  return null
}

function listZipFiles(buf: Buffer): string[] {
  const files: string[] = []
  let offset = 0
  const PK_LOCAL = 0x04034b50

  while (offset < buf.length - 30) {
    const sig = buf.readUInt32LE(offset)
    if (sig !== PK_LOCAL) { offset++; continue }

    const compressedSize = buf.readUInt32LE(offset + 18)
    const fileNameLen = buf.readUInt16LE(offset + 26)
    const extraLen = buf.readUInt16LE(offset + 28)
    const fileName = buf.toString('utf8', offset + 30, offset + 30 + fileNameLen)
    files.push(fileName)
    offset = offset + 30 + fileNameLen + extraLen + compressedSize
  }
  return files
}

// ── XLSX structure parsers ─────────────────────────────────────────────────────

interface XlsxWorkbook {
  sheets: Array<{ name: string; rId: string }>
  sharedStrings: string[]
}

function parseWorkbookXml(xml: string): Array<{ name: string; rId: string }> {
  const sheets: Array<{ name: string; rId: string }> = []
  const matches = xml.matchAll(/<sheet\s[^>]*name="([^"]*)"[^>]*r:id="([^"]*)"[^>]*/g)
  for (const m of matches) {
    sheets.push({ name: m[1], rId: m[2] })
  }
  return sheets
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = []
  const matches = xml.matchAll(/<si>([\s\S]*?)<\/si>/g)
  for (const m of matches) {
    const tMatches = m[1].matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)
    let text = ''
    for (const t of tMatches) { text += t[1] }
    strings.push(text)
  }
  return strings
}

function parseWorkbookRels(xml: string): Map<string, string> {
  const map = new Map<string, string>()
  const matches = xml.matchAll(/<Relationship\s[^>]*Id="([^"]*)"[^>]*Target="([^"]*)"[^>]*/g)
  for (const m of matches) {
    map.set(m[1], m[2])
  }
  return map
}

interface XlsxCell {
  col: string    // "A", "B", ...
  row: number
  type: string   // "s"=sharedString, "n"=number, "str"=formula, ""=default
  value: string  // raw string value
}

function parseSheetXml(xml: string, sharedStrings: string[]): string[][] {
  const rows: Map<number, Map<string, string>> = new Map()

  const cellMatches = xml.matchAll(/<c\s+r="([A-Z]+)(\d+)"(?:\s+[^>]*)?(?:t="([^"]*)")?[^>]*>([\s\S]*?)<\/c>/g)
  for (const m of cellMatches) {
    const col = m[1]
    const rowNum = parseInt(m[2])
    const cellType = m[3] ?? ''
    const innerXml = m[4]

    // Extract <v> value
    const vMatch = innerXml.match(/<v>([^<]*)<\/v>/)
    let rawVal = vMatch ? vMatch[1] : ''

    // Resolve shared string
    let displayVal: string
    if (cellType === 's' && rawVal !== '') {
      const idx = parseInt(rawVal)
      displayVal = sharedStrings[idx] ?? ''
    } else {
      displayVal = rawVal
    }

    if (!rows.has(rowNum)) rows.set(rowNum, new Map())
    rows.get(rowNum)!.set(col, displayVal)
  }

  if (rows.size === 0) return []

  // Convert to 2D array
  const maxRow = Math.max(...rows.keys())
  const allCols = new Set<string>()
  for (const row of rows.values()) {
    for (const col of row.keys()) { allCols.add(col) }
  }

  // Sort columns: A, B, C, ... Z, AA, AB ...
  const sortedCols = Array.from(allCols).sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length
    return a.localeCompare(b)
  })

  const result: string[][] = []
  for (let r = 1; r <= maxRow; r++) {
    const rowData = rows.get(r)
    if (!rowData) {
      result.push(sortedCols.map(() => ''))
      continue
    }
    result.push(sortedCols.map(col => rowData.get(col) ?? ''))
  }
  return result
}

// ── Pattern detection ──────────────────────────────────────────────────────────

function detectSheetPattern(rows: string[][], sheetName: string): 'A' | 'B' | 'unknown' {
  if (rows.length < 2) return 'unknown'
  const header = rows[0].join(' ').toLowerCase()

  // Pattern A: smartphone/iPhone — has scratch level or many symptom rows
  if (
    header.includes('รอย') ||
    header.includes('scratch') ||
    header.includes('ระดับ') ||
    sheetName.toLowerCase().includes('iphone') ||
    sheetName.toLowerCase().includes('android') ||
    sheetName.toLowerCase().includes('samsung')
  ) {
    return 'A'
  }

  // Pattern B: notebook — has brand + screen + ram + storage
  if (
    header.includes('brand') ||
    header.includes('ยี่ห้อ') ||
    header.includes('หน้าจอ') ||
    header.includes('ram') ||
    header.includes('storage') ||
    sheetName.toLowerCase().includes('notebook') ||
    sheetName.toLowerCase().includes('laptop')
  ) {
    return 'B'
  }

  // Try to guess from column count
  if (rows[0].length >= 6 && rows[0].length <= 8) return 'A'
  if (rows[0].length >= 7) return 'B'

  return 'unknown'
}

const SCRATCH_LEVEL_PATTERNS: ScratchLevel[] = ['A', 'B', 'C', '1', '2', '3', 'เล็กน้อย', 'ปานกลาง', 'หนัก']

function parseScratchLevel(val: string): ScratchLevel {
  const normalized = val.trim().toUpperCase()
  // Check for A/B/C tier
  if (['A', 'B', 'C'].includes(normalized)) return normalized as ScratchLevel
  // Check for 1/2/3 tier
  if (['1', '2', '3'].includes(normalized)) return normalized as ScratchLevel
  // Thai levels
  if (val.includes('เล็กน้อย')) return 'เล็กน้อย'
  if (val.includes('ปานกลาง')) return 'ปานกลาง'
  if (val.includes('หนัก')) return 'หนัก'
  return val.trim()
}

function parseCost(val: string): number {
  if (!val.trim()) return 0
  // Remove Thai Baht symbol, commas, spaces
  const cleaned = val.replace(/[฿,\s]/g, '').replace(/[^0-9.]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

function isImportWorthySheet(sheetName: string, rows: string[][]): boolean {
  const name = sheetName.toLowerCase()
  // Skip reference/lookup sheets
  const skipKeywords = ['lookup', 'ref', 'reference', 'สูตร', 'dropdown', 'drop_down', 'list', 'ดัชนี', 'index']
  if (skipKeywords.some(kw => name.includes(kw))) return false
  // Must have data rows (> 2)
  return rows.length > 2
}

// ── Pattern A parser ───────────────────────────────────────────────────────────

function parsePatternA(rows: string[][]): { data: PricingRowA[]; errors: string[] } {
  const data: PricingRowA[] = []
  const errors: string[] = []

  if (rows.length < 2) return { data, errors }

  // Auto-detect columns from header
  const header = rows[0]
  let colModel = -1, colSymptom = -1, colScratch = -1
  let colLabor = -1, colPart = -1, colTotal = -1, colRemark = -1

  for (let c = 0; c < header.length; c++) {
    const h = header[c].toLowerCase()
    if (h.includes('รุ่น') || h.includes('model') || h.includes('เครื่อง')) colModel = c
    else if (h.includes('อาการ') || h.includes('symptom') || h.includes('งาน')) colSymptom = c
    else if (h.includes('รอย') || h.includes('ระดับ') || h.includes('scratch') || h.includes('tier')) colScratch = c
    else if (h.includes('ค่าแรง') || h.includes('labor')) colLabor = c
    else if (h.includes('ค่าอะไหล่') || h.includes('part')) colPart = c
    else if (h.includes('รวม') || h.includes('total') || h.includes('ราคา')) colTotal = c
    else if (h.includes('หมายเหตุ') || h.includes('remark') || h.includes('note')) colRemark = c
  }

  // Fallback mapping for 7-col Pattern A
  if (colModel === -1) { colModel = 0; colSymptom = 1; colScratch = 2; colLabor = 3; colPart = 4; colTotal = 5; colRemark = 6 }

  let lastModel = ''

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.every(c => !c.trim())) continue

    // Model may be merged/blank (inherit from above)
    const modelRaw = row[colModel]?.trim() ?? ''
    if (modelRaw) lastModel = modelRaw

    const symptom = colSymptom >= 0 ? (row[colSymptom]?.trim() ?? '') : ''
    if (!symptom) continue  // Skip if no symptom/service

    try {
      data.push({
        model: lastModel,
        symptom,
        scratchLevel: colScratch >= 0 ? parseScratchLevel(row[colScratch] ?? '') : '',
        laborCost: colLabor >= 0 ? parseCost(row[colLabor] ?? '') : 0,
        partCost: colPart >= 0 ? parseCost(row[colPart] ?? '') : 0,
        totalCost: colTotal >= 0 ? parseCost(row[colTotal] ?? '') : 0,
        remark: colRemark >= 0 ? (row[colRemark]?.trim() || undefined) : undefined,
      })
    } catch (e) {
      errors.push(`Row[${i}]: ${(e as Error).message}`)
    }
  }

  return { data, errors }
}

// ── Pattern B parser ───────────────────────────────────────────────────────────

function parsePatternB(rows: string[][]): { data: PricingRowB[]; errors: string[] } {
  const data: PricingRowB[] = []
  const errors: string[] = []

  if (rows.length < 2) return { data, errors }

  // Skip merged header rows (rows where most cells are empty or look like sub-headers)
  let dataStartRow = 1
  for (let i = 1; i < Math.min(rows.length, 5); i++) {
    const nonEmpty = rows[i].filter(c => c.trim()).length
    if (nonEmpty < 3) { dataStartRow = i + 1; continue }
    break
  }

  const header = rows[0]
  let colBrand = -1, colModel = -1, colScreen = -1, colRam = -1
  let colStorage = -1, colService = -1, colCost = -1, colRemark = -1

  for (let c = 0; c < header.length; c++) {
    const h = header[c].toLowerCase()
    if (h.includes('brand') || h.includes('ยี่ห้อ') || h.includes('แบรนด์')) colBrand = c
    else if (h.includes('รุ่น') || h.includes('model')) colModel = c
    else if (h.includes('หน้าจอ') || h.includes('screen') || h.includes('จอ')) colScreen = c
    else if (h.includes('ram') || h.includes('แรม')) colRam = c
    else if (h.includes('storage') || h.includes('ความจำ') || h.includes('ssd') || h.includes('hdd')) colStorage = c
    else if (h.includes('บริการ') || h.includes('service') || h.includes('งาน') || h.includes('ซ่อม')) colService = c
    else if (h.includes('ราคา') || h.includes('cost') || h.includes('ค่า') || h.includes('total')) colCost = c
    else if (h.includes('หมายเหตุ') || h.includes('remark') || h.includes('note')) colRemark = c
  }

  // Fallback
  if (colModel === -1) { colModel = 0; colService = 1; colCost = 2; colRemark = 3 }

  let lastBrand = '', lastModel = ''

  for (let i = dataStartRow; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.every(c => !c.trim())) continue

    if (colBrand >= 0 && row[colBrand]?.trim()) lastBrand = row[colBrand].trim()
    if (colModel >= 0 && row[colModel]?.trim()) lastModel = row[colModel].trim()

    const serviceType = colService >= 0 ? (row[colService]?.trim() ?? '') : ''
    if (!serviceType) continue

    try {
      data.push({
        brand: lastBrand || undefined,
        model: lastModel,
        screenSize: colScreen >= 0 ? (row[colScreen]?.trim() || undefined) : undefined,
        ram: colRam >= 0 ? (row[colRam]?.trim() || undefined) : undefined,
        storage: colStorage >= 0 ? (row[colStorage]?.trim() || undefined) : undefined,
        serviceType,
        cost: colCost >= 0 ? parseCost(row[colCost] ?? '') : 0,
        remark: colRemark >= 0 ? (row[colRemark]?.trim() || undefined) : undefined,
      })
    } catch (e) {
      errors.push(`Row[${i}]: ${(e as Error).message}`)
    }
  }

  return { data, errors }
}

// ── Main parse function ────────────────────────────────────────────────────────

export async function parsePricingExcel(
  xlsxPath: string,
  forcePattern?: 'A' | 'B'
): Promise<PricingSheetResult> {
  const sourceFile = path.basename(xlsxPath)
  const parseErrors: string[] = []
  const sheets: PricingSheet[] = []

  const buf = fs.readFileSync(xlsxPath)

  // Parse workbook structure
  const workbookXml = extractFileFromZip(buf, 'xl/workbook.xml')
  const relsXml = extractFileFromZip(buf, 'xl/_rels/workbook.xml.rels')
  const sharedStringsXml = extractFileFromZip(buf, 'xl/sharedStrings.xml')

  if (!workbookXml) {
    return {
      sourceFile,
      applianceType: 'unknown',
      detectedPattern: 'unknown',
      sheets: [],
      totalImportRows: 0,
      parseErrors: ['Cannot read xl/workbook.xml — not a valid xlsx file'],
    }
  }

  const sheetDefs = parseWorkbookXml(workbookXml)
  const rels = relsXml ? parseWorkbookRels(relsXml) : new Map<string, string>()
  const sharedStrings = sharedStringsXml ? parseSharedStrings(sharedStringsXml) : []

  // Detect appliance type from filename + sheet names
  const allNames = [sourceFile, ...sheetDefs.map(s => s.name)].join(' ').toLowerCase()
  let applianceType = 'unknown'
  if (allNames.includes('iphone') || allNames.includes('android') || allNames.includes('samsung') || allNames.includes('smartphone')) {
    applianceType = 'smartphone'
  } else if (allNames.includes('notebook') || allNames.includes('laptop')) {
    applianceType = 'notebook'
  } else if (allNames.includes('แอร์') || allNames.includes('ac')) {
    applianceType = 'ac'
  }

  let overallPattern: 'A' | 'B' | 'mixed' | 'unknown' = 'unknown'

  for (let si = 0; si < sheetDefs.length; si++) {
    const sheetDef = sheetDefs[si]
    const rId = sheetDef.rId
    const relTarget = rels.get(rId)

    if (!relTarget) {
      parseErrors.push(`Sheet "${sheetDef.name}": no rel mapping found`)
      continue
    }

    const sheetPath = relTarget.startsWith('xl/') ? relTarget : `xl/${relTarget}`
    const sheetXml = extractFileFromZip(buf, sheetPath)

    if (!sheetXml) {
      parseErrors.push(`Sheet "${sheetDef.name}": cannot read ${sheetPath}`)
      continue
    }

    const rows = parseSheetXml(sheetXml, sharedStrings)
    const pattern = forcePattern ?? detectSheetPattern(rows, sheetDef.name)
    const importWorthy = isImportWorthySheet(sheetDef.name, rows)

    const sheet: PricingSheet = {
      sheetName: sheetDef.name,
      pattern,
      rowCount: rows.length - 1,  // exclude header
      importWorthy,
      errors: [],
    }

    if (importWorthy && rows.length > 1) {
      if (pattern === 'A') {
        const { data, errors } = parsePatternA(rows)
        sheet.rowsA = data
        sheet.errors = errors
      } else if (pattern === 'B') {
        const { data, errors } = parsePatternB(rows)
        sheet.rowsB = data
        sheet.errors = errors
      }
    }

    // Update overall pattern
    if (overallPattern === 'unknown') {
      overallPattern = pattern === 'unknown' ? 'unknown' : pattern
    } else if (overallPattern !== pattern && pattern !== 'unknown') {
      overallPattern = 'mixed'
    }

    sheets.push(sheet)
  }

  const totalImportRows = sheets
    .filter(s => s.importWorthy)
    .reduce((sum, s) => sum + (s.rowsA?.length ?? s.rowsB?.length ?? 0), 0)

  return {
    sourceFile,
    applianceType,
    detectedPattern: overallPattern,
    sheets,
    totalImportRows,
    parseErrors,
  }
}

// ── Batch parse (directory) ────────────────────────────────────────────────────

export async function parsePricingExcelDir(dirPath: string): Promise<PricingSheetResult[]> {
  const files = fs.readdirSync(dirPath)
    .filter(f => /\.(xlsx|xls)$/i.test(f))
    .map(f => path.join(dirPath, f))

  const results: PricingSheetResult[] = []
  for (const file of files) {
    console.error(`Parsing: ${path.basename(file)}`)
    try {
      results.push(await parsePricingExcel(file))
    } catch (e) {
      console.error(`  ERROR: ${(e as Error).message}`)
      results.push({
        sourceFile: path.basename(file),
        applianceType: 'unknown',
        detectedPattern: 'unknown',
        sheets: [],
        totalImportRows: 0,
        parseErrors: [(e as Error).message],
      })
    }
  }
  return results
}

// ── CLI entry point ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage:')
    console.error('  parse-pricing-excel.ts <file.xlsx> [--pattern A|B] [--out result.json]')
    console.error('  parse-pricing-excel.ts --dir <directory> [--pattern A|B] [--out results.json]')
    process.exit(1)
  }

  let outFile: string | null = null
  let forcePattern: 'A' | 'B' | undefined

  const outIdx = args.indexOf('--out')
  if (outIdx >= 0 && args[outIdx + 1]) outFile = args[outIdx + 1]

  const patternIdx = args.indexOf('--pattern')
  if (patternIdx >= 0 && args[patternIdx + 1]) {
    const p = args[patternIdx + 1].toUpperCase()
    if (p === 'A' || p === 'B') forcePattern = p
  }

  let results: PricingSheetResult | PricingSheetResult[]

  if (args[0] === '--dir') {
    const dirPath = args[1]
    if (!dirPath || !fs.existsSync(dirPath)) {
      console.error(`Directory not found: ${dirPath}`)
      process.exit(1)
    }
    results = await parsePricingExcelDir(dirPath)
  } else {
    const filePath = args[0]
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`)
      process.exit(1)
    }
    results = await parsePricingExcel(filePath, forcePattern)
  }

  const json = JSON.stringify(results, null, 2)
  if (outFile) {
    fs.writeFileSync(outFile, json, 'utf8')
    console.error(`✅ Written to ${outFile}`)
  } else {
    process.stdout.write(json + '\n')
  }

  const arr = Array.isArray(results) ? results : [results]
  const totalRows = arr.reduce((s, r) => s + r.totalImportRows, 0)
  const totalErrors = arr.reduce((s, r) => s + r.parseErrors.length, 0)
  console.error(`\n📊 Parsed ${arr.length} file(s) → ${totalRows} import rows, ${totalErrors} error(s)`)
}

// CJS guard: only run as CLI, not when imported as a module
if (require.main === module) {
  main().catch(e => {
    console.error('Fatal:', e)
    process.exit(1)
  })
}
