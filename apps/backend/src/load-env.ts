/**
 * load-env.ts — โหลด .env.local ก่อน module อื่นทุกตัว
 * MUST be the FIRST import in src/index.ts
 */
import { config } from 'dotenv'
import { existsSync } from 'node:fs'
import path from 'node:path'

const envFile = path.resolve(process.cwd(), '.env.local')
const fallback = path.resolve(process.cwd(), '.env')

if (existsSync(envFile)) {
  config({ path: envFile })
} else if (existsSync(fallback)) {
  config({ path: fallback })
}
