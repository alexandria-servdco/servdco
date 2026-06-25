# Final Production Hardening Report — Servd Co

**Date:** June 23, 2026  
**Sprint:** Pre-launch hardening  
**Production:** https://servdco-one.vercel.app

---

## Production Readiness Assessment

**Verdict: READY FOR LAUNCH** after applying pending database migrations and completing Stripe live-key cutover checklist below.

| Gate | Status |
|------|--------|
| `pnpm typecheck` | Pass |
| `pnpm test` | 118/118 pass |
| `pnpm build` | Pass |
| `pnpm lint` | Not configured in repo (no ESLint script) |
| Security E2E | Run after deploy |
| DB migrations | **Apply before launch** (see below) |

---

## 1. Password Reset Production Audit

### Edge cases covered

| Scenario | Behavior |
|----------|----------|
| Valid recovery link | Hash parsed → session established → `/reset-password` ready state |
| Expired link (`otp_expired`) | Hash error detected → clear message → link to login |
| Invalid token / `access_denied` | Invalid state with actionable copy |
| Reused link (post-success) | User signed out immediately after update; new link starts fresh recovery |
| Browser refresh on reset page | `usePasswordRecoverySession` re-validates session with retries |
| Multiple tabs | `storage` event invalidates stale tab after completion |
| Session expiry mid-form | `onAuthStateChange` SIGNED_OUT → invalid state |
| Password / confirm validation | Zod schema + strength meter |
| Network failure | Error alert with session-expired detection |
| Dashboard block | `passwordRecovery` + `sessionStorage` flag + `AuthGuard`/`GuestGuard` |

### Key files

- `client/lib/auth/passwordRecovery.ts` — hash parsing, session flags
- `client/hooks/usePasswordRecoverySession.ts` — validation lifecycle
- `client/pages/ResetPassword.tsx` — sign-out after successful update
- `client/components/Guards.tsx` — blocks all dashboards during recovery

### Supabase config required

Set recovery email redirect URL to:  
`https://servdco-one.vercel.app/reset-password`

---

## 2. Region Launch — Database-Backed Architecture

### Architecture

```
Admin selects city
       ↓
GeoZipService.searchCities() → RPC search_geo_cities (pg_trgm fuzzy)
       ↓
geo_city_zip_codes table (PostgreSQL)
       ↓
RPC geo_zips_for_cities → ZIP auto-populate
       ↓
launch_regions.city + launch_regions.zip_codes (unchanged schema)
```

### Why this approach

- Fast indexed lookups — no runtime geocoding API
- No third-party dependency during admin operations
- Predictable cost at scale
- Expand via CSV import script — engineers never edit TypeScript for new cities

### Migrations (apply to production Supabase)

1. `supabase/migrations/20250623100000_geo_city_zip_codes.sql` — table, indexes, RPCs, RLS
2. `supabase/migrations/20250623100001_geo_city_zip_seed.sql` — 943 seed rows (OH, TX, FL, CA, NY, GA, WA)

```bash
# With SUPABASE_DB_URL in .env.local
npx supabase db push
```

### Expand dataset (any time)

```bash
node scripts/import-geo-zip-csv.mjs path/to/state_city_zip.csv
# CSV columns: state_code,city_name,zip_code
```

### Backward compatibility

- `launch_regions.city` and `launch_regions.zip_codes` text fields unchanged
- Static `zip-codes-by-city-data.ts` kept as offline fallback until migration applied
- Manual ZIP textarea editing still supported

---

## 3. Region Launch QA

| Test | Result |
|------|--------|
| Duplicate city | Blocked with error message |
| Duplicate ZIP | `mergeUniqueZips` dedupes |
| Remove city | ZIPs recomputed from remaining cities |
| Edit ZIPs manually | `sanitizeZipInput` validates 5-digit format |
| Save / cancel / reopen | Parent `AdminDashboard` state unchanged on cancel |
| Empty search | Shows available cities |
| Loading / error states | Spinner + offline fallback message |
| Accessibility | `role="listbox"`, `aria-selected`, focus rings, labels |
| Responsive | Flex-wrap chips, scrollable lists |

---

## 4. Regression Audit

No breaking changes introduced to:

- Auth flows (signup/login/logout/guards)
- Messaging (`MessageBubble` unchanged this sprint)
- Stripe API routes (12-function consolidation preserved)
- Turnstile / security middleware
- RLS policies (new geo table is admin-read only)

---

## 5. Files Changed

| Area | Files |
|------|-------|
| Password reset | `passwordRecovery.ts`, `usePasswordRecoverySession.ts`, `ResetPassword.tsx`, `AuthProvider.tsx`, `Guards.tsx` |
| Geo ZIP DB | `20250623100000_geo_city_zip_codes.sql`, `20250623100001_geo_city_zip_seed.sql` |
| Geo service | `geo-zip.service.ts`, `RegionCityZipEditor.tsx`, `shared/geoZip.ts` |
| Tooling | `generate-geo-zip-seed.mjs`, `import-geo-zip-csv.mjs` |
| Types | `database.types.ts` |
| Tests | `passwordRecovery.test.ts` (6 new tests) |

---

## 6. Stripe — Live Payment Cutover Guide

### Current state (test mode)

You have **test keys** configured. The application is fully wired for Stripe:

- Booking checkout (`/api/stripe/create-checkout-session`)
- Tips checkout (`/api/stripe/tips/create-checkout-session`)
- Premium subscription (`/api/stripe/subscription/checkout-session`)
- Connect onboarding + dashboard (`/api/stripe/connect/*`)
- Webhooks (`/api/stripe/webhook`) — booking, tips, premium, renewals
- Transfers cron (`/api/stripe/transfers/process`)

Phase 5.1 audit previously validated webhooks, notifications, and premium state on Vercel test mode.

### What works today (with test keys)

| Flow | Works? |
|------|--------|
| Family booking checkout | Yes (`cs_test_…`) |
| Chef Connect onboarding | Yes (test Connect accounts) |
| Tips | Yes |
| Premium subscription | Yes (test price) |
| Refunds | Yes |
| Transfer scheduling | Yes |

### Vercel env vars to switch for LIVE payments

Replace test values with live values in **Vercel → Settings → Environment Variables → Production**:

| Variable | Test → Live |
|----------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_…` → **`sk_live_…`** |
| `STRIPE_WEBHOOK_SECRET` | Test webhook secret → **Live webhook secret** from Stripe Dashboard |
| `STRIPE_PREMIUM_PRODUCT_ID` | Test product → **Live Premium product ID** |
| `STRIPE_PREMIUM_PRICE_ID` | Test price → **Live recurring price ID** |
| `ENABLE_STRIPE_CHECKOUT` | `true` |
| `VITE_ENABLE_STRIPE_CHECKOUT` | `true` |
| `CRON_SECRET` | Keep existing (must match Vercel cron auth) |

**Do NOT set** `STRIPE_WEBHOOK_SECRET_LOCAL` in production.

### Stripe Dashboard — live setup checklist

1. **Webhook endpoint** (live mode):  
   `https://servdco-one.vercel.app/api/stripe/webhook`  
   Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`, `account.updated`, `charge.refunded`, etc.

2. **Connect**: Platform already uses Express accounts — ensure live Connect is enabled in Stripe Dashboard.

3. **Products**: Create or confirm live Premium product + monthly price; copy IDs to Vercel.

4. **Test before announcing**: Run one real $1 booking in live mode with a real card, then refund.

### Important live-mode cautions

- Connect accounts created in **test mode cannot be used in live mode** — chefs must re-onboard in live.
- Switch `STRIPE_SECRET_KEY` and webhook secret **together** in one deploy.
- Keep test keys in Preview/staging environments only.

---

## 7. Remaining Recommendations

1. Apply geo + cloudflare migrations on production Supabase
2. Import full US ZIP CSV for nationwide launch (`import-geo-zip-csv.mjs`)
3. Add `pnpm lint` (ESLint) to CI when ready
4. Wire family/cook settings password change forms to `updateUser`
5. Consider Vercel Pro if adding more serverless functions beyond 12

---

## 8. Deploy Steps

```bash
pnpm typecheck && pnpm test && pnpm build
# Apply migrations
npx supabase db push
# Commit + push + vercel deploy --prod
```

Post-deploy smoke test: password reset email, admin region city search, one test booking.
