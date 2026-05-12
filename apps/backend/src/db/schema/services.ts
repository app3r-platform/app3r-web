/**
 * services.ts — stub table (NOTE-D90-1 RESOLVED)
 *
 * D-2 สร้าง stub เพื่อให้ service_locations.service_id FK ทำงานได้
 * Phase D-3 จะ ALTER ADD COLUMN: title, description, point_amount, deadline
 * + เพิ่ม related tables: offers, parts, milestones
 */
import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 'repair' | 'maintain' | 'resell' | 'scrap'
    serviceType: text('service_type').notNull(),
    // 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled'
    status: text('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_services_owner').on(table.ownerId),
    index('idx_services_status').on(table.status),
  ],
)

export type Service = typeof services.$inferSelect
export type NewService = typeof services.$inferInsert
