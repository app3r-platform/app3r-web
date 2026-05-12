/**
 * distance-cache.ts — D90: Google Distance Matrix API cache
 *
 * NOTE-D90-2 (CRITICAL): round lat/lng เป็น 6 decimal places (~0.1m) ก่อน INSERT + SELECT
 * กัน floating-point precision miss (เช่น 13.7563912345 ≠ 13.756391234500001)
 *
 * Application code rule (ทุกที่ที่ insert หรือ lookup):
 * const roundCoord = (n: number) => Math.round(n * 1e6) / 1e6
 * const originLat = roundCoord(rawLat)  // ใช้ค่า rounded ทุกที่
 *
 * Composite PK: (origin_lat, origin_lng, dest_lat, dest_lng, mode)
 * TTL: distance = 7 วัน, geocoding = 90 วัน (ดู D90 spec)
 * Cache cleanup: cron ลบ row ที่ expires_at < NOW() ทุกวัน 03:00 (D-5)
 */
import {
  pgTable,
  doublePrecision,
  integer,
  text,
  timestamp,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core'

export const distanceCache = pgTable(
  'distance_cache',
  {
    // NOTE-D90-2: ต้อง round 6 decimals ก่อน store + lookup
    originLat: doublePrecision('origin_lat').notNull(),
    originLng: doublePrecision('origin_lng').notNull(),
    destLat: doublePrecision('dest_lat').notNull(),
    destLng: doublePrecision('dest_lng').notNull(),
    distanceMeters: integer('distance_meters').notNull(),
    durationSeconds: integer('duration_seconds').notNull(),
    // 'driving' | 'walking' | 'bicycling' | 'transit'
    mode: text('mode').notNull().default('driving'),
    cachedAt: timestamp('cached_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.originLat,
        table.originLng,
        table.destLat,
        table.destLng,
        table.mode,
      ],
    }),
    index('idx_dc_expires').on(table.expiresAt),
  ],
)

export type DistanceCache = typeof distanceCache.$inferSelect
export type NewDistanceCache = typeof distanceCache.$inferInsert
