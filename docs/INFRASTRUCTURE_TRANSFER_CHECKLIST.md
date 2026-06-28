# Infrastructure Transfer Checklist

Literal launch playbook for transferring Servd Co to client-owned infrastructure.

---

## GitHub

- [ ] Transfer repository to client's GitHub org/account (Settings → Transfer ownership)
- [ ] Client accepts transfer
- [ ] Remove developer as required collaborator after handover (optional)
- [ ] Verify GitHub Actions secrets if CI deploy is used (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`)
- [ ] Set `GITHUB_REPO` env if using `scripts/setup-vercel-github-deploy.mjs`

---

## Supabase

- [ ] Create new Supabase project under client account
- [ ] Install Supabase CLI locally
- [ ] `supabase login`
- [ ] `supabase link --project-ref <CLIENT_REF>`
- [ ] `supabase db push` — verify 48 migrations apply cleanly
- [ ] Confirm storage buckets exist (`avatars`, `chef-documents`, `chef-portfolio`, etc.)
- [ ] Confirm RLS enabled on all public tables
- [ ] Configure Auth → Site URL + redirect URLs (`https://servdco.com`, `/reset-password`)
- [ ] Configure email templates (or use Resend for custom flows)
- [ ] Configure Google OAuth (if enabled): client ID/secret in Supabase Auth
- [ ] Copy `SUPABASE_URL`, anon key, service role key to Vercel
- [ ] Bootstrap admin user — see `docs/ADMIN_ACCESS.md`
- [ ] Migrate storage objects from old project (if any production data to preserve)

---

## Stripe

- [ ] Create Stripe account under client (or transfer existing)
- [ ] Create Cook Premium Product + monthly Price
- [ ] Record Product ID → `STRIPE_PREMIUM_PRODUCT_ID`
- [ ] Record Price ID → `STRIPE_PREMIUM_PRICE_ID`
- [ ] Enable Stripe Connect (Express)
- [ ] Configure Connect branding + payout schedule
- [ ] Create webhook: `https://servdco.com/api/stripe/webhook`
- [ ] Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`
- [ ] Set `STRIPE_SECRET_KEY` (live mode for production)
- [ ] Test mode smoke first, then switch to live

---

## Resend

- [ ] Create Resend account under client
- [ ] Add and verify sending domain (`servdco.com`)
- [ ] Configure DNS at registrar:
  - [ ] SPF TXT record
  - [ ] DKIM CNAME/TXT records
  - [ ] DMARC TXT record (recommended)
  - [ ] Return-path / bounce domain if required by Resend
- [ ] Set `RESEND_API_KEY`
- [ ] Set `RESEND_FROM_EMAIL` (verified sender)
- [ ] Set `ADMIN_NOTIFY_EMAIL` (operations inbox — required, no default)
- [ ] Send test contact form + career application emails

---

## Cloudflare / Turnstile

- [ ] Add site to Cloudflare (or use registrar DNS)
- [ ] Create Turnstile widget for `servdco.com`
- [ ] Set `VITE_TURNSTILE_SITE_KEY` (public)
- [ ] Set `TURNSTILE_SECRET_KEY` (server)
- [ ] Document key rotation procedure

---

## Domain (servdco.com)

- [ ] **A** record → Vercel (or CNAME to `cname.vercel-dns.com`)
- [ ] **www** CNAME → Vercel or redirect to apex
- [ ] **TXT** — domain verification (Vercel, Google, etc.)
- [ ] **MX** — if receiving mail at domain (optional)
- [ ] **SPF / DKIM / DMARC** — for Resend (see above)
- [ ] Enable HTTPS (automatic on Vercel once DNS propagates)
- [ ] Set `SITE_URL=https://servdco.com` and `VITE_SITE_URL` in Vercel

---

## Vercel

- [ ] Create project under client account
- [ ] Connect GitHub repository
- [ ] Add all environment variables (see `docs/PRODUCTION_HANDOVER.md`)
- [ ] Mark sensitive vars as encrypted
- [ ] Verify cron jobs in `vercel.json` are active
- [ ] Add custom domain `servdco.com`
- [ ] Production deploy succeeds
- [ ] Preview deployments use separate env if desired

---

## Google (optional)

- [ ] Google OAuth credentials → Supabase Auth provider
- [ ] GA4 property → `VITE_GA4_MEASUREMENT_ID`
- [ ] Search Console verification
- [ ] Maps API key if location features expanded

---

## Post-deploy verification

- [ ] `GET /api/health` → 200
- [ ] Signup (family + cook)
- [ ] Admin login + dashboard loads
- [ ] Admin → Settings → **Send Password Reset Email** works
- [ ] Cook approval workflow
- [ ] One real booking end-to-end
- [ ] Stripe payment succeeds
- [ ] Cook Connect transfer processes (or cron runs)
- [ ] One refund test
- [ ] Messaging (if enabled)
- [ ] Cook earnings calculator: 6 dinner guests = $70 session, correct payout
- [ ] Lighthouse / performance spot check

---

## Data & backup

- [ ] Enable Supabase daily backups
- [ ] Export critical reference data snapshot
- [ ] Document PITR restore procedure
- [ ] Remove developer access from old Supabase/Vercel/Stripe after cutover

---

## Launch

- [ ] Final smoke on production URL
- [ ] Monitor Sentry / logs for 24h
- [ ] Announce launch
- [ ] Archive old developer infrastructure (after confirmation period)
