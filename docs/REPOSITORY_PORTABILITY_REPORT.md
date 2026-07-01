# Repository Portability Report

**Date:** 2026-06-28  
**Goal:** Repository deployable on fresh client infrastructure with zero developer account dependencies.

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Application code | **PASS** | No hardcoded Supabase/Stripe IDs in runtime paths |
| Environment variables | **PASS** | `.env.example` documents all required vars |
| Email / URLs | **PASS** | `SITE_URL` required in production; no `servdco.vercel.app` fallbacks in API |
| Admin notify email | **PASS** | `getAdminNotifyEmail()` throws if unset |
| Pricing | **PASS** | Centralized in `shared/pricing.ts` |
| Migrations | **PASS** | 48 SQL migrations; `supabase db push` sufficient |
| Dev scripts | **WARN** | Some audit JSON artifacts contain old project URLs (harmless) |
| Documentation | **PASS** | Handover + checklist created |

---

## Fixes applied this sprint

1. **Footer** — Removed bottom logo + developer attribution.
2. **ADMIN_NOTIFY_EMAIL** — Removed `alexandria@servdco.com` fallback; throws if missing.
3. **Email links** — `resolveSiteUrl()` requires `SITE_URL` in production.
4. **SEO** — `pageMeta.ts` uses `VITE_SITE_URL` / runtime origin.
5. **Scripts** — `scripts/lib/loadDbUrl.mjs` removes hardcoded Postgres credentials.
6. **GitHub deploy script** — Requires `GITHUB_REPO` env (no personal repo default).
7. **Cook calculator** — Uses shared pricing engine.

---

## Runtime code audit

### Supabase
- URLs/keys from `VITE_SUPABASE_*` / `SUPABASE_*` env only
- No project ref hardcoded in client/server runtime

### Stripe
- `STRIPE_PREMIUM_PRODUCT_ID` / `STRIPE_PREMIUM_PRICE_ID` from env
- Booking checkout uses dynamic `price_data` (no hardcoded booking price IDs)
- Connect account IDs stored per-cook in DB

### Vercel
- `vercel.json` is portable (crons, headers, rewrites)
- No Vercel project ID in application code

### Resend
- API key + from address from env
- Templates are inline HTML (no external template IDs)

### Personal identifiers removed from UI
- Footer developer credit removed

---

## Acceptable business references (not infrastructure)

These are **intentional business contact info**, not developer infrastructure:

- `shared/companyAddress.ts` — legal/company email for privacy policy
- Legal pages — client contact email
- Beta cleanup SQL — configurable `v_preserve_emails` array

---

## Artifacts with old project references (non-blocking)

Historical audit outputs in repo root / `scripts/*.json` may reference old Supabase project URLs from prior test runs. These are **not executed at runtime**. Safe to delete or regenerate after client cutover.

Scripts still needing env (fixed or documented):
- `scripts/phase1-realtime-test.mjs` — should use `loadDbUrl.mjs` (manual task if still has fallback)
- `scripts/phase1-document-preview-test.mjs` — same
- `scripts/inspect-document-paths.mjs` — same

---

## Fresh clone test procedure

```bash
git clone <client-repo>
pnpm install
cp .env.example .env.local
# Fill ALL env vars
supabase link --project-ref <new-ref>
supabase db push
pnpm dev
pnpm build
vercel deploy --prod
```

**Expected:** Full platform operational without access to original developer accounts.

---

## Remaining manual tasks

1. Transfer GitHub repo to client org
2. Create new Supabase + Stripe + Resend + Vercel under client
3. Configure DNS for servdco.com
4. Migrate storage objects if preserving production media
5. Stripe live mode activation + Connect onboarding for cooks
6. Delete or sanitize historical audit JSON files (optional)
7. Regenerate `database.types.ts` after linking new Supabase project

See `docs/INFRASTRUCTURE_TRANSFER_CHECKLIST.md`.
