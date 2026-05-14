/**
 * service-progress.ts — Sub-CMD-5 Wave 2: Service Progress Tracker (D79)
 *
 * SEPARATE table จาก `services` — ไม่ใช่ extend field
 * แต่ละ row = 1 progress checkpoint ที่ WeeeT บันทึก
 * WeeeU ดู timeline ผ่าน GET /service-progress/:serviceId
 * WeeeT เขียนผ่าน POST /service-progress + PATCH /service-progress/:id
 *
 * WS broadcast: progress:updated event → services.owner_id (WeeeU customer)
 *
 * Status flow:
 *   pending → accepted → in_progress → paused → completed
 *                                              ↘ cancelled (ทุก state ไปได้)
 *
 * Migration: apps/backend/src/db/migrations/0005_service_progress.sql
 * ⚠️ R2: run migration หลัง HUB approve เท่านั้น
 */
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { services } from './services'
import { users } from './users'

export const serviceProgress = pgTable(
  'service_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // FK → services.id (cascade — ลบ service = ลบ progress ทั้งหมด)
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),

    // สถานะ ณ จุดนี้ของ timeline
    // 'pending' | 'accepted' | 'in_progress' | 'paused' | 'completed' | 'cancelled'
    status: text('status').notNull(),

    // เปอร์เซ็นต์ความคืบหน้า 0–100
    progressPercent: integer('progress_percent').notNull().default(0),

    // บันทึกของช่าง WeeeT (optional)
    note: text('note'),

    // R2 key สำหรับรูปถ่ายงาน (ไม่ใช่ full URL — ใช้ presignGet เพื่อ access)
    photoR2Key: text('photo_r2_key'),

    // WeeeT user ที่ทำการอัพเดต
    updatedBy: uuid('updated_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // timeline query: ดึง progress ของ service เรียง created_at
    index('idx_service_progress_service').on(table.serviceId, table.createdAt),
    index('idx_service_progress_status').on(table.status),
  ],
)

export type ServiceProgress = typeof serviceProgress.$inferSelect
export type NewServiceProgress = typeof serviceProgress.$inferInsert
