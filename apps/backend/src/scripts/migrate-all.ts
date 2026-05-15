/**
 * scripts/migrate-all.ts — Sub-CMD-9: Apply ALL SQL migrations via pg.Client
 *
 * Why: drizzle-kit migrate only applies journal-tracked generated migrations (0000-0002).
 * Custom hand-written SQL (0003-0008) must be applied directly. This script
 * applies ALL migration files in order, tracking applied migrations in a
 * _migration_log table to ensure idempotency.
 *
 * Usage:
 *   pnpm db:migrate:all
 *
 * CI Usage (test-backend.yml):
 *   working-directory: apps/backend
 *   run: pnpm db:migrate:all
 *
 * Lesson: discovered in CMD-R2 (2026-05-14) — drizzle-kit silently skips custom SQL
 */
import { Client } from 'pg'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

// CommonJS: __dirname is available natively
const MIGRATIONS_DIR = join(__dirname, '../db/migrations')
const LOG_TABLE = '_migration_log'

// Forward-only: strip rollback section (after "-- ── Rollback" marker)
function extractForwardSql(raw: string): string {
  const rollbackIdx = raw.indexOf('-- ── Rollback')
  return rollbackIdx > -1 ? raw.slice(0, rollbackIdx).trim() : raw.trim()
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('❌ DATABASE_URL env var required')
    process.exit(1)
  }

  const client = new Client({ connectionString: url })
  await client.connect()

  try {
    // Create migration log table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${LOG_TABLE} (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )
    `)

    // Collect all .sql files (exclude meta/ directory)
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort() // lexicographic = numeric order (0000, 0001, ...)

    console.log(`📂 Found ${files.length} migration files in ${MIGRATIONS_DIR}`)

    for (const file of files) {
      // Check if already applied
      const { rows } = await client.query(
        `SELECT id FROM ${LOG_TABLE} WHERE filename = $1`,
        [file],
      )
      if (rows.length > 0) {
        console.log(`  ⏭  SKIP ${file} (already applied)`)
        continue
      }

      const raw = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8')
      const sql = extractForwardSql(raw)

      if (!sql) {
        console.log(`  ⚠️  SKIP ${file} (empty after forward-only extraction)`)
        continue
      }

      console.log(`  ▶  Applying ${file} ...`)
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(
          `INSERT INTO ${LOG_TABLE} (filename) VALUES ($1)`,
          [file],
        )
        await client.query('COMMIT')
        console.log(`  ✅ Applied ${file}`)
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`  ❌ Failed ${file}:`, err)
        throw err
      }
    }

    console.log('\n✅ All migrations applied successfully!')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
