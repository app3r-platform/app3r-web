-- Migration: 0033_d1_otp_codes
-- Phase D-1: otp_codes table สำหรับ POST /auth/otp-request + /auth/otp-verify
--
-- type values: email_verify | phone | 2fa
-- code: 6-digit string (padded with leading zeros)
-- used_at: NULL = not used yet, timestamp = already consumed
-- Rollback: DROP TABLE otp_codes;

CREATE TABLE IF NOT EXISTS "otp_codes" (
  "id"         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"    uuid        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code"       varchar(6)  NOT NULL,
  "type"       varchar(20) NOT NULL DEFAULT 'email_verify',
  "expires_at" timestamptz NOT NULL,
  "used_at"    timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_otp_codes_user_id"
  ON "otp_codes" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_otp_codes_expires_at"
  ON "otp_codes" ("expires_at");

COMMENT ON TABLE "otp_codes"
  IS 'D-1 Phase D Sprint: short-lived 6-digit OTP codes for auth verification';
