# Cloudflare Setup Report — Servd Co

**Date:** June 22, 2026  
**Scope:** Cloudflare-only security (Turnstile + edge rate limiting)

---

## Summary

Servd Co uses **Cloudflare as the single external security control plane**:

- **Turnstile** — bot protection on signup, contact, and waitlist forms
- **Cloudflare proxy + rate limiting** — IP-based abuse controls at the edge (configure in dashboard)
- **No Redis / Upstash** — nothing to manage outside Cloudflare + Vercel env vars

---

## What Is Implemented in Code

| Component | Status | Notes |
|-----------|--------|-------|
| Cloudflare Turnstile (client) | ✅ | Family/cook signup, contact, waitlist, admin invite stub |
| Turnstile server verify | ✅ | `api/_lib/turnstile.ts` |
| Client IP (`cf-connecting-ip`) | ✅ | `api/_lib/clientIp.ts` |
| Security middleware | ✅ | `api/_lib/securityMiddleware.ts` |
| `security_events` table | ✅ | Logs CAPTCHA failures + blocked requests |
| Admin Security dashboard | ✅ | `/admin-dashboard/security` |
| CSP for Turnstile | ✅ | `challenges.cloudflare.com` in `vercel.json` |
| App in-memory limits | ⚠️ | Best-effort per instance only — **not** production rate limiting |

---

## Environment Variables

### Client (Vercel)

| Variable | Purpose |
|----------|---------|
| `VITE_TURNSTILE_SITE_KEY` | Turnstile widget site key |

### Server (Vercel — Sensitive)

| Variable | Purpose |
|----------|---------|
| `TURNSTILE_SECRET_KEY` | Turnstile siteverify |

That is all you need outside Cloudflare itself.

---

## Cloudflare Dashboard Setup

### 1. Turnstile (required)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Turnstile**
2. Add widget → type **Managed**
3. Domains: production domain, `servdco.vercel.app`, `localhost` (dev)
4. **Site Key** → `VITE_TURNSTILE_SITE_KEY` (Vercel)
5. **Secret Key** → `TURNSTILE_SECRET_KEY` (Vercel, server only)

**Dev test keys** (always pass):

- Site: `1x00000000000000000000AA`
- Secret: `1x0000000000000000000000000000000AA`

### 2. Proxy site (custom domain)

1. Add site to Cloudflare (Free works)
2. DNS → orange cloud (proxied) to Vercel
3. SSL/TLS → **Full (strict)**
4. App reads real IP from `CF-Connecting-IP` automatically

### 3. Rate limiting (recommended — Pro or higher)

Configure in **Security → WAF → Rate limiting rules** (or **Security → Rate limiting**):

| Rule | Match | Limit |
|------|-------|-------|
| Signup | `POST /api/auth/signup` | 5 / hour / IP |
| Login | `POST /api/auth/login` | 20 / hour / IP |
| Contact | `POST /api/contact/submit` | 10 / hour / IP |
| Waitlist | `POST /api/waitlist/submit` | 10 / hour / IP |
| Email API | `POST /api/emails/booking-event` | 20 / minute / IP |

On **Free**, use Turnstile + basic WAF managed rules; upgrade to **Pro** when you need explicit rate limits.

### 4. Future (Business / Enterprise)

- Advanced bot management
- Cloudflare Access in front of `/admin-dashboard`
- Zero Trust for admin SSO

No application redesign required.

---

## API Routes

| Route | Turnstile | Notes |
|-------|-----------|-------|
| `POST /api/auth/signup` | ✅ | User creation |
| `POST /api/auth/login` | — | Rate limit at Cloudflare edge |
| `POST /api/contact/submit` | ✅ | Contact form |
| `POST /api/waitlist/submit` | ✅ | Waitlist |
| `POST /api/security/enforce` | — | User-scoped checks (booking/review/messaging) |

---

## Deployment Checklist

- [ ] Create Turnstile widget in Cloudflare
- [ ] Set `VITE_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` in Vercel
- [ ] Proxy domain through Cloudflare (when on custom domain)
- [ ] Add Cloudflare rate limiting rules (Pro+)
- [ ] Apply migration `20250622100000_cloudflare_security.sql`
- [ ] Deploy to Vercel
- [ ] Verify Turnstile on signup/contact/waitlist

---

## Verification

```bash
pnpm typecheck
pnpm test
pnpm build
node scripts/security-e2e-verify.mjs https://servdco.vercel.app
```
