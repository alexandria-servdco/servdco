# ServdCo — Deployment & Environment Domain Audit

**Audit date:** 2026-07-02  
**Status:** COMPLETE — no hardcoded deployment URLs remain in runtime application code

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8080` (Vite) + `http://localhost:3000` (API proxy) |
| Vercel Preview | Auto — `VERCEL_URL` / `window.location.origin` |
| Current Vercel Production | `https://servdco.vercel.app` |
| Future Production Domain | `https://servdco.com` |

---

## 1. Runtime URL Resolution (how the app works)

### Backend (`api/`)

| Function | File | Resolution order |
|----------|------|------------------|
| `resolveSiteUrl()` | `api/_lib/email/brandedTemplate.ts` | `SITE_URL` → `APP_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → `VERCEL_URL` → dev/preview fallback `http://localhost:8080` |

Used by: all transactional emails, signup confirmation redirects, webhook-triggered email CTAs, booking event emails, document verification emails.

### Frontend (`client/`)

| Function | File | Resolution order |
|----------|------|------------------|
| SEO / canonical / OG | `client/lib/seo/pageMeta.ts` | `VITE_SITE_URL` → `VITE_APP_URL` → `window.location.origin` |
| Stripe Checkout | `BookingOperationalPanel`, `TipPrompt`, `ChefDashboard` | `window.location.origin` + path |
| Stripe Connect | `useStripeConnect.ts` | `window.location.origin` + query params |
| Password reset | `auth.service.ts` | `window.location.origin/reset-password` |
| OAuth | `client/lib/auth/oauth.ts` | `window.location.origin/auth/callback` |

### Build-time SEO (not runtime)

| Artifact | Generator | Env vars |
|----------|-----------|----------|
| `public/sitemap.xml` | `scripts/generate-seo-files.mjs` | `VITE_SITE_URL` → `SITE_URL` → `VERCEL_URL` |
| `public/robots.txt` | same | same |
| Runs before | `pnpm build` | Set in Vercel per environment |

---

## 2. Stripe URL Audit — PASS

All Stripe redirect URLs are **client-supplied** from `window.location.origin`:

| Flow | success_url / cancel_url / return_url | Source |
|------|---------------------------------------|--------|
| Booking checkout | `/family-dashboard/bookings?...` | `BookingOperationalPanel.tsx` |
| Tips | `/dashboard/bookings?tip=...` | `TipPrompt.tsx` |
| Premium subscription | `/chef-dashboard/premium?...` | `ChefDashboard.tsx` |
| Connect onboarding | `?connect=return` / `?connect=refresh` | `useStripeConnect.ts` |
| API handlers | Pass-through only | `api/_lib/stripe/checkout.ts`, `connect.ts`, `tips.ts`, `subscription.ts` |

Webhook endpoint path is `/api/stripe/webhook` (relative — configured in Stripe Dashboard per deployment).

Cron: `/api/stripe/transfers/process` — relative in `vercel.json`, no hostname.

---

## 3. Email & Notifications — PASS

| Email | Link source |
|-------|-------------|
| Signup confirmation | `resolveSiteUrl()` |
| Booking payment success (webhook) | `resolveSiteUrl()` |
| Document verification | `resolveSiteUrl()` |
| Career application | `resolveSiteUrl()` |
| Branded footer link | `resolveSiteUrl()` (display text "servdco.com" is brand label only) |

In-app notifications: metadata only — no hardcoded external URLs in notification payloads.

---

## 4. Hardcoded URLs Removed (this audit)

| File | Was | Now |
|------|-----|-----|
| `index.html` | `canonical` + `og:url` → `servdco-one.vercel.app` | Removed — set at runtime by `PageMetaManager` |
| `public/sitemap.xml` | Static `servdco-one.vercel.app` | Build-generated from `VITE_SITE_URL` |
| `public/robots.txt` | Static sitemap URL | Build-generated |
| `scripts/*.mjs` (16 files) | Default `https://servdco-one.vercel.app` | `scripts/lib/resolve-base-url.mjs` — requires argv or `SITE_URL` |

---

## 5. URLs Converted to Dynamic

- All Stripe checkout / Connect / subscription URLs → `window.location.origin`
- All backend email links → `resolveSiteUrl()` (env-driven)
- SPA canonical / OpenGraph / Twitter → `pageMeta.ts` (env + origin)
- Verification scripts → `SITE_URL` / `SMOKE_BASE_URL` / CLI arg

---

## 6. Classified Occurrences (full inventory)

### OK — intentional, not deployment-dependent

| Location | URL / pattern | Classification |
|----------|---------------|----------------|
| `vite.config.ts` | `localhost:3000` proxy | OK — dev only |
| `brandedTemplate.ts` | `localhost:8080` fallback | OK — dev/preview only |
| `api/_lib/email/resend.ts` | `api.resend.com` | OK — external API |
| `api/_lib/turnstile.ts` | `challenges.cloudflare.com` | OK — external API |
| `client/lib/analytics.ts` | `googletagmanager.com` | OK — external API |
| Social links in `Footer.tsx` | instagram.com, facebook.com, etc. | OK — external |
| Unsplash CDN images | `images.unsplash.com` | OK — external CDN |
| `shared/companyAddress.ts` | bing.com maps | OK — external |
| Email addresses | `hello@servdco.com`, `alexandria@servdco.com` | OK — email domain, not app URL |
| `shared/validation.test.ts` | `https://servdco.com/success` | OK — test fixture URLs |
| `vercel.json` | Relative paths only | OK |
| `localhost` in test/retest scripts | Explicit local Stripe testing | OK — dev scripts |

### Documentation only — updated

All `*.md` audit reports previously referencing `servdco-one.vercel.app` were bulk-updated to `servdco.vercel.app`. Historical JSON artifacts under `scripts/*.json` (Lighthouse, smoke outputs) retain old URLs as captured evidence.

### Should use environment variable — FIXED

| Was | Fix |
|-----|-----|
| `index.html` canonical | Runtime via `VITE_SITE_URL` / origin |
| `public/sitemap.xml` | Build via `VITE_SITE_URL` |
| Verification script defaults | `resolve-base-url.mjs` |

---

## 7. Environment Variables (URL-related)

| Variable | Scope | Used by |
|----------|-------|---------|
| `SITE_URL` | Server (Vercel) | `resolveSiteUrl()` — emails, admin auth redirects |
| `APP_URL` | Server (alias) | `resolveSiteUrl()` fallback |
| `VERCEL_URL` | Auto (Vercel) | `resolveSiteUrl()` preview; SEO build script |
| `VERCEL_PROJECT_PRODUCTION_URL` | Auto (Vercel) | `resolveSiteUrl()` production hostname |
| `VITE_SITE_URL` | Build + client | `pageMeta.ts`, sitemap generation |
| `VITE_APP_URL` | Build + client | `pageMeta.ts` fallback |
| `SMOKE_BASE_URL` | Scripts | E2E / smoke test scripts |
| `VERIFY_BASE_URL` | Scripts | Verification scripts |
| `P3_UAT_BASE` / `V5_API_BASE` | Scripts | UAT audit scripts (override) |
| `RESEND_FROM_EMAIL` | Server | Email From header (domain, not app URL) |
| `STRIPE_WEBHOOK_SECRET` | Server | Webhook signature — no URL |
| `CRON_SECRET` | Server | Cron auth — no URL |

### Vercel production settings (required)

```
SITE_URL=https://servdco.vercel.app          # until servdco.com cutover
VITE_SITE_URL=https://servdco.vercel.app     # baked into client bundle at build
```

After custom domain cutover:

```
SITE_URL=https://servdco.com
VITE_SITE_URL=https://servdco.com
```

Also configure in **Supabase Auth → URL Configuration**: Site URL + redirect allowlist for both domains during transition.

---

## 8. Safe for All Environments

| Environment | Works because |
|-------------|-------------|
| localhost:8080 | Dev proxy; `resolveSiteUrl()` → localhost; Stripe URLs from `window.location.origin` |
| Vercel Preview | `VERCEL_URL` auto-set; client uses `window.location.origin` |
| servdco.vercel.app | Set `SITE_URL` + `VITE_SITE_URL` in Vercel Production |
| servdco.com | Change env vars + Supabase redirect URLs — no code changes |

---

## 9. Remaining Actions (operational, not code)

1. Set `SITE_URL` and `VITE_SITE_URL` in Vercel Production to `https://servdco.vercel.app` (if not already).
2. Update Stripe Dashboard webhook to `https://servdco.vercel.app/api/stripe/webhook`.
3. On `servdco.com` cutover: update env vars, Supabase auth URLs, Stripe webhook, Resend domain (already servdco.com).
4. Rebuild after env change so sitemap/robots reflect new domain.

---

## 10. Audit Verdict

**COMPLETE** — No hardcoded production deployment URL remains in runtime application code (`api/`, `client/`, shared business logic).

Build artifacts (`public/sitemap.xml`, `public/robots.txt`) are generated from environment at build time, not hardcoded in source templates.
