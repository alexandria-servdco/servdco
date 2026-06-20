# Security Audit Report — Servd Co

**Date:** June 21, 2026  
**Scope:** Full-stack audit (client, Vercel API, Supabase RLS, Stripe)  
**Migration applied:** `20250621180000_security_hardening.sql`  
**Commit:** Pending push (security hardening batch)

---

## Executive Summary

Servd Co uses a defense-in-depth model: Supabase Auth (JWT), Row Level Security, Vercel serverless API routes for Stripe/secrets, and client-side validation. The audit identified **3 Critical**, **8 High**, and **12 Medium** issues. Critical items have been remediated in code and migration; remaining items are tracked in `SECURITY_HARDENING_PLAN.md`.

| Severity | Found | Fixed This Pass | Open |
|----------|-------|-----------------|------|
| Critical | 3 | 3 | 0 |
| High | 8 | 5 | 3 |
| Medium | 12 | 4 | 8 |
| Low | 6 | 0 | 6 |

---

## 1. Authentication

### Architecture
- Supabase Auth with JWT in browser session (`localStorage` via Supabase client)
- API routes verify Bearer tokens via `api/_lib/auth.ts` → `verifySupabaseUser()`
- Admin signup blocked at DB trigger (`handle_new_user` coerces `admin` → `family`)

### Findings

| ID | Severity | Issue | Status |
|----|----------|-------|--------|
| AUTH-01 | High | Legacy in-memory auth grants admin if email contains "admin" | Mitigated — disabled when `VITE_USE_SUPABASE_AUTH=true` |
| AUTH-02 | Medium | JWT in localStorage — XSS can exfiltrate session | Accepted risk — CSP + DOMPurify on user content |
| AUTH-03 | Low | `requireAdmin()` did not check `status = active` | **Fixed** — now requires active admin |

---

## 2. Authorization & Privilege Escalation

| ID | Severity | Issue | Status |
|----|----------|-------|--------|
| AUTHZ-01 | **Critical** | Users could `UPDATE profiles SET role = 'admin'` via RLS `profiles_update_own` | **Fixed** — `guard_profile_sensitive_columns` trigger |
| AUTHZ-02 | High | Admin mutations rely on RLS only (no server RPC) | Partial — RLS + triggers; audit logging on client |
| AUTHZ-03 | Medium | `audit_logs_admin_insert` did not require active admin | **Fixed** — uses `is_admin()` |

---

## 3. API Security

| Endpoint | Auth | Rate Limit | Validation |
|----------|------|------------|------------|
| `/api/emails/booking-event` | **Fixed** — JWT + participant/admin | 20/min | Zod |
| `/api/contact/submit` | Public | **Fixed** — 10/min | Zod |
| `/api/stripe/*` | JWT / HMAC / CRON | 30/min | Zod |
| `/api/health` | Public | None | N/A |

| ID | Severity | Issue | Status |
|----|----------|-------|--------|
| API-01 | **Critical** | Public email API allowed arbitrary Resend spam | **Fixed** — auth + participant check |
| API-02 | High | Contact form had no rate limit | **Fixed** |
| API-03 | Medium | In-memory rate limits per serverless instance | Open — migrate to Redis/KV |

---

## 4. Booking & Payment Fraud

| ID | Severity | Issue | Status |
|----|----------|-------|--------|
| PAY-01 | **Critical** | RLS allowed arbitrary `bookings.status` updates (e.g. `pending` → `completed`) | **Fixed** — DB status state machine trigger |
| PAY-02 | **Critical** | Client could tamper `price_cents` / platform fees before checkout | **Fixed** — immutable pricing trigger + server fee source |
| PAY-03 | High | Bookings insertable for non-public chefs | **Fixed** — RLS requires `is_public_chef_profile()` |
| PAY-04 | High | Client could pass `family_platform_fee_dollars: 0` | **Fixed** — always read from `platform_settings` |
| PAY-05 | Medium | `updateBookingStatus` skipped `canTransition()` | **Fixed** — client validation + DB trigger |

**Stripe (strong):** Webhook HMAC, amount verification, idempotency, service-role ledger writes.

---

## 5. RLS & Data Access

See `RLS_AUDIT_REPORT.md` for full table-by-table analysis.

Key remediations:
- Dropped over-broad `profiles_select_public_chef` → `profiles_marketplace_public` view (id, name, avatar only)
- `FORCE ROW LEVEL SECURITY` on messages, conversations, chef_documents, stripe_customers, transfers

---

## 6. Input Validation & Injection

- **Zod** schemas in `shared/validation.ts` for forms, bookings, messaging, Stripe payloads
- **DOMPurify** on message send (`messages.service.ts`)
- **SQL injection:** Supabase parameterized queries; no raw SQL in client
- **HTML injection:** Email templates use `escapeHtml()`; legal pages use DOMPurify

---

## 7. XSS

| Surface | Control | Risk |
|---------|---------|------|
| Message body | DOMPurify + plain text render | Low |
| Legal HTML | DOMPurify static content | Low |
| CSP | `vercel.json` — `'unsafe-inline'` on scripts | Medium |

---

## 8. CSRF

SPA uses Bearer JWT (not cookie session) — classic CSRF risk is **low** for authenticated API calls. Public POST routes (`contact`) remain cross-site abusable — mitigated by rate limits; CAPTCHA recommended (Phase 2).

---

## 9. File Uploads

- Client validation: `validateFile.ts` (MIME, extension, 5MB images / 10MB docs)
- Storage RLS: folder = `auth.uid()` for private buckets
- `cook-documents` private with signed URLs

| ID | Severity | Issue | Status |
|----|----------|-------|--------|
| UP-01 | Medium | MIME trust client `file.type` only | Open — magic-byte validation |
| UP-02 | Low | `upsert: true` on some uploads | Open |

---

## 10. Messaging Abuse

| Control | Status |
|---------|--------|
| RLS participant-only insert | ✅ |
| Body max 4000 + DOMPurify | ✅ |
| Conversation requires booking participation | ✅ |
| **Rate limit 30 msg/min/sender** | **Fixed** — DB trigger |
| Message body tampering by recipient | **Fixed** — update guard trigger |
| Block/report flow | Open |

---

## 11. Secrets Management

- Stripe keys, service role, Resend — server env only (`api/_lib/stripe/env.ts`)
- `.env.local` gitignored; `.env.example` placeholders only
- No hardcoded live secrets in source

---

## 12. Session & Headers

`vercel.json` provides: HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy.

---

## 13. DDoS / Abuse Resilience

| Layer | Control |
|-------|---------|
| Vercel edge | Platform DDoS mitigation |
| API | Per-route rate limits (in-memory) |
| Supabase Auth | Platform rate limits in `config.toml` |
| DB | Message send rate trigger |
| Contact/waitlist | Rate limits + open INSERT policies (spam vector) |

---

## 14. E2E Verification Results

Script: `node scripts/security-e2e-verify.mjs`

| Check | Result |
|-------|--------|
| Static migration guards | 12/12 PASS |
| Contact validation (400 on bad input) | PASS |
| Stripe checkout (401 unauthenticated) | PASS |
| Health endpoint | PASS |
| Email API 401 (post-deploy) | Pending deploy |

Results: `scripts/security-e2e-results.json`

---

## Recommendations Priority

1. **Deploy** security hardening commit and re-run E2E probes
2. **Distributed rate limiting** (Upstash/Vercel KV)
3. **CAPTCHA** on contact + waitlist forms
4. **Column-level PII** for booking chef SELECT (status-gated sensitive fields)
5. **CSP tightening** — remove `'unsafe-inline'` where feasible

See `SECURITY_HARDENING_PLAN.md` for phased roadmap.
