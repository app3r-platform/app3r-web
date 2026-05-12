/**
 * service-locations.ts — D90: service-specific location (pickup/delivery/onsite)
 *
 * service_id FK NOT NULL → services(id):
 * ทำได้เพราะ services stub สร้างมาก่อน (NOTE-D90-1 resolved — migration order รับประกัน)
 *
 * location_id FK nullable:
 * ถ้า ad-hoc address (ไม่ได้บันทึกใน locations table) → location_id = NULL
 * ถ้าใช้ที่อยู่ที่บันทึกไว้ → location_id → locations(id)
 */
import { pgTable, uuid, text, doublePrecision, timestamp, index } from 'drizzle-orm/pg-core'
import { services } from './services'
import { locations } from './locations'

export const serviceLocations = pgTable(
  'service_locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    // 'pickup_from' | 'deliver_to' | 'onsite' | 'walkin'
    locationType: text('location_type').notNull(),
    // nullable ถ้า ad-hoc address
    locationId: uuid('location_id').references(() => locations.id),
    formattedAddress: text('formatted_address').notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_sl_service').on(table.serviceId),
  ],
)

export type ServiceLocation = typeof serviceLocations.$inferSelect
export type NewServiceLocation = typeof serviceLocations.$inferInsert
