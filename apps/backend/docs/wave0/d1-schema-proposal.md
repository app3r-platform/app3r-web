# Wave0 Deliverable #1 — Schema B6 Final DRAFT

> **Status:** DRAFT — quality gate required before running migrations  
> **Base commit:** origin/main (059e588)  
> **Reference:** D-1 branch `feature/backend-d1-auth-points` @ `328af1c` (HOLD)  
> **Canonical:** B6 design (commit `380f0ad`), Advisor Gen 60

---

## 1. Scope

This document defines:
1. The **canonical B6 tables** already in the codebase (migrations 0001–0031)
2. **New tables proposed** from D-1 work: `user_profiles`, `shop_profiles`, `otp_codes`, `idempotency_keys`
3. **Migration spec** for each new table
4. **Index plan** covering all tables
5. **ERD overview** (text-based)

**Constraint:** ❌ Do NOT run migrations until Advisor + HUB quality gate passes.

---

## 2. Canonical B6 Tables (already migrated)

| Table | Migration | Description |
|-------|-----------|-------------|
| `users` | 0001 | Identity — id, email, passwordHash, role, timestamps |
| `refresh_tokens` | 0001 | Auth sessions — token hash, userId, expiresAt, revokedAt |
| `wallets` | 0002 | Balance snapshot per (userId, pointType) — cash \| bonus |
| `point_ledger` | 0002 | Append-only transaction log — D75 integer amounts |
| `point_rounding_log` | 0002 | Audit trail for D75 rounding operations |
| `services` | 0004 | Job/service instances — repair/maintain/resell/scrap |
| `listing_meta` | 0027 | Universal listing id — state/counter/tambon shared |
| `notifications` | (D88) | In-app notification log — multi-channel |

### Core Domains Beyond B6 Canonical

| Table | Migration | Description |
|-------|-----------|-------------|
| `repair_master_data` (7 tables) | 0012 | B4 appliance/fault/worktype/checklist templates |
| `repair_workflow` (8 tables) | 0013 | B3/B3.5/B2.5 workflow instances + state transitions |
| `appliance_master` | 0016 | D92 appliance catalog |
| `repair_part_catalog` | 0018 | WeeeR-level part catalog |
| `inventory_stock_movements` | 0020 | B5 inventory ledger |
| `parts_b2b` | 0021 | D-6 B2B marketplace (parts) |
| `location_master` (3 tables) | 0025 | GR-9 provinces/amphures/tambons |
| `admin_config` | 0026 | D84 platform config |
| `listing_meta` + `listing_engagement` | 0027–0029 | B2 universal listing, D83 state |
| `offers` | 0030 | D61 buyer offers |
| `ads` | 0031 | C12 ad placements |

---

## 3. Proposed New Tables (D-1 → Wave0 Draft)

### 3.1 `user_profiles`

**Purpose:** Store extended user identity data (display name, phone, avatar) separately from `users` table.

**Justification:**
- `users` is identity-critical (email + passwordHash) — keep it lean for auth queries
- Profile data is optional and updated independently of auth operations
- Supports lazy creation pattern: row created on first PUT, not on signup
- Needed by all modules: WeeeU/WeeeR/WeeeT display names in job cards, notifications

**Proposed SQL (migration 0032):**
```sql
CREATE TABLE IF NOT EXISTS "user_profiles" (
  "user_id"      uuid        PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "display_name" varchar(100),
  "phone"        varchar(20),
  "avatar_url"   text,
  "created_at"   timestamptz NOT NULL DEFAULT now(),
  "updated_at"   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_user_profiles_user_id" ON "user_profiles" ("user_id");
```

**Endpoints served:** GET/PUT /api/v1/users/me

---

### 3.2 `shop_profiles`

**Purpose:** Store WeeeR-specific shop information (shop name, address, description).

**Justification:**
- B6 canonical design includes `shops` table — this is the implementation of that concept
- Separate from `user_profiles` because shop data is WeeeR-role-specific (403 for other roles)
- Lazy creation pattern (same as user_profiles): row created on first PUT by WeeeR user
- Required by: job detail views (shop info on service card), repair/maintain flows showing shop contact

**Proposed SQL (migration 0032, same file):**
```sql
CREATE TABLE IF NOT EXISTS "shop_profiles" (
  "user_id"     uuid         PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "shop_name"   varchar(200) NOT NULL DEFAULT '',
  "phone"       varchar(20),
  "address"     text,
  "description" text,
  "created_at"  timestamptz  NOT NULL DEFAULT now(),
  "updated_at"  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_shop_profiles_user_id" ON "shop_profiles" ("user_id");
```

**Endpoints served:** GET/PUT /api/v1/shops/me

---

### 3.3 `otp_codes`

**Purpose:** Store time-limited OTP codes for email verification, password reset, and 2FA.

**Justification:**
- Email verification is required for the WeeeU onboarding flow (confirm account before first job)
- Password reset requires OTP (no magic-link infrastructure)
- `type` column supports multiple OTP purposes without separate tables
- `used_at` guard prevents OTP reuse (idempotency at the row level)
- `expires_at` + index enables efficient cleanup of expired codes

**Proposed SQL (migration 0033):**
```sql
CREATE TABLE IF NOT EXISTS "otp_codes" (
  "id"         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"    uuid        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code"       varchar(6)  NOT NULL,
  "type"       varchar(20) NOT NULL DEFAULT 'email_verify',
  "expires_at" timestamptz NOT NULL,
  "used_at"    timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_otp_codes_user_id" ON "otp_codes" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_otp_codes_expires_at" ON "otp_codes" ("expires_at");
```

**OTP types:**
- `email_verify` — verify email on signup
- `password_reset` — initiate password reset
- `phone_verify` — future: verify phone number

**TTL:** 10 minutes. Cleanup job should DELETE WHERE expires_at < now() - INTERVAL '1 hour'

**Endpoints served:** POST /api/v1/auth/otp-request, POST /api/v1/auth/otp-verify

---

### 3.4 `idempotency_keys`

**Purpose:** Server-side idempotency store for standalone wallet operations (topup, withdraw, refund).

**Justification:**
- §D R3 (2-class point operations) requires standalone wallet ops to be idempotent
- Client sends `Idempotency-Key: <uuid v4>` header; server stores result for 24h TTL
- Without this table: duplicate requests from retry storms or network errors cause double-credits
- Covers: topup, withdraw, any future payment callback
- `response_body` JSONB allows replaying the original response exactly

**Proposed SQL (migration 0034):**
```sql
CREATE TABLE IF NOT EXISTS "idempotency_keys" (
  "id"             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "key"            varchar(255) NOT NULL UNIQUE,
  "user_id"        uuid        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "operation"      varchar(50) NOT NULL,
  "request_hash"   varchar(64),
  "response_status" integer    NOT NULL DEFAULT 200,
  "response_body"  jsonb       NOT NULL DEFAULT '{}',
  "expires_at"     timestamptz NOT NULL DEFAULT now() + INTERVAL '24 hours',
  "created_at"     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_idempotency_keys_key" ON "idempotency_keys" ("key");
CREATE INDEX IF NOT EXISTS "idx_idempotency_keys_user_id" ON "idempotency_keys" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_idempotency_keys_expires_at" ON "idempotency_keys" ("expires_at");
```

**Columns:**
- `key` — client-provided UUID v4
- `operation` — `topup` \| `withdraw` \| `refund` \| `ad_payment`
- `request_hash` — SHA-256 of request body (detect key reuse with different body)
- `response_body` — stored response replayed on duplicate
- `expires_at` — 24h TTL; cleanup job DELETE WHERE expires_at < now()

**Endpoints served:** POST /api/v1/points/topup, POST /api/v1/points/withdraw, future payment callbacks

---

## 4. Migration Spec

| Migration | File | Tables Created |
|-----------|------|----------------|
| 0032 | `0032_d1_profiles.sql` | `user_profiles`, `shop_profiles` |
| 0033 | `0033_d1_otp_codes.sql` | `otp_codes` |
| 0034 | `0034_wave0_idempotency.sql` | `idempotency_keys` |

**Migration 0032 note:** Both profile tables are in the same migration since they share the lifecycle (both profile types, both lazy-created, both in the same API file).

**Run order:** 0032 → 0033 → 0034 (sequential, no parallel deps)

**Pre-migration checklist:**
1. Advisor + HUB quality gate on Wave0 complete
2. Test DB (app3r_dev :5433) running: `docker ps | grep app3r_d1_postgres`
3. Full backup of app3r_dev via `pg_dump`
4. Run: `pnpm --filter @app3r/backend migrate` (uses migrate-all.ts with `_migration_log` idempotency)

---

## 5. Index Plan

### New tables

| Table | Index | Columns | Rationale |
|-------|-------|---------|-----------|
| user_profiles | idx_user_profiles_user_id | user_id | PK lookup, but helps FK joins |
| shop_profiles | idx_shop_profiles_user_id | user_id | PK lookup |
| otp_codes | idx_otp_codes_user_id | user_id | Filter by user for verify operation |
| otp_codes | idx_otp_codes_expires_at | expires_at | Cleanup job + TTL filter |
| idempotency_keys | idx_idempotency_keys_key | key (UNIQUE) | Primary lookup by client key |
| idempotency_keys | idx_idempotency_keys_user_id | user_id | Admin ops, user-scoped queries |
| idempotency_keys | idx_idempotency_keys_expires_at | expires_at | Cleanup job |

### Existing critical indexes (already migrated)

| Table | Index | Columns |
|-------|-------|---------|
| wallets | idx_wallets_user_point_type (UNIQUE) | userId, pointType |
| point_ledger | idx_point_ledger_idempotency (UNIQUE) | idempotencyKey, pointType |
| point_ledger | idx_point_ledger_user_point_type | userId, pointType |
| listing_meta | idx_listing_meta_type + idx_listing_meta_state | listingType, state |
| services | idx_services_type + idx_services_status | serviceType, status |

---

## 6. ERD Overview (Text)

```
users (1) ─────────────────────────────────────────────────────────────────────┐
  │                                                                             │
  ├─(1:1)── user_profiles (display_name, phone, avatar_url)                   │
  ├─(1:1)── shop_profiles  [WeeeR only] (shop_name, phone, address)           │
  ├─(1:N)── otp_codes      (code, type, expires_at, used_at)                 │
  ├─(1:N)── idempotency_keys (key UNIQUE, operation, response_body)           │
  ├─(1:N)── wallets         (point_type UNIQUE per user, balance)             │
  ├─(1:N)── point_ledger    (type, point_type, amount, direction, balance_after) │
  │           │                                                                 │
  │           └─(1:N)── point_rounding_log (original_value, rounded_value)    │
  ├─(1:N)── refresh_tokens  (token_hash, expires_at, revoked_at)              │
  ├─(1:N)── services        (service_type, status, title, point_amount)        │
  │           │                                                                 │
  │           └─(0:1)── listing_meta  (listing_type, state, view_count)        │
  │                       │                                                     │
  │                       ├─(1:N)── offers (buyer, price, status)             │
  │                       └─(1:N)── ads    (placement, start_date, end_date)   │
  └─(1:N)── notifications  (recipient_app, type, title, channel)              │
```

---

## 7. Drizzle Schema Files (proposed)

Source location: `apps/backend/src/db/schema/`

| File | Table | Status |
|------|-------|--------|
| `user-profiles.ts` | user_profiles | NEW (from d1 branch) |
| `shop-profiles.ts` | shop_profiles | NEW (from d1 branch) |
| `otp-codes.ts` | otp_codes | NEW (from d1 branch) |
| `idempotency-keys.ts` | idempotency_keys | PROPOSED (Wave0 new) |

All new files export via `schema/index.ts`.

---

## 8. Open Questions for Advisor Review

1. **idempotency_keys.request_hash** — Should we enforce SHA-256 mismatch = 422 (reject reuse with different body), or warn-only (log + replay original response)?
2. **otp_codes.type** — Enum or varchar? Current: varchar(20). If enum, add pgEnum to migration. Recommendation: varchar for extensibility.
3. **shop_profiles consolidation** — Should `shop_profiles` merge into a future `shops` table (with multiple WeeeR technicians per shop)? Current proposal: 1:1 with users (simple). Flag for Phase D review.
4. **idempotency TTL** — 24h is standard. Should topup use shorter TTL (e.g., 1h) to reduce table size?
