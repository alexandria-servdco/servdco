# ServdCo Admin Access Guide

## 1. Platform owner (Alexandria)

ServdCo uses a **single-owner admin model**. There is exactly one admin initially — Alexandria, the platform owner.

1. Alexandria signs up via normal registration (family or chef flow)
2. In Supabase SQL Editor (service role), promote the account:

```sql
UPDATE public.profiles
SET role = 'admin', status = 'active', updated_at = now()
WHERE email = 'alexandria@servdco.com';
```

3. Sign out and sign back in — the session picks up `role = admin`
4. Navigate to `/admin-dashboard`

**Admin self-registration is permanently disabled:**
- Database trigger `handle_new_user` coerces `role = admin` signups to `family`
- Client `AuthService.register()` rejects non-family/chef roles

## 2. How the owner logs in

1. Open [https://servdco-one.vercel.app/login](https://servdco-one.vercel.app/login)
2. Sign in with email + password using **Supabase Auth** (`VITE_USE_SUPABASE_AUTH=true`)
3. After login, `profiles.role` is read from the database
4. If `role = 'admin'` and `status = 'active'`, the app redirects to `/admin-dashboard`

## 3. Route protection

| Layer | Mechanism |
|-------|-----------|
| **Client routes** | `AdminGuard` in `client/components/Guards.tsx` — only `profile.role === 'admin'` may access `/admin-dashboard/*` |
| **Non-admin redirect** | Families → `/dashboard`, chefs → `/chef-dashboard` (not `/unauthorized`) |
| **Database** | `is_admin()` in RLS policies across bookings, chef_documents, stripe tables, storage |
| **Audit writes** | `AdminAuditService.log()` verifies `profiles.role === 'admin'` before inserting |
| **Stripe API** | `api/_lib/auth.ts` → `requireAdmin()` for refunds and transfer cron |

## 4. Admin capabilities

| Task | UI location | Backend |
|------|-------------|---------|
| Platform overview | Dashboard tab | Real counts from `profiles`, `bookings`, `payments`, `chef_documents`, `reviews` |
| Approve / reject / suspend chefs | Verification / Chef Network | `chef_profiles.verification_status` + DB notification trigger |
| Review documents (PDF/image preview) | Verification Center | `chef_documents` + signed URLs from `cook-documents` bucket |
| Approve / reject / request resubmission | Document preview modal | `AdminService.verifyDocument()` / `requestDocumentResubmission()` |
| View bookings + details modal | Bookings Ledger | `bookings` table (admin RLS) |
| Stripe payments, refunds, transfers, tips | Payout Control | `payments`, `transfers`, `tips` + `POST /api/stripe/refund` |
| Suspend / reactivate users | User Management | `profiles.status` via `AdminModerationSupabaseService` |
| Audit trail | Audit Logs tab | `audit_logs` table |

**There is no admin creation UI and no role assignment UI in the product.**

## 5. Audit logging

Every admin action writes to `audit_logs`:

- Chef approved / rejected / suspended
- Document approved / rejected / resubmission requested
- User suspended / reactivated / deleted
- Booking status changed
- Refund issued

Migration `20250612120024_admin_owner_security.sql` adds the `audit_logs_admin_insert` RLS policy so admins can insert audit rows as `actor_id`.

## 6. Notifications

- Chef profile approved/rejected/suspended: trigger `on_chef_verification_status_change`
- Document approved/rejected: trigger `on_chef_document_status_change`
- Document resubmission requested: `NotificationsSupabaseService.createForUser()` (admin insert policy)

## 7. Dev-only shortcuts (disabled in production)

When `VITE_USE_SUPABASE_AUTH` is not `true`, `AuthService.devLogin("admin")` and legacy mock users exist in `client/services/auth.service.ts`. **These are not used when Supabase auth is enabled.**
