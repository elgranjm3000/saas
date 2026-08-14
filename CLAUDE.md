# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Frontend for a multi-tenant ERP system (`erp-frontend`). Next.js 14 (App Router) + TypeScript + Tailwind CSS. UI text, code comments, and docs are written in **Spanish**.

The backend is **Supabase** (Postgres + Auth + Realtime + RLS), not a separate REST service. The database schema lives in the sibling repo `../erp` under `erp/supabase/migrations/` (SQL files `0001`…`0008`). Business logic (stock side-effects, SENIAT taxes, reports) is implemented as Postgres functions/triggers/RPCs in those migrations. There is a legacy FastAPI backend in `../erp` that is being replaced by Supabase.

## Commands

```bash
npm run dev         # start dev server (http://localhost:3000)
npm run build       # production build
npm run start       # serve production build
npm run lint        # next lint
npm run type-check  # tsc --noEmit (type checking without emitting)
```

There is **no test runner configured**. `package.json` has no `test` script and no Jest/Vitest dependency, even though `src/lib/__tests__/errorHandler.test.ts` exists (Jest-style, currently unrunnable — it is the only file that fails `tsc`). Do not claim tests pass — run `npm run type-check` and `npm run build` as the correctness gate.

## Environment

Configured via `.env.local` (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public anon key (safe for the browser)
- `SUPABASE_SERVICE_ROLE_KEY` — **server-only** service role (bypasses RLS; never prefix with `NEXT_PUBLIC_`). Used by `src/lib/supabase/admin.ts` and route handlers.
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` — Google Maps/Places/Geocoding API key

`NEXT_PUBLIC_API_URL` (legacy FastAPI) is still present in `.env.local`/`next.config.js` but no longer used.

## Architecture

### Route groups

`src/app/` uses two route groups:

- `(auth)/` — `/login`, `/register` (no dashboard chrome)
- `(dashboard)/` — every authenticated module, wrapped by `src/app/(dashboard)/layout.tsx` which renders `src/components/DashboardLayout.tsx` (sidebar + header)

Modules live under `(dashboard)/`: `dashboard`, `products`, `invoices` (+ `pos`, `new-usd`), `purchases`, `sales-operations`, `customers`, `suppliers`, `warehouses`, `categories`, `units`, `currencies`, `reports`, `fiscal-reports`, `settings`, `profile`.

### Authentication (Supabase Auth)

Login is **email + password** via Supabase Auth. There is no FastAPI JWT anymore.

- `src/app/(auth)/login/page.tsx` calls `useAuthStore.signIn()` → `supabase.auth.signInWithPassword`.
- `src/app/(auth)/register/page.tsx` POSTs to `src/app/api/auth/register/route.ts`, which uses the service role to create the auth user, call the `register_company` RPC, and set `app_metadata.company_id`.
- `src/middleware.ts` validates the Supabase session (via `createServerClient` + `getUser()`) and redirects unauthenticated users to `/login`.
- `src/store/auth-store.ts` (Zustand, **not persisted**) holds the app `user` (a `public.users` row joined with its `companies` row) and `isAuthenticated`. `loadUser()` rehydrates on mount.

### Multi-tenancy (RLS)

Every table has a `company_id` column and RLS `company_id = current_company_id()`. The tenant identity comes from the Supabase JWT's `app_metadata.company_id` claim (set at registration). A `BEFORE INSERT` trigger (`set_company_id_from_jwt`) auto-populates `company_id` from the JWT, so the frontend does not pass it. See `0002_rls.sql` and `0005_company_id_and_profile.sql`.

### Supabase clients — `src/lib/supabase/`

- `client.ts` — browser client (`createBrowserClient`) for client components.
- `server.ts` — server client (`createServerClient`) using `cookies()`.
- `admin.ts` — service-role client for server-side only (route handlers).

### API layer — `src/lib/api.ts`

This is the canonical data-access layer. It no longer uses Axios; every method is reimplemented over the Supabase client and returns Supabase's `{ data, error }` shape (so existing `const res = await xAPI.y(); res.data` call sites keep working). It exports namespaced objects: `authAPI`, `productsAPI`, `invoicesAPI`, `purchasesAPI`, `suppliersAPI`, `customersAPI`, `categoriesAPI`, `warehousesAPI`, `warehouseProductsAPI`, `unitsAPI`, `currenciesAPI`, `coinsAPI`, `coinHistoryAPI`, `salesOperationsAPI`, `reportsAPI`, etc.

Complex endpoints that are **not yet migrated** throw `[Supabase] "X" aún no está migrado` via the `notMigrated()` helper — grep for `notMigrated(` to find them.

### Realtime

`src/hooks/useRealtime.ts` subscribes to `postgres_changes` and is wired into the dashboard. Tables are added to the `supabase_realtime` publication in migration `0008_realtime.sql`.

### Edge Functions

`bcv-sync` (in `../erp/supabase/functions/bcv-sync/`) scrapes BCV exchange rates and writes them to `daily_rates`. It is invoked by `ratesAPI.syncBCVRates()` and scheduled via `pg_cron` (`0010_bcv_cron.sql`).

### State management — Zustand

Stores in `src/store/`:

- `auth-store.ts` — auth state (Supabase session).
- `currency-store.ts` — currency/rate/conversion/IGTF state (not persisted); async actions call `currenciesAPI` and throw on error.

### Multi-currency domain (Venezuela-specific)

- **USD** is the reference currency (product prices stored in USD); **VES** is the fiscal/payment currency; conversion uses BCV rates.
- **IGTF (3%)** and **IVA (16%)** per transaction. Tax calculations are Postgres functions in `0004_tax_functions.sql`.

Currency UI in `src/components/currencies/`; currency-aware invoice display in `src/components/invoices/`.

### Shared utilities and types

- `src/lib/utils.ts` — `cn`, `formatCurrency`, `formatDate`, `generateSKU`, `debounce`, conversion helpers.
- `src/types/` — domain types; report types are in `src/types/api.ts`.
- Path alias `@/*` → `./src/*`.

## Conventions

- Components: PascalCase; functions: camelCase; files: kebab-case.
- Forms use `react-hook-form` + `zod` (`@hookform/resolvers`). Form components in `src/components/forms/`.
- Charts use `recharts`; icons use `lucide-react`.
- Google Maps components (`src/components/GoogleMaps*.tsx`, `GooglePlacesAutocomplete.tsx`) are wrapped to avoid SSR/hydration errors — render them client-side only.
