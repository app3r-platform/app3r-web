/**
 * extract-doc-images.ts — D89 Image Extraction (word/media/ → /assets/)
 *
 * Extracts embedded images from .docx repair documents,
 * renames them per D89 naming convention, saves to /assets/parts/,
 * and outputs asset_images seed records (JSON).
 *
 * .docx structure (zip):
 *   word/document.xml      — main document content
 *   word/media/image1.png  — embedded images
 *   word/_rels/document.xml.rels — relationships (image↔anchor)
 *
 * Output JSON format (matches asset_images table — D89):
 * {
 *   category: 'parts',
 *   appliance_category: 'ac',
 *   local_path: '/assets/parts/ac-01-compressor.jpeg',
 *   alt_text: 'ชื่อชิ้นส่วน',
 *   linked_entity_type: 'repair_part_catalog',
 *   linked_entity_id: null,   // filled after DB insert of parts
 *   source_file: 'repair-ac.docx',
 *   sort_order: 0
 * }
 *
 * Usage:
 *   npx tsx src/scripts/import/extract-doc-images.ts <file.docx> --out-dir ./public/assets/parts [--out manifest.json]
 *   npx tsx src/scripts/import/extract-doc-images.ts --dir <directory> --out-dir ./public/assets [--out manifest.json]
 *
 * Spec: D89 (36a813ec-7277-8132-9cb3-de95b1dabc49)
 * Backend Gen · 2026-05-25
 */

import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ExtractedImage {
  /** original filename inside word/media/ */
  originalName: string
  /** image bytes */
  data: Buffer
  /** mime type (image/jpeg, image/png, image/gif, image/wmf) */
  mimeType: string
  /** extension: jpeg | png | gif | wmf */
  ext: string
  /** relationship ID from word/_rels/document.xml.rels */
  rId?: string
  /** paragraph/anchor text nearby in document (heuristic) */
  nearbyText?: string
}

export interface AssetImageSeedRecord {
  category: string
  appliance_category: string | null
  local_path: string
  cloud_url: null
  alt_text: string | null
  linked_entity_type: string | null
  linked_entity_id: null
  source_file: string
  sort_order: number
}

export interface DocImageExtractResult {
  sourceFile: string
  applianceCategory: string
  extractedCount: number
  skippedCount: number
  images: AssetImageSeedRecord[]
  errors: string[]
}

// ── Appliance category mapping (filename → DB code) ───────────────────────────

const FILENAME_TO_APPLIANCE: Array<[RegExp, string]> = [
  [/แอร์|air|เครื่องปรับอากาศ/i, 'ac'],
  [/ตู้เย็น|refrigerator|fridge/i, 'refrigerator'],
  [/ซักผ้า|washing|washer/i, 'washer'],
  [/คอมพิวเตอร์|computer|desktop/i, 'computer'],
  [/โทรทัศน์|television|tv|ทีวี/i, 'tv'],
  [/โน้ตบุ๊ก|notebook|laptop/i, 'notebook'],
  [/สมาร์ทโฟน|smartphone|iphone|android/i, 'smartphone'],
]

function detectApplianceFromFilename(filename: string): string {
  for (const [pattern, code] of FILENAME_TO_APPLIANCE) {
    if (pattern.test(filename)) return code
  }
  return 'unknown'
}

// ── MIME type helpers ──────────────────────────────────────────────────────────

const EXT_TO_MIME: Record<string, string> = {
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  gif:  'image/gif',
  wmf:  'image/x-wmf',
  emf:  'image/x-emf',
  tiff: 'image/tiff',
  bmp:  'image/bmp',
}

function getExtFromFilename(filename: string): string {
  return path.extname(filename).toLowerCase().replace('.', '') || 'png'
}

function shouldSkipImage(filename: string): boolean {
  const ext = getExtFromFilename(filename)
  // Skip vector/legacy formats that can't be directly served as web images
  return ['wmf', 'emf'].includes(ext)
}

// ── ZIP reader (reuse pattern from parse-repair-docs.ts) ───────────────────────

interface ZipEntry {
  name: string
  data: Buffer
}

function extractAllFromZip(buf: Buffer, prefix: string): ZipEntry[] {
  const entries: ZipEntry[] = []
  let offset = 0
  const PK_LOCAL = 0x04034b50

  while (offset < buf.length - 30) {
    const sig = buf.readUInt32LE(offset)
    if (sig !== PK_LOCAL) {
      offset++
      continue
    }

    const compression   = buf.readUInt16LE(offset + 8)
    const compressedSize= buf.readUInt32LE(offset + 18)
    const fileNameLen   = buf.readUInt16LE(offset + 26)
    const extraLen      = buf.readUInt16LE(offset + 28)
    const fileName      = buf.toString('utf8', offset + 30, offset + 30 + fileNameLen)
    const dataStart     = offset + 30 + fileNameLen + extraLen
    const dataEnd       = dataStart + compressedSize

    if (fileName.startsWith(prefix)) {
      const compressedData = buf.slice(dataStart, dataEnd)
      let data: Buffer | null = null

      if (compression === 0) {
        data = compressedData
      } else if (compression === 8) {
        try {
          data = zlib.inflateRawSync(compressedData)
        } catch {
          // skip corrupt entry
        }
      }

      if (data) {
        entries.push({ name: fileName, data })
      }
    }

    offset = dataEnd
  }

  return entries
}

function extractFileFromZip(buf: Buffer, targetName: string): Buffer | null {
  const entries = extractAllFromZip(buf, targetName)
  const found = entries.find(e => e.name === targetName)
  return found?.data ?? null
}

// ── Relationship parsing (word/_rels/document.xml.rels) ───────────────────────

interface RelationshipMap {
  /** rId → media filename (e.g. "image1.png") */
  [rId: string]: string
}

function parseRelationships(relXml: string): RelationshipMap {
  const map: RelationshipMap = {}
  const matches = relXml.matchAll(
    /Id="([^"]+)"[^>]+Type="[^"]*image[^"]*"[^>]+Target="([^"]+)"/gi
  )
  for (const m of matches) {
    const rId    = m[1]
    const target = m[2]  // e.g. "media/image1.png"
    const filename = path.basename(target)
    map[rId] = filename
  }
  return map
}

// ── Document XML: extract image rId → nearby text (heuristic) ─────────────────

interface ImageAnchor {
  rId: string
  nearbyText: string
}

function extractImageAnchors(docXml: string): ImageAnchor[] {
  const anchors: ImageAnchor[] = []

  // Match <a:blip r:embed="rId..."/> elements and get nearby paragraph text
  const blipPattern = /<a:blip\s[^>]*r:embed="([^"]+)"/g
  let m: RegExpExecArray | null

  while ((m = blipPattern.exec(docXml)) !== null) {
    const rId = m[1]

    // Find preceding paragraph text within ~500 chars before this blip
    const before = docXml.slice(Math.max(0, m.index - 500), m.index)
    // Extract text from <w:t>...</w:t> tags
    const texts: string[] = []
    const tPattern = /<w:t(?:\s[^>]*)?>([^<]+)<\/w:t>/g
    let tm: RegExpExecArray | null
    while ((tm = tPattern.exec(before)) !== null) {
      const t = tm[1].trim()
      if (t) texts.push(t)
    }

    anchors.push({
      rId,
      nearbyText: texts.slice(-3).join(' ').trim(),  // last 3 text fragments
    })
  }

  return anchors
}

// ── Main extraction function ───────────────────────────────────────────────────

export async function extractDocImages(
  docxPath: string,
  outDir: string,
): Promise<DocImageExtractResult> {
  const sourceFile = path.basename(docxPath)
  const applianceCategory = detectApplianceFromFilename(sourceFile)
  const errors: string[] = []
  const images: AssetImageSeedRecord[] = []
  let skippedCount = 0

  // Read .docx as buffer
  const buf = fs.readFileSync(docxPath)

  // 1. Extract word/media/ images
  const mediaEntries = extractAllFromZip(buf, 'word/media/')

  if (mediaEntries.length === 0) {
    errors.push(`No images found in word/media/ — file may be markdown-only or empty`)
    return { sourceFile, applianceCategory, extractedCount: 0, skippedCount: 0, images, errors }
  }

  // 2. Parse relationships to get rId→filename mapping
  const relsBuf = extractFileFromZip(buf, 'word/_rels/document.xml.rels')
  const relMap: RelationshipMap = relsBuf ? parseRelationships(relsBuf.toString('utf8')) : {}

  // 3. Parse document.xml for image anchors (rId → nearby text)
  const docXmlBuf = extractFileFromZip(buf, 'word/document.xml')
  const anchors: ImageAnchor[] = docXmlBuf ? extractImageAnchors(docXmlBuf.toString('utf8')) : []

  // Build rId → nearbyText map
  const anchorMap = new Map<string, string>(anchors.map(a => [a.rId, a.nearbyText]))

  // Build filename → rId reverse map (for lookup)
  const filenameToRid = new Map<string, string>(
    Object.entries(relMap).map(([rId, fname]) => [fname, rId])
  )

  // 4. Process each media file
  // Ensure output directory exists
  fs.mkdirSync(outDir, { recursive: true })

  for (let i = 0; i < mediaEntries.length; i++) {
    const entry = mediaEntries[i]
    const mediaFilename = path.basename(entry.name)
    const ext = getExtFromFilename(mediaFilename)

    // Skip non-web-compatible formats
    if (shouldSkipImage(mediaFilename)) {
      skippedCount++
      continue
    }

    // Determine rId and nearby text
    const rId = filenameToRid.get(mediaFilename)
    const nearbyText = rId ? (anchorMap.get(rId) ?? '') : ''

    // Generate output filename per D89 naming convention:
    // <applianceCategory>-<index>-<slug>.jpeg
    const indexStr = String(i + 1).padStart(3, '0')
    const slug = nearbyText
      ? nearbyText
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w฀-๿-]/g, '')  // keep Thai + word chars + hyphens
          .replace(/-+/g, '-')
          .slice(0, 40)
      : `image-${indexStr}`

    // Use jpeg as output format for web compatibility
    const outputExt = ['jpeg', 'jpg'].includes(ext) ? 'jpeg' : ext
    const outputFilename = `${applianceCategory}-${indexStr}-${slug}.${outputExt}`
    const outputPath = path.join(outDir, outputFilename)
    const localPath = `/assets/parts/${outputFilename}`

    // Write image file
    try {
      fs.writeFileSync(outputPath, entry.data)
    } catch (e) {
      errors.push(`Failed to write ${outputFilename}: ${e}`)
      continue
    }

    // Build asset_images seed record
    images.push({
      category: 'parts',
      appliance_category: applianceCategory !== 'unknown' ? applianceCategory : null,
      local_path: localPath,
      cloud_url: null,
      alt_text: nearbyText || null,
      linked_entity_type: 'repair_part_catalog',
      linked_entity_id: null,
      source_file: sourceFile,
      sort_order: i,
    })
  }

  return {
    sourceFile,
    applianceCategory,
    extractedCount: images.length,
    skippedCount,
    images,
    errors,
  }
}

export async function extractDocImagesDir(
  dirPath: string,
  outDir: string,
): Promise<DocImageExtractResult[]> {
  const files = fs.readdirSync(dirPath)
    .filter(f => f.toLowerCase().endsWith('.docx'))
    .sort()

  const results: DocImageExtractResult[] = []
  for (const file of files) {
    const filePath = path.join(dirPath, file)
    console.error(`📄 Extracting images: ${file}`)
    const result = await extractDocImages(filePath, path.join(outDir, 'parts'))
    results.push(result)
  }
  return results
}

// ── CLI entrypoint ─────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage:')
    console.error('  extract-doc-images.ts <file.docx> --out-dir ./public/assets/parts [--out manifest.json]')
    console.error('  extract-doc-images.ts --dir <directory> --out-dir ./public/assets [--out manifest.json]')
    process.exit(1)
  }

  // Parse --out-dir
  const outDirIdx = args.indexOf('--out-dir')
  if (outDirIdx < 0 || !args[outDirIdx + 1]) {
    console.error('Error: --out-dir <path> is required')
    process.exit(1)
  }
  const outDir = args[outDirIdx + 1]

  // Parse --out
  let outFile: string | null = null
  const outIdx = args.indexOf('--out')
  if (outIdx >= 0 && args[outIdx + 1]) {
    outFile = args[outIdx + 1]
  }

  let results: DocImageExtractResult | DocImageExtractResult[]

  if (args[0] === '--dir') {
    const dirPath = args[1]
    if (!dirPath || !fs.existsSync(dirPath)) {
      console.error(`Directory not found: ${dirPath}`)
      process.exit(1)
    }
    results = await extractDocImagesDir(dirPath, outDir)
  } else {
    const filePath = args[0]
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`)
      process.exit(1)
    }
    results = await extractDocImages(filePath, outDir)
  }

  const json = JSON.stringify(results, null, 2)

  if (outFile) {
    fs.writeFileSync(outFile, json, 'utf8')
    console.error(`✅ Manifest written to ${outFile}`)
  } else {
    process.stdout.write(json + '\n')
  }

  // Summary
  const arr = Array.isArray(results) ? results : [results]
  const totalExtracted = arr.reduce((s, r) => s + r.extractedCount, 0)
  const totalSkipped   = arr.reduce((s, r) => s + r.skippedCount, 0)
  const totalErrors    = arr.reduce((s, r) => s + r.errors.length, 0)
  console.error(`\n📊 ${arr.length} file(s) → ${totalExtracted} images extracted, ${totalSkipped} skipped, ${totalErrors} error(s)`)
}

main().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
