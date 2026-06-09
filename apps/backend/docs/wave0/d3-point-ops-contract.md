# Wave0 Deliverable #3 — Point Operations Contract

> **Status:** DRAFT — quality gate required before implementation  
> **Canonical reference:** §D R3, D75 rounding rule, Advisor Gen 115  
> **Gold = `point_type 'cash'` · 1 Gold = 1 THB**  
> **Updated 2026-06-09:** Advisor Gen 115 rulings applied — Q1 (IDEMPOTENCY_CONFLICT) confirmed 422; Q2 (missing key) changed to server fallback-generate (see §2, §4, §6, §9)

---

## 1. Point Types

| Type | Column value | Description |
|------|-------------|-------------|
| **Gold** | `cash` | Real money (1 Gold = 1 THB). Can topup, withdraw, pay. |
| **Silver** | `bonus` | Promotional. Can pay for services only (not withdrawable). |

---

## 2. Two-Class Operations (§D R3)

### Class A: Flow-Bound Operations

> Atomic: DB transaction ties **job state transition** + **point ledger write** together.

| Operation | Trigger endpoint | Source | Destination |
|-----------|-----------------|--------|-------------|
| Escrow hold | POST /services/{id}/start | WeeeU wallet | Escrow (held) |
| Release on complete | POST /services/{id}/complete | Escrow | WeeeR/WeeeT wallet |
| Cancel + refund | POST /services/{id}/cancel | Escrow | WeeeU wallet |
| Ad payment | POST /ads (create) | Owner wallet | Platform revenue |
| Ad refund (pro-rata) | POST /ads/{id}/cancel | Platform revenue | Owner wallet |

**Rules:**
- One DB transaction wrapping both `services.status` UPDATE and `point_ledger` INSERT
- Job must be in valid transition state or the entire tx rolls back (no partial state)
- No `Idempotency-Key` header needed — tied to job state (job ID is natural idempotency key)
- D75 rounding applied on settlement amount: `Math.round(rawAmount)`
- `point_rounding_log` row inserted when `rawAmount !== Math.round(rawAmount)`

### Class B: Standalone Wallet Operations

> Independent wallet operations NOT tied to job state.

| Operation | Endpoint | Actor |
|-----------|----------|-------|
| Gold topup | POST /points/topup | User (manual topup) |
| Gold withdraw | POST /points/withdraw | User (payout request) |
| Admin topup | POST /points/topup (initiatedBy:admin) | Admin |
| Transfer approve | POST /transfers/{id}/approve | Admin |

**Rules:**
- Client SHOULD send `Idempotency-Key: <uuid v4>` header — if absent, **server fallback-generates a UUID v4 + logs WARN** (operation proceeds normally; dedup across retries is NOT guaranteed without a client key) _(Advisor Gen 115 ruling — Q2)_
- Server stores key in `idempotency_keys` table with 24h TTL
- Duplicate key + same body → **replay original response (200)** without re-executing
- Duplicate key + different body → **422 IDEMPOTENCY_CONFLICT** — strict, no silent warn _(Advisor Gen 115 ruling — Q1: silent warn = hidden bug that silently double-credits/debits)_
- Key expires after 24h → normal re-processing (new key assumed)

---

## 3. D75 Rounding Rule

**Formula:** `Math.round(rawValue)` — standard half-up rounding

| Raw Value | Rounded | Direction |
|-----------|---------|-----------|
| 50.0 | 50 | (none — no rounding) |
| 50.4 | 50 | down |
| 50.5 | 51 | up |
| 50.7 | 51 | up |
| 100.0 | 100 | (none — no rounding) |

**When applied:**
1. `amountThb` → Gold topup (1 THB = 1 Gold, decimal THB → integer Gold)
2. Ad cost calculation: `Math.round(ratePerDay * days)`
3. Service settlement: `Math.round(servicePointAmount)`

**D75 Rounding Log:** Insert `point_rounding_log` row when `rawValue !== Math.round(rawValue)`:
```typescript
{
  originalValue: "50.70",       // DECIMAL(15,4)
  roundedValue: 51,             // INTEGER
  delta: "0.3000",              // DECIMAL(15,4) = rounded - original
  direction: "up",              // "up" | "down"
  ledgerId: "<uuid>",           // FK → point_ledger
  feeType: "topup",             // "topup" | "withdraw" | "ad_payment" | "settlement"
  app: "backend",               // "weeeu" | "weeer" | "weeet" | "backend"
  formula: "Math.round(amountThb)"
}
```

---

## 4. Idempotency Pattern (Class B)

### Request Flow

```
Client                          Server
  │                               │
  │  POST /points/topup            │
  │  Idempotency-Key: abc-123     ──→ Check idempotency_keys WHERE key = 'abc-123'
  │                               │
  │                               ├─ NOT FOUND → execute operation → store key+response → 200
  │                               │
  │                               ├─ FOUND + same body hash → replay stored response → 200
  │                               │
  │                               └─ FOUND + different body hash → 422 IDEMPOTENCY_CONFLICT
  │                               │
  │                       ←── response

  [Missing header path — Advisor Gen 115 ruling Q2]
  │  POST /points/topup            │
  │  (no Idempotency-Key header)  ──→ Server generates UUID v4 fallback key
  │                               │   + logs WARN: idempotency-key-missing op=topup userId=...
  │                               │   → executes operation normally → stores key+response → 200
  │                               │   ⚠ Retry storms without client key = no dedup protection
  │                       ←── response (identical to normal flow)
```

### Key Requirements

- Format: UUID v4 (`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`)
- Client-generated — server validates format only
- Case-insensitive comparison
- Scope: per user (key collision across users → independent)
- Missing key → **server fallback-generates UUID v4** + logs `WARN idempotency-key-missing op={operation} userId={userId}` — operation proceeds, but dedup across retries is NOT guaranteed without a client key _(Advisor Gen 115 ruling Q2: no 422 rejection)_

### Stored Fields (`idempotency_keys`)

```typescript
{
  key: "abc-123-...",            // client-provided UUID v4
  userId: "uuid",               // FK → users
  operation: "topup",           // topup | withdraw | refund | ad_payment
  requestHash: "sha256hex",     // SHA-256(JSON.stringify(sortedBody))
  responseStatus: 200,          // stored HTTP status
  responseBody: {...},          // stored response JSON
  expiresAt: "2026-06-10T...",  // now() + 24h
  createdAt: "2026-06-09T..."
}
```

### Cleanup

```sql
DELETE FROM idempotency_keys WHERE expires_at < now();
```
Run via cron every 6h.

---

## 5. Point Primitives (`lib/point-service.ts`)

### `creditGold(tx, args)`

```typescript
interface CreditArgs {
  userId: string
  amount: number          // INTEGER — post-D75 rounding
  reference: string       // "topup:manual:{id}" | "repair:{jobId}" | ...
  idempotencyKey: string
  type: 'earn' | 'refund' | 'adjust'
  metadata?: Record<string, unknown>
}
// Returns: balanceAfter (INTEGER)
```

- Inserts `point_ledger` row (direction='credit')
- Updates `wallets.balance += amount` (same tx)
- Throws if `idempotencyKey` already exists in `point_ledger` (UNIQUE constraint)

### `debitGold(tx, args)`

```typescript
interface DebitArgs {
  userId: string
  amount: number          // INTEGER — must be > 0
  reference: string
  idempotencyKey: string
  type: 'spend' | 'hold' | 'adjust'
  metadata?: Record<string, unknown>
}
// Returns: balanceAfter (INTEGER)
// Throws: Error('INSUFFICIENT_GOLD: balance={n}, needed={m}')
```

- Checks `wallets.balance >= amount` (inside tx for row-lock)
- Inserts `point_ledger` row (direction='debit')
- Updates `wallets.balance -= amount`

### `holdGold(tx, args)` — PROPOSED (Wave0)

```typescript
// Reserve Gold for escrow (flow-bound — tied to job start)
// Creates point_ledger row type='hold', direction='debit'
// Updates wallets.balance -= amount
// Caller tracks holdId = ledger row id for release
```

### `releaseHold(tx, holdId, toUserId)` — PROPOSED (Wave0)

```typescript
// Release escrow → credit destination
// Finds hold row, inserts credit row with reference to holdId
// Updates wallets.balance for toUserId
// Atomic with job state transition
```

### `refundGold(tx, args)` — PROPOSED (Wave0)

```typescript
// Reverse a debit (cancellation path)
// Inserts point_ledger row type='refund', direction='credit'
// Optionally linked to original ledger row via reference
```

### `getGoldBalance(tx, userId)` → `number`

- `SELECT balance FROM wallets WHERE userId=? AND pointType='cash'`
- Returns 0 if wallet row not found

### `roundD75(raw: number)` → `integer`

- `return Math.round(raw)`

---

## 6. Error Codes

| Code | HTTP | Trigger |
|------|------|---------|
| `INSUFFICIENT_GOLD` | 400 | Withdraw or Class A debit where balance < amount |
| `IDEMPOTENCY_CONFLICT` | 422 | Same key reused with **different** request body — strict 422, no silent warn _(Advisor Gen 115 Q1 confirmed)_ |
| `INVALID_AMOUNT` | 422 | amountThb ≤ 0 or goldAmount ≤ 0 |
| `WALLET_NOT_FOUND` | 404 | User has no wallet (shouldn't happen — created on signup) |

> **Removed:** `MISSING_IDEMPOTENCY_KEY` (was 422) — per Advisor Gen 115 ruling Q2, missing header → server fallback-generate, not rejection. Error code retired.

---

## 7. Audit Trail

Every point operation leaves an immutable trail:

```
point_ledger (append-only)
  └── point_rounding_log (when D75 rounds)

idempotency_keys (Class B dedup)
  └── links to ledger via responseBody.ledgerRowId
```

Admin can reconstruct any balance at any point in time by SUM-ing `point_ledger` rows.

`wallets.balance` is a **cached aggregate** — always derivable from `point_ledger`.

---

## 8. Transaction Isolation

- All point operations run at **READ COMMITTED** (PostgreSQL default)
- `debitGold` uses `SELECT ... FOR UPDATE` on `wallets` row to prevent race conditions
- Two concurrent debits by same user: one gets the lock, the other waits → sequential
- Deadlock prevention: always acquire wallet lock before inserting ledger (consistent order)

---

## 9. Open Questions for Advisor

1. **holdGold / releaseHold** — should escrow use a separate `escrow_accounts` table (explicit hold balance) vs. wallet balance + in-flight `point_ledger` rows with type='hold'? Recommendation: separate `escrow_holds` table for clarity.
2. **Silver earning** — how is Silver credited? Admin batch job? Campaign completion? Currently only Gold has earn/spend defined.
3. ~~**Idempotency-Key required/optional**~~ — **RESOLVED (Advisor Gen 115 ruling Q2):** missing header → server fallback-generates UUID v4 + logs WARN (no 422 rejection). Client SHOULD still send key for guaranteed retry dedup. ~~Recommendation: require client key for traceability.~~
