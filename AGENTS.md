<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SirkulasiIn — agent notes

Circular-economy marketplace + AI waste scan. **App Router only**, Indonesian UI (`lang="id"`).

## Commands

- Package manager: **npm** (`package-lock.json`)
- `npm run dev` — Next dev server
- `npm run build` — production build (best full verification)
- `npm run lint` — ESLint only (`eslint`, flat config)
- Typecheck: `npx tsc --noEmit` (no dedicated script)
- **No test suite** / no test runner in `package.json`

## Stack quirks

- **Next 16.2** + **React 19** + **Tailwind v4** via `@tailwindcss/postcss` (`@import "tailwindcss"` in `app/globals.css`). Do not assume Tailwind v3 config files.
- Path alias: `@/*` → repo root.
- Tunneling: `next.config.ts` allows `*.trycloudflare.com` / `*.ngrok*` for dev + Server Actions.
- `next/image` remote hosts: Google avatars + project Supabase storage only — add host before new remote images.
- No `middleware.ts`. Session via `@supabase/ssr` cookie clients.

## Layout & ownership

| Area | Role |
|------|------|
| `app/` | Routes, UI, route handlers |
| `app/actions/` | `"use server"` mutations (auth, listings, checkout, barter, wtb, shipping, payout, follow) |
| `app/api/` | HTTP/webhooks (Midtrans, IRIS, Biteship, scan/AI, shipping, chat, etc.) |
| `lib/` | Integrations + clients (do not re-create ad-hoc clients in pages) |
| `supabase/*.sql` | Schema/RPC — **manual** run in Supabase SQL Editor (not auto-migrated by app) |
| `docs/biteship-setup.md` | Biteship env, area_id, webhook, smoke tests |
| `Design.MD` + `app/globals.css` | Brand tokens (primary `#27AE60`, Plus Jakarta Sans, large radii) |

### Supabase clients (pick the right one)

- Browser: `createClient()` from `lib/supabase.ts`
- Server Components / Server Actions: `await createServerSupabaseClient()` from `lib/supabase-server.ts`
- Service role (webhooks, Midtrans sync, bypass RLS): `createAdminSupabaseClient()` from `lib/supabase-admin.ts` — never ship this to the client

### Domain flow agents miss

- Checkout places orders via Supabase RPC **`rpc_place_order`** then Midtrans Snap (`lib/midtrans.ts`). Payment ref: `SIRK-{orderId}`. Expiry: 60 minutes.
- WTB (Want-To-Buy): public request board (`?tab=dicari` di `/marketplace`, routes `/wtb/*`). Seller submits ad-hoc offer → poster accepts → checkout via RPC **`rpc_place_wtb_order`** (`app/actions/wtb.ts`). Orders from WTB have `listing_id = NULL` + `wtb_offer_id` set — always handle both sources when touching `orders`. Payment fail/expire reopens the WTB (`releaseOrderSource` in `lib/midtrans.ts`).
- Escrow / payout: Midtrans + **IRIS** (`lib/iris.ts`, `app/actions/payout.ts`). Payout operator allowlist: `PAYOUT_ADMIN_EMAILS` (`lib/admin.ts`). App admin UI gate: `profiles.role === "admin"`.
- Shipping: **Biteship** primary (`lib/biteship.ts`). `SHIPPING_USE_MOCK=1` forces mock rates when balance/API fails. RajaOngkir still in `lib/rajaongkir.ts` for older paths.
- Scan/upcycle AI: `lib/ai.ts` (`AI_API_*` env).
- `rpc_place_order` is **redefined** across several SQL files; later migrations must match the current call site in `app/actions/checkout.ts` (includes Biteship area/postal snapshot args).

## SQL migrations

Apply in Supabase SQL Editor when schema is missing. README lists a short core set; full set lives under `supabase/` (many feature migrations). Prefer the **latest** definition of a function/table when files conflict — re-read the SQL that last `CREATE OR REPLACE`s the object you touch.

Core order from README (if greenfield):

1. `checkout_migration.sql`
2. `midtrans_escrow_migration.sql`
3. `payouts_migration.sql`
4. `listing_sale_source_migration.sql`
5. `barter_lifecycle_migration.sql`

Plus feature files as needed (`biteship_*`, `chat_*`, `points_*`, `admin_*`, `wtb_migration.sql`, etc.).

## Env (`.env.local`, gitignored)

Required for real flows (names only):

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Site URL (auth redirect / Midtrans return): `NEXT_PUBLIC_SITE_URL` (defaults to `http://localhost:3000`)
- Midtrans: `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION`, `MIDTRANS_IRIS_API_KEY`
- Biteship: `BITESHIP_*` (see `docs/biteship-setup.md`)
- Optional: `AI_API_*`, `RAJAONGKIR_API_KEY`, `PAYOUT_ADMIN_EMAILS`, `SHIPPING_USE_MOCK`

Never commit secrets. Do not log service-role or payment keys.

## Code conventions (this repo)

- **RSC first.** `"use client"` only on interactive leaf components.
- Prefer Server Actions for mutations; route handlers for webhooks/third-party HTTP and client-fetch APIs.
- Avoid derived state in `useState`; minimize `useEffect` for data loading (fetch on server).
- Match existing style: short, pragmatic TS; no placeholder stubs.
- UI copy and user-facing errors are mostly **Indonesian**.
- Design tokens live in CSS variables (`--color-primary`, `--radius-*`); prefer them over one-off hex in new UI.

## Verify before claiming done

1. `npm run lint`
2. `npx tsc --noEmit` (or `npm run build` if touching routing/env-sensitive paths)
3. For payment/shipping/SQL changes: confirm env + matching Supabase RPC/columns exist — app will fail at runtime otherwise.
