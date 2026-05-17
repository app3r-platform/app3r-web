-- Migration: 0010_contact_messages.sql
-- Sub-4 D78: Contact Info + Form
-- Depends on: users table (Phase D-1)
-- Schema Plan: 363813ec-7277-81c2-b7b4-d9111d0b3427
-- Master CMD:  363813ec-7277-813c-ba73-e56b9695d828 (v4.2)
-- ⚠️  0009 = Sub-3 CMS — do NOT reorder

-- ── Table A: contact_messages (13 columns) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "contact_messages" (
  "id"          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "category"    TEXT        NOT NULL,                      -- ContactCategory: 8 values (D78)
  "name"        TEXT        NOT NULL,
  "email"       TEXT        NOT NULL,
  "phone"       TEXT,                                      -- optional
  "subject"     TEXT        NOT NULL,
  "body"        TEXT        NOT NULL,
  "status"      TEXT        NOT NULL DEFAULT 'new',        -- new|read|replied|closed
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "replied_at"  TIMESTAMPTZ,
  "replied_by"  UUID        REFERENCES "users" ("id") ON DELETE SET NULL,
  "deleted_at"  TIMESTAMPTZ                               -- soft delete: NULL = active
);
CREATE INDEX IF NOT EXISTS "idx_contact_status_created"   ON "contact_messages" ("status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_contact_category_status"  ON "contact_messages" ("category", "status");

-- ── Table B: contact_info (singleton JSONB) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS "contact_info" (
  "id"          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "key"         TEXT        NOT NULL UNIQUE DEFAULT 'platform',  -- enforce singleton
  "data"        JSONB       NOT NULL,                            -- ContactInfoDto
  "updated_by"  UUID        REFERENCES "users" ("id") ON DELETE SET NULL,
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Seed: D78-shaped placeholder (GAP-5 transparency) ────────────────────────
-- Static C-4.2 diverged from D78 structure → seed = best-effort map + TBD fields
-- Admin Editor สามารถแก้ข้อมูลจริงผ่าน PUT /api/admin/contact-info ภายหลัง
INSERT INTO "contact_info" ("key", "data", "updated_at")
VALUES (
  'platform',
  '{
    "companyName": "App3R Co., Ltd. (TBD)",
    "address": {
      "street":     "TBD",
      "district":   "TBD",
      "province":   "กรุงเทพมหานคร",
      "postalCode": "10000",
      "country":    "Thailand"
    },
    "phones": [
      { "label": "หลัก", "number": "02-XXX-XXXX" }
    ],
    "emails": [
      { "label": "ทั่วไป",     "address": "support@app3r.co.th" }
    ],
    "socials": [
      { "platform": "line", "handle": "@app3r", "url": "" }
    ],
    "businessHours": {
      "weekdays": "จันทร์–ศุกร์ 09:00–18:00 น."
    },
    "mapEmbedUrl": null,
    "updatedAt": "2026-05-17T00:00:00.000Z"
  }'::jsonb,
  NOW()
)
ON CONFLICT ("key") DO NOTHING;

-- ── Rollback ──────────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS "contact_messages";
-- DROP TABLE IF EXISTS "contact_info";
