/**
 * location-master.ts — D87: Thai administrative location reference dataset (L1 Static)
 *
 * ★ Standalone reference tables — NO FK to users/services (กัน B3 FK-conflict กับ Python DB)
 *   ต่างจาก locations.ts (D90 = user address book, province/district เป็น free TEXT)
 *
 * 3 ระดับ: provinces (77) → amphoes (~928) → tambons (~7,400)
 * Source: kongvut/thai-province-data (official Thai admin codes เป็น natural key)
 *   - province id = 2 หลัก · amphoe id = 4 หลัก · tambon id = 6 หลัก
 *
 * Usage:
 *   GR-9  dropdown cascade จังหวัด → อำเภอ → ตำบล + zipcode auto-fill
 *   GR-10 "ใกล้ฉัน" — Haversine บน lat/lng (ไม่ใช้ PostGIS ตาม D87)
 *
 * Decision: D87 (36e813ec-7277-81ec-8d00-dc3e3fee8816)
 * W-Round-1 Wave 1 · CMD INDEX 36e813ec-7277-8115-a905-e41a475f2aa0
 */
import { pgTable, integer, text, doublePrecision, index } from 'drizzle-orm/pg-core'

// ── provinces (จังหวัด) ─────────────────────────────────────────────────────────
export const provinces = pgTable(
  'provinces',
  {
    id:     integer('id').primaryKey(),          // official province code (2-digit)
    nameTh: text('name_th').notNull(),
    nameEn: text('name_en'),
    region: text('region'),                       // ภาค (เหนือ/อีสาน/กลาง/...)
    lat:    doublePrecision('lat'),               // centroid (geo search fallback)
    lng:    doublePrecision('lng'),
  },
  (t) => [
    index('idx_provinces_name_th').on(t.nameTh),
  ],
)

// ── amphoes (อำเภอ/เขต) ──────────────────────────────────────────────────────────
export const amphoes = pgTable(
  'amphoes',
  {
    id:         integer('id').primaryKey(),       // official amphoe code (4-digit)
    provinceId: integer('province_id')
                  .notNull()
                  .references(() => provinces.id, { onDelete: 'cascade' }),
    nameTh:     text('name_th').notNull(),
    nameEn:     text('name_en'),
    lat:        doublePrecision('lat'),
    lng:        doublePrecision('lng'),
  },
  (t) => [
    index('idx_amphoes_province').on(t.provinceId),
    index('idx_amphoes_name_th').on(t.nameTh),
  ],
)

// ── tambons (ตำบล/แขวง) ──────────────────────────────────────────────────────────
export const tambons = pgTable(
  'tambons',
  {
    id:       integer('id').primaryKey(),         // official tambon code (6-digit)
    amphoeId: integer('amphoe_id')
                .notNull()
                .references(() => amphoes.id, { onDelete: 'cascade' }),
    nameTh:   text('name_th').notNull(),
    nameEn:   text('name_en'),
    lat:      doublePrecision('lat'),
    lng:      doublePrecision('lng'),
    zipcode:  text('zipcode'),                    // GR-9 auto-fill
  },
  (t) => [
    index('idx_tambons_amphoe').on(t.amphoeId),
    index('idx_tambons_zipcode').on(t.zipcode),
    index('idx_tambons_name_th').on(t.nameTh),
  ],
)

export type Province = typeof provinces.$inferSelect
export type NewProvince = typeof provinces.$inferInsert
export type Amphoe = typeof amphoes.$inferSelect
export type NewAmphoe = typeof amphoes.$inferInsert
export type Tambon = typeof tambons.$inferSelect
export type NewTambon = typeof tambons.$inferInsert
