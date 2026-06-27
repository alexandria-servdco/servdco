# Launch Certification Report — Phase 2 RC

**Date:** June 12, 2026  
**Production URL:** https://servdco-one.vercel.app  
**Production commit:** `edb4175`  
**Certification type:** Release Candidate (automated + targeted production probes)

---

## Executive Recommendation

### **Ready for Private Beta** — with documented caveats

Not ready for unrestricted public launch until:
1. Live Stripe payment round-trip is signed off manually
2. Lighthouse Performance is improved (currently **59**, target ≥95)
3. Full device matrix manual QA is completed (see checklist below)

---

## Critical Bug Found & Fixed During Phase 2

| ID | Severity | Issue | Fix | Commit |
|----|----------|-------|-----|--------|
| RC-001 | **P0** | `@shared/location` path alias failed in Vercel serverless bundles → signup, location reverse/update returned HTTP 500 | Changed to relative import `../../../shared/location.js` in `api/_lib/location/reverseGeocode.ts` | `edb4175` |

**Impact before fix:** Family/cook signup could fail at module load; GPS location detection broken in production.

**Verification after fix:** Production smoke **12/12 PASS** including Columbus reverse geocode → ZIP `43216`.

---

## Automated Verification Summary

| Check | Result |
|-------|--------|
| `pnpm typecheck` | ✅ Pass |
| `pnpm test` | ✅ 146/146 pass |
| `pnpm build` | ✅ Pass |
| Production smoke (`phase1-production-smoke.mjs`) | ✅ 12/12 pass |
| Schema sync (Phase 1) | ✅ 48 migrations, types regenerated |
| Vercel deploy | ✅ `edb4175` live |

---

## Production API Smoke (post-fix)

| Endpoint | Expected | Actual |
|----------|----------|--------|
| `GET /api/health` | 200 + commit | ✅ `edb41752` |
| `POST /api/auth/signup` (invalid) | 400 | ✅ 400 |
| `POST /api/auth/login` (invalid) | 400/401 | ✅ 400 |
| `POST /api/contact/submit` (invalid) | 400 | ✅ 400 |
| `POST /api/waitlist/submit` (invalid) | 400 | ✅ 400 |
| `POST /api/stripe/create-checkout-session` | 401 | ✅ 401 |
| `POST /api/stripe/webhook` (unsigned) | 400 | ✅ 400 |
| `POST /api/location/reverse` (invalid) | 400 | ✅ 400 |
| `POST /api/location/reverse` (Columbus) | 200 + ZIP | ✅ 200, ZIP 43216 |
| `POST /api/location/update` (no auth) | 401 | ✅ 401 |
| `POST /api/launch/sync-user` (no auth) | 401 | ✅ 401 |

No `FUNCTION_INVOCATION_FAILED` or HTTP 500 on probed routes.

---

## Lighthouse — Home Page (production)

| Category | Score | Target | Status |
|----------|-------|--------|--------|
| Performance | **59** | ≥95 | ❌ Below target |
| Accessibility | **86** | ≥95 | ⚠️ Below target |
| Best Practices | **100** | ≥95 | ✅ |
| SEO | **100** | ≥95 | ✅ |

**Performance drivers (known):** Large vendor bundles (Sentry ~468KB, vendor ~800KB), PDF worker preload, no aggressive code-splitting on home route.

**Safe optimizations deferred:** Require perf sprint without feature changes; not blocking Private Beta if stakeholders accept load times.

Artifact: `scripts/phase2-lighthouse-home.json`

---

## Section-by-Section QA Status

Legend: ✅ Automated/code verified | 🔶 Requires manual signoff | ❌ Known gap

### §1 Family Account
| Workflow | Status | Notes |
|----------|--------|-------|
| Signup | ✅ | Validation + Turnstile enforced (400 CAPTCHA without token) |
| Login / Remember Me / Session | 🔶 | Session logic tested in unit tests; manual cookie verify |
| Forgot / Reset password | 🔶 | Supabase auth flow — manual |
| Cookie consent | ✅ | Component exists; analytics gated |
| Legal acceptance | ✅ | Version `2026-06-12`; re-acceptance modal |
| GPS / Manual location | ✅ | Reverse geocode production verified |
| Launch Control | ✅ | Unit tests + API routes |
| Browse / Book / Stripe / Tips | 🔶 | Lifecycle tests pass; live Stripe not run |
| Messaging / Notifications / Reviews | 🔶 | Realtime requires two-user manual test |
| Dashboard / Settings | 🔶 | Manual responsive pass needed |

### §2 Cook Account
| Workflow | Status | Notes |
|----------|--------|-------|
| Signup + verification docs | 🔶 | Upload flow manual |
| Reject / Resuspend / soft delete | ✅ | Hardening sprint implemented |
| Stripe Connect | 🔶 | Manual with test/live keys |
| Booking accept / messaging | 🔶 | Manual |

### §3 Admin
| Workflow | Status | Notes |
|----------|--------|-------|
| All admin tabs | 🔶 | Code complete; manual layout audit on mobile |
| Document preview / moderation | 🔶 | Manual |

### §4 Stripe Live Test
| Step | Status |
|------|--------|
| Live payment → webhook → booking confirmed | ❌ **Not executed** (requires human + live keys) |
| Refund round-trip | ❌ Not executed |
| stripe_events / audit logs | 🔶 Verify after live test |

### §5 Email QA
| Email type | Status |
|------------|--------|
| All production templates | 🔶 | Resend wired; inbox rendering manual |
| Branding / dark mode | 🔶 | Manual client preview |

### §6 Messaging
| Item | Status |
|------|--------|
| Trust notice + dismiss | ✅ | Implemented + localStorage |
| Realtime / read receipts | 🔶 | Manual two-browser test |
| Mobile layout | 🔶 | Manual |

### §7 Location
| Item | Status |
|------|--------|
| Reverse geocode (GPS path) | ✅ Production verified |
| Manual entry / Launch sync | ✅ API + unit tests |
| Service radius (stored) | ✅ Not used in booking yet (by design) |

### §8 Launch Control
| Item | Status |
|------|--------|
| Region states / permissions | ✅ `shared/launchControl.test.ts` + DB RPCs |
| Block bookings/payments/messages | 🔶 | Manual per-region test |

### §9 Security
| Item | Status |
|------|--------|
| Auth / RLS / rate limits / Turnstile | ✅ Code + smoke |
| Webhook signature verification | ✅ Returns 400 without sig |
| Admin route protection | 🔶 | Manual role test |

### §10–11 Responsive & Accessibility
| Item | Status |
|------|--------|
| 320px–1920px matrix | 🔶 Manual |
| Keyboard / ARIA / contrast | 🔶 Lighthouse a11y 86; manual audit recommended |

### §12 Performance
| Item | Status |
|------|--------|
| Lighthouse targets | ❌ Performance 59, A11y 86 |

### §13 Regression
| Area | Status |
|------|--------|
| Bookings / Stripe / Messaging / Launch / Location / Legal | ✅ No regressions in automated suite post-fix |

---

## Remaining Issues (by severity)

| ID | Severity | Issue | Owner action |
|----|----------|-------|--------------|
| RC-002 | High | Lighthouse Performance 59 | Perf sprint: lazy Sentry, split vendor chunks |
| RC-003 | High | Live Stripe payment not certified | Run one real booking + refund in production |
| RC-004 | Medium | Accessibility 86 | Fix contrast/focus/labels flagged by Lighthouse |
| RC-005 | Medium | Full device manual QA incomplete | Run checklist on iOS Safari + Android Chrome |
| RC-006 | Low | Vercel Hobby 11/12 function slots | Consolidate Stripe routes before adding APIs |
| RC-007 | Low | `supabase link` not configured locally | Use `scripts/phase1-generate-types.mjs` |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Signup failure in production | Low (fixed RC-001) | Critical | Smoke tests in CI |
| Payment webhook miss | Medium | High | Manual Stripe live test before public launch |
| Slow mobile first load | Medium | Medium | Accept for Private Beta; perf sprint |
| Off-platform messaging fraud | Low | Medium | Trust notice + future moderation rules |

---

## Manual QA Checklist (Private Beta signoff)

Copy from `shared/e2e-checklist.test.ts` and complete in staging/production:

- [ ] Family register → confirm email → dashboard
- [ ] Cook register → upload docs → admin approve
- [ ] Browse → book → Stripe checkout (live) → confirmed
- [ ] Messaging between family and cook
- [ ] GPS location on mobile Safari
- [ ] Launch Control: waitlist vs active region
- [ ] Admin: verify document, moderate message
- [ ] Refund from admin/cook flow
- [ ] Cookie consent + legal re-acceptance

---

## Files Modified in Phase 2

- `api/_lib/location/reverseGeocode.ts` — fix import path
- `api/platform/[action].ts` — improved error logging
- `scripts/phase1-production-smoke.mjs` — Columbus geocode probe
- `scripts/phase2-lighthouse-home.json` — Lighthouse artifact

---

## Certification Sign-off

| Role | Status |
|------|--------|
| Automated RC gate | ✅ **PASS** (post RC-001 fix) |
| Production deploy | ✅ `edb4175` |
| Private Beta | ✅ **Recommended** |
| Public Launch | ❌ **Not yet** — complete RC-002, RC-003, RC-005 |

---

*Screenshots: capture manually during Private Beta UAT on family signup, cook dashboard, booking checkout, and admin verification queue.*
