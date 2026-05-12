/**
 * tests/setup.ts — Vitest global setup
 * โหลด .env.local ก่อน test suite รัน
 */
import { config } from 'dotenv'
import path from 'node:path'

config({ path: path.resolve(process.cwd(), '.env.local') })

// Fallback: ensure test DB URL is present
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL not set. Run: cp .env.local.example .env.local and fill in values.\n' +
      'Also ensure docker compose is up: docker compose up -d',
  )
}
