-- Migration: 0011_testimonials
-- Sub-2 D-4: Testimonials API
-- Master CMD: 363813ec-7277-81ae-94e8-e0e79b492eb6
-- Schema Plan: 363813ec-7277-81dc-ac96-fd41d4fcdabf (T+0.6 APPROVED)
-- Prereq: 0010_contact_messages (must exist)
--
-- status enum: 'draft' | 'published' (OBS-1 resolved — Advisor Gen 49)
--
-- Forward migration

CREATE TABLE IF NOT EXISTS "testimonials" (
  "id"            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"          TEXT        NOT NULL,
  "role"          TEXT        NOT NULL,
  "stars_rating"  SMALLINT    NOT NULL CHECK ("stars_rating" BETWEEN 1 AND 5),
  "text"          TEXT        NOT NULL,
  "avatar"        TEXT        NOT NULL,
  "sort_order"    INTEGER     NOT NULL DEFAULT 0,
  "status"        TEXT        NOT NULL DEFAULT 'draft'
                              CHECK ("status" IN ('draft', 'published')),
  "published_at"  TIMESTAMPTZ NULL,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_testimonials_status_sort"
  ON "testimonials" ("status", "sort_order");

CREATE INDEX IF NOT EXISTS "idx_testimonials_stars"
  ON "testimonials" ("stars_rating");

-- Seed: 4 testimonials จาก Testimonials.tsx (status = 'published' ทันที)
INSERT INTO "testimonials" ("name", "role", "stars_rating", "text", "avatar", "sort_order", "status", "published_at")
VALUES
  (
    'คุณสมหญิง ว.',
    'ลูกค้า WeeeU — กรุงเทพฯ',
    5,
    'ใช้งานง่ายมาก จองช่างได้ทันที ราคาโปร่งใส ประทับใจบริการมาก',
    '👩‍🦱',
    1,
    'published',
    now()
  ),
  (
    'ร้านซ่อมคุณวิชัย',
    'เจ้าของร้านซ่อม WeeeR — เชียงใหม่',
    5,
    'ระบบช่วยจัดการงานซ่อมได้ดีมาก ลูกค้าเพิ่มขึ้นชัดเจน',
    '👨‍🔧',
    2,
    'published',
    now()
  ),
  (
    'ช่างสมชาย ต.',
    'ช่าง WeeeT — นนทบุรี',
    4,
    'แอปใช้งานสะดวก รับงานได้มากขึ้น รายได้ดีขึ้นแน่นอน',
    '👷',
    3,
    'published',
    now()
  ),
  (
    'คุณประภา น.',
    'ผู้ขายเครื่องใช้ไฟฟ้า WeeeU — สมุทรปราการ',
    5,
    'ขายได้เร็วขึ้น ระบบติดตามการซ่อมดีมาก ลูกค้าพอใจ',
    '👩‍💼',
    4,
    'published',
    now()
  )
ON CONFLICT DO NOTHING;

-- ── Rollback (manual) ──────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS "testimonials";
