/**
 * import-location-master.ts — D87 W-Round-1 Wave 1: import Thai admin location dataset
 *
 * Source: kongvut/thai-province-data (api/latest — official Thai admin codes)
 *   - province.json     → provinces (77)
 *   - district.json     → amphoes   (~930)
 *   - sub_district.json → tambons   (~7,452, has zip_code + lat/long)
 *
 * Idempotent: INSERT ... ON CONFLICT (id) DO UPDATE (re-runnable, refreshes names/coords)
 *
 * Usage:
 *   pnpm --filter backend import:locations
 *   # or against custom DB:
 *   DATABASE_URL=postgresql://... LOCATION_SRC=<dir-or-url> tsx src/scripts/import-location-master.ts
 *
 * D87 Decision: 36e813ec-7277-81ec-8d00-dc3e3fee8816
 */
import { Client } from 'pg'

const SRC_BASE =
  process.env.LOCATION_SRC ??
  'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api/latest'

// kongvut geography_id → ภาค (region label)
const REGION_BY_GEO: Record<number, string> = {
  1: 'ภาคเหนือ',
  2: 'ภาคกลาง',
  3: 'ภาคตะวันออกเฉียงเหนือ',
  4: 'ภาคตะวันตก',
  5: 'ภาคตะวันออก',
  6: 'ภาคใต้',
}

type RawProvince = { id: number; name_th: string; name_en: string | null; geography_id: number }
type RawDistrict = { id: number; name_th: string; name_en: string | null; province_id: number }
type RawSubDistrict = {
  id: number
  zip_code: number | string | null
  name_th: string
  name_en: string | null
  district_id: number
  lat: number | string | null
  long: number | string | null
}

async function loadJson<T>(file: string): Promise<T> {
  if (/^https?:\/\//.test(SRC_BASE)) {
    const res = await fetch(`${SRC_BASE}/${file}`)
    if (!res.ok) throw new Error(`fetch ${file} → HTTP ${res.status}`)
    return (await res.json()) as T
  }
  // local dir mode
  const { readFile } = await import('node:fs/promises')
  const { join } = await import('node:path')
  const txt = await readFile(join(SRC_BASE, file), 'utf8')
  return JSON.parse(txt) as T
}

function num(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

/** Bulk upsert rows in chunks. cols[0] must be the PK ('id'). */
async function bulkUpsert(
  client: Client,
  table: string,
  cols: string[],
  rows: (number | string | null)[][],
  chunkSize = 500,
): Promise<number> {
  let total = 0
  const updateSet = cols
    .filter((c) => c !== 'id')
    .map((c) => `"${c}" = EXCLUDED."${c}"`)
    .join(', ')
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const params: (number | string | null)[] = []
    const valueGroups = chunk.map((row) => {
      const ph = row.map((val) => {
        params.push(val)
        return `$${params.length}`
      })
      return `(${ph.join(', ')})`
    })
    const colList = cols.map((c) => `"${c}"`).join(', ')
    await client.query(
      `INSERT INTO "${table}" (${colList}) VALUES ${valueGroups.join(', ')}
       ON CONFLICT ("id") DO UPDATE SET ${updateSet}`,
      params,
    )
    total += chunk.length
  }
  return total
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('❌ DATABASE_URL env var required')
    process.exit(1)
  }

  console.log(`🌏 D87 Location import — source: ${SRC_BASE}`)
  const [provinces, districts, subDistricts] = await Promise.all([
    loadJson<RawProvince[]>('province.json'),
    loadJson<RawDistrict[]>('district.json'),
    loadJson<RawSubDistrict[]>('sub_district.json'),
  ])
  console.log(
    `   fetched: ${provinces.length} provinces · ${districts.length} amphoes · ${subDistricts.length} tambons`,
  )

  const client = new Client({ connectionString: url })
  await client.connect()
  try {
    await client.query('BEGIN')

    const pCount = await bulkUpsert(
      client,
      'provinces',
      ['id', 'name_th', 'name_en', 'region', 'lat', 'lng'],
      provinces.map((p) => [
        p.id,
        p.name_th,
        p.name_en ?? null,
        REGION_BY_GEO[p.geography_id] ?? null,
        null,
        null,
      ]),
    )
    console.log(`   ✅ provinces upserted: ${pCount}`)

    const aCount = await bulkUpsert(
      client,
      'amphoes',
      ['id', 'province_id', 'name_th', 'name_en', 'lat', 'lng'],
      districts.map((d) => [d.id, d.province_id, d.name_th, d.name_en ?? null, null, null]),
    )
    console.log(`   ✅ amphoes upserted: ${aCount}`)

    const tCount = await bulkUpsert(
      client,
      'tambons',
      ['id', 'amphoe_id', 'name_th', 'name_en', 'lat', 'lng', 'zipcode'],
      subDistricts.map((s) => [
        s.id,
        s.district_id,
        s.name_th,
        s.name_en ?? null,
        num(s.lat),
        num(s.long),
        s.zip_code != null && s.zip_code !== '' ? String(s.zip_code) : null,
      ]),
    )
    console.log(`   ✅ tambons upserted: ${tCount}`)

    await client.query('COMMIT')
    console.log(`\n✅ D87 import complete — ${pCount} + ${aCount} + ${tCount} rows`)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('Import failed:', err)
  process.exit(1)
})
