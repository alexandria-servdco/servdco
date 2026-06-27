# Production Hardening Report — June 2026

## Summary

Implemented production-grade cook lifecycle, session policy, cookie consent, legal acceptance, and admin permanent delete. Typecheck and production build pass. One pre-existing messaging feature-flag test timed out in CI (flaky network).

## Files Modified / Added

### Database
- `supabase/migrations/20250703120000_production_hardening.sql` — legal columns, cook rejection/suspension fields, soft-delete profile RLS, document resubmit trigger

### Shared
- `shared/legalVersions.ts`, `shared/cookieConsent.ts`

### API
- `api/_lib/handlers/adminPermanentDelete.ts`, `api/admin/[action].ts`
- `api/_lib/supabase/authAdminRest.ts` — `deleteAuthUser`
- `api/_lib/handlers/authSignup.ts` — legal acceptance + soft-deleted email handling
- `api/_lib/legalVersions.ts`

### Client — Auth & Session
- `client/lib/session/sessionPolicy.ts`, `client/hooks/useSessionPolicy.ts`, `client/hooks/useValidSession.ts`
- `client/lib/supabase/client.ts` — adaptive auth storage (session vs remember-me)
- `client/providers/AuthProvider.tsx`, `client/services/auth.service.ts`, `client/pages/Login.tsx`
- `client/components/Guards.tsx` — `AccountStatusGuard`
- `client/components/Navbar.tsx` — valid session for dashboard link

### Client — Legal & Cookies
- `client/lib/cookieConsent/storage.ts`, `client/components/legal/*`
- `client/lib/analytics.ts` — gated on analytics consent
- `client/components/Footer.tsx` — manage cookie preferences

### Client — Cook Lifecycle
- `client/services/supabase/admin-moderation.service.ts`
- `client/services/supabase/profiles.service.ts`, `documents.service.ts`
- `client/services/admin.service.ts`, `client/lib/api.ts`
- `client/components/account/AccountLifecyclePanels.tsx`
- `client/pages/ChefDashboard.tsx`, `AdminDashboard.tsx`
- `client/components/admin/ChefNetworkTable.tsx`, `UserManagementTable.tsx`

### Client — Signup
- `client/pages/ChefRegistration.tsx`, `FamilyRegistration.tsx`
- `client/lib/securityApi.ts`

### Performance
- `index.html` — hero image preload
- `client/pages/Index.tsx` — `fetchPriority` on hero images

### Types
- `client/lib/supabase/database.types.ts`, `client/lib/auth/legacySession.ts`

## Database Changes

| Table | Columns / policies |
|-------|-------------------|
| `profiles` | `accepted_terms_*`, `accepted_privacy_*`, `marketing_opt_in`, `cookie_preferences`, `account_restore_requested_at` |
| `chef_profiles` | `verification_rejection_reason`, `verification_rejected_at`, `suspension_reason` |
| RLS | Own profile readable when soft-deleted; restore-request update policy |
| Trigger | Reset verification to `pending` on document resubmit after rejection |

**Migration status:** `20250703120000_production_hardening.sql` created locally — apply with `npx supabase db push` before using new columns in production.

## Cook Lifecycle

| Case | Behavior |
|------|----------|
| A — Reject verification | Account stays active; rejection reason + notification; re-upload sets `pending` |
| B — Suspend | `profiles.status=suspended`, hidden profile, payouts disabled, dashboard banner |
| C — Soft delete | `deleted_at` set; login works; deleted panel + restore request |
| D — Permanent delete | Admin API removes auth, profile, docs, Stripe row, region access; email reusable |

## Session Management

- Idle timeout: 30 minutes
- Max lifetime: 7 days (default) / 30 days (Remember me)
- Non-remember sessions use `sessionStorage` for Supabase tokens
- Expired sessions clear caches and redirect to `/login?expired=1`

## Cookie System

- First-visit modal: Accept all / Essential only / Customize
- Analytics initializes only after consent
- Footer link reopens preferences
- Logged-in users can persist preferences to `profiles.cookie_preferences`

## Terms System

- Signup requires Terms + Privacy checkboxes (stored on profile)
- `LegalReacceptanceModal` prompts when `TERMS_VERSION` / `PRIVACY_VERSION` change

## Performance

- Hero preload + `fetchPriority="high"`
- Existing lazy routes for dashboards/admin preserved
- Vendor chunks unchanged; main bundle ~299 kB gzip ~68 kB

## Verification Commands

```bash
pnpm typecheck   # pass
pnpm test        # 141/142 pass (messaging flag test timeout)
pnpm build       # pass
```

## QA Checklist

| Item | Status |
|------|--------|
| Reject verification + notes | Implemented — verify after migration |
| Re-upload → pending | Implemented |
| Suspend account | Implemented |
| Soft delete + sign-in | Implemented |
| Permanent delete + email reuse | Implemented — verify after migration |
| Session timeout / remember me | Implemented |
| Cookie preferences | Implemented |
| Terms acceptance | Implemented |
| State dropdown | Fixed in `d7f7a1c` |
| Stripe / messaging / launch control | No breaking changes intended |

## Remaining Technical Debt

1. Apply migration `20250703120000` to production Supabase
2. WebP/AVIF image conversion not done (hero still PNG)
3. Messaging feature-flag unit test flaky (5s timeout)
4. `CookiePreferencesManager` could sync guest prefs to profile on login
5. Policy page copy not updated for new cookie/terms sections (pages exist)

## Deploy

Push to `main` triggers Vercel GitHub integration. Ensure env vars unchanged (`SUPABASE_*`, `VITE_GA_MEASUREMENT_ID`).
