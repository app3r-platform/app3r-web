-- Migration: 0009_content_cms.sql
-- Sub-3 Phase D-4: Platform Content CMS (D77)
-- Depends on: users table (Phase D-1)
-- CMD: 362813ec-7277-8145-8148-ddd74c4222d2
-- Schema Plan: 362813ec-7277-81be-b041-e669c1b24b77

CREATE TABLE IF NOT EXISTS "content_pages" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug"         TEXT NOT NULL,
  "type"         TEXT NOT NULL,
  "title"        TEXT NOT NULL,
  "body"         JSONB NOT NULL DEFAULT '{}',
  "status"       TEXT NOT NULL DEFAULT 'draft',
  "version"      INTEGER NOT NULL DEFAULT 1,
  "author_id"    UUID REFERENCES "users" ("id") ON DELETE SET NULL,
  "published_at" TIMESTAMPTZ,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_content_slug" ON "content_pages" ("slug");
CREATE INDEX IF NOT EXISTS "idx_content_slug_status" ON "content_pages" ("slug", "status");
CREATE INDEX IF NOT EXISTS "idx_content_type_status" ON "content_pages" ("type", "status");

CREATE TABLE IF NOT EXISTS "content_images" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "content_page_id" UUID NOT NULL REFERENCES "content_pages" ("id") ON DELETE CASCADE,
  "url"             TEXT NOT NULL,
  "r2_key"          TEXT NOT NULL,
  "alt"             TEXT,
  "caption"         TEXT,
  "order"           INTEGER NOT NULL DEFAULT 0,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_content_images_page" ON "content_images" ("content_page_id");

CREATE TABLE IF NOT EXISTS "content_versions" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "content_page_id" UUID NOT NULL REFERENCES "content_pages" ("id") ON DELETE CASCADE,
  "version"         INTEGER NOT NULL,
  "body"            JSONB NOT NULL,
  "published_at"    TIMESTAMPTZ,
  "author_id"       UUID REFERENCES "users" ("id") ON DELETE SET NULL,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_content_version" ON "content_versions" ("content_page_id", "version");
CREATE INDEX IF NOT EXISTS "idx_content_versions_page" ON "content_versions" ("content_page_id");

-- Rollback:
-- DROP TABLE IF EXISTS "content_versions";
-- DROP TABLE IF EXISTS "content_images";
-- DROP TABLE IF EXISTS "content_pages";
