# Security Hardening Plan — Servd Co

**Last updated:** June 21, 2026  
**Status:** Phase 1 complete (Critical fixes shipped)

---

## Phase 1 — Critical (Complete)

| Item | Owner | Status |
|------|-------|--------|
| Authenticate `/api/emails/booking-event` | API | ✅ Done |
| Rate limit contact + email routes | API | ✅ Done |
| Profile role/status escalation trigger | DB | ✅ Done |
| Booking status state machine trigger | DB | ✅ Done |
| Immutable booking pricing trigger | DB | ✅ Done |
| Message recipient update guard | DB | ✅ Done |
| Message send rate limit (30/min) | DB | ✅ Done |
| Public profile PII — limited view | DB + client | ✅ Done |
| Booking insert requires public chef | DB | ✅ Done |
| Platform fee from server settings only | Client | ✅ Done |
| `canTransition()` in updateBookingStatus | Client | ✅ Done |
| Admin require active status in API | API | ✅ Done |

**Migration:** `20250621180000_security_hardening.sql`  
**Deploy:** Push to `main` → Vercel auto-deploy

---

## Phase 2 — High (Next 2 weeks)

| Item | Effort | Notes |
|------|--------|-------|
| Distributed rate limiting (Upstash Redis / Vercel KV) | M | Replace in-memory `rateLimit.ts` |
| CAPTCHA on contact + waitlist (Turnstile/hCaptcha) | S | Prevent automated spam |
| Booking PII column split or status-gated RLS | L | Chef pending bookings — mask gate code at DB |
| Magic-byte file validation on upload | M | Server-side or Edge Function |
| Stripe checkout URL domain allowlist | S | Restrict success/cancel URLs to app origin |
| Admin document actions — fail if audit log fails | S | Fail-closed moderation |

---

## Phase 3 — Medium (Next sprint)

| Item | Effort | Notes |
|------|--------|-------|
| CSP: remove `'unsafe-inline'` scripts | L | Nonce-based CSP |
| Messaging block/report + admin queue | M | Abuse handling |
| Attachment daily cap per conversation | S | DB trigger |
| `chef_profile_views` server-side insert only | S | Remove client INSERT |
| Penetration test (external) | L | Schedule before public launch |
| Security headers audit on preview URLs | S | Verify all Vercel environments |

---

## Phase 4 — Low / Continuous

| Item | Notes |
|------|-------|
| Dependency scanning (Dependabot/Snyk) | Weekly |
| Supabase Auth MFA for admin accounts | Optional |
| Session rotation on privilege change | Supabase feature |
| WAF rules on Vercel Pro | If traffic scales |
| Bug bounty program | Post-launch |

---

## Verification Checklist (Each Release)

```bash
pnpm typecheck
pnpm test
node scripts/run-pending-migrations.mjs
node scripts/security-e2e-verify.mjs https://servdco-one.vercel.app
```

Expected: 0 FAIL on static checks; live probes pass after deploy.

---

## Environment Requirements

| Variable | Purpose | Exposure |
|----------|---------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Server API, webhooks | Server only |
| `STRIPE_SECRET_KEY` | Payments | Server only |
| `STRIPE_WEBHOOK_SECRET` | Webhook verify | Server only |
| `RESEND_API_KEY` | Email | Server only |
| `CRON_SECRET` | Scheduled jobs | Server only |
| `VITE_SUPABASE_ANON_KEY` | Client | Public (RLS protects) |

Never commit `.env.local` or production keys to git.

---

## Incident Response (Summary)

1. **Detect** — Sentry, admin audit logs, Stripe dashboard
2. **Contain** — Suspend user via admin, revoke sessions (Supabase dashboard)
3. **Eradicate** — Patch RLS/API, deploy migration
4. **Recover** — Verify E2E security script
5. **Review** — Update `THREAT_MODEL.md` and this plan

Contact: platform admin (Alexandria Porter) for production incidents.
