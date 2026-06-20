# Phase 4 — Production Hardening Sprint

**Date:** 2026-06-12  
**Production:** [https://servdco-one.vercel.app](https://servdco-one.vercel.app)  
**Goal:** Close operational, security, and reliability gaps before public launch — without changing pricing, booking workflows, or marketplace business rules.

---

## Sprint summary

| # | Area | Current state | Sprint target | Priority |
|---|------|---------------|---------------|----------|
| 1 | Error boundaries | Global + route boundaries exist; admin charts unguarded | Nested boundaries for charts, lazy PDF modal, Sentry tags | **P0** |
| 2 | Rate limiting | Stripe POST routes only (in-memory, per instance) | Contact, auth-adjacent APIs, global Redis-backed limiter | **P0** |
| 3 | Bot protection | None on public forms | Turnstile on contact + waitlist + signup | **P0** |
| 4 | Image optimization | Raw `<img>` + Supabase URLs | Responsive srcset, WebP, lazy loading, avatar CDN policy | **P1** |
| 5 | Speed Insights | Lighthouse WARN; no RUM | `@vercel/speed-insights` + Core Web Vitals baseline | **P1** |
| 6 | Database backup strategy | Supabase default only | Documented RPO/RTO, PITR, restore drill | **P0** |
| 7 | Admin audit logs | `audit_logs` table + client `AdminAuditService` | Full coverage + UI retention + export | **P1** |
| 8 | Abuse prevention | RLS + soft delete | Report flow, auto-suspend rules, messaging limits | **P1** |
| 9 | Marketplace dispute handling | Terms mention arbitration; no Stripe dispute webhooks | Dispute webhook + admin queue + payout holds | **P0** |
| 10 | Stripe live mode readiness | Test mode verified (`STRIPE_LIVE_READINESS_AUDIT.md`) | Live keys, webhook, Connect, smoke test | **P0** |

---

## 0. Immediate fixes (this sprint — shipped in code)

### Admin dashboard crash (`/admin-dashboard`)

**Symptoms:** Route error boundary — “This page failed to load” after admin login.

**Root causes addressed:**

1. **Heavy sync import** — `DocumentPreviewModal` pulled `pdfjs-dist` into the admin chunk at load time. Now lazy-loaded only when a document is opened.
2. **Unguarded chart render** — booking date/price edge cases and Recharts failures could crash the page. Added `ChartErrorBoundary`, safe date/price formatters, and null-safe region filters.
3. **CSP** — Added `worker-src 'self' blob:` for PDF.js workers in `vercel.json`.

### Notification sort

Probe/audit contact messages appeared out of chronological order. `NotificationService.syncUserNotifications` and `NotificationBell` now sort by `createdAt` descending.

**Verify after deploy:**

```text
1. Log in as admin → /admin-dashboard loads (overview cards + charts)
2. Open notification bell → newest message first
3. Verification tab → open a PDF → preview loads
```

---

## 1. Error boundaries

### Current

| Layer | File | Coverage |
|-------|------|----------|
| App shell | `client/components/errors/GlobalErrorBoundary.tsx` | Full app |
| Routes | `client/components/errors/RouteErrorBoundary.tsx` | Per `PageWrapper` / `LazyRoute` |
| Charts | `client/components/errors/ChartErrorBoundary.tsx` | Admin dashboard charts (new) |

### Tasks

- [ ] **P0** Wrap `AdminAnalytics`, `ChefDashboard` charts, and `PayoutControl` tables in `ChartErrorBoundary`
- [ ] **P0** Add `componentDidCatch` dev-only error detail toggle (admin-only) for faster triage
- [ ] **P1** Lazy-load all admin modals that import `pdfjs-dist` or heavy viewers
- [ ] **P1** Sentry: tag `route`, `admin_tab`, `chart_name` on boundary catches
- [ ] **P2** React Query `throwOnError: false` audit on dashboard hooks — never throw into render tree

### Acceptance

- A single chart failure shows inline fallback; sidebar and nav remain usable
- Sentry receives `RouteErrorBoundary` and `ChartErrorBoundary` events with route label
- No uncaught render errors in admin UAT script

---

## 2. Rate limiting

### Current

- `api/_lib/rateLimit.ts` — in-memory, 30 req/min/IP, per serverless instance
- Applied to: Stripe checkout, tips, connect onboarding, dashboard-link, refund

### Gaps

| Route | Limited? | Risk |
|-------|----------|------|
| `POST /api/contact/submit` | No | Spam, Resend quota burn |
| `POST /api/*` auth-adjacent | No | Credential stuffing |
| Stripe webhook | Intentionally no | Stripe-origin only |
| Cron transfers | Auth header | OK |

### Tasks

- [ ] **P0** Add `enforceRateLimit` to `api/contact/submit.ts` (10 req/min/IP)
- [ ] **P0** Add rate limit to any future `api/auth/*` or password-reset proxies
- [ ] **P1** Upgrade to **Upstash Redis** (or Vercel KV) for cross-instance limits
- [ ] **P1** Return `Retry-After` header on 429
- [ ] **P2** Admin bypass via service role (server-side only) for internal tools

### Acceptance

- Contact form returns 429 after threshold from same IP
- Load test (50 rapid POSTs) does not exhaust Resend daily quota

---

## 3. Bot protection

### Current

- No CAPTCHA / Turnstile on contact, waitlist, or registration
- Public forms write to Supabase via RLS + API routes

### Tasks

- [ ] **P0** Cloudflare Turnstile on `Contact.tsx` + `api/contact/submit.ts` server verify
- [ ] **P0** Turnstile on waitlist / interest forms (client + server)
- [ ] **P1** Turnstile on chef/family registration (optional invisible mode)
- [ ] **P1** Env: `TURNSTILE_SECRET_KEY` (Vercel), `VITE_TURNSTILE_SITE_KEY` (client)
- [ ] **P2** Honeypot field on contact form as defense-in-depth

### Acceptance

- Automated curl without token → 403
- Legitimate browser submission → 200
- LC-1 observability probes updated to use test bypass key in CI only

---

## 4. Image optimization

### Current

- `UserAvatar` uses raw URLs from Supabase Storage
- Chef portfolio and homepage cards use `<img>` without `loading="lazy"` everywhere
- No responsive `srcset` or Supabase image transformation

### Tasks

- [ ] **P1** Add `loading="lazy"` + explicit `width`/`height` on marketing and marketplace images
- [ ] **P1** Supabase Storage transform URLs (`?width=400&quality=80`) for chef cards and avatars
- [ ] **P1** Vite plugin or build step for critical hero image preload (`Index.tsx`)
- [ ] **P2** Migrate chef portfolio to WebP on upload (server-side or client canvas)
- [ ] **P2** Document max upload dimensions in chef onboarding copy

### Acceptance

- Lighthouse “Properly size images” improvement on `/` and `/browse-chefs`
- LCP image has `fetchpriority="high"` and dimensions set

---

## 5. Speed Insights

### Current

- Lighthouse mobile ~WARN (see `LIGHTHOUSE_REMEDIATION_REPORT.md`)
- GA4 + Sentry RUM partial; no Vercel Speed Insights

### Tasks

- [ ] **P1** Install `@vercel/speed-insights` in `client/App.tsx`
- [ ] **P1** Enable Speed Insights in Vercel project settings
- [ ] **P1** Set baseline targets: LCP &lt; 2.5s, INP &lt; 200ms, CLS &lt; 0.1 (p75)
- [ ] **P2** Defer non-critical homepage fetches (already started — verify in RUM)
- [ ] **P2** Review `vendor` chunk &gt; 500kB — further `manualChunks` split

### Acceptance

- Speed Insights dashboard shows data within 24h of deploy
- Week-1 report exported to `SPEED_INSIGHTS_BASELINE.md`

---

## 6. Database backup strategy

### Current

- Supabase hosted Postgres with platform backups (plan-dependent)
- No documented RPO/RTO or restore drill

### Tasks

- [ ] **P0** Confirm Supabase plan includes **Point-in-Time Recovery (PITR)** — enable if not
- [ ] **P0** Document RPO (e.g. 24h) and RTO (e.g. 4h) in `docs/DATABASE_BACKUP_RUNBOOK.md`
- [ ] **P0** Quarterly restore drill: clone project → verify `profiles`, `bookings`, `payments` row counts
- [ ] **P1** Export critical config snapshots: `platform_settings`, `launch_regions`, feature flags
- [ ] **P1** Store encrypted backup of Stripe price IDs + webhook config off-platform
- [ ] **P2** `pg_dump` automation via Supabase CLI in GitHub Action (weekly artifact, 30-day retention)

### Acceptance

- Runbook exists; last drill date recorded
- Alexandria can answer “how do we restore yesterday’s DB?” in one doc link

---

## 7. Admin audit logs

### Current

- Table: `audit_logs` (migration `20250612120024_admin_owner_security.sql`)
- Client: `AdminAuditService.log()` — chef, document, user, booking, refund actions
- UI: **Audit Logs** tab (`AdminAuditLogs.tsx`)

### Gaps

| Action | Logged? |
|--------|---------|
| Chef approve/reject | Yes |
| Document moderate | Partial (via moderation service) |
| Booking status change | Yes |
| Refund issued | Yes |
| Region launch toggle | No |
| Platform settings change | No |
| Contact message resolved | No |
| CSV export | No |

### Tasks

- [ ] **P1** Log `region.updated`, `region.initialized`, `settings.fee_changed`
- [ ] **P1** Log `contact.status_changed`, `export.csv` with row counts
- [ ] **P1** Server-side audit for API routes (refund, transfer process) via service role insert
- [ ] **P2** Audit log export CSV + 90-day retention policy
- [ ] **P2** Filter/search in `AdminAuditLogs` by actor, entity, date range

### Acceptance

- Every admin mutation in dashboard leaves an `audit_logs` row
- Audit tab loads last 50 entries without error for admin role

---

## 8. Abuse prevention

### Current

- Supabase RLS on all tables
- User soft-delete; chef suspension
- No user report flow; no messaging rate limits

### Tasks

- [ ] **P1** **Report user** flow (family/chef) → `abuse_reports` table + admin queue
- [ ] **P1** Auto-flag: &gt;5 failed logins / 15 min → temporary lock (Supabase Auth settings)
- [ ] **P1** Messaging: max 30 messages/hour per user (DB trigger or API)
- [ ] **P2** Block list: family cannot rebook same chef after admin block
- [ ] **P2** Review bombing guard: one review per completed booking (already enforced — verify)
- [ ] **P2** Admin “suspend + notify” template email

### Acceptance

- Submitted report appears in admin moderation within realtime window
- Suspended user cannot create bookings (RLS + status check)

---

## 9. Marketplace dispute handling

### Current

- Terms: binding arbitration (Ohio)
- Stripe: **no** `charge.dispute.*` webhook handlers
- Payouts: hold period via `platform_settings` — no dispute-linked hold

### Tasks

- [ ] **P0** Webhook handlers: `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`
- [ ] **P0** On dispute opened: flag `payments` row, pause related `transfers`, notify admin email
- [ ] **P1** Admin **Disputes** panel: booking link, evidence upload checklist, status
- [ ] **P1** Store dispute metadata in `payment_disputes` table
- [ ] **P2** Playbook doc: evidence submission timeline (Stripe 7-day window)
- [ ] **P2** Family/chef email templates for dispute opened/resolved

### Acceptance

- Stripe CLI test `charge.dispute.created` updates DB and sends admin notification
- Open dispute prevents transfer cron from paying affected booking

---

## 10. Stripe live mode readiness

### Current (test mode)

See **`STRIPE_LIVE_READINESS_AUDIT.md`** — all webhook handlers PASS in test.

### Pre-live checklist

- [ ] **P0** Replace `STRIPE_SECRET_KEY` with `sk_live_*` in Vercel (production env only)
- [ ] **P0** Create **live** webhook endpoint → `https://servdco-one.vercel.app/api/stripe/webhook`
- [ ] **P0** Update `STRIPE_WEBHOOK_SECRET` to live signing secret
- [ ] **P0** Verify Stripe Connect platform profile complete (business URL, support email)
- [ ] **P0** Live **Premium** product/price IDs in env (`STRIPE_PREMIUM_PRICE_ID`)
- [ ] **P1** One end-to-end live smoke: $1 booking → refund (staging chef Connect account)
- [ ] **P1** Enable Stripe Radar rules (block if CVC fail)
- [ ] **P2** Tax settings review if expanding beyond Ohio

### Acceptance

- `STRIPE_LIVE_READINESS_AUDIT.md` checklist 100% checked
- Live webhook event log shows `checkout.session.completed` in Stripe Dashboard
- No test keys in production `vercel env ls`

---

## Execution timeline (recommended)

| Week | Focus |
|------|-------|
| **Week 1** | Admin crash fix (done), rate limits on contact, Turnstile, CSP/worker-src deploy |
| **Week 2** | Dispute webhooks, backup runbook + drill, audit log gaps |
| **Week 3** | Speed Insights baseline, image optimization pass, abuse report MVP |
| **Week 4** | Stripe live switch (private beta cohort), hardening regression script |

---

## Regression gate (Phase 4 exit)

Run before marking sprint complete:

```bash
pnpm typecheck
pnpm test
node scripts/master-production-audit.mjs   # target: 0 FAIL on sections 1–16
```

Manual:

1. Admin login → all 15 tabs load without error boundary
2. Contact form with Turnstile → email + admin notification
3. Stripe test dispute simulation → DB flag + admin alert
4. Speed Insights receiving data
5. Restore drill documented with date

---

## References

- `MASTER_PRODUCTION_AUDIT.md` — pre-launch 23-section audit
- `STRIPE_LIVE_READINESS_AUDIT.md` — payment go-live checklist
- `ADMIN_OPERATIONS_GUIDE.md` — Alexandria daily ops
- `LIGHTHOUSE_REMEDIATION_REPORT.md` — perf baseline
- `SENTRY_PRODUCTION_VERIFICATION.md` / `GA4_PRODUCTION_VERIFICATION.md` — observability
- `docs/servdco-stripe-blueprint.md` — dispute and payout design intent

---

**Phase 4 exit criteria:** Admin dashboard stable in production, contact/abuse protected, dispute + backup runbooks in place, Speed Insights baseline captured, Stripe live checklist complete for private-beta payments.
