-- Migration: 0047_b2_platform_revenue
-- B2 Platform Revenue Account · STEP 1/2 (Backend · HUB Gen89 · Advisor ruling 38d813ec-7277-8145)
-- ⚠️ additive · idempotent (ON CONFLICT DO NOTHING) · non-destructive
--
-- Purpose: seed a non-loginable "platform revenue" user + its 'cash' wallet (= revenue pool) so STEP 2
--   (Point) can credit the fee-leg of releaseEscrow/splitEscrow into a real wallet — closing CF1
--   fee-leak (at platform_fee_percent>0 the fee is computed at escrow-service.ts but credited to no
--   wallet → lost from the ledger). SUM(wallets.balance) auto-includes this pool → conservation
--   invariant (buyerRefund + sellerCredit + fee = total) holds against a real account.
--
-- Scope LOCK (HUB Gen89): seed + config ONLY. fee logic (releaseEscrow/splitEscrow/fee-credit) = Point
--   (STEP 2 · NOT touched here). platform_fee_percent stays 0 — CF1-lift is gated behind proof
--   (Advisor only). listing_fee/offer_fee forced-0 logic unchanged (ruling 3).
--
-- Deterministic platform user (constant UUID · resolvable offline by STEP 2 · single global account):
--   id            = 00000000-0000-0000-0000-0000000000fe
--   email         = platform-revenue@system.app3r
--   role          = 'platform'                 (outside Zod login enum weeeu|weeer|weeet|admin)
--   password_hash = '!SYSTEM_NON_LOGINABLE'    (len 21 ≠ 60 → bcrypt.compare returns false → signin 401)
--
-- DEV precheck (2026-06-26 · seed-fresh):
--   • SELECT count(*) FROM users WHERE id    = '00000000-0000-0000-0000-0000000000fe'  = 0 rows ✓
--   • SELECT count(*) FROM users WHERE email = 'platform-revenue@system.app3r'         = 0 rows ✓
--
-- Prereq: 0001 (users/wallets) · 0036 (wallet/point CHECK) · Branch: feature/b2-revenue-be

-- (1) platform revenue user — deterministic UUID · non-loginable (role outside enum + sentinel hash)
INSERT INTO "users" ("id", "email", "password_hash", "role")
VALUES (
  '00000000-0000-0000-0000-0000000000fe',
  'platform-revenue@system.app3r',
  '!SYSTEM_NON_LOGINABLE',
  'platform'
)
ON CONFLICT ("id") DO NOTHING;

-- (2) 'cash' wallet for the platform user (= revenue pool · balance 0 · 'cash' satisfies chk_wallets_point_type)
--     unique idx (user_id, point_type) → ON CONFLICT = idempotent
INSERT INTO "wallets" ("user_id", "point_type", "balance")
VALUES ('00000000-0000-0000-0000-0000000000fe', 'cash', 0)
ON CONFLICT ("user_id", "point_type") DO NOTHING;

-- (3) admin_config keys explicitly 0 (forced-0 · CF1 NOT lifted · ruling 2 single global key · ruling 3)
--     value = jsonb number 0 → getPlatformFeePercent() reads typeof 'number' → 0
INSERT INTO "admin_config" ("key", "value", "description")
VALUES
  ('platform_fee_percent', '0'::jsonb, 'B2 platform fee %. FORCED 0 — CF1-lift gated behind proof (Advisor only).'),
  ('listing_fee',          '0'::jsonb, 'Listing fee (Gold). Forced 0 (ruling 3).'),
  ('offer_fee',            '0'::jsonb, 'Offer fee (Gold). Forced 0 (ruling 3).')
ON CONFLICT ("key") DO NOTHING;

-- ── Rollback (forward-only runner strips below · manual DEV reset only) ──
-- DELETE FROM "wallets"      WHERE "user_id" = '00000000-0000-0000-0000-0000000000fe';
-- DELETE FROM "users"        WHERE "id"      = '00000000-0000-0000-0000-0000000000fe';
-- DELETE FROM "admin_config" WHERE "key" IN ('platform_fee_percent', 'listing_fee', 'offer_fee');
