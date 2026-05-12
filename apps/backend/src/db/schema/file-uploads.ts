/**
 * file-uploads.ts — D87: R2 presigned upload tracking
 *
 * NOTE-M2 applied: scan_status + scanned_at columns อยู่ใน table นี้
 * (ไม่สร้าง table แยก — ลด overhead)
 *
 * ClamAV scan worker (PG polling):
 * SELECT * FROM file_uploads WHERE scan_status='pending' LIMIT 10 ทุก 30s
 * → call ClamAV daemon → update scan_status + scanned_at
 */
import { pgTable, uuid, text, integer, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'

export const fileUploads = pgTable(
  'file_uploads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ownerApp: text('owner_app').notNull(),
    // 'service_photo' | 'profile' | 'parts' | 'document'
    purpose: text('purpose').notNull(),
    // Cloudflare R2 object key (unique)
    r2Key: text('r2_key').notNull(),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    // NOTE-M2: scan status columns (ไม่สร้าง table แยก)
    // 'pending' | 'clean' | 'infected' | 'error'
    scanStatus: text('scan_status').notNull().default('pending'),
    scannedAt: timestamp('scanned_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_files_r2_key').on(table.r2Key),
    index('idx_files_owner').on(table.ownerApp, table.ownerId),
    index('idx_files_purpose').on(table.purpose),
    // partial index สำหรับ ClamAV scan worker
    index('idx_files_pending_scan')
      .on(table.createdAt)
      .where(sql`scan_status = 'pending'`),
  ],
)

export type FileUpload = typeof fileUploads.$inferSelect
export type NewFileUpload = typeof fileUploads.$inferInsert
