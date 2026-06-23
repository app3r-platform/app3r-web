/**
 * shop-profiles.ts — D-1 Phase D Sprint: WeeeR shop profile (1:1 with users)
 * Migration: 0032_d1_profiles.sql
 *
 * GET/PUT /shops/me — WeeeR role only
 * Created lazily on first PUT
 */
import { pgTable, uuid, varchar, text, timestamp, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'

export const shopProfiles = pgTable(
  'shop_profiles',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    shopName: varchar('shop_name', { length: 200 }).notNull().default(''),
    phone: varchar('phone', { length: 20 }),
    address: text('address'),
    description: text('description'),
    // Gen 122 R5: Admin approval state (WeeeR ต้องอนุมัติก่อนใช้งาน)
    // D1 = column only · workflow + UI defer → Admin slice (D2+)
    approvalStatus: varchar('approval_status', { length: 20 }).notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      'chk_shop_profiles_approval_status',
      sql`${t.approvalStatus} IN ('pending', 'approved', 'rejected', 'suspended')`,
    ),
  ],
)

export type ShopProfile = typeof shopProfiles.$inferSelect
export type NewShopProfile = typeof shopProfiles.$inferInsert
