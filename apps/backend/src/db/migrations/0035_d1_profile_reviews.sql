-- Migration: 0035_d1_profile_reviews
-- DB-phase D1 (Gen 122 · R3/R4)
--
-- profile_reviews = POST-TRANSACTION review of a PERSON/SHOP (counterparty · canon Gen 121).
-- NEW table (NOT extend listing_reviews · precedent parts_ratings).
--   listing_reviews (D86) = listing-scoped → coexists, untouched.
--   profile_reviews        = profile-scoped (reviewee user/shop after a completed transaction).
-- Anchor = listing_meta universal id (R4). Eligibility gate: anchor state='completed'
--   (= escrow released event) — enforced app-layer at write (D2+), not a DB constraint.
--   2-way buyer↔seller via reviewer+reviewee. unique(listing,reviewer,reviewee).
--
-- Rollback: DROP TABLE IF EXISTS "profile_reviews";
-- Prereq: 0001 (users) · 0027 (listing_meta) · Branch: feature/db-d1-core-schema

CREATE TABLE IF NOT EXISTS "profile_reviews" (
  "id"               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "listing_id"       uuid        NOT NULL REFERENCES "listing_meta"("listing_id") ON DELETE CASCADE,
  "reviewer_user_id" uuid        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "reviewee_user_id" uuid        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "rating"           integer     NOT NULL,
  "comment"          text,
  "is_visible"       boolean     NOT NULL DEFAULT true,
  "created_at"       timestamptz NOT NULL DEFAULT now(),
  "updated_at"       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "profile_reviews_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5),
  CONSTRAINT "profile_reviews_listing_reviewer_reviewee_key" UNIQUE ("listing_id", "reviewer_user_id", "reviewee_user_id")
);

CREATE INDEX IF NOT EXISTS "idx_profile_reviews_listing"  ON "profile_reviews" ("listing_id");
CREATE INDEX IF NOT EXISTS "idx_profile_reviews_reviewer" ON "profile_reviews" ("reviewer_user_id");
CREATE INDEX IF NOT EXISTS "idx_profile_reviews_reviewee" ON "profile_reviews" ("reviewee_user_id");

COMMENT ON TABLE "profile_reviews"
  IS 'D1 Gen122 R3/R4: post-transaction profile review (reviewee person/shop). Anchor=listing_meta · gate state=completed (app-layer). 2-way buyer<->seller.';
