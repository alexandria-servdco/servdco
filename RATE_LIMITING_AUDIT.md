# Rate Limiting Audit — Servd Co

**Date:** June 22, 2026  
**Primary control:** Cloudflare edge (dashboard)  
**App fallback:** In-memory per serverless instance (not distributed)

---

## Strategy

| Layer | Responsibility |
|-------|----------------|
| **Cloudflare** | IP-based rate limits (signup, login, contact, waitlist, email API) |
| **Turnstile** | Bot / automated abuse on public forms |
| **App (memory)** | Best-effort safety net + user-scoped limits (booking, review, messaging) |
| **Postgres** | Message send trigger (30/min/sender) from prior hardening |

**No Redis / Upstash** — rate limiting is managed in Cloudflare only for production IP controls.

---

## Recommended Cloudflare Rules (Pro+)

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/signup` | 5 | 1 hour / IP |
| `POST /api/auth/login` | 20 | 1 hour / IP |
| `POST /api/contact/submit` | 10 | 1 hour / IP |
| `POST /api/waitlist/submit` | 10 | 1 hour / IP |
| `POST /api/emails/booking-event` | 20 | 1 minute / IP |

Configure under **Security → WAF → Rate limiting rules** after proxying traffic through Cloudflare.

---

## App Policy Registry

`api/_lib/rateLimitPolicies.ts` — used by in-memory fallback only:

| Policy | Limit | Scope |
|--------|-------|-------|
| signup | 5/h | IP |
| login | 20/h | IP |
| contact | 10/h | IP |
| waitlist | 10/h | IP |
| messaging | 30/min | User |
| booking_create | 10/h | User |
| review_submit | 5/day | User |
| email_event | 20/min | IP |
| stripe_default | 30/min | IP |

User-scoped limits are enforced via `POST /api/security/enforce` before Supabase writes.

---

## Client IP

`api/_lib/clientIp.ts` priority:

1. `cf-connecting-ip`
2. `x-forwarded-for` (first hop)
3. `x-real-ip`

---

## Violation Logging

429 responses log to `security_events` (`event_type: rate_limit`).

---

## Sign-off

| Check | Status |
|-------|--------|
| Upstash / Redis removed | ✅ |
| Cloudflare IP resolution | ✅ |
| Turnstile on public forms | ✅ |
| Cloudflare dashboard rules documented | ✅ |
