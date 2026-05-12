/**
 * locations.ts — D90: user address book
 *
 * 1 user มีหลายที่อยู่ได้ (บ้าน, ที่ทำงาน, ร้าน)
 * google_place_id: จาก Places Autocomplete → ใช้ geocode/verify address
 * verified_at: Admin verify physical address สำหรับ WeeeR registration
 *
 * PostGIS GIST index defer Y2+:
 * -- CREATE INDEX idx_locations_point ON locations
 * --   USING GIST (ST_MakePoint(longitude, latitude));
 * ยังไม่สร้างใน D-2 (PostGIS ใช้ได้แต่ Haversine SQL เพียงพอ D-2)
 *
 * PDPA: ตำแหน่งของช่าง = personal data → require consent ก่อน share
 */
import { pgTable, uuid, text, doublePrecision, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const locations = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ownerApp: text('owner_app').notNull(),
    // 'home' | 'work' | 'shop' | ...
    label: text('label').notNull(),
    formattedAddress: text('formatted_address').notNull(),
    province: text('province'),
    district: text('district'),
    subdistrict: text('subdistrict'),
    postalCode: text('postal_code'),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    // จาก Google Places Autocomplete
    googlePlaceId: text('google_place_id'),
    // Admin verify physical address สำหรับ WeeeR
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_locations_owner').on(table.ownerApp, table.ownerId),
  ],
)

export type Location = typeof locations.$inferSelect
export type NewLocation = typeof locations.$inferInsert
