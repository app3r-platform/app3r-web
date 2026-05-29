-- Migration: 0029_downstream_listing
-- W-Round-1 Wave 1.2 [5]: downstream tables (FK → listing_meta.listing_id)
--
-- Migration order (B2): listing_meta (0027) → domain FK (0028) → downstream (0029) ← นี่
-- Additive only (Eng-2): ตารางใหม่ทั้งหมด · UUID FK จริง (B3-safe)
--
-- Tables (7):
--   D86  : listing_reviews + listing_review_replies   (รีวิว + ตอบกลับ)
--   GR-5 : listing_questions + listing_question_replies (Q&A + visibility/ปิดเมื่อ matched)
--   D82  : moderation_queue + moderation_audit_log     (hybrid moderation + audit)
--   C12  : ads                                          (โฆษณา + ตัด Gold Point D75)
--
-- Rollback:
--   DROP TABLE IF EXISTS "ads" CASCADE;
--   DROP TABLE IF EXISTS "moderation_audit_log" CASCADE;
--   DROP TABLE IF EXISTS "moderation_queue" CASCADE;
--   DROP TABLE IF EXISTS "listing_question_replies" CASCADE;
--   DROP TABLE IF EXISTS "listing_questions" CASCADE;
--   DROP TABLE IF EXISTS "listing_review_replies" CASCADE;
--   DROP TABLE IF EXISTS "listing_reviews" CASCADE;
--
-- Prereq: 0027 (listing_meta) · Branch: feature/backend-wr1-d87-d84 · 2026-05-29

-- ── D86: listing_reviews ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "listing_reviews" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "listing_id"       UUID NOT NULL REFERENCES "listing_meta"("listing_id") ON DELETE CASCADE,
  "reviewer_user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  -- คะแนน 1-5
  "rating"           INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
  "comment"          TEXT,
  -- D82: รีวิวก็ผ่าน moderation ได้ (visible เมื่อ approved/auto)
  "is_visible"       BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 1 review ต่อ (listing, reviewer)
  UNIQUE ("listing_id", "reviewer_user_id")
);
CREATE INDEX IF NOT EXISTS "idx_listing_reviews_listing" ON "listing_reviews" ("listing_id");
CREATE INDEX IF NOT EXISTS "idx_listing_reviews_reviewer" ON "listing_reviews" ("reviewer_user_id");

-- ── D86: listing_review_replies (เจ้าของ listing ตอบรีวิว) ──────────────────────
CREATE TABLE IF NOT EXISTS "listing_review_replies" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "review_id"       UUID NOT NULL REFERENCES "listing_reviews"("id") ON DELETE CASCADE,
  "replier_user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "body"            TEXT NOT NULL,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_listing_review_replies_review" ON "listing_review_replies" ("review_id");

-- ── GR-5: listing_questions (Q&A + visibility) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS "listing_questions" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "listing_id"     UUID NOT NULL REFERENCES "listing_meta"("listing_id") ON DELETE CASCADE,
  "asker_user_id"  UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "body"           TEXT NOT NULL,
  -- GR-5: ปิดเธรดเมื่อ listing matched (ห้ามถามเพิ่ม)
  "is_closed"      BOOLEAN NOT NULL DEFAULT FALSE,
  "is_visible"     BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_listing_questions_listing" ON "listing_questions" ("listing_id");
CREATE INDEX IF NOT EXISTS "idx_listing_questions_asker" ON "listing_questions" ("asker_user_id");

-- ── GR-5: listing_question_replies ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "listing_question_replies" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "question_id"     UUID NOT NULL REFERENCES "listing_questions"("id") ON DELETE CASCADE,
  "replier_user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "body"            TEXT NOT NULL,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_listing_question_replies_question" ON "listing_question_replies" ("question_id");

-- ── D82: moderation_queue (hybrid moderation) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "moderation_queue" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ประเภทเนื้อหา: review | question | reply | listing | ad
  "content_type"     TEXT NOT NULL
                     CHECK ("content_type" IN ('review','question','reply','listing','ad')),
  -- id ของเนื้อหาในตารางต้นทาง
  "content_ref_id"   UUID NOT NULL,
  -- listing ที่เกี่ยว (nullable — บางเนื้อหาไม่ผูก listing)
  "listing_id"       UUID REFERENCES "listing_meta"("listing_id") ON DELETE SET NULL,
  "submitter_user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  -- hybrid: text (auto-approve post-publish) | image | video (เข้าคิวเสมอ)
  "media_type"       TEXT NOT NULL DEFAULT 'text'
                     CHECK ("media_type" IN ('text','image','video')),
  -- pending | approved | rejected | auto_approved | hold
  "status"           TEXT NOT NULL DEFAULT 'pending'
                     CHECK ("status" IN ('pending','approved','rejected','auto_approved','hold')),
  -- เหตุผล hold/reject (ผู้โพสต์ใหม่ → hold)
  "reason"           TEXT,
  "reviewed_by"      UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "reviewed_at"      TIMESTAMPTZ,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_moderation_queue_status" ON "moderation_queue" ("status");
CREATE INDEX IF NOT EXISTS "idx_moderation_queue_content" ON "moderation_queue" ("content_type","content_ref_id");
CREATE INDEX IF NOT EXISTS "idx_moderation_queue_listing" ON "moderation_queue" ("listing_id");

-- ── D82: moderation_audit_log ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "moderation_audit_log" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "queue_id"       UUID REFERENCES "moderation_queue"("id") ON DELETE SET NULL,
  -- submit | approve | reject | auto_approve | hold
  "action"         TEXT NOT NULL
                   CHECK ("action" IN ('submit','approve','reject','auto_approve','hold')),
  "actor_user_id"  UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "note"           TEXT,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_moderation_audit_queue" ON "moderation_audit_log" ("queue_id");

-- ── C12: ads (โฆษณา + ตัด Gold Point D75) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ads" (
  "id"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "advertiser_user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  -- own_listing (ตัด Gold Point) | external_banner (ผ่านฟอร์มติดต่อ)
  "ad_type"            TEXT NOT NULL
                       CHECK ("ad_type" IN ('own_listing','external_banner')),
  -- listing ที่โปรโมท (own_listing) — nullable สำหรับ external_banner
  "listing_id"         UUID REFERENCES "listing_meta"("listing_id") ON DELETE SET NULL,
  -- ตำแหน่ง: home_first_row | module_first_row | sidebar
  "position"           TEXT NOT NULL
                       CHECK ("position" IN ('home_first_row','module_first_row','sidebar')),
  -- external_banner เท่านั้น
  "banner_image"       TEXT,
  "target_url"         TEXT,
  -- Gold Point ที่ตัด (D75 ปัดเต็ม) · point_ledger.reference = 'ad:<id>'
  "gold_cost"          INTEGER NOT NULL DEFAULT 0 CHECK ("gold_cost" >= 0),
  -- จำนวนวันที่ซื้อ (rate/day × days)
  "duration_days"      INTEGER NOT NULL DEFAULT 1 CHECK ("duration_days" >= 1),
  -- pending (รอ admin) | approved | active | rejected | expired
  "status"             TEXT NOT NULL DEFAULT 'pending'
                       CHECK ("status" IN ('pending','approved','active','rejected','expired')),
  "reject_reason"      TEXT,
  "approved_by"        UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "approved_at"        TIMESTAMPTZ,
  "start_date"         TIMESTAMPTZ,
  "end_date"           TIMESTAMPTZ,
  "created_at"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_ads_advertiser" ON "ads" ("advertiser_user_id");
CREATE INDEX IF NOT EXISTS "idx_ads_status" ON "ads" ("status");
-- ดันแถวแรก: query active ads ตามตำแหน่ง
CREATE INDEX IF NOT EXISTS "idx_ads_position_active" ON "ads" ("position","status");
CREATE INDEX IF NOT EXISTS "idx_ads_listing" ON "ads" ("listing_id");
