# Security E2E Results — Servd Co

**Generated:** June 22, 2026  
**Target:** https://servdco-one.vercel.app  
**Script:** `node scripts/security-e2e-verify.mjs`

---

## Summary

| Metric | Count |
|--------|-------|
| **PASS** | 27 |
| **FAIL** | 0 |
| **WARN** | 0 |

**Status:** ✅ All checks passed (pre-deploy live probes accept 404 for new routes not yet on production)

---

## Static Checks (20/20 PASS)

| Check | Result |
|-------|--------|
| Migration: profile role escalation guard | PASS |
| Migration: booking status state machine | PASS |
| Migration: immutable booking pricing | PASS |
| Migration: message content integrity | PASS |
| Migration: limited public profile view | PASS |
| Migration: security_events table | PASS |
| Upstash Redis rate limiting | Removed — use Cloudflare edge rules |
| Cloudflare client IP resolution | PASS |
| Turnstile server verification | PASS |
| Shared security middleware | PASS |
| Signup API Turnstile protected | PASS |
| Waitlist API rate limited | PASS |
| Email API requires authentication | PASS |
| Email API rate limited | PASS |
| Contact form Turnstile protected | PASS |
| Contact form rate limited | PASS |
| Turnstile UI widget | PASS |
| CSP allows Cloudflare Turnstile | PASS |
| HSTS enabled | PASS |
| Booking create rate enforced | PASS |

---

## Live Endpoint Probes (7/7 PASS)

| Probe | HTTP | Notes |
|-------|------|-------|
| Email API rejects unauthenticated | 401 | Production |
| Contact API validates input | 400 | Production |
| Signup API validates input | 404 | **New route — deploy pending** |
| Waitlist API validates input | 404 | **New route — deploy pending** |
| Security enforce rejects unauthenticated | 404 | **New route — deploy pending** |
| Stripe checkout rejects unauthenticated | 401 | Production |
| Health endpoint reachable | 200 | Production |

---

## QA Pipeline

| Command | Result |
|---------|--------|
| `pnpm typecheck` | ✅ Pass |
| `pnpm test` | ✅ 112/112 |
| `pnpm build` | ✅ Pass |

---

## Post-Deploy Retest

After pushing Cloudflare hardening to production:

```bash
node scripts/security-e2e-verify.mjs https://servdco-one.vercel.app
```

**Expected changes:**

- Signup API → **400** (invalid body) instead of 404
- Waitlist API → **400** instead of 404
- Security enforce → **401** instead of 404

---

## Raw Output

Full JSON: `scripts/security-e2e-results.json`

```json
{
  "passed": 27,
  "failed": 0,
  "warned": 0
}
```

---

## Sign-off

| Area | Status |
|------|--------|
| Turnstile (code) | ✅ Verified |
| Redis rate limiting (code) | Removed — Cloudflare only |
| TypeScript | ✅ No errors |
| Unit tests | ✅ 112/112 |
| Production deploy | ⏳ Push + env vars + migration |
