# RLS Audit Report — Servd Co

**Date:** June 21, 2026  
**Tables audited:** 32 public tables + 4 storage buckets  
**Migration remediation:** `20250621180000_security_hardening.sql`

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Tables with RLS enabled | 32/32 | 32/32 |
| Tables with FORCE RLS | 6 | 11 |
| Critical RLS gaps | 5 | 0 (mitigated) |
| Overly permissive SELECT policies | 3 | 0 (replaced/ guarded) |

---

## Admin Model

```sql
is_admin() := profiles.role = 'admin'
           AND status = 'active'
           AND deleted_at IS NULL
```

Service role bypasses RLS for Stripe ledger, webhooks, system notifications (intentional).

---

## Remediations Applied (20250621180000)

### 1. Profile privilege escalation
**Before:** `profiles_update_own` allowed any column change including `role`.  
**After:** `guard_profile_sensitive_columns` trigger blocks `role`, `status`, `deleted_at` changes for non-admins.

### 2. Public chef PII exposure
**Before:** `profiles_select_public_chef` exposed full row (email, phone, zip) to anon.  
**After:** Policy dropped; `profiles_marketplace_public` view exposes only `id`, `full_name`, `avatar_url`. Client updated in `chefs.service.ts`.

### 3. Booking fraud
**Before:** Family/chef could UPDATE status to any enum value; pricing columns mutable.  
**After:**
- `guard_booking_status_transition` — validates state machine (mirrors `shared/booking.ts`)
- `guard_booking_pricing_columns` — immutable `price_cents`, fee columns for non-admins
- `bookings_insert_family` — requires `is_public_chef_profile(chef_profile_id)`

### 4. Message integrity
**Before:** `messages_update_read_participants` allowed recipient to change `body`.  
**After:** `guard_message_recipient_update` trigger; `guard_message_send_rate` (30/min).

### 5. Analytics pollution
**Before:** `chef_profile_views_insert_authenticated` WITH CHECK `(true)`.  
**After:** `viewer_profile_id IS NULL OR viewer_profile_id = auth.uid()`.

### 6. Audit log consistency
**Before:** `audit_logs_admin_insert` checked role only.  
**After:** Uses `is_admin()` (includes active status).

### 7. FORCE RLS extended
Added to: `messages`, `conversations`, `chef_documents`, `stripe_customers`, `transfers`.

---

## Table-by-Table Status (Post-Remediation)

### Identity
| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|--------|--------|--------|--------|-------|
| profiles | Own, admin, booking chef, view | Self/admin | Own (guarded), admin | Denied | ✅ |
| chef_profiles | Public approved, own, admin | Own chef | Own, admin | Denied | ✅ |
| chef_portfolio_images | Public/own/admin | Own | Own | Own soft | ✅ |

### Bookings
| Table | Notes |
|-------|-------|
| bookings | Triggers enforce status + pricing; insert requires public chef |
| booking_addresses | Chef pending: full address (Medium — app masks) |
| booking_status_history | Append-only participants | ✅ |

### Messaging
| Table | Notes |
|-------|-------|
| conversations | Participant SELECT/INSERT; admin ALL | ✅ |
| messages | Rate limit + update guard triggers | ✅ |
| message_attachments | Participant access; private storage | ✅ |

### Payments / Stripe
| Table | User writes | Notes |
|-------|-------------|-------|
| payments | None | Service role + FORCE RLS |
| stripe_customers | None | Own SELECT only |
| stripe_accounts | None | Chef own SELECT |
| stripe_events | None | Admin SELECT |
| transfers | None | Chef SELECT |
| cook_payouts | None | Chef/admin SELECT |
| tips | Family INSERT | Service role updates |

### Documents
| Table | Notes |
|-------|-------|
| chef_documents | Chef own + admin; private bucket | ✅ FORCE RLS |

### Ops / Public
| Table | Risk | Notes |
|-------|------|-------|
| waitlist_signups | Low spam | Open INSERT |
| interest_requests | Low spam | Open INSERT |
| contact_messages | Low | Open INSERT + rate limit at API |
| platform_settings | Low | Public SELECT key allowlist only |
| feature_flags | Low | Public SELECT key allowlist only |

---

## Storage Buckets

| Bucket | Public | Access |
|--------|--------|--------|
| avatars | Yes | Own folder write; world read |
| cook-portfolio | Yes | Public chef images |
| cook-documents | **No** | Chef + admin; signed URLs |
| message-attachments | **No** | Participant + uploader folder |

---

## Remaining Gaps (Non-Critical)

| ID | Severity | Issue | Recommendation |
|----|----------|-------|----------------|
| RLS-01 | Medium | Chef SELECT on pending bookings includes gate code columns | Status-gated view or column split |
| RLS-02 | Medium | `profiles_select_booking_chef` exposes full family row | Limit to name + masked contact |
| RLS-03 | Low | Waitlist/interest open INSERT | CAPTCHA + honeypot |
| RLS-04 | Low | Message attachment storage no DELETE policy | Orphan cleanup job |

---

## Policy Source Files

| Migration | Content |
|-----------|---------|
| `20250605120009_10_rls_policies.sql` | Core 77 policies |
| `20250605120010_11_storage_buckets.sql` | Storage policies |
| `20250612120024_admin_owner_security.sql` | Admin signup block |
| `20250612130027_booking_participant_visibility.sql` | Booking chef visibility |
| `20250612140028_profiles_public_chef_avatar.sql` | **Superseded** by security migration |
| `20250621180000_security_hardening.sql` | Triggers + policy fixes |

---

## Verification

After migration apply:
```bash
node scripts/run-pending-migrations.mjs
# Confirm 20250621180000 in appliedThisRun
```

Manual RLS test (recommended with test JWTs):
1. Family JWT — attempt `UPDATE profiles SET role = 'admin'` → expect error
2. Family JWT — attempt `UPDATE bookings SET status = 'completed'` from pending → expect error
3. Anon — query `profiles_marketplace_public` → only 3 columns
4. Anon — query `profiles` for chef user_id → no row (unless own session)
