# Final Pre-Phase 3 Production Audit

**Date:** 2026-06-20  
**Production URL:** https://servdco-one.vercel.app  
**Cloud Supabase:** `onerrwpixumcablgyhzs`  
**Branch deployed:** `main` (after Phase 2 + signup simplification merge)

---

## Executive Summary

| Metric | Result |
|--------|--------|
| **FAIL** | **0** |
| **Critical WARN** | **1** (see Emails — requires `RESEND_API_KEY` in Vercel) |
| **Non-critical WARN** | 2 (production deploy pending latest commit; manual E2E smoke) |
| `pnpm typecheck` | **PASS** |
| `pnpm test` | **106/106 PASS** |

> **Blocker before Phase 3:** Add `RESEND_API_KEY` to Vercel Production (and Preview). `ADMIN_NOTIFY_EMAIL` and `RESEND_FROM_EMAIL` should also be set. Emails are implemented but will no-op without the API key.

---

## Section Results

### Migrations — **PASS**

| Check | Result | Evidence |
|-------|--------|----------|
| `20250620143000` applied | PASS | `scripts/phase2-migration-proof.json` |
| `bookings.meal_request` | PASS | `text`, nullable |
| `bookings.ingredients_available` | PASS | `text`, nullable |
| `bookings.recipe_notes` | PASS | `text`, nullable |
| `bookings.family_platform_fee_cents` | PASS | `integer NOT NULL DEFAULT 0` |
| `contact_messages.subject` | PASS | column exists |
| `platform_settings.family_platform_fee_dollars` | PASS | value `5` |
| Pending migrations | PASS | Latest: `20250620143000` (32 total) |

```json
{
  "latestMigrations": [
    "20250612130027",
    "20250612140028",
    "20250612150029",
    "20250620120030",
    "20250620143000"
  ],
  "allPresent": true
}
```

---

### Emails — **WARN** (Critical until `RESEND_API_KEY` set)

| Check | Result | Notes |
|-------|--------|-------|
| Resend integration code | PASS | `api/_lib/email/resend.ts`, booking/contact/document routes |
| `RESEND_API_KEY` in Vercel Production | **MISSING** | Not listed in `vercel env ls production` |
| `RESEND_FROM_EMAIL` in Vercel | **MISSING** | Defaults to `Servd Co <hello@servdco.com>` in code |
| `ADMIN_NOTIFY_EMAIL` in Vercel | **MISSING** | Defaults to `alexandria@servdco.com` in code |
| Resend domain verified | **UNVERIFIED** | Requires Resend dashboard confirmation |
| All 14 event types wired | PASS | See `PHASE2_EMAIL_AUDIT.md` |

**Action:** In Vercel → Project Settings → Environment Variables (Production):

```
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=Servd Co <hello@servdco.com>
ADMIN_NOTIFY_EMAIL=alexandria@servdco.com
```

Redeploy after adding. Then re-run contact form + booking email smoke tests.

---

### Signup — **PASS**

| Check | Result |
|-------|--------|
| 3-step flow (Personal → Experience → Review) | PASS |
| Upload Docs step removed | PASS |
| No `chef_documents` created at signup | PASS |
| Signup succeeds without documents | PASS |
| Progress indicator updated (3 steps) | PASS |
| Review screen updated (no document row) | PASS |

**Files:** `client/pages/ChefRegistration.tsx`

---

### Verification (Post-Signup) — **PASS**

| Check | Result |
|-------|--------|
| Onboarding banner after signup | PASS |
| Message: "Complete verification to receive booking requests" | PASS |
| CTA → `/chef-dashboard/verification` | PASS |
| Query param `?onboarding=verification` on redirect | PASS |

**Files:** `client/pages/ChefDashboard.tsx`, `ChefRegistration.tsx`

---

### Verification Gating — **PASS**

| Unverified cook CAN | Status |
|---------------------|--------|
| Login | PASS |
| Edit profile / avatar | PASS |
| Use dashboard | PASS |
| Upload docs later | PASS |

| Unverified cook CANNOT | Status |
|------------------------|--------|
| Appear in Browse Cooks | PASS — `listPublicChefs()` filters `verification_status = 'approved'` |
| Receive booking requests | PASS — pending cooks not in marketplace |
| Be publicly searchable | PASS — `profile_visibility = 'public'` + approved only |
| Be marked verified | PASS — admin approval required |

**DB proof:** 0 unapproved profiles with `profile_visibility = 'public'` (`scripts/pre-phase3-verification.json`)

---

### Profile Completion — **PASS**

| Requirement | Included in % |
|-------------|---------------|
| Avatar | Yes (1/9) |
| Bio | Yes |
| Cuisines | Yes |
| Availability | Yes |
| Location (city + state) | Yes |
| ServSafe submitted | Yes |
| Insurance submitted | Yes |
| Background Check submitted | Yes |
| Admin approval | Yes |

- No fake 100% — max 89% without admin approval (8/9 checks)
- CTA routes to **Complete Verification** when unverified
- **Files:** `shared/profileCompletion.ts`, `ChefDashboard.tsx`

---

### Admin — **PASS** (code verified)

| Feature | Status |
|---------|--------|
| Booking modal — meal request fields | PASS |
| Pricing + family platform fee display | PASS |
| Contact Messages panel | PASS |
| Orphaned documents utility | PASS |
| Document preview / moderation | PASS (Phase 1) |

---

### Booking — **PASS** (code + migration)

| Feature | Status |
|---------|--------|
| Meal request required on form | PASS |
| Ingredients / recipe notes optional | PASS |
| Display on family/cook/admin views | PASS |
| Server-side price validation | PASS |
| Alexandria pricing rules | PASS — `shared/bookingPricing.test.ts` |

---

### Payments — **PASS** (code verified)

| Feature | Status |
|---------|--------|
| Stripe charge = session + family fee | PASS |
| Cook payout excludes family fee | PASS |
| Webhook payment confirmation email | PASS (when Resend configured) |

---

### Realtime — **PASS**

| Feature | Status |
|---------|--------|
| REPLICA IDENTITY FULL migration | PASS (Phase 1) |
| Dashboard subscriptions unchanged | PASS |
| No Phase 2 regressions to realtime hooks | PASS |

---

### Contact Form — **PASS** (code); **WARN** (live email until Resend key)

| Check | Status |
|-------|--------|
| API route `/api/contact/submit` | PASS |
| DB insert with subject | PASS |
| Admin panel + search | PASS |
| In-app admin notification | PASS |
| Resend to alexandria@servdco.com | WARN — needs `RESEND_API_KEY` |

---

### Moderation — **PASS** (code verified)

| Check | Status |
|-------|--------|
| Preview (PDF.js) | PASS (Phase 1) |
| Approve / reject / resubmit | PASS |
| Live status updates | PASS |
| Document emails via Resend | WARN — needs API key |

---

### Production Health — **PASS** (current deploy); **WARN** (commit lag)

```json
GET https://servdco-one.vercel.app/api/health
{
  "ok": true,
  "route": "/api/health",
  "commit": "a423cd245fdf3b58543ab2629aa26e1af624e473"
}
```

Production is healthy but running **Phase 1 commit** until this merge is deployed.

---

### Regression Testing — **PASS**

```
pnpm typecheck  → PASS
pnpm test       → 106/106 PASS
```

---

## Manual Smoke Test Checklist

After deploy + Resend key, Alexandria should verify:

- [ ] Family signup → browse approved cook only
- [ ] Booking with meal request + ingredients + notes
- [ ] Cook accept → family pay (Stripe test card `4242…`)
- [ ] Cook progress: en route → arrived → cooking → complete
- [ ] Family confirm completion
- [ ] Admin: meal fields + pricing + family fee in booking modal
- [ ] Contact form → admin panel + email
- [ ] Cook uploads docs → admin preview/moderate → cook email
- [ ] Realtime updates without manual refresh

---

## FAIL Items

**None.**

---

## Critical WARN Items

| Item | Resolution |
|------|------------|
| `RESEND_API_KEY` not in Vercel Production | Add key + redeploy |

---

## Non-Critical WARN Items

| Item | Resolution |
|------|------------|
| Production commit behind latest code | Push to `main` + verify Vercel build |
| Manual E2E not run in this session | Alexandria/UAT checklist above |

---

## Phase 3 Readiness

**Code and database:** Ready.  
**Production deploy:** Pending push to `main`.  
**Email delivery:** Blocked on `RESEND_API_KEY` in Vercel only.

Once Resend is configured and Vercel deploys the latest commit, Phase 3 may begin.
