/**
 * services.ts — Sub-CMD-4 Wave 2: Services Table Full Expand
 *
 * D-2 stub ขยายเป็น full table:
 *   title        — ชื่อ service (แสดงใน list/card)
 *   description  — รายละเอียดงาน
 *   point_amount — มูลค่างาน (points) — Sub-5 Progress Tracker ต้องการ
 *   deadline     — กำหนดเสร็จงาน — Sub-5 deadline tracking
 *
 * Out of Scope (Sub-CMD-4): offers, parts, milestones tables
 * → ยก Sub-CMD ถัดไป (Sub-5+)
 *
 * Migration: apps/backend/src/db/migrations/0004_services_expand.sql
 * ⚠️ R2: run migration หลัง HUB approve เท่านั้น
 */
import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // เจ้าของ service (ผู้รับงาน: WeeeR | WeeeT | WeeeU)
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // ── ประเภทงาน ────────────────────────────────────────────────────────────
    // 'repair' | 'maintain' | 'resell' | 'scrap'
    serviceType: text('service_type').notNull(),

    // ── สถานะงาน ─────────────────────────────────────────────────────────────
    // 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled'
    status: text('status').notNull().default('draft'),

    // ── Sub-CMD-4: Fields ใหม่ (ALTER ADD COLUMN) ──────────────────────────
    // ชื่อ service — แสดงใน card/list (nullable: draft ไม่บังคับ)
    title: text('title'),

    // รายละเอียดงาน
    description: text('description'),

    // มูลค่างาน (points) — Sub-5 progress tracking + billing
    pointAmount: numeric('point_amount', { precision: 12, scale: 2 }),

    // กำหนดเสร็จงาน — Sub-5 deadline alert
    deadline: timestamp('deadline', { withTimezone: true }),

    // ── Timestamps ────────────────────────────────────────────────────────────
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_services_owner').on(table.ownerId),
    index('idx_services_status').on(table.status),
    // Sub-CMD-4: เพิ่ม index สำหรับ query ที่จะใช้บ่อย
    index('idx_services_type').on(table.serviceType),
    index('idx_services_deadline').on(table.deadline),
  ],
)

export type Service = typeof services.$inferSelect
export type NewService = typeof services.$inferInsert
