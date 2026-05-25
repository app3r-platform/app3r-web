/**
 * parse-repair-docs.ts — D92 Word Docx Parser (Generic-First)
 *
 * Parses repair procedure Word documents (.docx) into structured JSON
 * for seeding appliance_brands / appliance_models + related repair data.
 *
 * Handles 7 known variants across 5+ appliance types:
 *   Variant 1 : col count — 7 cols (partNumber col) vs 6 cols (no partNumber)
 *   Variant 2 : header label — "แนวทาง" vs "ขั้นตอน" (steps column)
 *   Variant 3 : table count — 4 tables (single) vs 5 tables (computer split Desktop+Notebook)
 *   Variant 4 : partGroup — dedicated group header row vs embedded in name
 *   Variant 5 : partNumber format — numeric "1","2" vs dotted "9.1","9.2"
 *   Variant 6 : multivalue delimiter — space (AC/fridge) vs comma (washer/computer) vs "และ" (TV)
 *   Variant 7 : Table-0 header — "ชิ้นส่วนอุปกรณ์ภายใน" vs "อุปกรณ์ที่ตรวจสอบ"
 *
 * Output: RepairDocResult JSON written to stdout or file
 *
 * Usage:
 *   npx tsx src/scripts/import/parse-repair-docs.ts <path/to/file.docx> [--out result.json]
 *   npx tsx src/scripts/import/parse-repair-docs.ts --dir ./docs/ [--out results.json]
 *
 * Prereqs: npm install mammoth (docx→html) — or use docx2json/xml parse
 * Note: Uses built-in xml parsing (no mammoth dep) — reads word/document.xml inside .docx zip
 *
 * Spec: D92 (36a813ec-7277-8166-b2cb-d31630a264c8)
 * Maintain Gen 4 · 2026-05-25
 */

import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { promisify } from 'util'

// ── Type definitions ───────────────────────────────────────────────────────────

export interface RepairPart {
  /** ลำดับ (Variant 5: "9.1" | numeric) */
  partNumber?: string
  /** กลุ่มชิ้นส่วน (Variant 4) */
  partGroup?: string
  /** ชื่อชิ้นส่วน */
  partName: string
  /** อาการเสีย (multivalue — split by Variant 6 delimiter) */
  symptoms: string[]
  /** แนวทาง/ขั้นตอนการซ่อม (Variant 2) */
  steps: string[]
  /** หมายเหตุ (optional) */
  remark?: string
}

export interface RepairChecklist {
  /** ชื่อรายการตรวจ */
  item: string
  /** ประเภท: visual | functional | measurement */
  checkType?: string
  /** ค่ามาตรฐาน */
  standard?: string
}

export interface RepairSymptom {
  /** รหัสอาการ */
  code?: string
  /** อาการ */
  description: string
  /** สาเหตุที่เป็นไปได้ */
  causes?: string[]
}

export interface RepairDocResult {
  /** ชื่อไฟล์ต้นฉบับ */
  sourceFile: string
  /** ประเภทเครื่อง (detected from content) */
  applianceType: string
  /** variant flags ที่ detect ได้ */
  variants: {
    hasPartNumberCol: boolean      // Variant 1
    stepsHeaderLabel: string       // Variant 2: "แนวทาง" | "ขั้นตอน"
    tableCount: number             // Variant 3
    hasPartGroupRows: boolean      // Variant 4
    partNumberFormat: 'numeric' | 'dotted' | 'none'  // Variant 5
    multivalueDelimiter: string    // Variant 6: ' ' | ',' | 'และ'
    partsTableHeader: string       // Variant 7
  }
  /** ชิ้นส่วน */
  parts: RepairPart[]
  /** checklist การตรวจ (ถ้ามี) */
  checklist: RepairChecklist[]
  /** อาการเสีย (ถ้ามี table แยก) */
  symptoms: RepairSymptom[]
  /** errors ระหว่าง parse */
  parseErrors: string[]
}

// ── XML extraction (read .docx as zip → word/document.xml) ────────────────────

async function extractDocumentXml(docxPath: string): Promise<string> {
  // .docx is a zip file — use Node.js built-in unzip
  // We read the file buffer and find word/document.xml via simple zip parsing
  const buf = fs.readFileSync(docxPath)

  // Locate "word/document.xml" in the zip central directory
  const target = 'word/document.xml'
  const xmlContent = extractFileFromZip(buf, target)
  if (!xmlContent) {
    throw new Error(`Cannot find ${target} in ${path.basename(docxPath)}`)
  }
  return xmlContent
}

/**
 * Minimal zip reader — extracts one file by name without external deps.
 * Reads local file headers (PK\x03\x04) sequentially.
 */
function extractFileFromZip(buf: Buffer, targetName: string): string | null {
  let offset = 0
  const PK_LOCAL = 0x04034b50

  while (offset < buf.length - 30) {
    const sig = buf.readUInt32LE(offset)
    if (sig !== PK_LOCAL) {
      // Scan forward for next PK signature
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
      const compressedData = buf.slice(dataStart, dataEnd)
      if (compression === 0) {
        // Stored (no compression)
        return compressedData.toString('utf8')
      } else if (compression === 8) {
        // Deflate
        try {
          const inflated = zlib.inflateRawSync(compressedData)
          return inflated.toString('utf8')
        } catch (e) {
          return null
        }
      }
    }

    offset = dataEnd
  }
  return null
}

// ── XML → Table rows extraction ────────────────────────────────────────────────

interface XmlTable {
  rows: string[][]  // rows[rowIdx][colIdx] = cell text
}

function extractTablesFromXml(xml: string): XmlTable[] {
  const tables: XmlTable[] = []

  // Match each <w:tbl>...</w:tbl>
  const tblMatches = xml.matchAll(/<w:tbl\b[^>]*>([\s\S]*?)<\/w:tbl>/g)
  for (const tblMatch of tblMatches) {
    const tblXml = tblMatch[1]
    const rows: string[][] = []

    // Match each <w:tr>...</w:tr>
    const trMatches = tblXml.matchAll(/<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/g)
    for (const trMatch of trMatches) {
      const trXml = trMatch[1]
      const cells: string[] = []

      // Match each <w:tc>...</w:tc>
      const tcMatches = trXml.matchAll(/<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/g)
      for (const tcMatch of tcMatches) {
        const tcXml = tcMatch[1]
        cells.push(extractTextFromCell(tcXml))
      }
      if (cells.length > 0) {
        rows.push(cells)
      }
    }
    tables.push({ rows })
  }
  return tables
}

/** Extract plain text from a <w:tc> cell — concatenate all <w:t> elements */
function extractTextFromCell(cellXml: string): string {
  const texts: string[] = []
  const tMatches = cellXml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)
  for (const m of tMatches) {
    texts.push(m[1])
  }
  return texts.join('').trim()
}

// ── Appliance type detection ───────────────────────────────────────────────────

const APPLIANCE_KEYWORDS: Record<string, string[]> = {
  ac:           ['แอร์', 'air conditioner', 'เครื่องปรับอากาศ', 'คอมเพรสเซอร์แอร์'],
  refrigerator: ['ตู้เย็น', 'refrigerator', 'คอมเพรสเซอร์ตู้เย็น'],
  washer:       ['เครื่องซักผ้า', 'washing machine', 'ถังซัก'],
  computer:     ['คอมพิวเตอร์', 'desktop', 'เดสก์ท็อป', 'cpu', 'เมนบอร์ด'],
  notebook:     ['โน้ตบุ๊ก', 'notebook', 'laptop', 'แล็ปท็อป'],
  tv:           ['โทรทัศน์', 'television', 'tv', 'แผงวงจร', 'จอ'],
  smartphone:   ['สมาร์ทโฟน', 'smartphone', 'มือถือ', 'iphone', 'android'],
  monitor:      ['มอนิเตอร์', 'monitor', 'จอคอม'],
  printer:      ['เครื่องพิมพ์', 'printer', 'หัวพิมพ์'],
}

function detectApplianceType(xml: string, filename: string): string {
  const combined = (xml + ' ' + filename).toLowerCase()
  for (const [type, keywords] of Object.entries(APPLIANCE_KEYWORDS)) {
    if (keywords.some(kw => combined.includes(kw.toLowerCase()))) {
      return type
    }
  }
  return 'unknown'
}

// ── Variant detection ──────────────────────────────────────────────────────────

interface VariantInfo {
  hasPartNumberCol: boolean
  stepsHeaderLabel: string
  tableCount: number
  hasPartGroupRows: boolean
  partNumberFormat: 'numeric' | 'dotted' | 'none'
  multivalueDelimiter: string
  partsTableHeader: string
}

const STEPS_HEADERS = ['แนวทาง', 'ขั้นตอน', 'วิธีการ', 'การซ่อม']
const PARTS_TABLE_HEADERS = ['ชิ้นส่วนอุปกรณ์ภายใน', 'อุปกรณ์ที่ต้องตรวจสอบ', 'ชิ้นส่วน', 'อุปกรณ์']

function detectVariants(tables: XmlTable[]): VariantInfo {
  const variants: VariantInfo = {
    hasPartNumberCol: false,
    stepsHeaderLabel: 'แนวทาง',
    tableCount: tables.length,
    hasPartGroupRows: false,
    partNumberFormat: 'none',
    multivalueDelimiter: ' ',
    partsTableHeader: 'ชิ้นส่วนอุปกรณ์ภายใน',
  }

  for (const table of tables) {
    if (table.rows.length === 0) continue
    const headerRow = table.rows[0]

    // Variant 1: col count — 7+ cols means partNumber column present
    if (headerRow.length >= 7) {
      variants.hasPartNumberCol = true
    }

    // Variant 2: steps header label
    for (const cell of headerRow) {
      const matched = STEPS_HEADERS.find(h => cell.includes(h))
      if (matched) {
        variants.stepsHeaderLabel = matched
        break
      }
    }

    // Variant 7: parts table header
    for (const cell of headerRow) {
      const matched = PARTS_TABLE_HEADERS.find(h => cell.includes(h))
      if (matched) {
        variants.partsTableHeader = matched
        break
      }
    }

    // Variant 4 & 5: scan data rows
    for (let i = 1; i < table.rows.length; i++) {
      const row = table.rows[i]
      if (!row || row.length === 0) continue

      // Variant 4: partGroup row — row where col[1] is empty and col[0] has group label
      if (row.length >= 2 && row[0] && !row[1] && row[0].length < 40) {
        variants.hasPartGroupRows = true
      }

      // Variant 5: partNumber format — dotted "9.1" or just numeric
      const firstCell = row[0] ?? ''
      if (/^\d+\.\d+/.test(firstCell)) {
        variants.partNumberFormat = 'dotted'
      } else if (/^\d+$/.test(firstCell) && variants.partNumberFormat === 'none') {
        variants.partNumberFormat = 'numeric'
      }

      // Variant 6: multivalue delimiter detection from symptom column
      // Symptom col is typically col 2 or 3 (after partNo, partName)
      const symptomCol = variants.hasPartNumberCol ? 2 : 1
      const symptomText = row[symptomCol] ?? ''
      if (symptomText.includes('และ')) {
        variants.multivalueDelimiter = 'และ'
      } else if (symptomText.includes(',') || symptomText.includes('，')) {
        variants.multivalueDelimiter = ','
      }
      // default remains ' ' (space)
    }
  }

  return variants
}

// ── Parts table parser ─────────────────────────────────────────────────────────

function splitMultivalue(text: string, delimiter: string): string[] {
  if (!text.trim()) return []

  let parts: string[]
  if (delimiter === 'และ') {
    // Split on "และ" — but keep compound names together
    parts = text.split(/\s*และ\s*/)
  } else if (delimiter === ',') {
    parts = text.split(/[,，]\s*/)
  } else {
    // Space-delimited — use newline as primary, fallback to sentence split
    parts = text.split(/\n+/)
    if (parts.length === 1) {
      // Try splitting on Thai sentence boundary (period + space or ·)
      parts = text.split(/[·•]\s*/)
    }
  }

  return parts.map(p => p.trim()).filter(p => p.length > 0)
}

function parsePartsTable(table: XmlTable, variants: VariantInfo): RepairPart[] {
  const parts: RepairPart[] = []
  if (table.rows.length < 2) return parts

  const headerRow = table.rows[0]

  // Determine column mapping based on variants
  // Standard 6-col: [ลำดับ?, ชิ้นส่วน, อาการเสีย, แนวทาง/ขั้นตอน, หมายเหตุ]
  // Standard 7-col: [ลำดับ, รหัส, ชิ้นส่วน, อาการเสีย, แนวทาง/ขั้นตอน, หมายเหตุ, ...]
  const hasPartNo = variants.hasPartNumberCol

  let colPartNum = -1
  let colPartName = -1
  let colSymptoms = -1
  let colSteps = -1
  let colRemark = -1

  // Auto-detect columns from header
  for (let c = 0; c < headerRow.length; c++) {
    const h = headerRow[c].toLowerCase()
    if (h.includes('ลำดับ') || h.includes('ที่') || h === 'no' || h === 'no.') {
      colPartNum = c
    } else if (h.includes('ชิ้นส่วน') || h.includes('อุปกรณ์') || h.includes('part')) {
      colPartName = c
    } else if (h.includes('อาการ') || h.includes('symptom')) {
      colSymptoms = c
    } else if (STEPS_HEADERS.some(sh => h.includes(sh.toLowerCase()))) {
      colSteps = c
    } else if (h.includes('หมายเหตุ') || h.includes('note') || h.includes('remark')) {
      colRemark = c
    }
  }

  // Fallback column mapping if auto-detect fails
  if (colPartName === -1) {
    if (hasPartNo) {
      colPartNum = 0; colPartName = 1; colSymptoms = 2; colSteps = 3; colRemark = 4
    } else {
      colPartNum = -1; colPartName = 0; colSymptoms = 1; colSteps = 2; colRemark = 3
    }
  }

  let currentGroup: string | undefined

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i]
    if (!row || row.length === 0) continue

    const partNameCell = colPartName >= 0 ? (row[colPartName] ?? '') : ''

    // Variant 4: detect partGroup row — sparse row with only label
    if (variants.hasPartGroupRows) {
      const nonEmpty = row.filter(c => c.trim().length > 0)
      if (nonEmpty.length === 1 && partNameCell.length < 50) {
        currentGroup = partNameCell
        continue
      }
    }

    // Skip totally empty rows
    if (!partNameCell.trim()) continue

    const part: RepairPart = {
      partName: partNameCell,
      symptoms: [],
      steps: [],
    }

    if (currentGroup) {
      part.partGroup = currentGroup
    }

    if (colPartNum >= 0 && row[colPartNum]) {
      part.partNumber = row[colPartNum]
    }

    if (colSymptoms >= 0 && row[colSymptoms]) {
      part.symptoms = splitMultivalue(row[colSymptoms], variants.multivalueDelimiter)
    }

    if (colSteps >= 0 && row[colSteps]) {
      part.steps = splitMultivalue(row[colSteps], '\n')
    }

    if (colRemark >= 0 && row[colRemark]) {
      part.remark = row[colRemark]
    }

    parts.push(part)
  }

  return parts
}

// ── Checklist table parser ─────────────────────────────────────────────────────

function parseChecklistTable(table: XmlTable): RepairChecklist[] {
  const items: RepairChecklist[] = []
  if (table.rows.length < 2) return items

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i]
    if (!row || !row[0]?.trim()) continue

    items.push({
      item: row[0],
      checkType: row[1] ?? undefined,
      standard: row[2] ?? undefined,
    })
  }
  return items
}

// ── Symptom table parser ───────────────────────────────────────────────────────

function parseSymptomTable(table: XmlTable): RepairSymptom[] {
  const symptoms: RepairSymptom[] = []
  if (table.rows.length < 2) return symptoms

  const header = table.rows[0]
  let colCode = -1
  let colDesc = -1
  let colCauses = -1

  for (let c = 0; c < header.length; c++) {
    const h = header[c].toLowerCase()
    if (h.includes('รหัส') || h.includes('code')) colCode = c
    else if (h.includes('อาการ') || h.includes('symptom')) colDesc = c
    else if (h.includes('สาเหตุ') || h.includes('cause')) colCauses = c
  }
  if (colDesc === -1) { colDesc = 0; colCauses = 1 }

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i]
    if (!row || !row[colDesc]?.trim()) continue

    symptoms.push({
      code: colCode >= 0 ? row[colCode] : undefined,
      description: row[colDesc],
      causes: colCauses >= 0 && row[colCauses]
        ? splitMultivalue(row[colCauses], '\n')
        : [],
    })
  }
  return symptoms
}

// ── Table classifier ───────────────────────────────────────────────────────────

type TableType = 'parts' | 'checklist' | 'symptoms' | 'pricing' | 'unknown'

function classifyTable(table: XmlTable): TableType {
  if (table.rows.length === 0) return 'unknown'
  const header = table.rows[0].join(' ').toLowerCase()

  if (header.includes('ชิ้นส่วน') || header.includes('อุปกรณ์ภายใน') || header.includes('part')) {
    return 'parts'
  }
  if (header.includes('ตรวจ') || header.includes('checklist') || header.includes('ตรวจสอบ')) {
    return 'checklist'
  }
  if (header.includes('อาการ') || header.includes('symptom')) {
    return 'symptoms'
  }
  if (header.includes('ราคา') || header.includes('price') || header.includes('ค่าบริการ')) {
    return 'pricing'
  }
  return 'unknown'
}

// ── Main parse function ────────────────────────────────────────────────────────

export async function parseRepairDoc(docxPath: string): Promise<RepairDocResult> {
  const sourceFile = path.basename(docxPath)
  const parseErrors: string[] = []

  let xml: string
  try {
    xml = await extractDocumentXml(docxPath)
  } catch (e) {
    return {
      sourceFile,
      applianceType: 'unknown',
      variants: {
        hasPartNumberCol: false,
        stepsHeaderLabel: 'แนวทาง',
        tableCount: 0,
        hasPartGroupRows: false,
        partNumberFormat: 'none',
        multivalueDelimiter: ' ',
        partsTableHeader: 'ชิ้นส่วนอุปกรณ์ภายใน',
      },
      parts: [],
      checklist: [],
      symptoms: [],
      parseErrors: [`Failed to read docx: ${(e as Error).message}`],
    }
  }

  const tables = extractTablesFromXml(xml)
  const variants = detectVariants(tables)
  const applianceType = detectApplianceType(xml, sourceFile)

  const allParts: RepairPart[] = []
  const allChecklist: RepairChecklist[] = []
  const allSymptoms: RepairSymptom[] = []

  for (let t = 0; t < tables.length; t++) {
    const table = tables[t]
    const tableType = classifyTable(table)

    try {
      switch (tableType) {
        case 'parts':
          allParts.push(...parsePartsTable(table, variants))
          break
        case 'checklist':
          allChecklist.push(...parseChecklistTable(table))
          break
        case 'symptoms':
          allSymptoms.push(...parseSymptomTable(table))
          break
        case 'unknown':
          // Try as parts if has enough columns
          if (table.rows[0]?.length >= 3) {
            const parsed = parsePartsTable(table, variants)
            if (parsed.length > 0) {
              allParts.push(...parsed)
            }
          }
          break
      }
    } catch (e) {
      parseErrors.push(`Table[${t}] (${tableType}): ${(e as Error).message}`)
    }
  }

  return {
    sourceFile,
    applianceType,
    variants,
    parts: allParts,
    checklist: allChecklist,
    symptoms: allSymptoms,
    parseErrors,
  }
}

// ── Batch parse (directory) ────────────────────────────────────────────────────

export async function parseRepairDocsDir(dirPath: string): Promise<RepairDocResult[]> {
  const files = fs.readdirSync(dirPath)
    .filter(f => f.toLowerCase().endsWith('.docx'))
    .map(f => path.join(dirPath, f))

  const results: RepairDocResult[] = []
  for (const file of files) {
    console.error(`Parsing: ${path.basename(file)}`)
    const result = await parseRepairDoc(file)
    results.push(result)
  }
  return results
}

// ── CLI entry point ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage:')
    console.error('  parse-repair-docs.ts <file.docx> [--out result.json]')
    console.error('  parse-repair-docs.ts --dir <directory> [--out results.json]')
    process.exit(1)
  }

  let outFile: string | null = null
  const outIdx = args.indexOf('--out')
  if (outIdx >= 0 && args[outIdx + 1]) {
    outFile = args[outIdx + 1]
  }

  let results: RepairDocResult | RepairDocResult[]

  if (args[0] === '--dir') {
    const dirPath = args[1]
    if (!dirPath || !fs.existsSync(dirPath)) {
      console.error(`Directory not found: ${dirPath}`)
      process.exit(1)
    }
    results = await parseRepairDocsDir(dirPath)
  } else {
    const filePath = args[0]
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`)
      process.exit(1)
    }
    results = await parseRepairDoc(filePath)
  }

  const json = JSON.stringify(results, null, 2)

  if (outFile) {
    fs.writeFileSync(outFile, json, 'utf8')
    console.error(`✅ Written to ${outFile}`)
  } else {
    process.stdout.write(json + '\n')
  }

  // Summary
  const arr = Array.isArray(results) ? results : [results]
  const totalParts = arr.reduce((s, r) => s + r.parts.length, 0)
  const totalErrors = arr.reduce((s, r) => s + r.parseErrors.length, 0)
  console.error(`\n📊 Parsed ${arr.length} file(s) → ${totalParts} parts, ${totalErrors} error(s)`)
}

main().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
