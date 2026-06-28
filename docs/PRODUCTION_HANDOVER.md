# Production Handover Guide

This document describes how to deploy Servd Co on **entirely new infrastructure** owned by the client. No dependency on the original developer accounts remains in application code.

---

## Required accounts

| Service | Purpose |
|---------|---------|
| **GitHub** | Source control + CI |
| **Supabase** | Postgres, Auth, Storage, Realtime |
| **Vercel** | Hosting (SPA + serverless API) |
| **Stripe** | Payments, Connect, Premium subscriptions |
| **Resend** | Transactional email |
| **Cloudflare** | DNS + Turnstile (CAPTCHA) |
| **Domain registrar** | `servdco.com` (or client domain) |
| **Google Cloud** (optional) | OAuth, Maps, Analytics, Search Console |

---

## Deployment order

1. Create GitHub repository (or accept transfer).
2. Create Supabase project → `supabase link` → `supabase db push`.
3. Configure Supabase Auth (email templates, OAuth if used), Storage buckets (created by migrations).
4. Create Stripe account → Products/Prices → Connect → Webhooks.
5. Create Resend account → verify sending domain → DNS (SPF, DKIM, DMARC).
6. Create Turnstile site + secret keys.
7. Create Vercel project → connect GitHub → set environment variables.
8. Point domain DNS to Vercel.
9. Run smoke tests (see checklist below).

---

## Environment variables

Copy `.env.example` to `.env.local` for local development. Set **all production values in Vercel** (Production scope).

### Client (VITE_*)

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_SUPABASE_URL` | Yes | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase → Settings → API |
| `VITE_USE_SUPABASE_AUTH` | Yes | `true` in production |
| `VITE_ENABLE_STRIPE_CHECKOUT` | Yes | `true` when Stripe live |
| `VITE_TURNSTILE_SITE_KEY` | Yes | Cloudflare Turnstile |
| `VITE_SITE_URL` | Yes | `https://servdco.com` |
| `VITE_ENABLE_MESSAGING` | No | Feature flag |
| `VITE_GA4_MEASUREMENT_ID` | No | Analytics |

### Server (Vercel only)

| Variable | Required | Notes |
|----------|----------|-------|
| `SUPABASE_URL` | Yes | Same as VITE |
| `SUPABASE_ANON_KEY` | Yes | Same as VITE |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **Sensitive** — server only |
| `STRIPE_SECRET_KEY` | Yes | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes | From Stripe webhook endpoint |
| `STRIPE_PREMIUM_PRODUCT_ID` | Yes | Created in Stripe Dashboard |
| `STRIPE_PREMIUM_PRICE_ID` | Yes | Created in Stripe Dashboard |
| `ENABLE_STRIPE_CHECKOUT` | Yes | `true` |
| `CRON_SECRET` | Yes | Random hex; protects cron routes |
| `TURNSTILE_SECRET_KEY` | Yes | Cloudflare |
| `RESEND_API_KEY` | Yes | Resend dashboard |
| `RESEND_FROM_EMAIL` | Yes | Verified domain, e.g. `Servd Co <hello@servdco.com>` |
| `ADMIN_NOTIFY_EMAIL` | **Yes** | Owner inbox — **no fallback**; app throws if missing |
| `SITE_URL` | Yes | `https://servdco.com` — used in emails |

### Local only

| Variable | Notes |
|----------|-------|
| `SUPABASE_DB_URL` | Migrations CLI only — never in Vercel |
| `STRIPE_WEBHOOK_SECRET_LOCAL` | From `stripe listen` |
| `ALLOW_DEV_SEED` | Never `true` in production |

---

## Migration order

All schema is in `supabase/migrations/` (48 files, timestamp-ordered).

```bash
supabase login
supabase link --project-ref <YOUR_REF>
supabase db push
```

This creates: extensions, enums, tables, RLS policies, storage buckets, RPCs, triggers, seed/reference data (launch regions, feature flags, geo ZIPs, platform settings defaults).

**Local dev reset (optional):**

```bash
supabase start
supabase db reset   # applies migrations + seed.sql
```

**Regenerate TypeScript types after schema change:**

```bash
supabase gen types typescript --linked > client/lib/supabase/database.types.ts
```

---

## Stripe setup

1. Create **Cook Premium** Product + recurring Price in Stripe Dashboard.
2. Set `STRIPE_PREMIUM_PRODUCT_ID` and `STRIPE_PREMIUM_PRICE_ID` in Vercel.
3. Enable **Stripe Connect** (Express accounts for cooks).
4. Create webhook endpoint: `https://servdco.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `payment_intent.*`, `account.updated`, `customer.subscription.*`, `charge.refunded`, etc.
5. Set `STRIPE_WEBHOOK_SECRET`.
6. Booking checkout uses **dynamic `price_data`** — no hardcoded booking Price IDs.

See `docs/servdco-stripe-dashboard-setup-guide.md` for detailed steps.

---

## Resend + DNS

1. Add domain in Resend → copy DNS records.
2. Configure at registrar / Cloudflare:
   - **SPF** TXT
   - **DKIM** CNAME/TXT
   - **DMARC** TXT (recommended)
   - **MX** (if receiving — optional for send-only)
3. Set `RESEND_FROM_EMAIL` to verified address.
4. Set `ADMIN_NOTIFY_EMAIL` to operations inbox.

---

## Vercel configuration

Documented in `vercel.json`:

- **Crons:** `/api/stripe/transfers/process` (daily midnight UTC), `/api/launch/auto-check` (06:00 UTC)
- **Security headers:** CSP, HSTS, frame denial
- **Rewrites:** SPA fallback + API aliases

Function limit: 30s max duration for `api/**/*.ts`.

---

## Verification checklist

After deploy:

- [ ] `GET /api/health` returns 200
- [ ] Home page loads; platform settings fetch succeeds
- [ ] Family signup + email confirmation
- [ ] Cook signup + document upload
- [ ] Admin promotes cook / approves region
- [ ] Family books cook → correct price in UI
- [ ] Stripe Checkout amount matches booking
- [ ] Webhook confirms payment → booking status updated
- [ ] Cook receives payout transfer (Connect)
- [ ] Refund flow works
- [ ] Contact form emails admin (`ADMIN_NOTIFY_EMAIL`)
- [ ] Admin password reset email from Settings tab
- [ ] Cook earnings calculator matches booking price for same guest counts

---

## Rollback

1. **Vercel:** Redeploy previous production deployment from dashboard.
2. **Database:** Supabase point-in-time recovery (Pro plan) or restore from backup.
3. **Stripe:** Webhook replay from Stripe Dashboard if events missed.
4. **DNS:** Revert A/CNAME records to previous host.

---

## Secrets rotation

| Secret | Rotation steps |
|--------|----------------|
| Supabase service role | Supabase → regenerate → update Vercel → redeploy |
| Stripe secret + webhook | Stripe Dashboard → roll keys → update Vercel → update webhook |
| Resend API key | Resend → new key → update Vercel |
| CRON_SECRET | Generate new → update Vercel → redeploy |
| Turnstile | Cloudflare → rotate → update Vercel (both keys) |

---

## Disaster recovery

1. Maintain daily Supabase backups (enabled on Pro).
2. Export Stripe reconciliation reports weekly.
3. Keep `.env.example` updated; store production secrets in a password manager (1Password, etc.), not in git.
4. Document admin bootstrap: see `docs/ADMIN_ACCESS.md`.

---

## Ownership transfer checklist

See `docs/INFRASTRUCTURE_TRANSFER_CHECKLIST.md` for the step-by-step launch playbook.

---

## Fresh clone test (“open source” test)

On a new machine with no prior setup:

```bash
git clone <repo>
cd servdco
pnpm install
cp .env.example .env.local   # fill all values
supabase link --project-ref <ref>
supabase db push
pnpm dev                       # local smoke
pnpm build && pnpm start       # production build smoke
vercel deploy --prod           # after linking Vercel project
```

If any step fails without documentation, file an issue — the repo is not yet portable.
