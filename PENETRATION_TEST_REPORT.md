# Penetration Test Report — Servd Co

**Date:** June 21, 2026  
**Type:** Automated + manual logical testing (internal)  
**Target:** https://servdco-one.vercel.app + local codebase  
**Tester:** Platform security audit (Phase 1)

> This is an **internal logical penetration assessment** based on code review, RLS analysis, and automated endpoint probing. A third-party external pentest is recommended before high-traffic public launch (see `SECURITY_HARDENING_PLAN.md` Phase 3).

---

## Methodology

1. **Static analysis** — Auth flows, API routes, RLS policies, client bypass paths
2. **Architecture review** — STRIDE threat model (`THREAT_MODEL.md`)
3. **Automated E2E** — `scripts/security-e2e-verify.mjs`
4. **Database policy review** — All 32 tables (`RLS_AUDIT_REPORT.md`)
5. **Payment flow review** — Stripe checkout, webhook, transfer pipeline

---

## Findings Summary

| Severity | Count | Remediated |
|----------|-------|------------|
| Critical | 3 | 3 |
| High | 5 | 3 |
| Medium | 4 | 2 |
| Informational | 6 | — |

---

## Critical Findings (Remediated)

### PT-001: Unauthenticated transactional email API
- **Vector:** `POST /api/emails/booking-event` with arbitrary UUID
- **Impact:** Resend email spam, phishing using Servd Co branding, cost abuse
- **Evidence:** No `Authorization` header required pre-fix
- **Fix:** JWT auth + `canSendBookingEmail` / `canSendDocumentEmail` + rate limit
- **Retest:** Expect HTTP 401 without token (after deploy)

### PT-002: Booking status manipulation
- **Vector:** Direct Supabase REST `PATCH bookings` with `status: completed`
- **Impact:** Free meals, bypass payment, fraudulent completion
- **Evidence:** RLS `bookings_update_family/chef` had no transition validation
- **Fix:** `guard_booking_status_transition` DB trigger
- **Retest:** Family JWT pending → completed should raise exception

### PT-003: Profile admin self-promotion
- **Vector:** `PATCH profiles SET role = 'admin' WHERE id = auth.uid()`
- **Impact:** Full platform admin access
- **Evidence:** `profiles_update_own` column-agnostic
- **Fix:** `guard_profile_sensitive_columns` trigger
- **Retest:** Non-admin role change should fail

---

## High Findings

### PT-004: Booking price tampering (Remediated)
- **Vector:** Update `price_cents` to 100 before Stripe checkout
- **Impact:** Pay $1 for full session; platform fee evasion
- **Fix:** `guard_booking_pricing_columns` + server-side platform fee

### PT-005: Public chef profile PII leak (Remediated)
- **Vector:** Anon query `profiles` via public chef policy
- **Impact:** Harvest emails/phones of all public cooks
- **Fix:** `profiles_marketplace_public` limited view

### PT-006: Message body tampering (Remediated)
- **Vector:** Recipient UPDATE on `messages.body`
- **Impact:** Conversation history manipulation
- **Fix:** `guard_message_recipient_update` trigger

### PT-007: Contact form abuse (Partially remediated)
- **Vector:** Automated POST to `/api/contact/submit`
- **Impact:** Spam, Resend cost, admin notification flood
- **Fix:** Rate limit 10/min/IP
- **Residual:** No CAPTCHA — still abusable at low rate

### PT-008: In-memory rate limit bypass (Open)
- **Vector:** Distributed requests across serverless instances / cold starts
- **Impact:** Stripe checkout spam, API abuse
- **Recommendation:** Redis-backed rate limiting

---

## Medium Findings

### PT-009: Pending booking sensitive field exposure (Open)
- **Vector:** Chef JWT reads full booking row while status = pending
- **Impact:** Gate code, emergency contact visible before acceptance
- **Mitigation:** App-layer masking only
- **Recommendation:** DB-level column gating

### PT-010: CSP unsafe-inline (Open)
- **Vector:** XSS → script execution despite other controls
- **Impact:** Session theft, actions as user
- **Recommendation:** Nonce-based CSP

### PT-011: Message rate limit only at DB (Remediated)
- **Vector:** >30 messages/minute
- **Fix:** `guard_message_send_rate` trigger

### PT-012: Platform fee client override (Remediated)
- **Vector:** Pass `family_platform_fee_dollars: 0` on booking create
- **Fix:** Always read from `platform_settings`

---

## Informational

| ID | Finding |
|----|---------|
| PT-I01 | `health` endpoint exposes git commit SHA |
| PT-I02 | Webhook error may include `secretSource` (Stripe route) |
| PT-I03 | Legacy dev auth exists when Supabase auth disabled |
| PT-I04 | Realtime subscriptions rely on SELECT policies being tight |
| PT-I05 | No MFA on admin accounts |
| PT-I06 | Email API returned 404 on prod pre-deploy (route not yet live) |

---

## Automated E2E Results

**Script:** `node scripts/security-e2e-verify.mjs https://servdco-one.vercel.app`  
**Output:** `scripts/security-e2e-results.json`

| Test | Result |
|------|--------|
| Migration guards (static) | 5/5 PASS |
| Email API auth in source | PASS |
| Rate limits in source | PASS |
| CSP + HSTS headers | PASS |
| Contact bad input → 400 | PASS |
| Stripe unauthenticated → 401 | PASS |
| Health → 200 | PASS |
| Email API live 401 | FAIL (404 — pre-deploy) |

**Post-deploy expectation:** 16/16 PASS

---

## Attack Paths Tested (Logical)

| Attack | Pre-fix | Post-fix |
|--------|---------|----------|
| Anonymous email trigger | ✅ Exploitable | ❌ Blocked |
| Status pending → completed | ✅ Exploitable | ❌ Blocked |
| Self-admin via profiles UPDATE | ✅ Exploitable | ❌ Blocked |
| Price cents → 1 | ✅ Exploitable | ❌ Blocked |
| XSS in message body | ❌ Blocked (DOMPurify) | ❌ Blocked |
| Stripe webhook replay | ❌ Blocked (idempotency) | ❌ Blocked |
| Checkout wrong amount | ❌ Blocked (amount verify) | ❌ Blocked |
| CSRF on authenticated API | ❌ N/A (Bearer token) | ❌ N/A |

---

## Recommendations

1. Deploy security hardening commit and re-run E2E script
2. Schedule external pentest before marketing launch
3. Enable Supabase MFA for admin accounts
4. Implement CAPTCHA on public forms
5. Add security regression tests to CI (static checks from E2E script)

---

## Sign-off

| Role | Status |
|------|--------|
| Critical vulnerabilities | Remediated in code + migration |
| E2E verification | 15/16 pass (1 pending deploy) |
| External pentest | Recommended — not yet performed |
| Production ready (security) | **Conditional** — deploy + retest required |
