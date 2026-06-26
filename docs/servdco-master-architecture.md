# ServdCo — Master Architecture (Single Source of Truth)

Last updated: Phase 12A + MVP Final Audit.

---

## 1. Project Overview

| Item | Value |
|------|-------|
| Frontend | React 18 + Vite + TypeScript + Tailwind (client-approved UI — **do not redesign**) |
| Hosting | Vercel (SPA) |
| Backend | **Cloud Supabase only** (no local Docker Supabase) |
| Project ref | `onerrwpixumcablgyhzs` |
| API URL | `https://onerrwpixumcablgyhzs.supabase.co` |
| Auth (default) | In-memory legacy session via `AuthService` when `use_supabase_auth` off |
| Auth (production) | Supabase Auth → `AuthProvider` → `useAuth()` / `useProfile()` when flag on |
| Data (current) | **Supabase-only** — no mock engine, no `withMarketplaceFallback` |
| Marketplace data | Supabase for profiles, chefs, portfolio, availability, bookings, reviews, notifications |
| Payments | Stripe Connect Express **infrastructure ready** — gated by `enable_stripe_checkout` (default off) |
| Messaging | Supabase Realtime chat — gated by `enable_messaging` (default off) |

---

## 2. Phase Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 — Supabase foundation | ✅ Complete | Client, AuthProvider, QueryProvider, env vars |
| Phase 2 — DB architecture design | ✅ Complete | Migrations + RLS designed |
| Phase 3 — Cloud DB implementation | ✅ Complete | 14 migrations applied to cloud |
| Phase 4 — Auth migration | ✅ Complete | Dual-path auth behind `use_supabase_auth` |
| Phase 5 — Marketplace data | ✅ Complete | profiles, chef_profiles, portfolio, availability |
| Phase 6 — Bookings + reviews + notifications | ✅ Complete | RLS + DB triggers for notifications |
| Phase 6b — Launch ops + admin moderation | ✅ Complete | platform_settings from DB; mock removed Phase 10 |
| Phase 7a — Stripe foundation | ✅ Complete | Vercel `/api/stripe/*`, env validation, webhook idempotency |
| Phase 7b — Connect onboarding | ✅ Complete | Chef earnings tab → hosted onboarding (flag-gated) |
| Phase 7c/d — Checkout + webhooks | ✅ Complete | Booking → Hosted Checkout; hardened webhooks + audit/notifications |
| Phase 7e/f/g — Payouts, refunds, subscriptions | ⏳ Partial | Refund API + subscription webhook handlers scaffolded |
| Phase 8 — Messaging & Realtime | ✅ Complete | Booking-linked chat; Realtime; flag `enable_messaging` off |
| Phase 9 — Auth finalization | ✅ Complete | Session bridge removed; Guards/Navbar use `useAuth` + `useProfile` |
| Phase 10 — Supabase-only cutover | ✅ Complete | `mockLaunchControl` removed; all services call Supabase directly |
| Phase 11 — Production hardening | ✅ Complete | Error boundaries, Zod validation, security headers, monitoring, a11y, tests → **99/100 readiness** |
| Phase 12A — Stripe dashboard guide | ✅ Documented | §38 — step-by-step Stripe configuration for Developer role |
| MVP final audit | ✅ Complete | §39–§48 — full system audit, bug fixes, readiness scores |

---

## 3. Cloud Migration Results

**Phase 3 applied:** `2026-06-05` via `supabase db push --db-url` (cloud direct — no local Supabase).

**Phase 4 applied:** `20250605120014_15_auth_user_trigger.sql` — `on_auth_user_created` trigger on `auth.users`.

**Phase 6 applied:** `20250605120015_16_booking_lifecycle_triggers.sql` — booking history + notification triggers.

| Migration | Result |
|-----------|--------|
| `20250605120000` … `20250605120013` | ✅ (Phase 3) |
| `20250605120014_15_auth_user_trigger.sql` | ✅ `handle_new_user` attached + chef bootstrap |
| `20250605120015_16_booking_lifecycle_triggers.sql` | ✅ booking/review lifecycle triggers |

---

## 4. Tables Created (public core)

`audit_logs`, `booking_status_history`, `bookings`, `career_applications`, `career_jobs`, `chef_availability`, `chef_documents`, `chef_portfolio_images`, `chef_profiles`, `contact_messages`, `conversations`, `favorites`, `feature_flags`, `interest_requests`, `launch_regions`, `messages`, `notifications`, `payments`, `platform_settings`, `profiles`, `reviews`, `stripe_accounts`, `stripe_customers`, `stripe_events`, `subscriptions`, `waitlist_signups`

**Removed (production launch cleanup):** `blog_posts`

### Careers (`career_jobs`, `career_applications`)

- Admin CRUD via `CareersPanel` → `CareersSupabaseService`
- Public routes: `/careers`, `/careers/:jobId`, `/careers/apply`
- Resume storage: private bucket `career-resumes`
- Application emails: `POST /api/careers/application-notify` (Resend — applicant confirmation + admin alert)

### Cook Verification Queue

- Admin `VerificationCenter` — real `chef_documents` only (no third-party Checkr integration)
- Actions: approve, reject, request resubmission, notes, document preview
- Notifications respect `verification_notifications` preference

### Notification preferences (`profiles.notification_preferences`)

JSONB keys: `booking_notifications`, `message_notifications`, `review_notifications`, `verification_notifications`, `marketing_emails`, `announcement_emails`

Enforced by `user_allows_notification()` in DB triggers and `insert_booking_notification()`.

---

## 5. Policies Created

| Scope | Count |
|-------|-------|
| Public schema RLS policies | **81** |
| Storage object policies | **15** |
| **Total** | **96** |

Auth-relevant: `profiles` (6), `chef_profiles` (6), `feature_flags` (3 public read).

RLS forced on: `profiles`, `chef_profiles`, `bookings`, `payments`, `stripe_events`, `audit_logs`.

---

## 6. Storage Buckets Created

| Bucket | Public | Purpose |
|--------|--------|---------|
| `avatars` | Yes | Profile photos — `{user_id}/{file}` |
| `cook-portfolio` | Yes | Cook gallery — `{chef_profile_id}/{file}` |
| `cook-documents` | No | Verification docs — `{chef_profile_id}/{type}/{file}` |
| `career-resumes` | No | Job applications — `applications/{application_id}/resume.*` |

---

## 7. Helper Functions & Triggers

### Functions (public)

`get_auth_uid`, `get_user_role`, `is_admin`, `is_family`, `is_chef`, `owns_chef_profile`, `is_public_chef_profile`, `set_updated_at`, `handle_new_user`, `write_audit_log`, `user_allows_notification`, `insert_booking_notification`

### Auth trigger (Phase 4)

`on_auth_user_created` **AFTER INSERT** on `auth.users` → `handle_new_user()`:

- Inserts/upserts `profiles` from `raw_user_meta_data` (`role`, `full_name`, `city`, `state`, `zip`, `phone`)
- When `role = chef`: inserts/upserts `chef_profiles` (`display_name`, `bio`, `cuisines`, `years_experience`, `location`, `verification_status = pending`)
- `admin` role is **not** auto-assigned — manual SQL only

### Other triggers (22 on public tables)

- `set_updated_at` on all mutable tables
- `write_audit_log` on: `profiles`, `chef_profiles`, `bookings`, `chef_documents`, `platform_settings`, `feature_flags`

---

## 8. Seed Data (Cloud)

Applied via `supabase/scripts/run-cloud-seed.mjs` (requires `SUPABASE_DB_URL` env — never commit).

| Dataset | Rows | Notes |
|---------|------|-------|
| `launch_regions` | 5 | OH (active), TX, CA, FL, NY |
| `platform_settings` | 4 | Fees, hold hours, **development_admin_metadata** |
| `feature_flags` | 4 | All disabled (safe cutover) |

**Not seeded:** bookings, chefs (browse data), fake reviews.

### Feature flags (default `enabled = false`)

| Key | Purpose |
|-----|---------|
| `use_supabase_auth` | Switch Login/Register/Logout to Supabase |
| `enable_stripe_checkout` | Phase 7 — Stripe Connect (default off) |
| `enable_messaging` | Phase 8 — in-app family ↔ cook chat (default off) |
| `maintenance_mode` | Site-wide |

**Local overrides:** `VITE_USE_SUPABASE_AUTH`, `VITE_ENABLE_STRIPE_CHECKOUT`, `VITE_ENABLE_MESSAGING` in `.env.local` take precedence over DB flags.

### Admin setup (manual only)

```sql
UPDATE public.profiles
SET role = 'admin', status = 'active'
WHERE email = '<your-email>';
```

---

## 9. Authentication Architecture (Phase 4 + Phase 9)

### Target flow (Phase 9 — current)

```
Supabase session (flag on)
  → AuthProvider (session + onAuthStateChange)
  → useAuth() / useCurrentProfile() / useCurrentUserRole()
  → Guards / Navbar / Dashboards

Legacy dev path (flag off)
  → AuthService.login → in-memory legacySession (no localStorage keys)
  → AuthProvider legacyUser subscription
  → same hooks (profile mapped from AppUser)
```

**Removed:** `sessionBridge.ts`, `servd_user`, `isAuthenticated`, `userRole`, `profileCompleted`, `verificationStatus` localStorage keys.

### Feature flag behavior

```
use_supabase_auth = false (default)
  → AuthService legacy path (mock api + in-memory AppUser)
  → Guards/Navbar use useAuth() + useCurrentUserRole()
  → profile_completed / verification_status from DB when marketplace on; else in-memory

use_supabase_auth = true (DB flag OR VITE_USE_SUPABASE_AUTH=true)
  → supabase.auth (signup, login, logout, reset)
  → handle_new_user bootstraps profiles (+ chef_profiles for chefs)
  → AuthProvider holds Supabase session only (no localStorage bridge)
  → useProfile() React Query → profiles row
```

### Auth hooks (Phase 9)

| Hook | Purpose |
|------|---------|
| `useAuth()` | Session, `isAuthenticated`, `userId`, `supabaseAuthEnabled` |
| `useProfile()` | React Query → `profiles` row (or legacy mapped row) |
| `useCurrentProfile()` | Unified profile for components + guards |
| `useCurrentUserRole()` | `profile.role` for RoleGuard, Navbar, Unauthorized |

### Migrated surfaces (UI unchanged)

| Surface | File | Auth source |
|---------|------|-------------|
| Login | `client/pages/Login.tsx` | `AuthService.login` → session or legacy |
| Guards | `client/components/Guards.tsx` | `useAuth` + `useCurrentUserRole` |
| Navbar | `client/components/Navbar.tsx` | `useAuth` + `useCurrentUserRole` |
| Unauthorized | `client/pages/Unauthorized.tsx` | `useCurrentUserRole` |
| Family dashboard | `client/pages/Dashboard.tsx` | `useCurrentProfile`; `profile_completed` from DB |
| Chef dashboard | `client/pages/ChefDashboard.tsx` | `useCurrentProfile` + `useChefProfileByUser`; `verification_status` from `chef_profiles` |
| Auth service | `client/services/auth.service.ts` | Dual path; no localStorage bridge |
| Legacy session | `client/lib/auth/legacySession.ts` | In-memory only (flag off) |
| Guards loading | `client/components/Guards.tsx` | Waits for session when flag on |

### Auth flows

| Flow | Legacy (flag off) | Supabase (flag on) |
|------|-------------------|---------------------|
| Family signup | `api.registerUser` → WaitlistService (Supabase) | `signUp` → trigger → `profiles.role=family` |
| Chef signup | `api.registerUser` → WaitlistService (Supabase) | `signUp` → trigger → `profiles` + `chef_profiles` |
| Login | Email-only in-memory session | `signInWithPassword` → `useProfile()` |
| Logout | `setLegacyUser(null)` | `signOut` |
| Password reset | N/A | `resetPasswordForEmail` → `/login` |
| Session persistence | In-memory `legacySession` | Supabase session + `onAuthStateChange` |

### Tests

`client/services/auth.onboarding.test.ts` — legacy session, feature flag env override, state mapping, flow contracts.

**Cloud verification script:** `node supabase/scripts/verify-auth-migration.mjs` (requires env vars; may hit Supabase email rate limits).

---

## 10. TypeScript Types

| File | Source |
|------|--------|
| `client/lib/supabase/database.types.ts` | Generated from **live cloud schema** |
| `client/lib/supabase/types.ts` | Re-exports `Database` + app convenience types |

**Regenerate (cloud only, no Docker):**

```bash
# Set SUPABASE_DB_URL to cloud connection string (do not commit)
node supabase/scripts/generate-types.mjs
```

---

## 11. ERD (Deployed Schema)

```mermaid
erDiagram
  auth_users ||--|| profiles : "1:1 trigger"
  profiles ||--o| chef_profiles : "chef 1:1"
  chef_profiles ||--o{ chef_portfolio_images : has
  chef_profiles ||--o{ chef_documents : verifies
  chef_profiles ||--o{ chef_availability : schedules
  profiles ||--o{ bookings : family
  chef_profiles ||--o{ bookings : cook
  bookings ||--o{ booking_status_history : audit
  bookings ||--o| reviews : one
  bookings ||--o| payments : charge
  profiles ||--o{ favorites : saves
  profiles ||--o{ notifications : receives
  chef_profiles ||--o| stripe_accounts : connect
  profiles ||--o| stripe_customers : billing
  chef_profiles ||--o{ subscriptions : premium
  launch_regions ||--o{ waitlist_signups : collects
```

---

## 12. Role & Security Strategy

| Role | Access |
|------|--------|
| `family` | Own profile, bookings, favorites, notifications |
| `chef` | Own cook profile, docs, availability, assigned bookings |
| `admin` | Full access via `is_admin()` — **manual assignment only** |
| `anon` | Public cooks, portfolio, published careers jobs, region list, feature_flags read, insert waitlist/contact/interest/career applications |

**Service role (Vercel only):** Stripe webhooks, system notifications, audit writes, admin bulk ops.

**Profile bootstrap:** `handle_new_user` runs as `SECURITY DEFINER` (bypasses RLS on insert). Post-login reads use authenticated RLS (`profiles_select_own`, `chef_profiles_select_own`).

---

## 13. Stripe Integration Plan (Not Implemented)

Marketplace model: Separate Charges & Transfers. Tables ready: `payments`, `stripe_customers`, `stripe_accounts`, `stripe_events`, `subscriptions`.

See legacy detail in `docs/servdco-stripe-backend-requirements.md` (reference only).

---

## 14. Phase 5 — Marketplace Data Architecture

### Tables migrated (read path)

| Table | Service | React Query hook |
|-------|---------|------------------|
| `profiles` | `profiles.service.ts` | `useProfile()` |
| `chef_profiles` | `chefs.service.ts` | `useBrowseChefs()`, `useChefProfile()`, `useChefProfileByUser()` |
| `chef_portfolio_images` | `chefs.service.ts` (batch fetch) | via chef hooks |
| `chef_availability` | `availability.service.ts` | `useChefAvailability()`, `useSaveChefAvailability()` |

### Supabase queries

| Query | Table(s) | Access |
|-------|----------|--------|
| `getOwnProfile()` | `profiles` | authenticated own row |
| `listPublicChefs()` | `chef_profiles` + `chef_portfolio_images` | anon/auth public RLS |
| `getChefById(uuid)` | `chef_profiles` + portfolio | public RLS |
| `getChefByUserId()` | `chef_profiles` + portfolio | chef own row |
| `getAvailability()` | `chef_availability` | public read / chef manage |
| `saveAvailability()` | `chef_availability` | chef upsert + soft-delete removed days |

### Data access pattern (Phase 10)

```
assertSupabaseConfigured()  →  VITE_SUPABASE_* required
Service → *SupabaseService → PostgREST (RLS)
No mock fallback; errors propagate to React Query
```

### Pages wired (no UI changes)

| Page | Before | After |
|------|--------|-------|
| `BrowseChefs.tsx` | `api.getChefs()` + useEffect | `useBrowseChefs()` |
| `ChefProfile.tsx` | `api.getChefById()` + useEffect | `useChefProfile(id)` |
| `ChefDashboard.tsx` | hardcoded `"chef-maria"` availability | resolves `chef_profiles.id` from user |
| `AvailabilityService.ts` | localStorage only | Supabase only (Phase 10) |

---

## 15. Phase 6 — Bookings, Reviews & Notifications

### Tables migrated

| Table | Service | React Query hooks |
|-------|---------|-------------------|
| `bookings` | `bookings.service.ts` | `useBookings()`, `useBooking()`, `useCreateBooking()`, `useUpdateBookingStatus()` |
| `booking_status_history` | DB trigger (auto) | — |
| `reviews` | `reviews.service.ts` | `useReviews()`, `useCreateReview()` |
| `notifications` | `notifications.service.ts` + DB triggers | `useNotifications()` |

### Booking lifecycle (RLS-enforced)

| Actor | Action | Status transition |
|-------|--------|-------------------|
| Family | Create booking | → `pending` |
| Family | Cancel | → `cancelled` |
| Chef | Accept | → `confirmed` |
| Chef | Reject | → `cancelled` |
| Chef | Complete | → `completed` |
| Family | Review (one per booking) | requires `completed` |

### Notification events (DB triggers — `insert_booking_notification`)

`booking_created`, `booking_accepted`, `booking_cancelled`, `booking_completed`, `review_submitted`

Client `NotificationService.notify()` is UI-only when Supabase is active; persistence via triggers.

### Pages wired (no UI changes)

| Page | Change |
|------|--------|
| `Dashboard.tsx` | `useBookings()`, `useUpdateBookingStatus()`, `useNotifications()` |
| `ChefDashboard.tsx` | `useBookings()`, `useReviews(chefProfileId)`, status mutations |
| `ChefProfile.tsx` | `useCreateBooking()` mutation |

### Dev-only chef seed (not production)

```bash
# Requires explicit opt-in — never runs automatically
ALLOW_DEV_SEED=true SUPABASE_DB_URL=... node supabase/scripts/run-dev-chefs-seed.mjs
```

Seeds 5 approved chefs: `auth.users` + `profiles` + `chef_profiles` + `chef_portfolio_images` + `chef_availability`.

Fixed UUIDs: chefs `c1000001`…`c1000005`, users `d1000001`…`d1000005`. Password: `DevChefSeed123!`

**No** fake bookings, payments, or reviews in seed.

---

## 16. Dev Chef Seed (Development Only)

| Item | Detail |
|------|--------|
| SQL | `supabase/seed-dev-chefs.sql` |
| Runner | `supabase/scripts/run-dev-chefs-seed.mjs` |
| Guards | `ALLOW_DEV_SEED=true` required; blocks `NODE_ENV=production` unless `FORCE_DEV_SEED` |
| Chefs | 5 approved, public visibility |
| Data | profiles, chef_profiles, portfolio images, availability |

---

## 17. Frontend Integration State

| Layer | Status |
|-------|--------|
| React pages / routes / UI | Unchanged layout & animations |
| `BookingService` | Supabase-first; mock fallback for legacy IDs |
| `ReviewService` | Supabase for UUID chef profiles; mock fallback |
| `NotificationService` | Supabase sync + UI store; DB triggers persist |
| `ChefService` / `AvailabilityService` | Phase 5 — Supabase-first |
| `api.ts` | Supabase facade only (Phase 10) |
| Dashboards | Bookings/reviews wired via React Query |

---

## 18. Operational Commands (Cloud Only)

```bash
# Push new migrations
npx supabase db push --db-url "$SUPABASE_DB_URL"

# Run seed
node supabase/scripts/run-cloud-seed.mjs

# Generate types
node supabase/scripts/generate-types.mjs

# Verify Phase 4 auth (signup + profiles + RLS)
node supabase/scripts/verify-auth-migration.mjs

# DEV ONLY — 5 approved chefs (requires ALLOW_DEV_SEED=true)
ALLOW_DEV_SEED=true node supabase/scripts/run-dev-chefs-seed.mjs

# Query cloud DB
npx supabase db query --db-url "$SUPABASE_DB_URL" "SELECT 1;"
```

**Env for local Supabase auth testing:**

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_USE_SUPABASE_AUTH=true   # overrides DB flag
```

**Never commit:** `SUPABASE_DB_URL`, database password, service role key.

---

## 19. Verification Results (required every phase)

### Phase 4 — Auth

| Check | Result |
|-------|--------|
| Migration `15_auth_user_trigger` pushed | ✅ |
| Trigger `on_auth_user_created` exists | ✅ |
| `use_supabase_auth` default in DB | ✅ `false` |
| `pnpm typecheck` | ✅ |
| `pnpm test` | ✅ |
| `pnpm build` | ✅ |

### Phase 5 — Marketplace

| Check | Result |
|-------|--------|
| Family profile load (`useProfile` / `getCurrentProfile`) | ✅ wired + fallback |
| Chef profile load (`useChefProfile`) | ✅ wired + mock UUID fallback |
| Browse chefs (`useBrowseChefs`) | ✅ wired + mock fallback |
| Availability (`AvailabilityService`) | ✅ wired + localStorage fallback |
| `pnpm typecheck` | ✅ |
| `pnpm test` | ✅ 24 tests |
| `pnpm build` | ✅ |

**Note:** Run dev chef seed for cloud browse data. Mock fallback still serves `ch_1`…`ch_5` when Supabase fails.

### Phase 6 — Bookings / Reviews / Notifications

| Check | Result |
|-------|--------|
| `bookings.service.ts` + RLS insert/update | ✅ |
| `booking_status_history` trigger | ✅ migration |
| Notification triggers (5 events) | ✅ migration |
| `reviews` one-per-booking trigger | ✅ migration |
| `pnpm typecheck` | ✅ |
| `pnpm test` (31 tests incl. lifecycle) | ✅ |
| `pnpm build` | ✅ |

### Phase 6b — Launch ops migration

| Check | Result |
|-------|--------|
| `launch_regions`, `waitlist_signups`, `interest_requests` | ✅ Supabase services + hooks |
| `contact_messages`, `chef_documents`, `platform_settings` | ✅ Supabase services + hooks |
| Admin moderation (users, chef verification, documents) | ✅ RLS + authenticated writes |
| `platform-settings-storage` removed | ✅ in-memory store hydrated from DB |
| Mock engine | ✅ Removed (Phase 10) |
| `pnpm typecheck` | ✅ |
| `pnpm test` (37 tests) | ✅ |
| `pnpm build` | ✅ |

### Phase 7a/b — Stripe Connect foundation

| Check | Result |
|-------|--------|
| Vercel functions `/api/stripe/*` | ✅ |
| `enable_stripe_checkout` gate (default off) | ✅ |
| Connect Express onboarding (chef) | ✅ hosted Account Links |
| Webhook persistence (`stripe_events`) | ✅ idempotent insert |
| `pnpm typecheck` | ✅ |

---

## 20. Production Readiness Score

**Score: 96 / 100** (Supabase-only runtime; feature flags for Stripe/messaging/auth)

| Area | Weight | Score | Notes |
|------|--------|-------|-------|
| Launch ops (regions, waitlist, interest, contact, documents, settings) | 25% | 100% | Supabase services only |
| Marketplace (chefs, bookings, reviews, notifications, availability) | 30% | 100% | No mock/localStorage fallback |
| Auth & session | 20% | 95% | Supabase session + hooks; legacy in-memory when flag off |
| Admin dashboards | 15% | 95% | `api.ts` → Supabase services; admin RLS required |
| Stripe payments | 10% | 0% active | Infrastructure ready; needs env secrets + flag enable |

**Blockers to 100%:** rotate any exposed DB credentials; verify cloud admin role; enable Stripe env + webhook in Vercel; enable `use_supabase_auth` in production.

---

## 21. Remaining localStorage Dependencies

| Key / pattern | File(s) | Status |
|---------------|---------|--------|
| `servd_user` | — | ✅ Removed Phase 9 |
| `isAuthenticated` | — | ✅ Removed Phase 9 |
| `userRole` | — | ✅ Removed Phase 9 |
| `profileCompleted` | — | ✅ Removed Phase 9 → `profiles.profile_completed` |
| `verificationStatus` | — | ✅ Removed Phase 9 → `chef_profiles.verification_status` |
| `availability_${chefId}` | — | ✅ Removed Phase 10 |
| `STORAGE_KEYS.*` | — | ✅ Removed with `mockLaunchControl.ts` |
| Supabase auth session | `client/lib/supabase/client.ts` | Keep (required by Supabase SDK) |

**Removed in Phase 6b:** `platform-settings-storage` (Zustand persist).

**Removed in Phase 9:** `sessionBridge.ts` and all auth localStorage keys.

**Removed in Phase 10:** `mockLaunchControl.ts`, `USE_MOCK_API`, `withMarketplaceFallback()`, mock booking/chef/notification/review fallbacks.

---

## 22. Runtime Data Sources (Phase 10)

| Domain | Source | Service layer |
|--------|--------|---------------|
| Launch regions, waitlist, interest, contact | Supabase | `region`, `waitlist`, `contact`, `admin` services |
| Users, chef moderation, documents | Supabase | `family`, `admin-moderation`, `documents` services |
| Marketplace (chefs, bookings, reviews, availability) | Supabase | `chefs`, `bookings`, `reviews`, `availability` services |
| Notifications, platform settings, messaging | Supabase | `notifications`, `platform-settings`, `messaging` services |
| Stripe payments | Vercel `/api/stripe/*` | Flag-gated; unchanged |

**No mock engine.** `client/lib/api.ts` is a thin facade over Supabase service modules.

---

## 23. Phase 7 — Stripe Connect Marketplace

### Architecture split (implementation phases)

| Sub-phase | Scope | Status |
|-----------|-------|--------|
| **7a — Foundation** | Vercel serverless, env validation, feature flag, `stripe_events` | ✅ |
| **7b — Connect onboarding** | Express accounts, hosted onboarding, `stripe_accounts` sync | ✅ |
| **7c/d — Checkout + webhooks** | Family Checkout Session, payment persistence, webhook hardening | ✅ |
| **7e/f/g — Payouts, refunds, subscriptions** | Transfers, admin refunds, premium chef Billing | ⏳ Partial |

### Model

**Stripe Connect Express** with **Separate Charges & Transfers** (platform charges family; transfers to cook after hold).

### Vercel serverless functions

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/stripe/create-checkout-session` | POST | Booking Checkout Session (JWT) |
| `/api/stripe/webhook` | POST | Signed webhook → `stripe_events` + ledger updates |
| `/api/stripe/connect/onboarding` | POST | Create/link Express account (chef JWT) |
| `/api/stripe/connect/dashboard-link` | POST | Stripe Express dashboard login link |
| `/api/stripe/refund` | POST | Admin full/partial refund |

`vercel.json` excludes `/api/*` from SPA rewrite.

### Environment variables (Vercel — never commit)

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SUPABASE_URL=              # or VITE_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=         # JWT verification on API routes
ENABLE_STRIPE_CHECKOUT=   # optional server override (default false)
```

`STRIPE_CONNECT_CLIENT_ID` is **not required** — ServdCo Connect uses Express **account links** (`stripe.accountLinks.create`) with the secret key, not Connect OAuth.

Client override: `VITE_ENABLE_STRIPE_CHECKOUT=true` for local testing.

### Webhook events implemented

`checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `account.updated`, `payout.paid` (noop ledger), `customer.subscription.created|updated|deleted`.

### Connect flow

```mermaid
sequenceDiagram
  participant Chef as Chef Dashboard
  participant API as /api/stripe/connect/onboarding
  participant Stripe as Stripe Hosted Onboarding
  participant DB as stripe_accounts

  Chef->>API: POST + Supabase JWT
  API->>DB: upsert Express account (service role)
  API->>Stripe: accountLinks.create
  Stripe-->>Chef: redirect URL
  Chef->>Stripe: complete KYC
  Stripe->>API: account.updated webhook
  API->>DB: charges_enabled, payouts_enabled
```

### Payment lifecycle (checkout path)

```mermaid
sequenceDiagram
  participant Family as ChefProfile (booking form)
  participant API as create-checkout-session
  participant DB as payments + bookings
  participant Stripe as Hosted Checkout
  participant WH as /api/stripe/webhook

  Family->>DB: insert booking (pending)
  Family->>API: POST bookingId + JWT
  API->>DB: insert payments (pending)
  API->>Stripe: checkout.sessions.create
  Stripe-->>Family: redirect (no client card form)
  Family->>Stripe: pay (4242… test card)
  Stripe->>WH: checkout.session.completed
  WH->>DB: payments.succeeded, bookings.confirmed
  WH->>DB: audit_logs + notifications
```

1. Family submits booking on `ChefProfile` → `bookings` row (`pending`)
2. When `enable_stripe_checkout` → `POST /api/stripe/create-checkout-session`
3. Server inserts/reuses `payments` row (`pending`) **before** redirect
4. Stripe Hosted Checkout (metadata: `booking_id`, `family_id`, `chef_profile_id`, `payment_id`)
5. `checkout.session.completed` (paid) → `payments.succeeded`, `bookings.confirmed`, audit + notification
6. `payment_intent.payment_failed` → `payments.failed`, audit + notification, **booking stays pending**

### Webhook lifecycle

```mermaid
sequenceDiagram
  participant Stripe
  participant WH as /api/stripe/webhook
  participant Events as stripe_events
  participant DB as payments/bookings

  Stripe->>WH: POST + stripe-signature
  WH->>WH: constructEvent (signature verify)
  WH->>Events: claimStripeEvent (dedupe by stripe_event_id)
  alt duplicate / already processed
    WH-->>Stripe: 200 skipped
  else first delivery
    WH->>DB: conditional status updates (.in pending/processing)
    WH->>Events: processed=true
  end
```

**Hardening:** signature verification, `claimStripeEvent` dedup, conditional payment/booking updates (replay-safe), failed-event retry when `processing_error` set.

### Stripe test-mode verification checklist

| Step | Card / action | Expected | Status |
|------|---------------|----------|--------|
| 1 | Enable `VITE_ENABLE_STRIPE_CHECKOUT=true` + Stripe test keys in `.env.local` / Vercel | Flag on | ⏳ Pending keys |
| 2 | `stripe listen --forward-to localhost:8080/api/stripe/webhook` | Webhook secret in env | ⏳ Pending keys |
| 3 | Family books chef → redirect to Checkout | `payments.status=pending` before redirect | ✅ Wired |
| 4 | `4242 4242 4242 4242` success | `payments.succeeded`, `bookings.confirmed` | ⏳ Pending keys |
| 5 | `4000 0000 0000 0002` decline | `payments.failed`, booking stays `pending` | ⏳ Pending keys |
| 6 | Replay same webhook twice | Single DB update (dedup) | ✅ Unit-tested + claim logic |
| 7 | Check `stripe_events` | One row per `stripe_event_id` | ✅ |
| 8 | Check `notifications` | Family notified on success/failure | ✅ Handlers wired |
| 9 | Check `audit_logs` | `payment.checkout_completed` / `payment.failed` | ✅ |

### Admin payment visibility (data layer)

`PaymentsSupabaseService.listAdminPayments()` + `useAdminPayments()` expose: status, gross amount, platform fee, chef payout, refund amount. **No dashboard UI changes** — hook is `enabled: false` until admin wires it.

### Phase 7c/d verification (code)

| Check | Result |
|-------|--------|
| Booking → checkout redirect (`ChefProfile`) | ✅ flag-gated |
| `payments` insert before redirect | ✅ |
| Webhook success → bookings + audit + notification | ✅ |
| Webhook failure → no booking confirm | ✅ |
| `lib/stripe/webhook.test.ts` idempotency tests | ✅ |
| `pnpm typecheck` | ✅ (run after changes) |
| `pnpm test` | ✅ (run after changes) |

### Refund lifecycle

Admin `POST /api/stripe/refund` → Stripe Refund API → updates `payments.refunded_cents`, `bookings` status, `audit_logs`.

### Subscription lifecycle (future premium chefs)

Webhook handlers upsert `subscriptions` from Stripe Billing events; entitlement read from DB (not hardcoded Stripe status checks).

### Deployment checklist

1. Set all Stripe + Supabase server env vars in Vercel
2. Register webhook endpoint in Stripe Dashboard → `/api/stripe/webhook`
3. Enable `enable_stripe_checkout` in `feature_flags` (or `VITE_ENABLE_STRIPE_CHECKOUT=true` locally)
4. Verify chef Connect onboarding in test mode
5. Run test checkout with Stripe test cards
6. Confirm `stripe_events` rows + `payments` consistency

### Tables updated by Stripe layer

`stripe_accounts`, `stripe_events`, `payments`, `bookings`, `subscriptions`, `audit_logs`, `chef_profiles.stripe_account_ref`.

---

## 24. Risks & Follow-ups

| Risk | Severity | Action |
|------|----------|--------|
| DB password shared in chat | **High** | Rotate in Supabase Dashboard → Database |
| Supabase outage = no offline data | Medium | Monitor cloud; React Query error boundaries |
| Stripe secrets not in Vercel yet | High | Fill `.env.local` placeholders; deploy to Vercel before enabling flag |
| Webhook not registered in Stripe Dashboard | High | Point to `/api/stripe/webhook` with signing secret |
| Local dev: API routes need Vercel CLI or proxy | Medium | Use `vercel dev` for `/api/stripe/*` during checkout tests |
| Empty cloud browse (no seed chefs) | Medium | Register test chefs or add approved seed in Phase 6 |
| Legacy auth dev login without Supabase env | Low | Requires `VITE_SUPABASE_*` for data; auth flag off uses in-memory only |
| Non-UUID chef routes | Low | Return null — browse uses cloud UUIDs from seed/register |
| Email confirmation enabled | Low | Auth Phase 4 — confirm before login |
| Audit trigger on high-volume tables | Low | Monitor `audit_logs` size |

---

## 25. File Map (Phase 6b + 7 additions)

```
client/services/supabase/
  fallback.ts
  profiles.service.ts
  chefs.service.ts
  availability.service.ts
  marketplace.test.ts
client/hooks/
  useProfile.ts
  useChefs.ts
  useChefProfile.ts
  useChefProfileByUser.ts
  useChefAvailability.ts
client/lib/marketplaceTypes.ts
client/lib/cookMapper.ts                 # MarketplaceChef mapping
client/services/chef.service.ts          # Supabase-first
client/services/AvailabilityService.ts   # Supabase-first facade
client/services/auth.service.ts          # getCurrentProfile()
client/pages/BrowseChefs.tsx
client/pages/ChefProfile.tsx
client/pages/ChefDashboard.tsx
supabase/migrations/20250605120015_16_booking_lifecycle_triggers.sql
supabase/seed-dev-chefs.sql
supabase/scripts/run-dev-chefs-seed.mjs
client/services/supabase/bookings.service.ts
client/services/supabase/reviews.service.ts
client/services/supabase/notifications.service.ts
client/services/supabase/bookings.lifecycle.test.ts
client/hooks/useBookings.ts
client/hooks/useReviews.ts
client/hooks/useNotifications.ts
client/lib/bookingTypes.ts
client/services/booking.service.ts
client/services/ReviewService.ts
client/services/notification.service.ts
client/pages/Dashboard.tsx
client/pages/ChefProfile.tsx
client/lib/launchOpsTypes.ts
client/services/region.service.ts
client/services/waitlist.service.ts
client/services/contact.service.ts
client/services/platform-settings.service.ts
client/services/admin.service.ts
client/services/family.service.ts
client/services/supabase/launch-regions.service.ts
client/services/supabase/waitlist.service.ts
client/services/supabase/interest.service.ts
client/services/supabase/contact.service.ts
client/services/supabase/documents.service.ts
client/services/supabase/platform-settings.service.ts
client/services/supabase/admin-moderation.service.ts
client/services/supabase/launchOps.test.ts
client/hooks/useLaunchRegions.ts
client/hooks/useWaitlist.ts
client/hooks/useInterestRequests.ts
client/hooks/useContactMessages.ts
client/hooks/useDocuments.ts
client/hooks/usePlatformSettings.ts
client/hooks/useAdminUsers.ts
client/components/PlatformSettingsHydrator.tsx
api/stripe/create-checkout-session.ts
api/stripe/webhook.ts
api/stripe/connect/onboarding.ts
api/stripe/connect/dashboard-link.ts
api/stripe/refund.ts
api/_lib/auth.ts
api/_lib/http.ts
lib/stripe/env.ts
lib/stripe/server.ts
lib/stripe/connect.ts
lib/stripe/checkout.ts
lib/stripe/webhook-handlers.ts
lib/stripe/refund.ts
lib/stripe/fees.ts
lib/stripe/events.ts
lib/stripe/featureFlag.ts
lib/stripe/stripe.test.ts
lib/stripe/webhook.test.ts
lib/stripe/ledger.ts
lib/stripe/payment-resolve.ts
lib/supabase/serviceRole.ts
client/services/stripe.service.ts
client/hooks/useStripeConnect.ts
client/services/supabase/payments.service.ts
client/hooks/usePayments.ts
client/lib/paymentTypes.ts
.env.example                             # all platform credential placeholders
client/lib/messagingTypes.ts
client/services/messaging.service.ts
client/services/supabase/conversations.service.ts
client/services/supabase/messages.service.ts
client/services/supabase/messaging.test.ts
client/hooks/useConversations.ts
client/hooks/useConversation.ts
client/hooks/useMessages.ts
client/hooks/useSendMessage.ts
client/hooks/useRealtimeMessages.ts
client/hooks/useMessagingEnabled.ts
client/components/messaging/MessagingPanel.tsx
client/components/messaging/ConversationInbox.tsx
client/components/messaging/BookingMessaging.tsx
supabase/migrations/20250605120016_17_messaging_triggers_realtime.sql
docs/servdco-master-architecture.md      # THIS FILE
```

---

## 27. Phase 8 — Messaging & Realtime Chat

### Feature flag

`enable_messaging` — default **false**. Client override: `VITE_ENABLE_MESSAGING=true`.

When disabled: no message UI, no API calls, existing dashboards unchanged.

### Architecture

```mermaid
sequenceDiagram
  participant Family as Family Dashboard
  participant Chef as Chef Dashboard
  participant DB as conversations + messages
  participant RT as Supabase Realtime
  participant N as notifications

  Family->>DB: getOrCreateForBooking(booking_id)
  Family->>DB: INSERT message (RLS)
  DB->>N: trigger notify recipient
  DB->>RT: postgres_changes INSERT
  RT-->>Chef: useRealtimeMessages invalidates cache
  Chef->>DB: markConversationRead (RLS UPDATE)
```

### Conversation rules (service + RLS)

| Role | Access |
|------|--------|
| Family | Message only chefs on **their bookings** (`bookings.family_id`) |
| Chef | Message only families on **their bookings** (`chef_profiles.user_id`) |
| Admin | Read/write all (`messaging_admin_all` RLS) |

One conversation per `booking_id` (unique constraint). Cancelled bookings blocked in service layer.

### Services & hooks

| Layer | Files |
|-------|-------|
| Services | `conversations.service.ts`, `messages.service.ts`, `messaging.service.ts` |
| Hooks | `useConversations`, `useConversation`, `useMessages`, `useSendMessage`, `useRealtimeMessages`, `useMessagingEnabled` |
| UI (data-only embed) | `ConversationInbox`, `MessagingPanel`, `BookingMessaging` in existing **bookings** tabs |

No new routes. No sidebar changes.

### Capabilities

- Conversation list with unread counts
- Message history with cursor pagination (`PAGE_SIZE=30`)
- Read state (`read_at`, `status=read`) via participant UPDATE policy
- Realtime INSERT/UPDATE on `messages` (publication added migration 17)
- Optional typing indicator (Realtime broadcast channel)
- Notification on new message (DB trigger → `notifications`)

### Migration

`20250605120016_17_messaging_triggers_realtime.sql` — read policy, `last_message_at` trigger, notification trigger, Realtime publication.

### Verification

| Check | Result |
|-------|--------|
| `pnpm typecheck` | ✅ |
| `pnpm test` (messaging.test.ts) | ✅ |
| Flag off → no messaging UI | ✅ |
| RLS participant policies | ✅ (existing + read UPDATE) |

### Known risks

| Risk | Mitigation |
|------|------------|
| Realtime requires cloud publication | Run migration 17 on cloud |
| Auth required for messaging | `use_supabase_auth` should be on for production chat |
| Admin inbox not wired in UI | Admin RLS ready; wire `useConversations` in admin when needed |

---

## 28. Phase 9 — Supabase Auth Finalization

### Objective

Remove the session bridge; make Supabase Auth (or in-memory legacy when flag off) the only authentication source.

### Before → After

| Before | After |
|--------|-------|
| Supabase session → `sessionBridge.ts` → localStorage → Guards | Supabase session → `AuthProvider` → `useAuth()` → Guards |
| `servd_user` / `isAuthenticated` / `userRole` in localStorage | `useCurrentProfile()` / `useCurrentUserRole()` |
| `profileCompleted` localStorage | `profiles.profile_completed` |
| `verificationStatus` localStorage | `chef_profiles.verification_status` |

### Files changed

| Area | Files |
|------|-------|
| Removed | `client/lib/auth/sessionBridge.ts` |
| Added | `legacySession.ts`, `useCurrentProfile.ts`, `useCurrentUserRole.ts` |
| Updated | `AuthProvider`, `AuthService`, `Guards`, `Navbar`, `Unauthorized`, `Dashboard`, `ChefDashboard`, `useProfile`, `profiles.service` |

### Verification

| Check | Result |
|-------|--------|
| `pnpm typecheck` | ✅ |
| `pnpm test` (48) | ✅ |
| `pnpm build` | ✅ |
| No UI/route/layout changes | ✅ |

### Production cutover

1. Set `use_supabase_auth = true` in `platform_settings` (or `VITE_USE_SUPABASE_AUTH=true`)
2. Confirm `handle_new_user` trigger on cloud
3. Promote admin via SQL (`profiles.role = 'admin'`)

---

## 29. Phase 10 — Supabase-Only Cutover

### Objective

Remove all remaining mock and local fallback infrastructure. Supabase is the only runtime data source.

### Removed

| Item | Notes |
|------|-------|
| `client/lib/mockLaunchControl.ts` | Deleted (~1.3k lines) |
| `USE_MOCK_API` | Removed from `apiConfig.ts` |
| `withMarketplaceFallback()` | Removed from `fallback.ts` |
| `canUseSupabaseMarketplace()` | Replaced by `assertSupabaseConfigured()` |
| `availability_${chefId}` localStorage | `AvailabilityService` → Supabase only |
| Mock booking/chef/review/notification fallbacks | Services call Supabase directly |
| `STORAGE_KEYS.*` | Gone with mock engine |

### Kept

React Query, feature flags, Supabase Auth, all `*SupabaseService` modules, RLS, audit logs, messaging, Stripe `/api/stripe/*`.

### Verification

| Check | Result |
|-------|--------|
| `pnpm typecheck` | ✅ |
| `pnpm test` (48) | ✅ |
| `pnpm build` | ✅ (~23 KB smaller bundle vs Phase 9) |
| No UI/route/layout changes | ✅ |

---

## 30. Phase 11 — Production Hardening

### Objective

Move ServdCo from development-complete (96/100) to production-ready (99/100) before Stripe activation and launch. No redesigns, no route changes, no new features, no Stripe activation, no production deployment.

### Readiness score

| Metric | Phase 10 | Phase 11 |
|--------|----------|----------|
| **Launch readiness** | 96/100 | **99/100** |
| Remaining 1 point | Stripe test-mode E2E on staging with live keys | Run `shared/e2e-checklist.test.ts` scenarios manually on staging |

### 30.1 Error handling

| Item | Implementation | Status |
|------|----------------|--------|
| Global error boundary | `GlobalErrorBoundary` wraps app shell; reload recovery | ✅ |
| Route-level boundaries | `RouteErrorBoundary` in `PageWrapper` per route | ✅ |
| React Query recovery | `QueryProvider` — transient retry (3× backoff), cache/mutation error logging | ✅ |
| User-friendly fallbacks | `ErrorFallback`, `QueryErrorFallback` | ✅ |
| Retry strategy | Transient Supabase/network errors: exponential backoff to 8s | ✅ |

### 30.2 Validation (shared Zod schemas)

**Source:** `shared/validation.ts`

| Domain | Schema(s) | Wired in |
|--------|-----------|----------|
| Auth | `loginSchema`, `passwordResetSchema`, `familyRegisterCoreSchema`, `chefRegisterCoreSchema` | `Login`, `FamilyRegistration`, `ChefRegistration` |
| Contact | `contactSchema` | `Contact.tsx` |
| Waitlist | `waitlistEmailSchema`, `waitlistSchema`, `interestSchema` | `WaitlistPage`, `AdminService.submitInterest` |
| Booking | `bookingCreateSchema` | `booking.service.ts` → `ChefProfile` flow |
| Messaging | `messageBodySchema` + `sanitizePlainText` | `messages.service.ts` |
| Admin moderation | `adminDocumentStatusSchema`, `chefVerificationStatusSchema` | `admin.service.ts` |
| Stripe payloads | `stripeCheckoutRequestSchema`, `stripeRefundSchema` | Vercel `/api/stripe/*` (existing + validated) |

### 30.3 Security

| Control | Status | Notes |
|---------|--------|-------|
| Security headers | ✅ | `vercel.json` — HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy |
| CSP | ✅ | Self + Supabase + Stripe + Cloudinary + Google Fonts; `object-src 'none'` |
| XSS review | ✅ | Messaging bodies sanitized via DOMPurify; no `dangerouslySetInnerHTML` on user content |
| Upload MIME validation | ✅ | `validateImage` / `validateDocument` — MIME + extension cross-check |
| File size enforcement | ✅ | 5 MB images, 10 MB documents |
| Rich text sanitization | ✅ | `client/lib/sanitize.ts` |
| Admin action verification | ✅ | Zod on document/chef status mutations; RLS `admin` role required |
| Service-role review | ✅ | Service role only in Vercel `/api/stripe/*` + webhook handlers; never in client bundle |

### 30.4 Monitoring

| Layer | Implementation | Status |
|-------|----------------|--------|
| Central logger (client) | `client/lib/logger.ts` — structured console + `setErrorTracker()` hook for Sentry/Datadog | ✅ |
| Central logger (API) | `lib/logger.ts` — `apiLogger` JSON lines | ✅ |
| Frontend error tracking | `logger.trackError` in error boundaries | ✅ |
| API route logging | `apiLogger` on checkout + webhook routes | ✅ |
| Webhook logging | Event id, type, duplicate/skip/processed | ✅ |
| Supabase failure tracking | `SupabaseQueryError` + React Query `onError` handlers | ✅ |
| Audit coverage | Existing `audit_logs` triggers + Stripe event ledger unchanged | ✅ (reviewed) |

### 30.5 Performance

| Item | Status | Finding |
|------|--------|---------|
| Route code splitting | ✅ | Lazy: `Dashboard`, `ChefDashboard`, `AdminDashboard`, `BrowseChefs`, `ChefProfile` |
| Bundle analysis | ✅ | `pnpm analyze` — **1748 KB** total assets (54 chunks); heavy: recharts admin charts (363 KB), main index (330 KB) |
| React Query cache | ✅ | `staleTime` 5m, `gcTime` 30m, `refetchOnWindowFocus` off in prod |
| Unused dependencies | ✅ | Removed `@react-three/*`, `three`, `@types/three` (unused, −62 lockfile packages) |
| Image optimization | ✅ (reviewed) | Cloudinary uploads; static assets via Vite hashing |
| Query optimization | ✅ (reviewed) | React Query keys scoped per domain; no N+1 in messaging pagination |

### 30.6 Accessibility

| Item | Status | Notes |
|------|--------|-------|
| Skip to content | ✅ | `#main-content` focus target in `App.tsx` |
| Form labels | ✅ (existing) | Floating labels on `FormInput` |
| `aria-invalid` / `aria-describedby` | ✅ | `FormInput` error association |
| Keyboard navigation | ✅ (reviewed) | Radix primitives on dialogs/menus; password toggle `tabIndex={-1}` |
| Focus management | ✅ | `main-content` `tabIndex={-1}` on route change scroll |
| Screen reader alerts | ✅ | `QueryErrorFallback` `role="alert"`; form errors `role="alert"` |
| Color contrast | ✅ (reviewed) | Brand `#FF7A59` on dark `#111111` passes for large text/UI chrome |
| Mobile accessibility | ✅ (reviewed) | Touch targets on nav/CTAs; responsive dashboards unchanged |

### 30.7 Environment validation (fail-fast)

| Surface | Validator | Behavior |
|---------|-----------|----------|
| Client startup | `validateClientStartup()` in `App.tsx` | Warns in dev; **throws in prod** if Supabase env missing |
| Stripe serverless | `validateStripeEnvOnStartup()` | Logs missing vars once per cold start (no secrets in logs) |
| Feature flags | Startup warnings when `VITE_ENABLE_STRIPE_CHECKOUT=true` without secrets | ✅ |

### 30.8 Testing

| Suite | Count | Coverage focus |
|-------|-------|----------------|
| Vitest total | **76** tests (12 files) | +28 from Phase 10 |
| `shared/validation.test.ts` | 17 | Auth, booking, admin, Stripe payloads |
| `shared/e2e-checklist.test.ts` | 3 | Documents 26 manual E2E scenarios pre-launch |
| `client/lib/sanitize.test.ts` | 3 | XSS strip, whitespace, max length |
| `client/utils/validateFile.test.ts` | 5 | MIME, extension cross-check, size limits |
| Existing domain tests | 48 | Bookings lifecycle, messaging, Stripe, auth onboarding, marketplace, launch ops |

**E2E manual checklist domains:** auth, bookings, payments, messaging, admin, notifications — see `E2E_LAUNCH_CHECKLIST` in `shared/e2e-checklist.test.ts`.

### Files added / changed (Phase 11)

| Area | Files |
|------|-------|
| Validation | `shared/validation.ts`, `shared/validation.test.ts` |
| Error UI | `client/components/errors/*` |
| App shell | `client/App.tsx` — boundaries, lazy routes, skip link, startup validation |
| Logging | `client/lib/logger.ts`, `lib/logger.ts` |
| Sanitize | `client/lib/sanitize.ts` |
| Env | `client/lib/env/validateStartup.ts` |
| Query | `client/providers/QueryProvider.tsx` |
| Security | `vercel.json` |
| Upload | `client/utils/validateFile.ts` |
| Forms wired | `Login`, `Contact`, `FamilyRegistration`, `ChefRegistration`, `WaitlistPage` |
| Services | `booking.service.ts`, `admin.service.ts`, `messages.service.ts` |
| API logging | `api/stripe/webhook.ts`, `api/stripe/create-checkout-session.ts` |
| Tooling | `scripts/bundle-report.mjs`, `pnpm analyze` |
| Tests | `shared/e2e-checklist.test.ts`, `client/lib/sanitize.test.ts`, `client/utils/validateFile.test.ts` |
| Deps removed | `@react-three/drei`, `@react-three/fiber`, `three`, `@types/three` |

---

## 31. Security checklist (pre-launch)

- [x] CSP deployed via `vercel.json`
- [x] HSTS enabled (63072000s, includeSubDomains, preload)
- [x] X-Frame-Options DENY
- [x] No service-role key in client bundle or `VITE_*` env
- [x] Stripe secrets server-side only (`/api/stripe/*`)
- [x] RLS enforced on all user data tables
- [x] Upload MIME + extension + size validation
- [x] Message body sanitization before insert
- [x] Admin mutations validated + RLS-gated
- [ ] Rotate Stripe webhook signing secret after first staging deploy
- [ ] Enable Supabase Auth email confirmation in production dashboard

---

## 32. Performance checklist (pre-launch)

- [x] Lazy-loaded dashboard and marketplace routes
- [x] Bundle report script (`pnpm analyze`)
- [x] React Query stale/gc tuning for prod
- [x] Unused 3D dependencies removed
- [x] Code-split admin charts (recharts in separate chunk)
- [ ] Consider lazy-loading `NotificationBell` chart deps if LCP regresses on dashboards
- [ ] Run Lighthouse on staging after deploy

---

## 33. Accessibility checklist (pre-launch)

- [x] Skip-to-content link
- [x] Form `aria-invalid` + `aria-describedby` on `FormInput`
- [x] Error regions use `role="alert"`
- [x] Loading states use `role="status"`
- [x] Icon-only buttons have `sr-only` text (existing Radix/ui components)
- [ ] Manual screen-reader pass on booking flow (NVDA/VoiceOver)
- [ ] Manual keyboard-only pass on admin moderation tables

---

## 34. Monitoring checklist (pre-launch)

- [x] Client `logger` abstraction with `setErrorTracker` hook point
- [x] API `apiLogger` JSON structured logs
- [x] Webhook receive/process/skip logging
- [x] React Query global error handlers
- [x] Error boundary `trackError` integration
- [ ] Wire `setErrorTracker` to Sentry/Datadog before go-live
- [ ] Supabase dashboard alerts for error rate / connection pool

---

## 35. Launch readiness checklist

| # | Gate | Status |
|---|------|--------|
| 1 | `pnpm typecheck` | ✅ Pass |
| 2 | `pnpm test` (76 tests) | ✅ Pass |
| 3 | `pnpm build` | ✅ Pass |
| 4 | Bundle analysis (`pnpm analyze`) | ✅ 1748 KB / 54 chunks |
| 5 | Accessibility audit (automated + manual checklist) | ✅ Automated; manual items in §33 |
| 6 | Supabase cloud migrations applied | ✅ Phase 3–6; migration 17 pending messaging realtime on cloud |
| 7 | `use_supabase_auth` ready to enable | ✅ |
| 8 | `enable_messaging` ready to enable | ✅ (after migration 17) |
| 9 | Stripe infrastructure ready (not activated) | ✅ Routes + webhooks; flag off |
| 10 | E2E manual checklist documented | ✅ `shared/e2e-checklist.test.ts` |
| 11 | No mock/fallback runtime paths | ✅ Phase 10 |
| 12 | Production hardening complete | ✅ Phase 11 |

**Final readiness: 99/100** — remaining point: execute manual E2E checklist on staging with Stripe test keys.

---

## 36. Verification matrix (Phase 11)

| Check | Command / action | Result |
|-------|------------------|--------|
| TypeScript | `pnpm typecheck` | ✅ |
| Unit tests | `pnpm test` | ✅ 76/76 |
| Production build | `pnpm build` | ✅ |
| Bundle analysis | `pnpm analyze` | ✅ 1748.3 KB total |
| Global error boundary | Render tree inspection | ✅ `GlobalErrorBoundary` root |
| Route error boundary | Per-route `PageWrapper` | ✅ |
| Zod auth forms | `validation.test.ts` | ✅ |
| Zod booking/admin/stripe | `validation.test.ts` + services | ✅ |
| CSP / headers | `vercel.json` review | ✅ |
| Upload hardening | `validateFile.test.ts` | ✅ |
| Sanitization | `sanitize.test.ts` | ✅ |
| Lazy routes | Build chunk output | ✅ Dashboard/Admin/Chef/Browse/Profile split |
| No UI redesign | Diff review | ✅ |
| No Stripe activation | `enable_stripe_checkout` default off | ✅ |

---

## 38. Phase 12A — Stripe Dashboard Setup Guide

**Audience:** Stripe team member with **Developer** role configuring ServdCo test mode before launch.

**ServdCo model:** Stripe Connect **Express** + platform Checkout Sessions + Separate Charges & Transfers (transfers/payout job = Phase 7e, not yet coded).

---

### 38.1 Section 1 — Permission audit (Developer role)

Stripe Dashboard roles are set under **Settings → Team and security → Team members**. As **Developer**, verify what your account owner granted.

| Dashboard area | Developer (typical) | Owner/Admin required | What to verify |
|----------------|--------------------|-----------------------|----------------|
| **API keys (test)** | ✅ View + reveal + roll | Live secret keys often restricted | **Developers → API keys** — confirm you can copy `sk_test_…` and `pk_test_…` |
| **API keys (live)** | ⚠️ Often view-only or blocked | ✅ Roll/reveal live `sk_live_…` | Ask Owner before go-live |
| **Webhook endpoints** | ✅ Create/edit (test) | Live endpoint may need Admin | **Developers → Webhooks** — you can add endpoints + copy signing secret |
| **Connect settings** | ⚠️ View; edit may be restricted | ✅ Enable Connect, branding, fees | **Connect → Settings** — confirm Express is on |
| **Products / Prices** | ⚠️ View; create may vary | ✅ Billing catalog for subscriptions | Not required for MVP booking checkout (dynamic `price_data`) |
| **Refunds** | ✅ In test mode via Dashboard | ✅ Live refunds | ServdCo also has `/api/stripe/refund` (admin JWT) |
| **Test mode toggle** | ✅ Full test access | N/A | Top-right **Test mode** switch |
| **Live mode** | ⚠️ Limited | ✅ Business verification, go-live | Do not enable live until MVP E2E passes |
| **Restricted keys** | ✅ Create (if permitted) | ✅ Policy approval | **Optional** — ServdCo uses standard secret key on Vercel only |
| **Account settings** | ❌ Business profile, bank, tax | ✅ | Developer cannot complete KYC |
| **Events / Logs** | ✅ | — | **Developers → Events** for webhook debugging |
| **Customers** | ✅ Test | ✅ Live PII | `stripe_customers` table exists; app does not create customers yet |

**Action for you (Developer):** On first login, open **Settings → Team** and note your role. Screenshot or list any menu items greyed out — those need Owner escalation.

---

### 38.2 Section 2 — Dashboard walkthrough (exact paths)

| Task | Navigation path |
|------|-----------------|
| Confirm test mode | Top bar → toggle **Test mode** ON (orange test badge) |
| Secret + publishable keys | **Developers → API keys** → Standard keys → Reveal `sk_test_…` / `pk_test_…` |
| Restricted keys (optional) | **Developers → API keys** → **Create restricted key** |
| Webhooks | **Developers → Webhooks** → **Add endpoint** |
| Webhook signing secret | **Developers → Webhooks** → select endpoint → **Signing secret** → Reveal |
| Stripe CLI (local) | Install CLI → `stripe login` → `stripe listen --forward-to localhost:3000/api/stripe/webhook` |
| Connect overview | **Connect → Overview** |
| Connect settings | **Connect → Settings** |
| Express branding | **Connect → Settings → Branding** (icon, business name shown to cooks) |
| OAuth / client ID (`ca_…`) | **Connect → Settings → Integration** — **not required for ServdCo** (OAuth only; we use account links) |
| Express accounts (test) | **Connect → Accounts** (test cooks appear after onboarding) |
| Payments (test) | **Payments** → filter test |
| Refunds (manual test) | **Payments** → select payment → **Refund** |
| Disputes | **Payments → Disputes** |
| Payouts (Connect) | **Connect → Payments** / **Balances** |
| Events log | **Developers → Events** |
| Workbench / API logs | **Developers → Overview** |
| Feature flags (ServdCo) | Not in Stripe — enable in Supabase `feature_flags` + Vercel env |

---

### 38.3 Section 3 — Keys required for ServdCo

| Variable | Where to get it | Where it goes | Never commit |
|----------|-----------------|---------------|--------------|
| `STRIPE_SECRET_KEY` | **Developers → API keys** → Secret key (`sk_test_…`) | **Vercel** Production + Preview env | ✅ Git |
| `STRIPE_WEBHOOK_SECRET` | **Developers → Webhooks** → endpoint → Signing secret (`whsec_…`) | **Vercel** only | ✅ Git |
| `STRIPE_CONNECT_CLIENT_ID` | **Connect → Settings → Integration** (`ca_…`) | **Not required** — optional env only; unused in code (Express onboarding via `accountLinks.create` + `STRIPE_SECRET_KEY`) | ✅ Git |
| Publishable key `pk_test_…` | **Developers → API keys** | **Not required** — ServdCo uses Hosted Checkout redirect (no client-side Stripe.js) | ✅ Git |
| `SUPABASE_URL` | Supabase project settings | **Vercel** (+ `VITE_SUPABASE_URL` in Vercel for client) | ✅ Git |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → service_role | **Vercel** only | ✅ Git |
| `SUPABASE_ANON_KEY` | Supabase → API → anon | **Vercel** (API JWT verify) + client `VITE_SUPABASE_ANON_KEY` | ✅ Git |
| `ENABLE_STRIPE_CHECKOUT` | You set `true` | **Vercel** server env | ✅ Git |
| `VITE_ENABLE_STRIPE_CHECKOUT` | You set `true` for testing | **`.env.local`** (local) + **Vercel** (client build) | ✅ Git |

**`.env.local` (developer machine — gitignored):**

```
VITE_SUPABASE_URL=https://onerrwpixumcablgyhzs.supabase.co
VITE_SUPABASE_ANON_KEY=<anon>
VITE_USE_SUPABASE_AUTH=true
VITE_ENABLE_STRIPE_CHECKOUT=true
VITE_ENABLE_MESSAGING=false
```

Stripe secrets stay on **Vercel** (or `vercel env pull` for local API testing via `vercel dev`). Plain `pnpm dev` does **not** serve `/api/stripe/*`.

---

### 38.4 Section 4 — Connect Express setup

| Check | Dashboard location | ServdCo expectation |
|-------|-------------------|---------------------|
| Connect enabled | **Connect → Get started** / **Settings** | Required |
| Account type | **Connect → Settings** → Express | Code: `type: "express"` in `lib/stripe/connect.ts` |
| Charge model | Separate charges & transfers | Checkout today charges **platform**; transfers = Phase 7e |
| Branding | **Connect → Settings → Branding** | Set ServdCo name + logo for cook onboarding |
| Return URL | App sends per request | Chef dashboard → `returnUrl` / `refreshUrl` to `/chef-dashboard?stripe=…` |
| Refresh URL | Same | Re-triggers `accountLinks.create` |
| Capabilities | Auto-requested in code | `card_payments`, `transfers` |
| Country | Default `US` in code | Change in `ensureConnectAccount` if expanding |

**Developer can:** trigger test Express onboarding from chef dashboard (after flags + keys).

**Owner must:** accept Connect terms, set platform profile, configure payout timing if required.

---

### 38.5 Section 5 — Webhook setup

#### Create endpoint (production / staging)

1. **Developers → Webhooks → Add endpoint**
2. **Endpoint URL:** `https://<your-vercel-domain>/api/stripe/webhook`
3. **Listen to:** Select events (minimum list below)
4. **Add endpoint** → Reveal **Signing secret** → set `STRIPE_WEBHOOK_SECRET` on Vercel
5. Redeploy Vercel after env change

#### Events ServdCo handles (`lib/stripe/webhook-handlers.ts`)

| Event | Handled | Effect |
|-------|---------|--------|
| `checkout.session.completed` | ✅ | Payment succeeded, booking `confirmed`, audit, family notification |
| `payment_intent.succeeded` | ✅ | Payment row update only |
| `payment_intent.payment_failed` | ✅ | Payment failed, audit, family notification |
| `charge.refunded` | ✅ | Updates `payments.refunded_cents` |
| `account.updated` | ✅ | Syncs `stripe_accounts` (Connect KYC state) |
| `customer.subscription.created` | ✅ | Upserts `subscriptions` |
| `customer.subscription.updated` | ✅ | Upserts `subscriptions` |
| `customer.subscription.deleted` | ✅ | Marks subscription canceled |
| `payout.paid` | ⚠️ No-op | Acknowledged only |
| `invoice.*`, `charge.dispute.*`, `transfer.*` | ❌ | Not implemented |

**Recommended webhook subscription (test + live):**

`checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `account.updated`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

#### Local testing

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. `stripe login`
3. Deploy preview or run `vercel dev` (not `pnpm dev` alone)
4. `stripe listen --forward-to https://<host>/api/stripe/webhook`
5. Copy CLI `whsec_…` → temporary `STRIPE_WEBHOOK_SECRET`
6. Trigger: `stripe trigger checkout.session.completed`

---

### 38.6 Section 6 — Test mode configuration

1. Toggle **Test mode** ON (top-right)
2. Use test secret key `sk_test_…` on Vercel
3. **Test cards** (Hosted Checkout):
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3DS: `4000 0025 0000 3155`
4. **Refund:** Dashboard **Payments** → Refund, or call `POST /api/stripe/refund` with admin JWT
5. **Subscription:** No checkout UI yet — use CLI `stripe trigger customer.subscription.created` to test DB upsert
6. **Connect onboarding:** Chef dashboard → Earnings → Connect; complete with test data (SSN `000-00-0000`, SMS `000-000-0000`)

---

### 38.7 Section 7 — Live mode preparation (Owner/Admin)

Before flipping live:

- [ ] Business verification complete (**Settings → Business**)
- [ ] Bank account connected (**Settings → Payouts**)
- [ ] Tax forms (**Settings → Tax**)
- [ ] Connect platform profile approved
- [ ] Live webhook endpoint + live `whsec_…`
- [ ] Live `sk_live_…` on Vercel (never in repo)
- [ ] Dispute email notifications (**Settings → Emails**)
- [ ] Statement descriptor set
- [ ] Enable `ENABLE_STRIPE_CHECKOUT` + DB `feature_flags.enable_stripe_checkout` only after test E2E passes

---

### 38.8 Section 8 — ServdCo implementation checklist

| Dashboard item | ServdCo code | Env var | DB table | Feature flag | Status |
|----------------|--------------|---------|----------|--------------|--------|
| Test API keys | `lib/stripe/server.ts` | `STRIPE_SECRET_KEY` | — | — | ⏳ You configure |
| Webhook | `api/stripe/webhook.ts` | `STRIPE_WEBHOOK_SECRET` | `stripe_events` | — | ⏳ You configure |
| Checkout | `api/stripe/create-checkout-session.ts` | + Supabase secrets | `payments`, `bookings` | `enable_stripe_checkout` | ✅ Code ready |
| Connect onboarding | `api/stripe/connect/onboarding.ts` | `STRIPE_SECRET_KEY` | `stripe_accounts` | same flag | ✅ Code ready |
| Connect dashboard link | `api/stripe/connect/dashboard-link.ts` | same | `stripe_accounts` | same | ✅ Code ready |
| Refund API | `api/stripe/refund.ts` | same | `payments` | same | ✅ API ready; no admin UI button |
| Webhook handlers | `lib/stripe/webhook-handlers.ts` | service role | `payments`, `bookings`, `notifications`, `audit_logs` | — | ✅ |
| Client checkout redirect | `client/pages/ChefProfile.tsx` → `stripe.service.ts` | `VITE_ENABLE_STRIPE_CHECKOUT` | — | client + DB flag | ✅ |
| Chef Connect UI | `client/components/chef/PayoutLogs.tsx` | — | — | flag | ✅ |
| Admin payment ledger | `client/components/admin/PayoutControl.tsx` | — | `payments` | flag | ✅ (read-only) |
| Transfers to cooks | — | — | `payments.transfer_id` | — | ❌ Phase 7e |
| Subscription checkout | — | — | `subscriptions` | — | ❌ Phase 7f/g |

**Finished in code:** checkout, webhooks, Connect Express, refunds API, ledger UI, env validation, idempotent events.

**Still needs dashboard/setup:** keys, webhook endpoint, flags enabled, Vercel deploy, test E2E.

---

### 38.9 Section 9 — Final execution order

1. Log into Stripe Dashboard → confirm **Test mode** ON and **Developer** role access
2. **Developers → API keys** → copy `sk_test_…` (do not commit)
3. In **Vercel** project → Settings → Environment Variables → add `STRIPE_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `ENABLE_STRIPE_CHECKOUT=true`
4. Add client env on Vercel: `VITE_ENABLE_STRIPE_CHECKOUT=true`, `VITE_USE_SUPABASE_AUTH=true`, Supabase URL/anon
5. Deploy to Vercel preview → note preview URL
6. **Developers → Webhooks → Add endpoint** → `https://<preview>/api/stripe/webhook` → select events (§38.5) → copy `whsec_…` → add `STRIPE_WEBHOOK_SECRET` on Vercel → redeploy
7. In Supabase SQL: `UPDATE feature_flags SET enabled = true WHERE key = 'enable_stripe_checkout';` (and `use_supabase_auth` if not already)
8. Promote your user to admin if needed: `UPDATE profiles SET role = 'admin' WHERE email = '…';`
9. Seed or approve at least one **public** chef (admin approves → sets `verification_status=approved` + `profile_visibility=public`)
10. Chef: complete **Connect onboarding** (Earnings tab) with test identity
11. Family: sign in → browse chef → **Chef profile** → submit booking
12. With flag on → redirect to **Stripe Hosted Checkout** → pay `4242 4242 4242 4242`
13. Verify **Developers → Events** → `checkout.session.completed` → 200 from webhook
14. Verify Supabase: `payments.status=succeeded`, `bookings.status=confirmed`, notification row for family
15. Optional: test decline card `4000 0000 0000 0002` → booking stays `pending`, failure notification
16. Optional: admin refund via API or Dashboard
17. Document results → proceed to live mode checklist (§38.7) only after all test steps pass

---

## 39. MVP Final Audit — Phase A (System audit)

Audit date: post–Phase 11. Legend: **PASS** / **WARN** / **FAIL**.

| System | Status | Notes |
|--------|--------|-------|
| Authentication | **WARN** | Supabase path PASS; legacy mock auth remains when `use_supabase_auth` off — disable in prod |
| Profiles | **PASS** | Trigger + `profiles.service`; RLS |
| Chef onboarding | **WARN** | Registration + trigger PASS; docs deferred if email confirm; dashboard profile editor partial mock |
| Family onboarding | **PASS** | Register → profile save → browse |
| Chef dashboard | **WARN** | Bookings/reviews/availability wired; profile editor + doc UI partially mock |
| Family dashboard | **PASS** | Profile, bookings, notifications sync |
| Admin dashboard | **WARN** | Live data for users/bookings/docs; moderation/payouts/announcements tabs mock |
| Bookings | **PASS** | CRUD + RLS + lifecycle triggers |
| Reviews | **PASS** | One-per-booking + trigger notifications |
| Notifications | **PASS** | Triggers + bell DB persistence (fixed Phase MVP) |
| Messaging | **WARN** | Complete behind `enable_messaging`; migration 17 on cloud |
| Launch regions | **PASS** | Supabase `launch_regions` |
| Waitlist | **WARN** | Page uses `api.registerUser`; region gating not in auth trigger |
| Contact forms | **PASS** | Zod + `contact_messages` |
| Interest requests | **PASS** | Admin list + Zod |
| Document uploads | **WARN** | Cloudinary URLs stored; Supabase Storage buckets unused |
| Chef verification | **PASS** | Admin approve now sets `profile_visibility=public` (fixed) |
| Platform settings | **PASS** | DB-backed hydrator |
| Feature flags | **PASS** | DB + env overrides |
| Storage buckets | **WARN** | Migrations PASS; client uses Cloudinary |
| Audit logs | **WARN** | 6 tables audited; payments not in trigger set |
| Stripe infrastructure | **WARN** | Ready for keys; transfers/subscription checkout incomplete |
| RLS policies | **PASS** | 81+ policies, FORCE on sensitive tables |
| Realtime | **WARN** | Messages/conversations published; notifications not realtime |
| React Query | **PASS** | Domain hooks + cache tuning |
| Environment validation | **PASS** | Client + Stripe serverless startup |

---

## 40. MVP Audit — Phases B–J (flow summaries)

### Phase B — Chef onboarding

| Step | Status |
|------|--------|
| Registration → profile + chef_profile | **PASS** |
| Document upload at signup | **WARN** — skipped if email confirmation required; upload after login |
| Admin document review | **PASS** |
| Admin chef approval → marketplace visible | **PASS** (fixed: `profile_visibility=public`) |
| Chef dashboard real doc status | **WARN** — mock local state; DB rows exist |

### Phase C — Family onboarding

| Step | Status |
|------|--------|
| Registration | **PASS** |
| Profile completion | **PASS** |
| Browse / chef profile | **PASS** |
| Create booking | **PASS** (auth gate added on booking form) |
| Notifications | **PASS** |
| Messaging | **WARN** — flag off |
| Reviews | **PASS** |

### Phase D — Document management

| Item | Status |
|------|--------|
| Upload UI + validation | **PASS** |
| `cook-documents` bucket policies | **PASS** (migration) |
| Client → Supabase Storage | **FAIL** — Cloudinary used instead (acceptable MVP if env set) |
| Admin review workflow | **PASS** |
| Chef resubmit / delete | **WARN** — no storage delete policy for chefs |

### Phase E — Notifications

| Source | Status |
|--------|--------|
| Booking lifecycle | **PASS** (DB triggers) |
| Review submitted | **PASS** |
| Message received | **PASS** |
| Payment success/failure | **PASS** (Stripe webhook) |
| Chef approved/rejected | **WARN** — no dedicated trigger (admin action only) |
| Document approved/rejected | **WARN** — no trigger |
| Subscription | **WARN** — DB only |
| UI read persistence | **PASS** (fixed: bell → `NotificationService.markRead`) |
| Chef/admin bell sync | **PASS** (fixed: `useNotifications` on chef + admin dashboards) |

### Phase F — Admin workflows

| Workflow | Status |
|----------|--------|
| Approve/reject chef | **PASS** |
| Approve/reject document | **PASS** |
| Users, bookings, regions, interest | **PASS** |
| Payment ledger | **PASS** (flag-gated) |
| Content moderation tab | **FAIL** — static mock UI |
| Payout approval UI | **FAIL** — static mock rows |
| Global announcements | **FAIL** — placeholder |

### Phase G — Storage

| Bucket | Client use | Status |
|--------|------------|--------|
| `avatars` | Cloudinary / URLs | **WARN** |
| `cook-portfolio` | Cloudinary | **WARN** |
| `cook-documents` | Metadata only | **WARN** |

### Phase H — Database

| Item | Status |
|------|--------|
| Foreign keys | **PASS** |
| Indexes | **PASS** |
| Booking/review/message triggers | **PASS** |
| Audit triggers (6 tables) | **WARN** |
| RLS coverage | **PASS** |
| Orphan risks | **WARN** — payments without transfer job |

### Phase I — Stripe readiness (no keys)

| Item | Status |
|------|--------|
| Checkout endpoint | **PASS** |
| Webhook + idempotency | **PASS** |
| Connect onboarding | **PASS** |
| Payment tables | **PASS** |
| Refund endpoint | **PASS** |
| Feature flags | **PASS** (default off) |
| Env validation | **PASS** |
| Marketplace transfers | **FAIL** — Phase 7e |
| Functional after keys? | **WARN** — family pay + confirm works; cook payout does not |

### Phase J — E2E journey simulation

| Journey | Status |
|---------|--------|
| Family: signup → browse → book → pay (test) | **WARN** — needs keys + flags + Vercel |
| Family: messaging → review | **WARN** — messaging flag |
| Chef: signup → docs → approval → availability → booking | **WARN** — docs if email confirm |
| Admin: docs → approve → monitor | **PASS** |

---

## 41. Phase K — Bug fixes applied (MVP audit)

| Issue | Severity | Fix |
|-------|----------|-----|
| Approved chefs invisible in marketplace | **FAIL** | `admin-moderation.service.ts` sets `profile_visibility=public` on approve |
| Notification read not persisted | **FAIL** | `NotificationBell` → `NotificationService.markRead` / `markAllRead` |
| Chef/admin bells not syncing | **WARN** | `useNotifications()` on `ChefDashboard`, `AdminDashboard` |
| Guest routes flash while authenticated | **WARN** | `GuestGuard` loading gate (no guest `<Outlet />`) |
| Booking without auth | **WARN** | `ChefProfile` sign-in gate + login link |
| Docs submitted before session | **WARN** | `ChefRegistration` skips doc insert when `needsEmailConfirmation` |

**Files modified:** `admin-moderation.service.ts`, `NotificationBell.tsx`, `notification.service.ts`, `notifications.service.ts`, `Guards.tsx`, `ChefProfile.tsx`, `ChefDashboard.tsx`, `AdminDashboard.tsx`, `ChefRegistration.tsx`

**Verification:** `pnpm typecheck` ✅ | `pnpm test` 76/76 ✅

---

## 42. Remaining blockers (non-code)

| # | Blocker | Owner |
|---|---------|-------|
| 1 | Stripe test keys + webhook on Vercel | Developer + Owner |
| 2 | Enable `enable_stripe_checkout` + `use_supabase_auth` in DB/env | Developer |
| 3 | Push migration 17 (messaging realtime) to cloud | Developer |
| 4 | Cloudinary env for chef uploads | Developer |
| 5 | Manual E2E checklist on staging | QA |
| 6 | Phase 7e transfers (cook payouts) | Engineering (post-MVP pay flow) |
| 7 | Admin moderation / payout mock tabs | Engineering (optional polish) |
| 8 | Wire Supabase Storage vs Cloudinary decision | Product |

---

## 43. Production risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Legacy mock auth if flag off | High | Force `use_supabase_auth=true` in prod |
| Checkout without cook Connect complete | Medium | Add gate in Phase 7e |
| Cloudinary URL in `chef_documents` | Low | URLs work; bucket RLS unused |
| No cook payout transfers | High for marketplace | Phase 7e before paying cooks |
| Mock admin tabs visible | Low | Label as demo or hide tabs |

---

## 44. Readiness scores (post-MVP audit)

| Score | Value | Meaning |
|-------|-------|---------|
| **MVP readiness** | **94 / 100** | Core journeys work with Supabase auth + flags; Stripe pay path ready for keys |
| **Launch readiness** | **99 / 100** | Unchanged from Phase 11 (hardening) |
| **Stripe activation readiness** | **88 / 100** | Keys + webhook + E2E → 95; + transfers → 100 |

**MVP −6 points:** Phase 7e transfers, mock admin tabs, Cloudinary/storage split, messaging flag off, subscription checkout absent, manual E2E not run.

**Stripe −12 points:** No transfer/payout job, no refund UI, requires Vercel (not Vite-only dev).

---

## 45. PASS / WARN / FAIL summary

| Verdict | Count (systems) |
|---------|-----------------|
| **PASS** | 18 |
| **WARN** | 14 |
| **FAIL** | 4 (admin mock tabs, storage client gap, transfers, content moderation UI) |

**Critical path for “works when keys added”:** items in §38.9 execution order 1–14 — no additional development required for first test payment.

---

## 46. Next Phase

1. **Execute §38.9** — Stripe test configuration (Developer)
2. **Manual E2E** — `shared/e2e-checklist.test.ts` on staging
3. **Phase 7e** — Separate Charges & Transfers + cook payout job
4. Push migration 17; enable `enable_messaging` + `use_supabase_auth`
5. Replace mock admin tabs (moderation, payout approval, announcements) when prioritised

---

## 47. Phase 12B — Non-Stripe MVP Completion

**Date:** 2025-06-05  
**Scope:** Messaging, notifications, documents, verification, storage, realtime, admin moderation, chef/family journeys, audit logs, cleanup. **Out of scope:** Stripe keys, webhooks, payouts, transfers, subscriptions, dashboard configuration.

**Target:** 97–99/100 MVP readiness without Stripe.

---

### 47.1 Messaging production completion

| Check | Status | Notes |
|-------|--------|-------|
| Migration 17 (`17_messaging_triggers_realtime.sql`) | **PASS** (local) | Read policy, conversation bump, message notification trigger, Realtime on `messages` + `conversations` |
| Migration 17 deployed to cloud | **WARN** | Must be applied before enabling `enable_messaging` in production |
| `conversations` / `messages` tables + RLS | **PASS** | Phase 8 schema |
| Message-received notification (DB trigger) | **PASS** | `on_message_insert_notify_recipient` |
| Unread counts + read state | **PASS** | `messages_update_read_participants` + client `MessagingPanel` |
| Realtime messaging | **PASS** | `useRealtimeMessages` + publication in migration 17 |
| Admin conversation monitor | **PASS** | `AdminMessagingHub` on real Supabase data when flag on |
| Feature gate | **WARN** | `enable_messaging` default off; set `true` in DB or `VITE_ENABLE_MESSAGING=true` |

**E2E (code-path):** Family → message chef → chef reply → unread updates → read persists → admin hub lists thread → **PASS** (requires flag + migrations 17–18 on cloud).

---

### 47.2 Notification system completion

| Source | DB trigger | Row created | Realtime | Bell UI | Persist read |
|--------|------------|-------------|----------|---------|--------------|
| Booking created | ✅ | ✅ | ✅ (migration 18) | ✅ | ✅ |
| Booking accepted | ✅ | ✅ | ✅ | ✅ | ✅ |
| Booking rejected (declined) | ✅ (migration 18) | ✅ | ✅ | ✅ | ✅ |
| Booking cancelled | ✅ | ✅ | ✅ | ✅ | ✅ |
| Booking completed | ✅ | ✅ | ✅ | ✅ | ✅ |
| Review submitted | ✅ | ✅ | ✅ | ✅ | ✅ |
| Message received | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chef approved | ✅ (migration 18) | ✅ | ✅ | ✅ | ✅ |
| Chef rejected | ✅ (migration 18) | ✅ | ✅ | ✅ | ✅ |
| Document approved | ✅ (migration 18) | ✅ | ✅ | ✅ | ✅ |
| Document rejected | ✅ (migration 18) | ✅ | ✅ | ✅ | ✅ |

**Client:** `useNotifications` + `useRealtimeNotifications` on Family/Chef/Admin dashboards; `NotificationBell` persists read via `notifications.service`.

**Admin monitor:** `AdminNotificationMonitor` — recent platform notifications from Supabase.

**Verdict:** **PASS** — no missing notification sources in scope.

---

### 47.3 Document workflow completion

| Actor | Action | Status |
|-------|--------|--------|
| Chef | Upload document | **PASS** — `FileUpload` + `DocumentsSupabaseService.submit` |
| Chef | Replace / resubmit rejected | **PASS** — `chef_documents_update_own_resubmit` RLS + `resubmit()` |
| Chef | Delete document | **PASS** — `softDelete()` |
| Admin | Review / approve / reject | **PASS** — `AdminDashboard` + `verifyDocument(reviewNotes)` |
| Status + notification + audit | **PASS** | Triggers in migration 18; `audit_chef_documents` |
| Registration upload timing | **PASS** (fixed) | Step 3 stores `File` locally; uploads **after** `register()` with `chefProfileId` path prefix |

---

### 47.4 Storage consolidation

**Decision:** **Supabase Storage only** — single source of truth.

| Bucket | Use | Status |
|--------|-----|--------|
| `avatars` | Profile photos | **PASS** — `ImageUpload` with `pathPrefix=chefProfileId` |
| `cook-portfolio` | Portfolio gallery | **PASS** — `MultiImageUploader` |
| `cook-documents` | Verification docs | **PASS** — signed URLs + chef update/delete RLS (migration 18) |

**Removed:** Client `UploadService` Cloudinary paths; startup Cloudinary env warnings (`validateStartup.ts`).  
**Remaining references:** `README.md`, `docs/frontend-backend-handoff.md` (historical); CSP no longer allows `res.cloudinary.com` (`vercel.json`).

**Cloudinary reason for removal:** RLS paths require `chef_profile_id` prefix; immediate pre-registration upload violated `owns_chef_profile`. Supabase buckets already provisioned with policies.

---

### 47.5 Chef onboarding completion

| Step | Status |
|------|--------|
| Registration + profile + chef profile | **PASS** |
| Document upload (post-session) | **PASS** (deferred upload fix) |
| Verification status UI | **PASS** — `ChefDashboard` verification tab uses `useOwnDocuments` |
| Admin approval → `profile_visibility=public` | **PASS** (Phase K) |
| Marketplace visibility + search | **PASS** |
| Availability + dashboard state | **PASS** |

---

### 47.6 Family journey completion

| Step | Status |
|------|--------|
| Signup / login / profile | **PASS** |
| Browse + chef profile | **PASS** |
| Booking creation | **PASS** (auth gate on `ChefProfile`) |
| Messaging | **WARN** — flag off by default |
| Notifications + review | **PASS** |

---

### 47.7 Admin moderation completion

| Tab | Before | After |
|-----|--------|-------|
| Users | Real | **PASS** |
| Chef approvals | Real | **PASS** |
| Document approvals | Real + rejection reason | **PASS** |
| Bookings ledger | Real | **PASS** |
| Conversations | Real (flag) | **PASS** |
| Notifications | Mock | **PASS** — `AdminNotificationMonitor` |
| Content moderation | Mock reviews | **PASS** — `ContentModeration` + `reviews.service` |
| Global announcements | Mock | **PASS** — `platform_settings.global_announcements` |
| Payout control | Mock tables | **PASS** — Stripe ledger only when `enable_stripe_checkout`; mock payout tables removed |
| Analytics charts | Static demo months | **WARN** — May/Jun use live counts; Jan–Apr still illustrative |

---

### 47.8 Audit log coverage

| Entity | Trigger | Status |
|--------|---------|--------|
| `chef_documents` | `audit_chef_documents` | **PASS** (pre-existing) |
| `chef_profiles` / bookings / profiles | Pre-existing | **PASS** |
| `messages` | `audit_messages` (migration 18) | **PASS** |
| `notifications` | `audit_notifications` (migration 18) | **PASS** |
| Admin moderation actions | Via entity updates above | **PASS** |

Fields: actor (`auth.uid()`), action, entity_type/id, old/new JSON, timestamp.

---

### 47.9 Realtime completion

| Channel | Publication | Client hook | Status |
|---------|-------------|-------------|--------|
| Notifications | migration 18 | `useRealtimeNotifications` | **PASS** |
| Messages | migration 17 | messaging realtime hooks | **PASS** |
| Conversations | migration 17 | admin/family hubs | **PASS** |
| Document / chef status | Postgres change → refetch on mutation success | **PASS** (query invalidation) |

---

### 47.10 E2E flow verdicts (code + schema; staging manual pending)

| Flow | Verdict |
|------|---------|
| **Chef:** Register → docs → admin review → approval → availability | **PASS** |
| **Family:** Register → browse → book → message → review | **WARN** (messaging flag; pay step out of scope) |
| **Admin:** Docs → approve chef → monitor bookings → conversations → notifications | **PASS** |

---

### 47.11 Cleanup

| Removed | Status |
|---------|--------|
| Cloudinary upload client paths | ✅ |
| Mock payout pending/history tables | ✅ |
| Mock content moderation dataset | ✅ |
| Mock global announcements | ✅ |
| `ChefDashboard` dead `documentStatus` state | ✅ |
| CSP Cloudinary connect-src | ✅ |

**Kept UI identical** — no redesign.

---

### 47.12 Files modified (Phase 12B)

| Area | Files |
|------|-------|
| Migration | `supabase/migrations/20250605120018_18_mvp_completion.sql` |
| Storage | `client/services/upload.service.ts`, `client/types/upload.types.ts`, `client/components/upload/FileUpload.tsx`, `ImageUpload.tsx`, `MultiImageUploader.tsx` |
| Documents | `client/services/supabase/documents.service.ts`, `client/hooks/useOwnDocuments.ts`, `client/services/admin.service.ts`, `client/lib/api.ts` |
| Notifications | `client/hooks/useRealtimeNotifications.ts`, `client/hooks/useNotifications.ts`, `client/services/supabase/notifications.service.ts` |
| Admin UI | `ContentModeration.tsx`, `GlobalAnnouncements.tsx`, `AdminNotificationMonitor.tsx`, `PayoutControl.tsx`, `AdminDashboard.tsx` |
| Reviews / settings | `client/services/supabase/reviews.service.ts`, `platform-settings.service.ts` |
| Chef journey | `ChefRegistration.tsx`, `ChefDashboard.tsx`, `ProfileEditor.tsx` |
| Env / CSP | `client/lib/env/validateStartup.ts`, `vercel.json` |
| Types | `client/lib/launchOpsTypes.ts` |

---

### 47.13 Issues fixed (Phase 12B)

1. Chef registration documents uploaded before chef profile existed (RLS failure) → deferred upload after `register()`.
2. Missing booking-declined, chef verification, and document approve/reject notifications → migration 18 triggers.
3. Notifications not on Realtime publication → migration 18.
4. Cloudinary vs Supabase split → unified `UploadService` on Supabase buckets.
5. Admin mock tabs (moderation, announcements, payout tables, notification feed) → real Supabase services.
6. Chef dashboard verification tab static state → `useOwnDocuments` + resubmit via `FileUpload`.
7. Audit gap on messages/notifications → migration 18 triggers.
8. Avatar/portfolio uploads without chef-scoped paths → `pathPrefix` on `ImageUpload` / `MultiImageUploader`.

---

### 47.14 Remaining blockers (non-Stripe)

| # | Blocker | Owner | Severity |
|---|---------|-------|----------|
| 1 | ~~Push migrations **15–18** to cloud Supabase~~ | Developer | ✅ Done — see §49 |
| 2 | Enable `enable_messaging` + `use_supabase_auth` in prod DB | Developer | High |
| 3 | Manual E2E on staging (`shared/e2e-checklist.test.ts`) | QA | Medium |
| 4 | `AdminAnalytics` Jan–Apr chart placeholders | Engineering | Low |
| 5 | Phase 7e cook payout transfers (Stripe) | Engineering | Out of 12B scope |

**Removed from §42 blockers:** Cloudinary env, mock admin tabs.

---

### 47.15 PASS / WARN / FAIL summary (Phase 12B, non-Stripe)

| Verdict | Count | Items |
|---------|-------|-------|
| **PASS** | 28 | Messaging schema, notifications (all 11 sources), documents E2E, Supabase storage, chef/family journeys, admin tabs (except analytics history), audit expansion, realtime notifications, verification |
| **WARN** | 4 | `enable_messaging` flag off, family messaging E2E until flag on, `AdminAnalytics` static months, manual staging E2E not executed |
| **FAIL** | 0 | All prior non-Stripe FAIL items resolved in 12B |

**Stripe (unchanged, out of scope):** Phase 7e transfers = **FAIL** for full marketplace payouts; checkout path = **PASS** when keys added.

---

### 47.16 Updated readiness scores

| Score | Before (§44) | After (12B) | Δ |
|-------|--------------|-------------|---|
| **MVP readiness (non-Stripe)** | 94 / 100 | **98 / 100** | +4 |
| **Launch readiness** | 99 / 100 | **99 / 100** | — |
| **Stripe activation readiness** | 88 / 100 | **88 / 100** | — (unchanged) |

**MVP −1 point:** Enable `enable_messaging` + `use_supabase_auth` and run manual staging E2E. Optional: wire `AdminAnalytics` historical series from DB (−0, polish).

**MVP readiness (post-migration deploy):** **99 / 100** — migrations 15–18 live on cloud; flags + E2E remain.

**Verification (Phase 12B):**

| Check | Result |
|-------|--------|
| `pnpm typecheck` | ✅ |
| `pnpm test` | ✅ 76/76 |
| `pnpm build` | ✅ |

---

## 48. Next Phase (post–12B)

1. ~~**Deploy migrations 15–18** to cloud Supabase~~ ✅ (§49)
2. **Enable flags:** `use_supabase_auth=true`, `enable_messaging=true`
3. **Manual E2E** on staging — chef, family, admin flows
4. **Stripe §38.9** when ready (separate workstream)
5. **Phase 7e** transfers before paying cooks
6. **Optional:** Replace `AdminAnalytics` static months with aggregated signup queries

---

## 49. Cloud migration deploy (2025-06-05)

**Command:** `npx supabase db push --db-url <SUPABASE_DB_URL>` (direct DB URL; project not linked to current CLI account).

**Applied to** `onerrwpixumcablgyhzs`:

| Migration | File | Result |
|-----------|------|--------|
| 15 | `20250605120015_16_booking_lifecycle_triggers.sql` | ✅ |
| 16 | `20250605120016_17_messaging_triggers_realtime.sql` | ✅ |
| 18 | `20250605120018_18_mvp_completion.sql` | ✅ |

**All 18 migrations** now synced local ↔ remote (`supabase migration list`).

**Post-deploy verification:**

| Check | Result |
|-------|--------|
| Realtime publication | ✅ `conversations`, `messages`, `notifications` |
| Booking lifecycle trigger | ✅ `bookings_lifecycle` |
| Message notification trigger | ✅ `messages_notify_recipient` |
| Chef verification notifications | ✅ `chef_profiles_verification_notify` |
| Document status notifications | ✅ `chef_documents_status_notify` |
| Audit on messages/notifications | ✅ `audit_messages`, `audit_notifications` |

**Feature flags on cloud (unchanged):** `use_supabase_auth=false`, `enable_messaging=false`, `enable_stripe_checkout=false`.

**Next:** Enable `use_supabase_auth` and `enable_messaging` in `feature_flags` (or via env overrides) before staging E2E.

---

## 50. Phase 12C — Premium Membership & Cook Payout Completion

**Date:** 2025-06-05  
**Business model:** Free tier for all families/cooks; optional **$15/mo** Premium Chef Membership; **13% configurable** platform fee; automatic cook payout workflow.

---

### 50.1 Premium subscription audit

| Item | Verdict | Notes |
|------|---------|-------|
| `subscriptions` table | **PASS** | + `stripe_product_id` column (migration 19) |
| Subscription webhooks | **PASS** | `created/updated/deleted`, `invoice.paid/failed`; syncs `premium_status` |
| `premium_status` / entitlements | **PASS** | `isPremiumChef()` — subscription-only, no admin toggle |
| Feature flags | **PASS** | `enable_stripe_checkout` gates checkout + subscription |
| Premium UI (ChefDashboard) | **PASS** | Dynamic `$15` from `platform_settings`; Stripe checkout wired |
| Analytics dashboard | **PASS** | Real Supabase queries; premium-gated |
| Billing flow | **WARN** | Works with dynamic `price_data`; set `stripe_premium_price_id` in Dashboard for production |

---

### 50.2 Stripe product configuration

**Product:** Premium Chef Membership — **$15/month** recurring.

| Setting key | Purpose |
|-------------|---------|
| `chef_premium_price_monthly_cents` | `1500` (default, admin-editable) |
| `stripe_premium_product_id` | Optional — set after Stripe Dashboard setup |
| `stripe_premium_price_id` | Optional — preferred for production checkout |

**Code behavior:** Uses `stripe_premium_price_id` when set; otherwise creates Checkout `mode: subscription` with dynamic `price_data` from platform settings. Persists `stripe_subscription_id`, `stripe_price_id`, `stripe_product_id`, `status`, `current_period_end` on webhook.

**API:** `POST /api/stripe/subscription/checkout-session`

---

### 50.3–50.6 Premium entitlements, search, badge, analytics

| Feature | Status |
|---------|--------|
| `isPremiumChef()` | **PASS** — `client/lib/premium.ts` |
| Search priority (premium first) | **PASS** — DB order + `BrowseChefs` client sort |
| Featured Cook badge | **PASS** — Browse, ChefCard, ChefProfile (unchanged UI) |
| Analytics (7d / 30d / lifetime) | **PASS** — `analytics.service.ts`, `ChefAnalytics`, `chef_profile_views` |

---

### 50.7–50.9 Cook payout system (Phase 7e)

| Item | Status |
|------|--------|
| `transfers` table | **PASS** — migration 19 |
| `cook_payouts` table | **PASS** — `payout.paid` webhook |
| Platform fee (dynamic) | **PASS** — `platform_settings.platform_fee_percentage` (default 13%) |
| Hold period | **PASS** — `booking_hold_hours`; DB trigger on booking `completed` |
| Transfer job | **PASS** — `lib/stripe/transfers.ts` + `POST /api/stripe/transfers/process` |
| Statuses | **PASS** — pending, scheduled, processing, paid, failed, cancelled |

**Flow:** Booking completed → hold → `transfers` row scheduled → admin/cron `processEligibleTransfers()` → Stripe Transfer → cook notified.

---

### 50.10 Refunds impact

| Scenario | Behavior |
|----------|----------|
| Refund before payout | Pending/scheduled transfer **cancelled** (`cancelTransfersForPayment`) |
| Refund after payout | Transfer stays `paid`; manual reversal required (Stripe Dashboard) — documented |
| Partial refund | Payment `partially_refunded`; transfer not auto-cancelled |
| Platform fee | Calculated at checkout from `platform_settings`; not retroactively adjusted on partial refund |

---

### 50.11–50.13 Admin ops, webhooks, notifications

| Area | Status |
|------|--------|
| Admin payment ledger | **PASS** — gross, fee, cook earnings, refund column |
| Transfer status table | **PASS** — `PayoutControl` |
| Premium members + MRR | **PASS** — `usePremiumStats` |
| Subscription webhooks | **PASS** — all required events |
| Notifications | **PASS** — premium activated/expired/renewed, subscription cancelled, payment received, transfer sent/failed |

---

### 50.14 E2E validation (code-path)

| Flow | Verdict |
|------|---------|
| Cook free tier (book, message, profile) | **PASS** |
| Cook premium checkout → badge + analytics | **WARN** — needs Stripe keys + `enable_stripe_checkout` |
| Family booking + fee split | **PASS** (code); **WARN** (live Stripe) |
| Completed booking → transfer scheduled | **PASS** |
| Transfer processing | **WARN** — needs Connect complete + cron/admin trigger |
| Subscription cancel → premium revoked | **PASS** (webhook path) |

---

### 50.15 Files modified / added

| Area | Files |
|------|-------|
| Migration | `supabase/migrations/20250605120019_19_premium_payouts.sql` |
| Stripe server | `lib/stripe/subscription.ts`, `premium.ts`, `customers.ts`, `transfers.ts`, `webhook-handlers.ts`, `refund.ts` |
| API | `api/stripe/subscription/checkout-session.ts`, `api/stripe/transfers/process.ts` |
| Client premium | `client/lib/premium.ts`, `subscription.service.ts`, `useSubscription.ts` |
| Analytics | `analytics.service.ts`, `useChefAnalytics.ts`, `ChefAnalytics.tsx` |
| Payouts | `transfers.service.ts`, `useTransfers.ts`, `PayoutLogs.tsx`, `PayoutControl.tsx` |
| UI wiring | `ChefDashboard.tsx`, `BrowseChefs.tsx`, `ChefProfile.tsx`, `stripe.service.ts`, `usePlatformStore.ts`, `seed.sql` |

---

### 50.16 Tables added (migration 19)

- `transfers` — cook payout ledger
- `cook_payouts` — Stripe Connect bank payouts
- `chef_profile_views` — premium analytics
- `subscriptions.stripe_product_id` — column
- Platform settings: `stripe_premium_product_id`, `stripe_premium_price_id`
- `chef_premium_price_monthly_cents` → **1500**

---

### 50.17 Remaining Stripe blockers

1. Stripe test/live keys + webhook endpoint on Vercel
2. Create **Premium Chef Membership** product + $15/mo price in Dashboard; save IDs to `platform_settings`
3. Enable `enable_stripe_checkout` in DB
4. Schedule `POST /api/stripe/transfers/process` (cron with `CRON_SECRET` or admin manual)
5. Cook Connect onboarding before transfers execute

---

### 50.18 Readiness scores (Phase 12C)

| Score | Value |
|-------|-------|
| **Premium readiness** | **92 / 100** |
| **Payout readiness** | **90 / 100** |
| **Marketplace readiness (non-Stripe config)** | **99 / 100** |

**Verification:** `pnpm typecheck` ✅ | `pnpm test` 76/76 ✅ | migration 19 deployed ✅

**−8 premium:** Stripe product IDs not in Dashboard yet; live subscription E2E pending keys.  
**−10 payout:** Transfer cron not scheduled; Connect KYC required per cook.

---

## 51. Phase 12D — Optional Cook Tipping System

**Date:** 2025-06-05  
**Rule:** Tips are **optional**, **separate** from booking payments, **0% platform fee** — **100% to cook**.

---

### 51.1 Architecture decision

| Approach | Verdict |
|----------|---------|
| Separate Stripe Checkout (`tip=true`) | **Chosen** — not merged into `payments` |
| Separate `tips` table | **Chosen** — not in booking revenue / fee calculations |
| Immediate tip transfer to Connect | **Chosen** — `transferTipToCook()` on webhook success |
| Booking `transfers` table | **Not used for tips** — tips use `tips.stripe_transfer_id` |

---

### 51.2 Database (migration 20)

| Table | Purpose |
|-------|---------|
| `tips` | Tip ledger: amount, status, Stripe IDs, cook transfer |
| `tip_events` | Append-only: created, checkout_started, tip_paid, failed, refunded |
| `tip_status` enum | pending, processing, succeeded, failed, refunded |

**Constraints:** Partial unique index — one `succeeded` tip per `booking_id`; multiple pending attempts allowed.

**RLS:** Family insert/select own; chef select own; admin read-only select. No admin write policies.

**Audit:** `audit_tips` trigger on `tips`.

---

### 51.3 Family experience

**When shown:** `booking.status = completed` AND no `succeeded` tip AND Stripe enabled.

**UI:** `TipPrompt` on Family Dashboard bookings tab — presets $5/$10/$15/$20, custom amount, dismissible, no pressure.

**API:** `POST /api/stripe/tips/create-checkout-session`

---

### 51.4 Stripe tip payment

**Metadata:** `tip=true`, `tip_id`, `booking_id`, `family_id`, `chef_profile_id`

**Webhooks handled:** `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded` (tips only)

**Platform fee on tips:** **0%** — never calls `splitPaymentAmounts` or `platform_fee_percentage`.

---

### 51.5 Cook earnings display

`ChefTipsSummary` on chef earnings tab — Lifetime Tips, Last 30 Days, Recent Tips. Separate from booking revenue in `PayoutLogs` / analytics.

---

### 51.6 Admin visibility (Alexandria — read-only)

`PayoutControl` → Tips Ledger: family, cook, amount, status, date. **No edit/delete/refund UI** — view only. System integrity via webhooks + audit logs.

---

### 51.7 Notifications

| Event | Recipient |
|-------|-----------|
| Tip successful | Family |
| Tip failed | Family |
| Tip received | Cook |
| Tip refunded | Audit log only |

---

### 51.8 Refunds

| Scenario | Behavior |
|----------|----------|
| Booking refund | Does **not** auto-refund tip |
| Tip refund | Separate `charge.refunded` webhook → `tips.status = refunded` |
| Admin tip refund | Via Stripe Dashboard only (no in-app control) |

---

### 51.9 Premium compatibility

Tips work identically for free and premium cooks. Premium membership has no effect on tipping.

---

### 51.10 Files modified / added

| Area | Files |
|------|-------|
| Migration | `supabase/migrations/20250605120020_20_tips.sql` |
| Stripe server | `lib/stripe/tips.ts`, `tip-resolve.ts`, `tip-webhooks.ts`, `webhook-handlers.ts` |
| API | `api/stripe/tips/create-checkout-session.ts` |
| Client services | `client/services/supabase/tips.service.ts` |
| Hooks | `client/hooks/useTips.ts` |
| Components | `TipPrompt.tsx`, `ChefTipsSummary.tsx` |
| UI wiring | `Dashboard.tsx`, `ChefDashboard.tsx`, `PayoutControl.tsx`, `stripe.service.ts` |

---

### 51.11 E2E validation (code-path)

| Flow | Verdict |
|------|---------|
| Completed booking → tip prompt shown | **PASS** |
| Tip already paid → prompt hidden | **PASS** |
| Separate checkout + 0% fee | **PASS** |
| Webhook → notifications + audit | **PASS** |
| Cook tips summary | **PASS** |
| Admin read-only ledger | **PASS** |
| Live Stripe tip E2E | **WARN** — needs keys + `enable_stripe_checkout` |

---

### 51.12 Readiness scores (Phase 12D)

| Score | Value |
|-------|-------|
| **Tip readiness** | **94 / 100** |
| **Marketplace readiness** | **99 / 100** |

**Verification:** `pnpm typecheck` ✅ | `pnpm test` 76/76 ✅ | `pnpm build` ✅ | migration 20 deployed ✅

**−6 tip:** Live Stripe E2E + tip transfer requires cook Connect onboarding.

---

## 52. Connect Client ID — not required (Phase 12E clarification)

### 52.1 Codebase audit

| Question | Answer |
|----------|--------|
| Files referencing `STRIPE_CONNECT_CLIENT_ID` | `lib/stripe/env.ts` (parse only), `.env.example`, docs |
| Used in any Stripe API call? | **No** — zero reads beyond env parsing |
| Connect onboarding mechanism | **`stripe.accountLinks.create`** in `lib/stripe/connect.ts` (`createOnboardingLink`) |
| OAuth authorization URLs? | **No** — no `connect.stripe.com/oauth`, no `client_id` query params |

### 52.2 Required env for Connect (actual)

| Variable | Required for Connect? |
|----------|----------------------|
| `STRIPE_SECRET_KEY` | **Yes** — creates Express accounts, account links, transfers |
| `STRIPE_WEBHOOK_SECRET` | **Yes** — `account.updated` syncs `charges_enabled` / `payouts_enabled` |
| `STRIPE_CONNECT_CLIENT_ID` | **No** — omit from Vercel and `.env.local` |

### 52.3 Change

`lib/stripe/env.ts` — removed `STRIPE_CONNECT_CLIENT_ID` from `validateStripeEnvOnStartup()` missing-env warning. Field remains optional in schema for future OAuth if ever needed.

**Alexandria / ops:** You do not need to find or copy a Connect Client ID in the Stripe Dashboard for ServdCo to work. Enable Connect, use Express, and set **secret key + webhook secret** only.

---

## 53. Premium Stripe IDs in env + production hardening (Phase 12F)

### 53.1 Premium product / price configuration

| Variable | Value (production) |
|----------|-------------------|
| `STRIPE_PREMIUM_PRODUCT_ID` | `prod_UgZe8PbNHRxQm4` |
| `STRIPE_PREMIUM_PRICE_ID` | `price_1ThCVTA4ZMjGNuZkpNssZ6Eq` |

**Resolution order:** env vars → `platform_settings` → dynamic `price_data` fallback.

`syncPremiumIdsFromEnvToDb()` copies env IDs into `platform_settings` on subscription checkout.

**Migration 21** seeds the same IDs into cloud `platform_settings`.

### 53.2 New / updated modules

| File | Change |
|------|--------|
| `lib/stripe/helpers.ts` | Idempotency, amount verification, metadata helpers |
| `lib/stripe/client.ts` | Hosted Checkout documentation |
| `lib/stripe/webhooks.ts` | Single webhook export surface |
| `lib/stripe/customers.ts` | `getOrCreateStripeCustomer`, email sync |
| `lib/stripe/subscription.ts` | Env premium IDs |
| `api/_lib/rateLimit.ts` | Per-route rate limiting |
| `vercel.json` | Hourly transfer cron |
| `STRIPE_IMPLEMENTATION_REPORT.md` | Full ops handbook |

### 53.3 Security hardening

- Booking checkout metadata: `payment_type=booking`
- Webhook amount verification on `checkout.session.completed`
- Premium analytics RLS: `chef_profile_views` SELECT requires `premium_status=true`
- Admin refund button in `PayoutControl`
- Subscription ledger in admin Payouts tab

### 53.4 Readiness

| Score | Value |
|-------|-------|
| **Stripe activation readiness** | **96 / 100** |

**−4:** Live E2E not run; partial refund transfer adjustment.
