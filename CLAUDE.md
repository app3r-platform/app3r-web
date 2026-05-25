# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

pnpm + Turborepo workspace. Multiple Next.js apps share two internal packages:

```
apps/
  weeer/          ← WeeeR (ร้านค้า/บริษัท) — port 3001 — PRIMARY scope
  admin/          ← Admin portal
  weeeu/          ← WeeeU (ลูกค้า)
  weeet/          ← WeeeT (ช่าง)
  app3r/          ← App3R (Website/landing)
packages/
  shared/         ← @app3r/shared — DAL types, IWeeerDAL interface
  ui/             ← @app3r/ui — shared React components
e2e/              ← Playwright API-level E2E tests (no browser)
  weeer/
  parts-b2b/
  shared/
```

**File ownership rule**: When working on WeeeR, only touch `apps/weeer/`. Never touch `apps/app3r/` or other apps. Mock data must be copied inline — no cross-app imports.

## Commands

All commands run from repo root unless noted.

```bash
# Dev (all apps)
pnpm dev

# Dev (WeeeR only — port 3001)
pnpm dev:weeer

# Build (WeeeR only)
pnpm --filter weeer build

# Lint
pnpm --filter weeer lint

# Unit tests (from apps/weeer/)
pnpm --filter weeer test
pnpm --filter weeer test:watch
pnpm --filter weeer test -- --testPathPattern=<filename>   # single file
pnpm --filter weeer test:coverage

# E2E tests (Playwright API-level, from repo root)
pnpm e2e
pnpm e2e:report
```

**Backend**: Next.js rewrites all `/api/*` to `http://localhost:8000`. Backend must be running separately.

## WeeeR App Architecture (`apps/weeer/`)

### Route Groups

- `app/(auth)/` — Login, register, signup, upload-documents. No sidebar.
- `app/(app)/` — All authenticated screens. Sidebar + header in `(app)/layout.tsx`.
- Root `app/page.tsx` redirects to `/login`.

### Data Layer (DAL) — Feature-Flag Pattern

`lib/dal/index.ts` exports `getAdapter()` which returns a per-module composite adapter:

- All `NEXT_PUBLIC_USE_API_*` flags OFF (default) → `weeerLocalStorageAdapter` (localStorage, no backend needed)
- Flag `NEXT_PUBLIC_USE_API_PARTS=true` → `weeerApiAdapter.parts` for that module, rest stay on localStorage
- Set flags in `.env.local` per-module as backend endpoints become ready

The DAL interface `IWeeerDAL` is defined in `packages/shared/dal/index.ts`.

### API Client

`lib/api-client.ts` — `apiFetch()` wraps `fetch` with auth:
- **Dev**: calls `/api/v1/_dev/get-test-token` via `lib/dev-auth.ts`, caches token in-memory
- **Prod**: reads `localStorage.getItem("access_token")`
- Helpers: `apiGet<T>`, `apiPost<T>`, `apiPatch<T>` return `Result<T>` from `@app3r/dal`

**Parts B2B** has its own inline `apiFetch` in `app/(app)/parts/_lib/api.ts` (legacy — predates the shared client).

`lib/parts-api.ts` is the newer unified parts API used by orders, dispute, and rating flows.

### Module Structure

Each feature module lives in `app/(app)/<module>/`. Some modules have a sub-layout (`layout.tsx`) and a `_lib/` folder with local types, API, and mock data.

Notable modules:
- `parts/` — B2B marketplace; has sub-layout with `ShopIdSwitcher`, tabs (marketplace / ขายของฉัน / คำสั่งซื้อ)
- `listings/repair/` and `listings/maintain/` — WeeeR sees full sensitive job fields (D4); list pages filter by `registeredServiceTypes` by default (D5)
- `wallet/` — Silver points transactions
- `services/` — Shop service catalog

### Server vs Client Components

- **Detail pages** (`listings/repair/[id]`, `listings/maintain/[id]`) are **async Server Components**. `params` type is `Promise<{id: string}>` (Next.js 15).
- Session check in Server Components uses `getMockWeeeRSession()` from `lib/mock-data/weeer-profile.ts`. Unauthorized → `redirect("/login?reason=weeer-required&from=...")`.
- Client Components that need `onClick` / state must be extracted as separate files with `"use client"` (e.g. `listings/_components/AcceptJobButton.tsx`).

### Mock Data

`lib/mock-data/` holds all Phase D placeholder data:
- `weeer-profile.ts` — `MOCK_WEEER_PROFILE` (registeredServiceTypes: [1,2]), `getMockWeeeRSession()`
- `repair-jobs.ts` — 12 jobs, `getRepairJobById()`
- `maintain-jobs.ts` — 8 jobs (all serviceType:1 on-site), `getMaintainJobById()`
- `shops.ts`, `weeet-list.ts` — used by parts and staff modules

**Sensitive fields** (`problemDescription`, `photos`, `estimatedBudget`, `feePreview`, `customerName`, `customerPhone`) are in mock only — not yet in backend DB schema. Never call real backend for these.

### Types

- `lib/types/listings-jobs.ts` — `ServiceTypeId` (1=on-site, 2=รับ-ส่ง, 3=walk-in, 4=พัสดุ), `WeeeRJobListing`
- `app/(app)/parts/_lib/types.ts` — local Part, StockMovement types (legacy)
- `lib/parts-api.ts` — newer Part, PartsOrderDto, etc. (SOURCE-OF-TRUTH = backend `apps/backend/src/types/parts-b2b.ts`)

## Testing

### Unit Tests

Located in `apps/weeer/tests/unit/`. Jest with SWC transformer + jsdom.

Test files match `<rootDir>/tests/**/*.test.{ts,tsx}`. Path alias `@/*` maps to project root (no `src/` folder).

Coverage collected from `components/**` and `lib/**` (60% lines/functions/statements, 50% branches threshold).

### E2E Tests

`e2e/weeer/` — Playwright API-level tests. Use `APIRequestContext` directly (no browser). Page Object Model pattern in `e2e/weeer/pages/`. Backend must be running at `http://localhost:8787` (or set `API_BASE_URL`).

## Dev Auth Bypass

`lib/dev-auth.ts` fetches a test JWT from `POST /api/v1/_dev/get-test-token` in development. The token is cached per session. **Remove before production.**

Backend must run with `DEV_AUTH_BYPASS=true` for this to work.

## Git Branch Convention

Each Sub-CMD uses a dedicated branch from `main` HEAD (not from previous feature branches):

- `phase-d-4/<chat>` — Phase D-4 feature branches
- `sub-4-d78/<chat>` — Sub-4 D78 contact feature branches

Branch naming from HUB Forward CMD. Always verify base commit matches CMD spec (`git log --oneline -1`). Push with `git push -u origin <branch>` — local commit alone is not DONE.

## Environment Variables

Set in `apps/weeer/.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=          # empty = relative (uses Next.js rewrite to :8000)
NEXT_PUBLIC_USE_API_AUTH=false
NEXT_PUBLIC_USE_API_PARTS=false
NEXT_PUBLIC_USE_API_REPAIR=false
NEXT_PUBLIC_USE_API_MAINTAIN=false
NEXT_PUBLIC_USE_API_SCRAP=false
NEXT_PUBLIC_USE_API_RESELL=false
NEXT_PUBLIC_USE_API_POINTS=false
NEXT_PUBLIC_USE_API_OFFER=false
```
