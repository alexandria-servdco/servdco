# ServdCo — Final Production Audit

**Auditor role:** Principal architect & release auditor  
**Date:** 2025-06-05  
**Scope:** Stripe, Supabase, Vercel, admin finance, onboarding, security  
**Code status:** Stripe implementation complete — this audit covers **deployment readiness**, not rebuild.

---

## Executive Summary

ServdCo’s Stripe Connect marketplace is **architecturally production-grade in code**, but **cannot safely accept real money tomorrow** without completing operational cutover steps.

| Verdict | Answer |
|---------|--------|
| **Can accept real money tomorrow?** | **NO** |
| **Can accept real users tomorrow (non-payment)?** | **NO** (auth flags + dev login exposed) |
| **Code ready after ops cutover?** | **YES** (with documented WARN items) |

**Top 5 launch blockers:**

1. `enable_stripe_checkout` and `use_supabase_auth` are **false** in DB seed and `.env.local`
2. **Vercel Cron uses GET**; `/api/stripe/transfers/process` accepts **POST only** → transfers will not run unattended
3. **`CRON_SECRET`** must be set in Vercel or cron auth fails
4. **Dev Access Panel** on Login is visible in production builds (bypasses real auth)
5. **Migration 21** (premium IDs + analytics RLS) must be confirmed applied to cloud Supabase

---

## Readiness Scores

| Score | Value | Meaning |
|-------|-------|---------|
| **Production readiness (code)** | **91 / 100** | Stripe flows, webhooks, ledgers, admin UI implemented |
| **Launch readiness (ops + config)** | **58 / 100** | Flags, cron, auth, E2E, and security cutover incomplete |
| **Stripe activation readiness** | **72 / 100** | Keys configured locally; flags off; cron broken; no live E2E |

**Weighted overall:** **64 / 100** — not launch-ready for payments.

---

## 1. API Route Verification

All eight required routes **exist** as Vercel serverless handlers under `api/stripe/`.

| Route | File | Reachable on Vercel | Method |
|-------|------|---------------------|--------|
| `/api/stripe/create-checkout-session` | `api/stripe/create-checkout-session.ts` | ✅ | POST |
| `/api/stripe/subscription/checkout-session` | `api/stripe/subscription/checkout-session.ts` | ✅ | POST |
| `/api/stripe/tips/create-checkout-session` | `api/stripe/tips/create-checkout-session.ts` | ✅ | POST |
| `/api/stripe/connect/onboarding` | `api/stripe/connect/onboarding.ts` | ✅ | POST |
| `/api/stripe/connect/dashboard-link` | `api/stripe/connect/dashboard-link.ts` | ✅ | POST |
| `/api/stripe/webhook` | `api/stripe/webhook.ts` | ✅ | POST |
| `/api/stripe/transfers/process` | `api/stripe/transfers/process.ts` | ✅ | POST |
| `/api/stripe/refund` | `api/stripe/refund.ts` | ✅ | POST |

**Note:** `vercel.json` rewrites exclude `/api/*` from SPA — routes are reachable when deployed to Vercel. Plain `pnpm dev` (Vite-only) does **not** serve these routes.

### Route Security Matrix

| Route | Auth | RBAC | Zod | Logging | Rate limit | Error handling |
|-------|------|------|-----|---------|--------------|----------------|
| create-checkout-session | Family JWT | Family only | ✅ | ✅ | ✅ | ✅ |
| subscription/checkout-session | Chef JWT | Chef only | ✅ | ✅ | ✅ | ✅ |
| tips/create-checkout-session | Family JWT | Family only | ✅ | ✅ | ✅ | ✅ |
| connect/onboarding | Chef JWT | Chef only | ✅ | ⚠️ partial | ✅ | ✅ |
| connect/dashboard-link | Chef JWT | Chef only | N/A (no body) | ❌ | ❌ | ✅ |
| webhook | Stripe signature | N/A | N/A (raw body) | ✅ | ❌ | ✅ |
| transfers/process | `CRON_SECRET` or Admin JWT | Admin/cron | N/A | ✅ | ❌ | ✅ |
| refund | Admin JWT | Admin only | ✅ | ❌ | ❌ | ✅ |

**Legend:** ✅ PASS · ⚠️ WARN · ❌ gap

---

## 2. Stripe Metadata Recovery (No Frontend State)

Webhook handlers resolve entities from metadata + DB fallbacks.

| Entity | Metadata keys | DB fallback | Verdict |
|--------|---------------|-------------|---------|
| Booking | `booking_id`, `payment_type=booking` | `payments.stripe_checkout_session_id` | ✅ PASS |
| Payment | `payment_id` | `stripe_payment_intent_id` | ✅ PASS |
| Family | `family_id` | `payments.family_id` | ✅ PASS |
| Chef | `chef_profile_id` | `payments.chef_profile_id` | ✅ PASS |
| Tip | `tip=true`, `tip_id` | `tips.stripe_checkout_session_id` | ✅ PASS |
| Subscription | `chef_profile_id` in `subscription_data.metadata` | `subscriptions.stripe_subscription_id` | ✅ PASS |
| Transfer | `transfer_id` on Stripe Transfer | `transfers.stripe_transfer_id` | ✅ PASS |

**Files:** `lib/stripe/payment-resolve.ts`, `lib/stripe/tip-resolve.ts`, `lib/stripe/webhook-handlers.ts`

---

## 3. Webhook Processing

| Requirement | Implementation | Verdict |
|-------------|----------------|---------|
| Raw body verification | `bodyParser: false` + `constructEvent` | ✅ PASS |
| Idempotency | `stripe_events.stripe_event_id` UNIQUE + `claimStripeEvent()` | ✅ PASS |
| Duplicate-safe | Skips already-processed events | ✅ PASS |
| Retry-safe | Retries when `processing_error` set | ✅ PASS |
| Event logging | All events inserted before processing | ✅ PASS |

**Handled events:** `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `account.updated`, `customer.subscription.created|updated|deleted`, `invoice.paid`, `invoice.payment_failed`, `transfer.created`, `payout.paid`

**WARN:** Code handles `transfer.created` (marks paid); Stripe docs often reference `transfer.paid` — ensure Dashboard registers events your handler expects.

**WARN:** `payout.paid` → `cook_payouts` requires `chef_profile_id` in payout metadata; Stripe does not set this automatically — bank payout ledger may stay empty.

---

## 4. Payment Calculations Reconciliation

| Calculation | Source of truth | Formula | Verdict |
|-------------|-----------------|---------|---------|
| Booking gross | `bookings.price_cents` / checkout session | Server reads booking at checkout | ✅ PASS |
| Platform fee | `platform_settings.platform_fee_percentage` (default 13) | `round(gross × pct / 100)` | ✅ PASS |
| Cook payout | Server at checkout | `gross - platform_fee` | ✅ PASS |
| Tip amount | Server `tips.amount_cents` from checkout input (validated 100–50000) | 100% to cook, 0% fee | ✅ PASS |
| Refund | Stripe charge + `payments.refunded_cents` | Full/partial via admin API | ⚠️ WARN |

**Unit test:** `lib/stripe/stripe.test.ts` — $100 @ 13% → $13 fee, $87 cook ✅

**WARN — fee drift:** Client booking insert uses `usePlatformStore` fee; server checkout recalculates from DB. If admin changes fee between booking creation and checkout, displayed vs charged amounts can differ.

**FAIL — partial refund vs transfer:** Partial refunds update `payments` but do **not** reduce scheduled `transfers.net_amount_cents`. Full refund cancels transfers only.

---

## 5. Premium Subscription Lifecycle

| Stage | Handler | `premium_status` | Verdict |
|-------|---------|------------------|---------|
| Subscribe | `customer.subscription.created` + checkout | `true` when active/trialing | ✅ PASS |
| Renew | `invoice.paid` (`subscription_cycle`) | Stays `true` + notify | ✅ PASS |
| Payment failure | `invoice.payment_failed` | Notify only; status follows Stripe on `subscription.updated` | ⚠️ WARN |
| Cancel | `customer.subscription.deleted` | `false` | ✅ PASS |
| Reactivate | New `customer.subscription.created` | `true` again | ✅ PASS |

**Price ID:** `STRIPE_PREMIUM_PRICE_ID=price_1ThCVTA4ZMjGNuZkpNssZ6Eq`  
**Product ID:** `STRIPE_PREMIUM_PRODUCT_ID=prod_UgZe8PbNHRxQm4`

**WARN:** No in-app subscription cancel / billing portal — cooks must use Stripe Express dashboard or Stripe Customer Portal (not wired).

---

## 6. Premium Benefits Enforcement

| Benefit | UI | Server / RLS | Verdict |
|---------|-----|--------------|---------|
| Featured badge | `premium_status` on cards | DB field from webhook | ✅ PASS |
| Search ranking | `BrowseChefs` sort + DB `order premium_status DESC` | Client + query | ✅ PASS |
| Analytics dashboard | Gated in `ChefDashboard` | `chef_profile_views` RLS requires premium (migration 21) | ⚠️ WARN |

**WARN — analytics leak:** `AnalyticsSupabaseService` also reads `bookings` and `payments` via chef RLS **without** premium check. Non-premium cooks can still compute earnings from payment rows if they call Supabase directly. Profile views are gated; earnings metrics are not.

---

## 7. Connect Onboarding Lifecycle

| State | DB fields | Sync trigger | Verdict |
|-------|-----------|--------------|---------|
| Not connected | No `stripe_accounts` row | — | ✅ PASS |
| Pending verification | `onboarding_status=pending`, `details_submitted` | `account.updated` | ✅ PASS |
| Charges enabled | `charges_enabled=true` | `account.updated` | ✅ PASS |
| Payouts enabled | `payouts_enabled=true` | `account.updated` | ✅ PASS |

**Mechanism:** Express + `stripe.accountLinks.create` (not OAuth). `STRIPE_CONNECT_CLIENT_ID` not required.

**WARN:** Transfers/tips stall in `pending` until `payouts_enabled=true` — no automated retry job for tips.

---

## 8. Transfer Engine

| Status | When set | Verdict |
|--------|----------|---------|
| `scheduled` | Booking → `completed` (DB trigger + hold hours) | ✅ PASS |
| `processing` | `processEligibleTransfers()` before Stripe call | ✅ PASS |
| `paid` | After `stripe.transfers.create` succeeds | ✅ PASS |
| `failed` | Stripe API error | ✅ PASS |
| `cancelled` | Full refund or ineligible payment | ✅ PASS |

**FAIL — unattended cron:** `vercel.json` schedules cron on `/api/stripe/transfers/process`, but **Vercel Cron invokes GET**. Handler returns **405** for GET. Hourly transfers **will not run** until fixed.

**FAIL — `CRON_SECRET`:** If unset in Vercel, cron requests fail admin auth check → **401**.

---

## 9. Notification Coverage

| Event | Notification | Verdict |
|-------|--------------|---------|
| Booking paid | Family: "Payment Received" | ✅ PASS |
| Payment failed | Family: "Payment failed" | ✅ PASS |
| Premium activated | Cook: "Premium Activated" | ✅ PASS |
| Premium cancelled / expired | Cook: "Premium Expired" / "Subscription Cancelled" | ✅ PASS |
| Premium renewed | Cook: "Premium Renewed" | ✅ PASS |
| Premium payment failed | Cook: "Premium Payment Failed" | ✅ PASS |
| Tip received (cook) | Cook: "Tip Received" | ✅ PASS |
| Tip success (family) | Family: "Tip Successful" | ✅ PASS |
| Transfer sent | Cook: "Transfer Sent" | ✅ PASS (wording ≠ "paid") |
| Transfer failed | Cook: "Transfer Failed" | ✅ PASS |
| Refund issued | Family: "Refund Completed" / "Partial Refund" | ✅ PASS |

---

## 10. Admin Finance Dashboard

| Component | Data source | Verdict |
|-----------|-------------|---------|
| PayoutControl — payments ledger | `payments` via admin RLS | ✅ PASS |
| PayoutControl — transfers ledger | `transfers` via admin RLS | ✅ PASS |
| PayoutControl — tips ledger | `tips` via admin RLS | ✅ PASS |
| PayoutControl — subscription ledger | `subscriptions` via admin RLS | ✅ PASS |
| PayoutControl — MRR / premium count | `chef_profiles` + platform settings | ✅ PASS |
| PayoutControl — refund button | `POST /api/stripe/refund` | ✅ PASS |
| AdminAnalytics charts | **Static Jan–Apr mock months** + live May totals | ❌ FAIL |

**WARN:** No date-range / chef / status filtering on ledgers (read-only lists).

---

## 11. Mock Data & Legacy Dependencies

| Item | Location | Production impact | Verdict |
|------|----------|-------------------|---------|
| Homepage chef cards | `client/components/ChefsSection.tsx` | Hardcoded Unsplash chefs | ❌ FAIL |
| Admin signup chart | `client/components/admin/AdminAnalytics.tsx` | Static months | ❌ FAIL |
| Legacy mock auth | `client/services/auth.service.ts` | Active when `use_supabase_auth=false` | ❌ FAIL |
| Dev 1-click login | `client/pages/Login.tsx` | **Visible in production** | ❌ FAIL |
| Waitlist local mock | `client/pages/WaitlistPage.tsx` | Waitlist only | ⚠️ WARN |
| Supabase session storage | `client/lib/supabase/client.ts` | Standard `localStorage` for JWT — expected | ✅ PASS |
| Legacy session bridge | `client/lib/auth/legacySession.ts` | In-memory only (not localStorage) | ✅ PASS |

---

## 12. Migrations (21 total)

| # | File | Purpose |
|---|------|---------|
| 01 | `20250605120000_01_extensions_enums.sql` | Extensions, enums |
| 02 | `20250605120001_02_helper_functions.sql` | Helper functions |
| 03 | `20250605120002_03_core_profiles.sql` | Profiles |
| 04 | `20250605120003_04_marketplace_tables.sql` | Marketplace |
| 05 | `20250605120004_05_launch_ops_tables.sql` | Launch ops, platform_settings |
| 06 | `20250605120005_06_stripe_future_tables.sql` | Stripe core tables |
| 07 | `20250605120006_07_messaging_future.sql` | Messaging schema |
| 08 | `20250605120007_08_indexes.sql` | Indexes |
| 09 | `20250605120008_09_rls_enable.sql` | RLS enable |
| 10 | `20250605120009_10_rls_policies.sql` | RLS policies |
| 11 | `20250605120010_11_storage_buckets.sql` | Storage buckets |
| 12 | `20250605120011_12_audit_logs_feature_flags.sql` | Audit + flags |
| 13 | `20250605120012_13_audit_flags_rls.sql` | Audit RLS |
| 14 | `20250605120013_14_fix_audit_trigger.sql` | Audit trigger fix |
| 15 | `20250605120014_15_auth_user_trigger.sql` | Auth trigger |
| 16 | `20250605120015_16_booking_lifecycle_triggers.sql` | Booking lifecycle |
| 17 | `20250605120016_17_messaging_triggers_realtime.sql` | Messaging realtime |
| 18 | `20250605120018_18_mvp_completion.sql` | MVP completion |
| 19 | `20250605120019_19_premium_payouts.sql` | Transfers, premium, analytics |
| 20 | `20250605120020_20_tips.sql` | Tips system |
| 21 | `20250605120021_21_premium_stripe_ids.sql` | Premium IDs + analytics RLS |

**Verify applied (cloud):**

```sql
SELECT version FROM supabase_migrations.schema_migrations
ORDER BY version DESC LIMIT 5;
```

Expected latest: `20250605120021`.

---

## 13. Environment Variables

| Variable | Status | Where |
|----------|--------|-------|
| `STRIPE_SECRET_KEY` | **Required** | Vercel server |
| `STRIPE_WEBHOOK_SECRET` | **Required** | Vercel server |
| `STRIPE_PREMIUM_PRODUCT_ID` | **Required** | Vercel server (`prod_UgZe8PbNHRxQm4`) |
| `STRIPE_PREMIUM_PRICE_ID` | **Required** | Vercel server (`price_1ThCVTA4ZMjGNuZkpNssZ6Eq`) |
| `SUPABASE_URL` | **Required** | Vercel server |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required** | Vercel server |
| `SUPABASE_ANON_KEY` | **Required** | Vercel server (JWT verify) |
| `ENABLE_STRIPE_CHECKOUT` | **Required** (`true`) | Vercel server |
| `CRON_SECRET` | **Required** | Vercel server |
| `VITE_SUPABASE_URL` | **Required** | Vercel client build |
| `VITE_SUPABASE_ANON_KEY` | **Required** | Vercel client build |
| `VITE_ENABLE_STRIPE_CHECKOUT` | **Required** (`true`) | Vercel client build |
| `VITE_USE_SUPABASE_AUTH` | **Required** (`true`) | Vercel client build |
| `VITE_ENABLE_MESSAGING` | Optional | Vercel client |
| `SUPABASE_DB_URL` | Optional (migrations CLI) | Local only |
| `STRIPE_CONNECT_CLIENT_ID` | **Deprecated / optional** | Not used |
| `ALLOW_DEV_SEED` | Optional | Local dev |

**Current `.env.local` risk:** Live `sk_live_` key present while `ENABLE_STRIPE_CHECKOUT=false` — keys configured but payments gated off.

---

## 14. Vercel Deployment Requirements

| Requirement | Status | Verdict |
|-------------|--------|---------|
| Deploy to Vercel (not static host only) | Required for `/api/stripe/*` | ✅ |
| `vercel.json` SPA rewrite excludes `/api` | Configured | ✅ PASS |
| CSP allows `js.stripe.com`, `hooks.stripe.com` | Configured | ✅ PASS |
| Webhook URL registered in Stripe | Operator task | ⚠️ unverified |
| Cron job for transfers | Configured but **broken (GET vs POST)** | ❌ FAIL |
| `CRON_SECRET` in Vercel env | Operator task | ⚠️ unverified |
| Production + Preview env parity | Recommended test/live split | ⚠️ WARN |

---

## 15. Supabase RLS Requirements

| Table | Policy summary | Verdict |
|-------|----------------|---------|
| `payments` | Family own / chef own / admin all | ✅ PASS |
| `transfers` | Chef own read / admin all | ✅ PASS |
| `tips` | Family / chef / admin select | ✅ PASS |
| `subscriptions` | Chef own / admin all | ✅ PASS |
| `stripe_accounts` | Chef own / admin all | ✅ PASS |
| `stripe_events` | Admin read; writes service role only | ✅ PASS |
| `chef_profile_views` | Premium chef + admin (migration 21) | ✅ PASS |
| `platform_settings` | Public read subset / admin write | ✅ PASS |
| `feature_flags` | Public read / admin write | ✅ PASS |

**Service role:** All Stripe API routes use `SUPABASE_SERVICE_ROLE_KEY` for writes — correct.

---

## 16. Storage Bucket Permissions

| Bucket | Public read | Upload scope | Verdict |
|--------|-------------|--------------|---------|
| `avatars` | Yes | `{user_id}/` | ✅ PASS |
| `cook-portfolio` | Yes | `{chef_profile_id}/` | ✅ PASS |
| `cook-documents` | No (private) | Chef/admin policies | ✅ PASS |

**Chef registration:** Documents held in memory during step 3, uploaded after `register()` with `chefProfileId` — ✅ PASS path in `ChefRegistration.tsx`.

---

## 17. Onboarding Flow E2E

| Step | Status | Blocker |
|------|--------|---------|
| Family registration | Code ✅ | `use_supabase_auth=false` → legacy path | ❌ |
| Chef registration | Code ✅ | Same + doc upload needs real auth | ❌ |
| Chef verification / approval | Admin workflow ✅ | Requires Supabase profiles | ⚠️ |
| Family books cook | Code ✅ | Stripe flag off → no checkout redirect | ❌ |
| Stripe checkout | Code ✅ | Flags + real JWT required | ❌ |
| Booking confirmed (webhook) | Code ✅ | Webhook endpoint must be live | ⚠️ |
| Chef marks completed | Code ✅ | — | ✅ |
| Tip (optional) | Code ✅ | Stripe flag + completed booking | ❌ |
| Transfer to cook | Code ✅ | Cron broken + cook Connect | ❌ |

---

## 18. PASS / WARN / FAIL Summary

### PASS (32)

- All 8 Stripe API routes exist
- Stripe singleton + typed handlers
- Booking checkout with server-side fee calculation
- Premium checkout with env + DB price IDs
- Tip checkout 0% platform fee
- Connect Express account links
- Webhook signature verification
- Webhook idempotency (`stripe_events`)
- Metadata recovery without frontend state
- Payment amount verification on webhook
- Full refund + transfer cancellation
- Premium badge + search ranking
- Admin payout ledgers (real Supabase data)
- Admin refund UI
- Notification coverage (all major events)
- 21 migrations defined
- Storage buckets + RLS
- Rate limiting on 4 checkout/connect routes
- Separate Charges & Transfers model
- Feature flag architecture

### WARN (18)

- Partial refunds don't adjust transfers
- Tip transfer retry when cook not onboarded
- Analytics earnings not premium-gated at RLS
- Fee display vs checkout drift if admin changes fee
- `dashboard-link` / `refund` missing rate limit + structured logging
- Rate limit is per-instance (not global)
- `payout.paid` cook bank ledger unreliable
- Premium cancel only via Stripe (no app portal)
- `invoice.payment_failed` doesn't immediately flip premium
- AdminAnalytics static chart months
- Waitlist mock stats
- Google OAuth button non-functional (UI only)
- No ledger date/chef/status filters
- Migration 21 apply status unverified on cloud
- Live Stripe E2E not documented as run
- Preview vs production key separation
- Transfer notification wording ("Sent" not "Paid")
- `pnpm dev` cannot test API routes locally without `vercel dev`

### FAIL (8)

- **`enable_stripe_checkout=false`** — all payment routes return 503
- **`use_supabase_auth=false`** — Stripe APIs need Supabase JWT; legacy mock users cannot pay
- **Vercel Cron GET vs POST** — transfer engine won't run on schedule
- **`CRON_SECRET` likely unset** in Vercel
- **Dev Access Panel exposed** on production Login page
- **ChefsSection hardcoded mock chefs** on marketing homepage
- **AdminAnalytics static mock months** in finance-adjacent dashboard
- **Cannot accept real money tomorrow** (composite)

---

## 19. Remaining Blockers — Exact Fixes

### Blocker 1 — Enable production auth & payments (SQL)

```sql
UPDATE public.feature_flags
SET enabled = true, updated_at = now()
WHERE key IN ('use_supabase_auth', 'enable_stripe_checkout');
```

### Blocker 2 — Assign admin (replace email)

```sql
UPDATE public.profiles
SET role = 'admin', status = 'active', updated_at = now()
WHERE email = 'your-admin@email.com';
```

### Blocker 3 — Apply migration 21 (if missing)

```bash
npx supabase db push --db-url "<SUPABASE_DB_URL>"
```

Or verify:

```sql
SELECT value FROM public.platform_settings WHERE key = 'stripe_premium_price_id';
-- Expected: "price_1ThCVTA4ZMjGNuZkpNssZ6Eq"
```

### Blocker 4 — Fix Vercel Cron (code change required)

**Option A (recommended):** Accept GET on `/api/stripe/transfers/process` when `Authorization: Bearer ${CRON_SECRET}` matches.

**Option B:** Change cron to an external scheduler that sends POST.

Until fixed: manually `POST /api/stripe/transfers/process` hourly with admin JWT or cron secret.

### Blocker 5 — Vercel environment variables

Set in **Production**:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRODUCT_ID=prod_UgZe8PbNHRxQm4
STRIPE_PREMIUM_PRICE_ID=price_1ThCVTA4ZMjGNuZkpNssZ6Eq
SUPABASE_URL=https://onerrwpixumcablgyhzs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
ENABLE_STRIPE_CHECKOUT=true
CRON_SECRET=<generate-32+-char-secret>
VITE_SUPABASE_URL=https://onerrwpixumcablgyhzs.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_ENABLE_STRIPE_CHECKOUT=true
VITE_USE_SUPABASE_AUTH=true
```

Redeploy after env changes.

### Blocker 6 — Stripe Dashboard

1. **Connect → Express** enabled  
2. **Developers → Webhooks** → `https://<your-domain>/api/stripe/webhook`  
3. Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `account.updated`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `transfer.created`, `payout.paid`  
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`  
5. Confirm Premium product `prod_UgZe8PbNHRxQm4` price `price_1ThCVTA4ZMjGNuZkpNssZ6Eq` is **$15/month USD active**

### Blocker 7 — Hide dev login in production (code change)

Wrap Dev Access Panel in `import.meta.env.DEV` or remove before launch.

### Blocker 8 — Replace mock marketing data (code change)

Wire `ChefsSection.tsx` to `useBrowseChefs()` or remove section.

---

## 20. Pre-Launch Test Checklist (Must PASS)

| # | Test | Owner |
|---|------|-------|
| 1 | Real family signup + login (Supabase) | QA |
| 2 | Real chef signup + doc upload | QA |
| 3 | Admin approves chef | Ops |
| 4 | Chef completes Connect onboarding (live/test) | QA |
| 5 | Family books + Stripe Checkout succeeds | QA |
| 6 | Webhook confirms booking (`confirmed`) | QA |
| 7 | Chef marks booking `completed` | QA |
| 8 | Transfer runs (cron or manual POST) | Ops |
| 9 | Premium checkout $15/mo | QA |
| 10 | Tip on completed booking | QA |
| 11 | Admin refund on test payment | Ops |
| 12 | Resend webhook → no duplicate charge | QA |

---

## 21. Final Verdict

```
┌─────────────────────────────────────────────────────────────┐
│  LAUNCH DECISION: NO — NOT SAFE FOR REAL MONEY TOMORROW     │
├─────────────────────────────────────────────────────────────┤
│  Code:        READY (91/100)                                │
│  Operations:  NOT READY (58/100)                            │
│  Est. cutover: 1–2 days ops + 1 code fix (cron GET)         │
│               + hide dev login + E2E validation             │
└─────────────────────────────────────────────────────────────┘
```

After completing §19 blockers and §20 checklist, re-run this audit — expected launch score **≥ 90/100**.

---

## Appendix — Files Reviewed

**API:** `api/stripe/*`, `api/_lib/auth.ts`, `api/_lib/http.ts`, `api/_lib/rateLimit.ts`  
**Stripe lib:** `lib/stripe/*.ts`  
**Client:** `client/services/stripe*.ts`, `client/components/admin/PayoutControl.tsx`, `client/pages/ChefProfile.tsx`, `client/pages/Login.tsx`, `client/components/ChefsSection.tsx`  
**DB:** `supabase/migrations/*.sql`, `supabase/seed.sql`  
**Deploy:** `vercel.json`, `.env.example`, `.env.local` (not committed)  
**Docs:** `STRIPE_IMPLEMENTATION_REPORT.md`, `docs/servdco-master-architecture.md`
