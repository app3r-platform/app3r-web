/**
 * migration-apply.test.ts — W-Round-1 Wave 1.2 [6]: B1 CI Guard (ปิด D85 / TD-W3-01)
 *
 * เป้าหมาย (B1 Advisor decision):
 *   hand-written SQL = official migration path → ไม่ใช้ `drizzle-kit check` อีก
 *   แทนด้วย "migration-apply test": DB เปล่า → รัน SQL 0000→ล่าสุด ตามลำดับ →
 *   introspect information_schema → assert structure ตรงกับ schema (drizzle) →
 *   smoke route mount. ถ้า structural drift ใหม่โผล่ → test RED → กัน merge.
 *
 * TD-W3-01 (no STRUCTURAL drift): ปิดได้เมื่อ test นี้ผ่าน — introspect ยืนยัน
 *   ตาราง/คอลัมน์หลัก (รวม Wave 1.2 listing_meta surface) ครบตาม schema.
 *
 * ⚠️ TD-W3-02 (pre-existing, NOT Wave 1.2): seed 0019_seed_pricing.sql + 0024_d5_seed_pricing.sql
 *   INSERT ลงคอลัมน์ "notes" ของ used_pricing_models ที่ไม่มีใน 0014 + schema repair-pricing.ts
 *   → seed-data drift บน main (commit eb5a148 / 6bcb817, คนละ chat). routed → HUB → repair chat.
 *   guard นี้ allowlist ไว้ชัดเจน: ถ้า "notes" ถูกแก้แล้ว ลบ allowlist ออก;
 *   ถ้ามี seed พังใหม่นอก allowlist → RED.
 *
 * Run: pnpm vitest run tests/integration/migration-apply.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Client } from 'pg'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { app } from '../../src/app'

const MIGRATIONS_DIR = join(__dirname, '../../src/db/migrations')
// ชื่อ DB ชั่วคราว (ephemeral) — สร้าง/ทิ้งใน suite นี้เท่านั้น
const GUARD_DB = `app3r_migguard_${Date.now()}`

// Forward-only: ตัด rollback section ออก (pattern เดียวกับ migrate-all.ts)
function extractForwardSql(raw: string): string {
  const idx = raw.indexOf('-- ── Rollback')
  return idx > -1 ? raw.slice(0, idx).trim() : raw.trim()
}

// ── TD-W3-02 known pre-existing seed drift allowlist ───────────────────────────
// key = migration filename · pattern = error message ที่ "ยอมรับได้" (รู้สาเหตุแล้ว)
const KNOWN_SEED_DRIFT: Record<string, RegExp> = {
  '0019_seed_pricing.sql': /column "notes" of relation "used_pricing_models" does not exist/i,
  '0024_d5_seed_pricing.sql': /column "notes" of relation "used_pricing_models" does not exist/i,
}

// ── structural manifest: ตาราง/คอลัมน์หลักที่ต้องมีหลัง apply ครบ ────────────────
// เน้น Wave 1.2 surface + core integrity (ไม่ครบทุกคอลัมน์ — assert จุดวิกฤต)
const EXPECTED_TABLES = [
  'users', 'wallets', 'point_ledger',
  'services', 'parts_listings', 'parts_inventory', 'parts_orders',
  'provinces', 'amphoes', 'tambons',
  'admin_config', 'admin_config_audit',
  // Wave 1.2
  'listing_meta', 'listing_views',
]

// คอลัมน์/FK วิกฤตที่ต้องยืนยัน (table → columns)
const EXPECTED_COLUMNS: Record<string, string[]> = {
  listing_meta: [
    'listing_id', 'listing_type', 'domain_ref_id', 'owner_id', 'state',
    'view_count', 'offer_count', 'tambon_id', 'created_at', 'updated_at',
  ],
  listing_views: ['id', 'listing_id', 'viewer_user_id', 'viewer_ip', 'view_date', 'created_at'],
  services: ['listing_meta_id'],
  parts_listings: ['listing_meta_id'],
}

function adminUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL required for migration-apply guard')
  // เชื่อม maintenance DB (postgres) เพื่อ CREATE/DROP guard DB
  const u = new URL(url)
  u.pathname = '/postgres'
  return u.toString()
}

function guardUrl(): string {
  const u = new URL(process.env.DATABASE_URL as string)
  u.pathname = `/${GUARD_DB}`
  return u.toString()
}

describe('B1 CI Guard — migration-apply (TD-W3-01)', () => {
  // ผลการ apply ราย migration
  const applied: string[] = []
  const failures: { file: string; message: string }[] = []
  let introspectedColumns: Record<string, Set<string>> = {}

  beforeAll(async () => {
    // 1) สร้าง guard DB เปล่า
    const admin = new Client({ connectionString: adminUrl() })
    await admin.connect()
    try {
      await admin.query(`DROP DATABASE IF EXISTS "${GUARD_DB}"`)
      await admin.query(`CREATE DATABASE "${GUARD_DB}"`)
    } finally {
      await admin.end()
    }

    // 2) apply migrations ทุกไฟล์ตามลำดับ lexicographic (= numeric)
    const guard = new Client({ connectionString: guardUrl() })
    await guard.connect()
    try {
      const files = readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort()

      for (const file of files) {
        const sql = extractForwardSql(readFileSync(join(MIGRATIONS_DIR, file), 'utf-8'))
        if (!sql) continue
        try {
          await guard.query('BEGIN')
          await guard.query(sql)
          await guard.query('COMMIT')
          applied.push(file)
        } catch (err) {
          await guard.query('ROLLBACK')
          failures.push({ file, message: err instanceof Error ? err.message : String(err) })
        }
      }

      // 3) introspect — สร้าง map table → set(columns) จาก public schema
      const { rows } = await guard.query<{ table_name: string; column_name: string }>(`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
      `)
      introspectedColumns = {}
      for (const r of rows) {
        ;(introspectedColumns[r.table_name] ??= new Set()).add(r.column_name)
      }
    } finally {
      await guard.end()
    }
  }, 120_000)

  afterAll(async () => {
    const admin = new Client({ connectionString: adminUrl() })
    await admin.connect()
    try {
      // terminate connections ค้าง แล้ว drop guard DB
      await admin.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [GUARD_DB],
      )
      await admin.query(`DROP DATABASE IF EXISTS "${GUARD_DB}"`)
    } finally {
      await admin.end()
    }
  })

  it('ไม่มี structural drift — migration พังได้เฉพาะ seed ที่อยู่ใน TD-W3-02 allowlist', () => {
    const unexpected = failures.filter((f) => {
      const allow = KNOWN_SEED_DRIFT[f.file]
      return !(allow && allow.test(f.message))
    })
    // ถ้ามี migration พังนอก allowlist → RED พร้อมรายละเอียด
    expect(
      unexpected,
      `Unexpected migration failures (structural drift?):\n${unexpected
        .map((u) => `  - ${u.file}: ${u.message}`)
        .join('\n')}`,
    ).toEqual([])
  })

  it('seed drift ที่รู้แล้ว (TD-W3-02) ยังตรงกับ allowlist — เตือนเมื่อถูกแก้ไป', () => {
    // ตรวจว่า known drift ยัง "พัง" จริง — ถ้า repair chat แก้แล้ว seed ผ่าน
    // → ไฟล์จะหลุดจาก failures → ต้องลบ allowlist (test ช่วยเตือน)
    for (const file of Object.keys(KNOWN_SEED_DRIFT)) {
      const stillFailing = failures.some((f) => f.file === file)
      if (!stillFailing) {
        console.warn(
          `[TD-W3-02] ${file} ผ่านแล้ว — ลบออกจาก KNOWN_SEED_DRIFT allowlist ได้`,
        )
      }
    }
    // ไม่ assert hard — เป็น guard เตือน (ไม่ทำให้ RED ตอน fix)
    expect(true).toBe(true)
  })

  it('ตารางหลักครบหลัง apply (รวม Wave 1.2 listing_meta + listing_views)', () => {
    const missing = EXPECTED_TABLES.filter((t) => !introspectedColumns[t])
    expect(missing, `Missing tables after migration: ${missing.join(', ')}`).toEqual([])
  })

  it('คอลัมน์/FK วิกฤตตรงกับ schema (B2 2-way integrity surface)', () => {
    const problems: string[] = []
    for (const [table, cols] of Object.entries(EXPECTED_COLUMNS)) {
      const have = introspectedColumns[table]
      if (!have) {
        problems.push(`table ${table} missing`)
        continue
      }
      for (const c of cols) {
        if (!have.has(c)) problems.push(`${table}.${c} missing`)
      }
    }
    expect(problems, `Column drift:\n${problems.join('\n')}`).toEqual([])
  })
})

// ── D14 / B-D14 smoke: route ต้อง mount เปิดได้ ไม่ error routing ────────────────
describe('B1 CI Guard — route smoke (D14)', () => {
  it('GET /health → 200 (app boots, router mounts)', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
  })

  it('public routes เปิดได้ ไม่ error (D14: no 5xx)', async () => {
    // public GET ที่มี handler จริง — D14: ต้องเปิดได้ ไม่ server error (status < 500)
    for (const path of [
      '/api/v1/locations/provinces',   // 200 (DB-backed) — Wave 1 D87
      '/api/content/pages',            // content public list
      '/api/testimonials',             // testimonials public list
    ]) {
      const res = await app.request(path)
      expect(res.status, `route ${path} returned server error ${res.status}`).toBeLessThan(500)
    }
  })
})
