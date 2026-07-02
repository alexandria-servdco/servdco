# ServdCo — Zero Trust Production Audit (Phase Final+)

**Date:** 2026-07-02  
**Mode:** Principal Engineer / zero-trust — no new features, reliability only  
**Would I launch with real money?** **NO** — conditional YES after P0 ops + P0 code fixes below

---

## Launch Verdict

| Question | Answer |
|----------|--------|
| **YES / NO** | **NO** (today) |
| **Why not** | (1) Production DB migration `20250702160000` not applied — password auth blocked deploy. (2) Stripe refund path can double-refund (P0). (3) Webhook concurrent-claim race can drop events (P0). (4) Duplicate checkout sessions possible without pending-payment unique index (P0). (5) Realtime channels die after 6 retries with no token-refresh reconnect (P1, affects live ops). |
| **When YES** | After migrations applied, duplicate $45 refunded, P0 Stripe fixes shipped, 48h monitored beta with payment + realtime dashboards clean. |

**Launch readiness score: 78 / 100**

---

## Focused Audit: CHANNEL_ERROR + 403 /auth/v1/user

These are **not independent** — both stem from JWT lifecycle timing.

### CHANNEL_ERROR (all 5 chef channels fail together)

| Root cause | Evidence | Eliminable? |
|------------|----------|-------------|
| **JWT stale during `autoRefreshToken`** | `useRealtimeDashboard` subscribes immediately on mount; no wait for `TOKEN_REFRESHED` | Reduce, not 100% |
| **Retry exhaustion** | After 6 `CHANNEL_ERROR`s, channels stop; `online` only invalidates cache, does not resubscribe | **Yes** — fix reconnect |
| **DB infra (if migrations applied)** | Publication + `REPLICA IDENTITY FULL` + RLS align with filters — verified in migrations `20250612150029`, `20250620120030` | N/A — correct |

**Not the cause:** per-table RLS mismatch, missing publication (when migrations applied).

### 403 /auth/v1/user

| Root cause | Evidence | Eliminable? |
|------------|----------|-------------|
| **`getUser()` during token refresh** | ~35 call sites; `profiles.service`, `notifications.service` hit `/auth/v1/user` while `autoRefreshToken` invalidates old JWT | **Mostly** — switch hot paths to `getSession()` / context `userId` |
| **Misread as "forbidden user"** | 403 = invalid JWT at that instant, not missing permission | Education + logging filter |

**Recommendation:** Gate realtime on stable session; resubscribe on `TOKEN_REFRESHED`; replace `getUser()` on dashboard mount paths.

---

## P0 — Critical

| ID | Area | Issue | Root cause |
|----|------|-------|------------|
| P0-DB | Migrations | `20250702160000_payment_reconciliation_integrity.sql` not in prod | Deploy blocked — DB password auth failed against pooler |
| P0-S1 | Stripe refund | Admin refund can double-refund | No idempotency key; no `refunded` guard (`api/_lib/stripe/refund.ts`) |
| P0-S2 | Stripe webhook | Concurrent claim race | `claimStripeEvent` duplicate insert returns `alreadyProcessed: true` while winner in-flight (`events.ts`) |
| P0-S3 | Stripe checkout | Duplicate pending payments / sessions | No unique on `payments(booking_id) WHERE status=pending` |
| P0-S4 | Transfers | Cooks unpaid on default completion path | Trigger requires `family_confirmed_at`; main `updateBookingStatus` never sets it |

---

## P1 — High

| ID | Area | Issue |
|----|------|-------|
| P1-1 | DB | No one-active-subscription-per-chef unique index |
| P1-2 | DB | No double-booking constraint on chef+datetime |
| P1-3 | DB | `chef_availability` no unique (chef, day_of_week) |
| P1-4 | Stripe | Checkout amount mismatch logged but not rejected in webhook |
| P1-5 | Stripe | Tip transfer missing Stripe idempotency key |
| P1-6 | Stripe | Stale webhook retry re-sends notifications/emails |
| P1-7 | Realtime | Channels permanently dead after max retries |
| P1-8 | Client | Analytics gated (fixed) — verify post-deploy |
| P1-9 | Ops | Duplicate $45 production charge needs refund + reconcile |

---

## P2 — Medium

Notifications lack dedup keys; `reviews` UNIQUE vs soft-delete trigger contradiction; `chef_availability` not in realtime publication; availability race last-write-wins; blocked dates not unified with calendar; mobile QA not signed off; family dashboard not on `resolveProfileCompletion()`.

---

## P3 — Low

Dead `pending→accepted` path; `bookings.stripe_payment_intent_id` duplicates `payments`; tip pending rows unlimited; view-count spam possible.

---

## Category Summaries

### 1. Database Integrity
Strong: transfer claim + idempotency, booking status DB triggers, partial unique on succeeded payments (after migration).  
Weak: subscription uniqueness, pending payment uniqueness, booking slot collision, notification dedup, availability day uniqueness.

### 2. Stripe Audit
Strong: cook transfer pipeline, booking `confirmBookingFromPayment`, reconciliation crons.  
Weak: refund idempotency, webhook claim race, checkout amount enforcement, tip idempotency, notification replay on stale retry.

### 3. API Audit
Most routes: auth + rate limit + Zod validation. Gaps: refund route replay-unsafe; some cron routes lack feature-flag parity.

### 4. Security Audit
CSP in `vercel.json`; RLS enabled; service role server-only. No service role in client bundle found. `.env.production` must never be committed (gitignored). Upload paths use Supabase storage policies — verify bucket policies in ops checklist.

### 5–6. Dashboard / Booking Workflow
Phase Final fixes: profile completion resolver, premium checkout state machine, subscription reconcile, availability validation, dashboard metric alignment. Booking `canTransition()` enforced client + DB. Payment reconciliation layer closes paid-but-unconfirmed gap **after migration + deploy**.

### 7. Notifications
Duplicate risk on webhook retry — no `(user_id, event, booking_id)` unique.

### 8. Mobile
Responsive grids present; formal 375/390/414/768 sign-off pending.

### 9. Performance
`useChefAnalytics` gated; hero preload removed from global `index.html`. Multiple realtime hooks on chef dashboard (~8 channels) — watch connection limits.

### 10. Production Monitoring
`apiLogger` on webhooks/crons; Sentry on client. Gap: no structured log when realtime gives up after max retries.

### 11. Disaster Recovery
Stripe down: checkout fails gracefully; crons retry. Supabase down: SPA degrades; no offline queue. Resend down: emails fail non-blocking. Vercel cold start: Stripe retries webhooks.

### 12. Admin Audit
Payment Reconciliation panel, transfer retry, payout controls present. Subscription reconcile API added. Refund UI needs idempotency hardening.

### 13. Code Cleanup
No `TODO`/`FIXME` in TS source. Multiple overlapping audit markdown files in repo root — consolidate post-launch.

---

## Operational Tasks (before launch)

1. **Verify DB password** in Supabase Dashboard → Settings → Database → reset if needed  
2. Run: `node scripts/run-pending-migrations.mjs --production` (`.env.production` only)  
3. Deploy latest `main` to Vercel production  
4. Refund duplicate $45 charge; run Admin Payment Reconciliation  
5. Delete duplicate Monday availability slots for affected cook  
6. Monitor Sentry + Stripe webhook dashboard 48h  

---

## Architecture / Scalability / Security Risks

| Risk | Severity | Note |
|------|----------|------|
| Webhook event loss under concurrency | High | Fix claim race before scale |
| Duplicate checkout sessions | High | Unique partial index on pending payments |
| Realtime silent failure | Medium | Chefs see stale bookings until refresh |
| `getUser()` fan-out | Medium | Amplifies 403 noise at scale |
| Notification duplication | Medium | Support burden at volume |
| No booking slot exclusion | Medium | Double-booking at popularity |

---

## Chaos Scenarios

| Scenario | Converges? |
|----------|------------|
| 10 families pay same cook | Yes (after migration) — booking idempotency |
| Webhook before browser | Yes — webhook + reconcile |
| Browser before webhook | Yes — return URL + cron |
| Duplicate webhook | Partial — event ID dedup; side effects may duplicate |
| Two crons overlap | Yes — idempotent upserts |
| Realtime disconnect | Partial — retries then silent death |
| Rapid button spam | Partial — rate limits; some UX debounce gaps |

---

## Files in this release (code)

Payment integrity, subscription integrity, premium checkout UX, profile completion resolver, availability validation, realtime retry, migration script (`--production` only), reconcile crons.

See `PRODUCTION_READINESS_PHASE_FINAL.md` and `BOOKING_PAYMENT_RECONCILIATION_AUDIT.md` for implementation detail.
