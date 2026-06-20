# Threat Model — Servd Co

**Platform:** Marketplace connecting families with private cooks  
**Stack:** React SPA · Vercel API · Supabase (Postgres + Auth + Storage) · Stripe Connect

---

## Assets

| Asset | Sensitivity | Storage |
|-------|-------------|---------|
| User credentials | Critical | Supabase Auth |
| PII (email, phone, address) | Critical | `profiles`, `booking_addresses`, `bookings` |
| Payment data | Critical | Stripe (PCI); `payments` metadata in Supabase |
| Cook verification docs | High | Private storage bucket |
| Messages | High | `messages`, `message_attachments` |
| Admin audit trail | High | `audit_logs` |
| Platform revenue settings | Medium | `platform_settings` |
| Stripe secrets | Critical | Vercel env (server only) |

---

## Actors

| Actor | Trust | Goals |
|-------|-------|-------|
| Anonymous visitor | Untrusted | Browse, waitlist, contact form |
| Family user | Authenticated | Book cooks, pay, message |
| Cook user | Authenticated | Accept bookings, upload docs, message |
| Admin | Privileged | Moderate, verify, payouts |
| Stripe | Trusted external | Payments, webhooks |
| Attacker | Untrusted | Fraud, data theft, abuse, spam |

---

## Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (untrusted)                                        │
│  React SPA · JWT in localStorage                            │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS + Bearer JWT
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Vercel Edge / Serverless API                               │
│  Stripe · Resend · Auth verify · Rate limits                │
└───────────────────────────┬─────────────────────────────────┘
                            │ Service role (server only)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase                                                   │
│  Postgres + RLS · Storage RLS · Realtime                    │
└─────────────────────────────────────────────────────────────┘
```

**Key assumption:** Client code is fully attacker-controlled. All authorization MUST enforce at RLS/triggers/API — not client guards alone.

---

## STRIDE Analysis

### Spoofing
| Threat | Mitigation | Residual |
|--------|------------|----------|
| Fake admin account | Signup trigger blocks admin role; profile role guard trigger | Low |
| JWT theft via XSS | CSP, DOMPurify, no secrets in DOM | Medium |
| Webhook spoofing | Stripe HMAC signature verification | Low |

### Tampering
| Threat | Mitigation | Residual |
|--------|------------|----------|
| Booking status jump to `completed` | DB status transition trigger | Low (post-fix) |
| Price manipulation before checkout | Immutable pricing trigger | Low (post-fix) |
| Message body edit by recipient | Message update guard trigger | Low (post-fix) |
| Profile role self-promotion | Profile sensitive column trigger | Low (post-fix) |

### Repudiation
| Threat | Mitigation | Residual |
|--------|------------|----------|
| Admin action denial | `audit_logs` + triggers | Low |
| Booking status disputes | `booking_status_history` | Low |

### Information Disclosure
| Threat | Mitigation | Residual |
|--------|------------|----------|
| Full family PII via public chef profile policy | Replaced with limited view | Low (post-fix) |
| Chef reads gate code on pending booking | RLS still exposes full row — app masks | **Medium** |
| Signed URL leakage for cook documents | Short TTL signed URLs | Low |

### Denial of Service
| Threat | Mitigation | Residual |
|--------|------------|----------|
| Contact form spam | Rate limit 10/min | Medium |
| Email API abuse | Auth + rate limit | Low (post-fix) |
| Message flood | 30/min DB trigger | Medium |
| Expensive Stripe API calls | Rate limit 30/min | Medium |

### Elevation of Privilege
| Threat | Mitigation | Residual |
|--------|------------|----------|
| `profiles.role = admin` UPDATE | Trigger blocks non-admin | Low (post-fix) |
| Direct Supabase REST bypassing UI | RLS + triggers | Low-Medium |
| Service role key in client | Never shipped to browser | Low |

---

## Attack Scenarios (Prioritized)

### AS-1: Booking payment bypass (Critical — remediated)
**Path:** Attacker sets `status = confirmed` and `price_cents = 1` via Supabase REST, then triggers checkout.  
**Controls:** Status state machine + immutable pricing triggers.

### AS-2: Email spam via booking-event API (Critical — remediated)
**Path:** Unauthenticated POST to `/api/emails/booking-event` with any UUID.  
**Controls:** JWT auth, participant verification, rate limit.

### AS-3: Admin self-promotion (Critical — remediated)
**Path:** `PATCH /profiles?id=eq.self` with `{ role: admin }`.  
**Controls:** `guard_profile_sensitive_columns` trigger.

### AS-4: Messaging harassment (High — partially remediated)
**Path:** Rapid message send in booking conversation.  
**Controls:** 30/min rate trigger; no block/report yet.

### AS-5: PII harvesting from marketplace (High — remediated)
**Path:** Anon reads full `profiles` rows for public chefs (email, phone).  
**Controls:** `profiles_marketplace_public` view with 3 columns only.

---

## Data Flow — Payment

```
Family creates booking (RLS: family insert, public chef check)
  → Cook accepts (status: pending → accepted) [DB trigger validates]
  → Family pays via Stripe Checkout [API validates ownership + amount vs DB]
  → Webhook confirms payment [HMAC + idempotency + amount verify]
  → Transfer scheduled [service role, payment.status = succeeded]
```

---

## Out of Scope

- Physical security of cook/family homes
- Stripe infrastructure compromise
- Supabase platform-level breaches
- Social engineering of admin users

---

## Review Cadence

- **Quarterly:** RLS policy review, dependency audit
- **Per release:** Run `scripts/security-e2e-verify.mjs`
- **After incidents:** Update this model and `SECURITY_HARDENING_PLAN.md`
