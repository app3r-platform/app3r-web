import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'
import { env } from '../env'

const pool = new Pool({ connectionString: env.DATABASE_URL })

export const db = drizzle(pool, { schema })

/** ใช้สำหรับ health check — ping DB */
export async function pingDb(): Promise<number> {
  const start = Date.now()
  await pool.query('SELECT 1')
  return Date.now() - start
}
