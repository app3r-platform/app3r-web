/**
 * seeds/0003_d84_admin_config.ts — D84 W-Round-1 Wave 1: default admin config
 *
 * Seeds default 'bad_record_policy' (admin-tunable later via API):
 *   tier 1: ≥3 bad records / 30 days  → suspend 7 days
 *   tier 2: ≥5 bad records / 30 days  → suspend 30 days
 *   tier 3: ≥10 lifetime              → escalate (manual admin review)
 *   coolDownDays: 30  (window for tier evaluation reset)
 *
 * Idempotent: INSERT ... ON CONFLICT (key) DO NOTHING
 *
 * Usage:
 *   pnpm --filter backend seed:d84
 *
 * D84 Decision: W-Round-1 Wave 1
 */
import { Client } from 'pg'

const BAD_RECORD_POLICY = {
  tiers: [
    { count: 3, windowDays: 30, action: 'suspend', durationDays: 7 },
    { count: 5, windowDays: 30, action: 'suspend', durationDays: 30 },
  ],
  lifetimeEscalateAt: 10, // ≥10 lifetime → escalate (manual review)
  coolDownDays: 30,
}

const SEED_ROWS = [
  {
    key: 'bad_record_policy',
    value: JSON.stringify(BAD_RECORD_POLICY),
    description: 'D84 Bad Record Policy — admin-tunable threshold/window/cool-down',
  },
]

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('❌ DATABASE_URL env var required')
    process.exit(1)
  }

  const client = new Client({ connectionString: url })
  await client.connect()
  console.log('🌱 D84 admin_config seed...')
  try {
    let inserted = 0
    let skipped = 0
    for (const row of SEED_ROWS) {
      const result = await client.query(
        `INSERT INTO admin_config (key, value, description, updated_by, updated_at)
         VALUES ($1, $2::jsonb, $3, 'system:seed', NOW())
         ON CONFLICT (key) DO NOTHING`,
        [row.key, row.value, row.description],
      )
      if (result.rowCount && result.rowCount > 0) {
        console.log(`  ✅ Inserted: key=${row.key}`)
        inserted++
      } else {
        console.log(`  ⏭  Skipped (already exists): key=${row.key}`)
        skipped++
      }
    }
    console.log(`\n✅ D84 seed complete — inserted: ${inserted}, skipped: ${skipped}`)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
