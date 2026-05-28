/**
 * seeds/0002_w3_cms_content.ts — W-3-A: CMS Content Seed
 *
 * Seeds 6 content_pages rows for new types: legal / contact / social_links
 * Status: 'draft' (Rule #5 — Admin promotes to published)
 * Body: {} skeleton (legal/contact) | {facebook,line,instagram} (social_links)
 *
 * Idempotent: INSERT ... ON CONFLICT (slug) DO NOTHING
 *
 * Usage:
 *   pnpm --filter backend seed:w3
 *
 * W-3-A CMD: 36e813ec-7277-81fa-85fd-cd39ce3de23e
 * Advisor Gen 98 sign-off: D77 reuse — no new schema migration needed
 */
import { Client } from 'pg'

const SEED_ROWS = [
  { slug: 'terms',   type: 'legal',        title: 'ข้อกำหนดการใช้งาน',          body: '{}' },
  { slug: 'privacy', type: 'legal',        title: 'นโยบายความเป็นส่วนตัว',      body: '{}' },
  { slug: 'cookies', type: 'legal',        title: 'นโยบายคุกกี้',               body: '{}' },
  { slug: 'refund',  type: 'legal',        title: 'นโยบายการคืนเงิน',           body: '{}' },
  { slug: 'main',    type: 'contact',      title: 'ติดต่อเรา',                   body: '{}' },
  {
    slug: 'footer',
    type: 'social_links',
    title: 'Social Links',
    body: JSON.stringify({ facebook: '', line: '', instagram: '' }),
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

  console.log('🌱 W-3-A CMS Seed — inserting 6 content_pages rows...')

  try {
    let inserted = 0
    let skipped = 0

    for (const row of SEED_ROWS) {
      const result = await client.query(
        `INSERT INTO content_pages (slug, type, title, body, status, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, 'draft', 1, NOW(), NOW())
         ON CONFLICT (slug) DO NOTHING`,
        [row.slug, row.type, row.title, row.body],
      )
      if (result.rowCount && result.rowCount > 0) {
        console.log(`  ✅ Inserted: type=${row.type} slug=${row.slug}`)
        inserted++
      } else {
        console.log(`  ⏭  Skipped (already exists): slug=${row.slug}`)
        skipped++
      }
    }

    console.log(`\n✅ Seed complete — inserted: ${inserted}, skipped: ${skipped}`)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
