/**
 * shop-profiles.ts — D-1 Phase D Sprint: WeeeR shop profile (1:1 with users)
 * Migration: 0032_d1_profiles.sql
 *
 * GET/PUT /shops/me — WeeeR role only
 * Created lazily on first PUT
 */
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const shopProfiles = pgTable('shop_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  shopName: varchar('shop_name', { length: 200 }).notNull().default(''),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type ShopProfile = typeof shopProfiles.$inferSelect
export type NewShopProfile = typeof shopProfiles.$inferInsert
