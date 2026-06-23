-- Migration: 0032_d1_profiles
-- Phase D-1: user_profiles + shop_profiles (B6 canonical schema)
--
-- user_profiles — profile data for all users (GET/PUT /users/me)
-- shop_profiles  — WeeeR service provider profile (GET/PUT /shops/me)
--
-- Both tables use user_id as PK (1:1 with users)
-- Created lazily on first PUT — GET returns defaults if row missing
-- Rollback: DROP TABLE shop_profiles; DROP TABLE user_profiles;

CREATE TABLE IF NOT EXISTS "user_profiles" (
  "user_id"      uuid        PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "display_name" varchar(100),
  "phone"        varchar(20),
  "avatar_url"   text,
  "created_at"   timestamptz NOT NULL DEFAULT now(),
  "updated_at"   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_user_profiles_user_id"
  ON "user_profiles" ("user_id");

CREATE TABLE IF NOT EXISTS "shop_profiles" (
  "user_id"     uuid         PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "shop_name"   varchar(200) NOT NULL DEFAULT '',
  "phone"       varchar(20),
  "address"     text,
  "description" text,
  "created_at"  timestamptz  NOT NULL DEFAULT now(),
  "updated_at"  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_shop_profiles_user_id"
  ON "shop_profiles" ("user_id");

COMMENT ON TABLE "user_profiles"
  IS 'D-1 Phase D Sprint: profile info for all user roles (1:1 with users)';

COMMENT ON TABLE "shop_profiles"
  IS 'D-1 Phase D Sprint: WeeeR service-provider shop info (1:1 with users where role=weeer)';
