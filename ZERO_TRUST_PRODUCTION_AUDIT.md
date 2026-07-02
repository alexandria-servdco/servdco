# ServdCo — Zero Trust Production Audit (Phase Final+)

**Date:** 2026-07-02 (final pass)  
**Auditor mode:** Principal Engineer — zero trust, reliability only (no new features)  
**Production DB:** `huweeggothyibfeeyvnz` — **53/53 migrations applied**  
**Code:** `735dea1` + reliability patch (this commit) on `alexandria/main`

---

## Launch Verdict

| | |
|---|---|
| **Would you launch with real money?** | **YES — conditional beta launch** |
| **Score** | **86 / 100** (was 78 before migrations + P0 reliability fixes) |
| **Why YES (conditional)** | Payment reconciliation + idempotency + crons deployed; DB at 53 migrations; webhook claim race fixed; refund idempotency added; realtime reconnect on token refresh; `family_confirmed_at` set on completion; pending-payment unique index applied. |
| **Why not unconditional** | Ops: refund duplicate $45, mobile QA sign-off, 48h production monitoring. P1: subscription-per-chef unique index, booking slot collision, notification dedup still open. |

---

## Task Completion Checklist

| Task | Status |
|------|--------|
| Apply all migrations (`.env.production` only) | **Done** — 53/53 |
| Push code to alexandria GitHub | **Done** — `735dea1` (+ this patch pending push) |
| Phase Final hardening (payment, premium, profile, availability) | **Done** |
| Zero-trust audit all 14 categories | **Done** (this document) |
| CHANNEL_ERROR + 403 root-cause audit | **Done** + reliability fixes shipped |
| No new features | **Honored** — only reliability hardening |

---

## Focused Audit: CHANNEL_ERROR + 403 /auth/v1/user

### Root cause (confirmed — not "mystery noise")

Both symptoms share **JWT refresh timing**:

1. `autoRefreshToken: true` briefly invalidates the access token  
2. `useRealtimeDashboard` subscribed all 5 chef channels immediately → **CHANNEL_ERROR × 5**  
3. `getUser()` on dashboard mount hit `/auth/v1/user` → **403** (invalid JWT at instant, not missing permission)

DB layer is **correct** when migrations applied: publication (`20250612150029`), `REPLICA IDENTITY FULL` (`20250620120030`), RLS matches filters.

### Fixes shipped (this pass)

| Fix | File |
|-----|------|
| Resubscribe on `TOKEN_REFRESHED` / `SIGNED_IN` | `useRealtimeDashboard.ts` |
| Resubscribe on `online` and after retry exhaustion | `useRealtimeDashboard.ts` |
| Structured log when retries exhausted | `useRealtimeDashboard.ts` → `logger.warn` |
| `getSession()` instead of `getUser()` on hot paths | `sessionUser.ts`, `profiles.service.ts`, `notifications.service.ts` |

**Eliminable?** 403 mostly yes; CHANNEL_ERROR reduced significantly. Brief refresh-window gaps may still occur at scale.

---

## 1. Database Integrity

| Finding | Severity | Status |
|---------|----------|--------|
| Partial unique: one succeeded payment per booking | P0 | **Fixed** — `20250702160000` applied |
| Partial unique: one pending payment per booking | P0 | **Fixed** — `20250706120000` applied |
| Transfer retry enum + columns | P1 | **Fixed** — `20250702140000`, `20250702150000` applied |
| No one-active-subscription-per-chef | P1 | Open |
| No double-booking on chef+datetime | P1 | Open |
| `chef_availability` no unique (chef, day) | P1 | Open — client validation only |
| Notification dedup | P2 | Open |
| `reviews` UNIQUE vs soft-delete trigger | P2 | Open |
| `family_confirmed_at` required for transfer trigger | P0 | **Fixed** — set on `completed` in `bookings.service.ts` |

**Strong:** FKs on core tables, `canTransition` + DB triggers, transfer claim + Stripe idempotency keys.

---

## 2. Stripe Audit

| Area | Replay-safe? | Notes |
|------|--------------|-------|
| Webhook event ID dedup | **Yes** (fixed race) | `claimStripeEvent` re-reads on concurrent insert |
| Booking payment confirm | **Yes** | `confirmBookingFromPayment` + DB unique index |
| Checkout amount | **Enforced** | `verifyCheckoutAmountCents` in webhook |
| Admin refund | **Yes** (fixed) | Idempotency key + `refunded` guard |
| Cook transfer | **Yes** | Claim + idempotency key |
| Subscription sync | **Yes** | Upsert + reconcile cron |
| Tip transfer | Partial | P1 — no idempotency key |
| Stale webhook retry side effects | Partial | P1 — notifications may duplicate on retry |

---

## 3. API Audit

| Control | Coverage |
|---------|----------|
| Authentication | JWT on user routes; cron secret on crons |
| Authorization | `requireChefProfile`, admin role checks |
| Ownership | Booking/payment scoped to family/chef |
| Input validation | Zod on Stripe routes |
| Rate limiting | `enforceRateLimit` on Stripe endpoints |
| Logging | `apiLogger` on webhooks, crons, Stripe ops |
| Gaps | Refund was replay-unsafe — **fixed** |

---

## 4. Security Audit

| Check | Result |
|-------|--------|
| Service role in client | **None found** |
| `.env.production` in git | **Gitignored** — never commit |
| RLS | Enabled on user tables |
| CSP | Configured in `vercel.json` |
| XSS | React default escaping; no `dangerouslySetInnerHTML` in user paths |
| CSRF | Bearer token API; Stripe webhook signature |
| Unsafe redirects | Checkout URLs from `window.location.origin` / env |
| Uploads | Supabase storage + RLS — verify bucket policies in ops |

---

## 5. Dashboard Audit

| State | Behavior |
|-------|----------|
| Loading | Skeleton components on chef/family dashboards |
| Empty | `EmptyState` on lists |
| Offline | React Query `refetchOnReconnect`; realtime reconnect on `online` |
| Stale cache | Realtime invalidates query keys; reconcile crons |
| Permission revoked | Auth provider redirects; API 401/403 |
| Fixed this phase | Profile 100% ring, premium checkout tab, earnings labels |

---

## 6. Booking Workflow Audit

```
Family → Book → Pay → Accept → En route → Arrived → Cooking → Completed → Transfer → Paid
```

| Interrupt | Converges? |
|-----------|------------|
| Family refresh after pay | Yes — reconcile API + cron + webhook |
| Webhook delayed | Yes — return URL + 15m cron |
| Duplicate webhook | Yes — event claim + payment idempotency |
| Cook completes without family_confirmed | **Fixed** — `family_confirmed_at` set on completion |
| Realtime disconnect | Partial — reconnect fixes improve; manual refresh always works |
| Cron overlap | Yes — idempotent upserts |

---

## 7. Notification Audit

| Issue | Status |
|-------|--------|
| Duplicate on webhook retry | P2 — no unique on metadata event key |
| Stale notifications | React Query invalidation on realtime |
| After cancellation | Booking cancel path updates status; verify notification templates |
| Impossible notifications | No guard for premium-locked analytics (fixed — query gated) |

---

## 8. Mobile Audit

Responsive Tailwind grids + `DashboardMobileNav` on cook dashboard. **Formal sign-off pending** at 375/390/414/768px and landscape — manual QA required before unconditional launch.

---

## 9. Performance Audit

| Item | Status |
|------|--------|
| Analytics query gated (non-premium) | Fixed |
| Global hero preload removed | Fixed |
| ~8 realtime channels on chef dashboard | Monitor at scale |
| N+1 queries | No critical N+1 on dashboard load |
| `getUser()` fan-out | Reduced on profile + notifications |

---

## 10. Production Monitoring

| Failure | Logged? |
|---------|---------|
| Payment failed | `apiLogger` + webhook handler |
| Transfer failed | Webhook + `transferIntegrity` |
| Webhook failed | `markStripeEventProcessed(error)` + Stripe retry |
| Cron failed | `apiLogger.error` on batch routes |
| Subscription failed | `subscriptionIntegrity` + cron |
| Realtime failed | **Added** — `logger.warn` on retry exhaustion |
| Email failed | Resend errors logged server-side |
| Availability failed | Client toast on validation error |

---

## 11. Disaster Recovery

| Service down | Behavior |
|--------------|----------|
| Stripe | Checkout fails with user message; crons retry; no data loss |
| Supabase | SPA shows errors; no offline queue |
| Resend | Emails skipped; core flows continue |
| Vercel | Stripe retries webhooks; cold start may delay cron once |

---

## 12. Admin Audit

| Repair action | Without SQL? |
|---------------|--------------|
| Booking payment mismatch | **Yes** — Payment Reconciliation panel |
| Transfer retry | **Yes** — Admin transfer controls |
| Payout / Connect | **Yes** — PayoutControl + Connect sync |
| Subscription | **Yes** — `POST /api/stripe/subscription/reconcile` |
| Refund | **Yes** — Admin refund (now idempotent) |
| Notification | Partial — mark read; no dedup repair UI |

---

## 13. Code Cleanup

- No `TODO`/`FIXME` in TypeScript source  
- Duplicate audit markdown files in repo root — consolidate post-launch (cosmetic)  
- `sessionUser.ts` centralizes session reads (reduces duplicate `getUser` patterns)

---

## 14. Issue Summary

### P0 — Critical

| ID | Issue | Status |
|----|-------|--------|
| P0-DB | Migrations not in prod | **Resolved** — 53/53 |
| P0-S1 | Refund double-charge | **Fixed** |
| P0-S2 | Webhook claim race | **Fixed** |
| P0-S3 | Duplicate pending payments | **Fixed** — migration + index |
| P0-S4 | Transfer blocked (family_confirmed_at) | **Fixed** |

### P1 — High (remaining)

Subscription uniqueness, booking slot collision, availability DB unique, tip idempotency, notification dedup, duplicate $45 refund (ops), mobile QA.

### P2 / P3

See prior sections — non-blocking for conditional beta.

---

## Operational Tasks (remaining)

1. ~~Apply migrations~~ **Done**  
2. **Deploy** latest `main` to Vercel (trigger redeploy if needed)  
3. **Refund** duplicate $45 via Stripe + Admin Payment Reconciliation  
4. **Delete** duplicate Monday availability slots (James Lopez)  
5. **48h monitor** Sentry + Stripe webhooks + realtime warn logs  
6. **Mobile QA** sign-off  

---

## Architecture / Scalability / Security Risks

| Risk | Level | Mitigation |
|------|-------|------------|
| Double-booking same slot | Medium | P1 migration recommended |
| Duplicate subscriptions | Medium | P1 partial unique index |
| Notification spam on retry | Low | P2 dedup index |
| Realtime at 1000+ chefs | Low | Monitor Supabase Realtime quotas |

---

## Chaos Testing Summary

| Scenario | Result |
|----------|--------|
| 10 concurrent payments | Protected |
| Webhook before/after browser | Converges |
| Duplicate webhook | Protected (claim + idempotency) |
| Two crons overlap | Safe |
| Token refresh during dashboard load | **Improved** — reconnect |
| Rapid Pay clicks | **Protected** — pending payment unique index |

---

## Files Modified (reliability pass)

- `api/_lib/stripe/events.ts` — webhook claim race  
- `api/_lib/stripe/refund.ts` — idempotency + guard  
- `api/_lib/stripe/webhook-handlers.ts` — amount enforcement  
- `client/hooks/useRealtimeDashboard.ts` — token refresh reconnect  
- `client/lib/supabase/sessionUser.ts` — session reads  
- `client/services/supabase/profiles.service.ts` — no getUser on hot path  
- `client/services/supabase/notifications.service.ts` — no getUser on hot path  
- `client/services/supabase/bookings.service.ts` — family_confirmed_at  
- `supabase/migrations/20250706120000_pending_payment_unique.sql`  

See also: `PRODUCTION_READINESS_PHASE_FINAL.md`, `BOOKING_PAYMENT_RECONCILIATION_AUDIT.md`.
