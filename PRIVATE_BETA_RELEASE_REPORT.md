# Private Beta Release Report — Servd Co

**Date:** June 22, 2026  
**Sprint:** Client feedback + production hardening

---

## Features Implemented

### 1. Password reset flow (critical)
- Dedicated `/reset-password` page with strength meter, confirm password, loading/invalid/success states
- Recovery email now redirects to `/reset-password` (not `/login`)
- `AuthService.completePasswordReset()` → Supabase `updateUser({ password })`
- `PASSWORD_RECOVERY` session handling in `AuthProvider`
- `GuestGuard` / `AuthGuard` redirect recovery sessions to reset page (blocks dashboard until password changed)
- Success → logout → login with confirmation message

### 2. Google OAuth
- Removed dead “Continue with Google” button from login UI
- Backend-ready stub: `client/lib/auth/oauth.ts` (`signInWithGoogle`)
- Enable later with `VITE_ENABLE_GOOGLE_OAUTH=true` + Supabase Google provider

### 3. Messaging UI
- New `MessageBubble` component — WhatsApp/Airbnb-style layout
- Own messages: right-aligned, brand orange bubble, read receipts
- Other party: left-aligned, neutral bubble, avatar, Family/Cook label
- Recomputes `is_own` using `sender_id` + `family_id` for accuracy
- ARIA live region on message thread

### 4. Region launch / ZIP management
- `RegionCityZipEditor` — searchable city picker auto-expands ZIP codes
- Dataset: `client/lib/zip-codes-by-city.ts` (OH, TX, FL, CA, NY, GA, WA + more)
- Integrated into admin region edit modal
- Backward compatible with existing `city` + `zip_codes` text fields

---

## Bugs Fixed

| Issue | Fix |
|-------|-----|
| Reset email redirected to dashboard | Recovery route + guards |
| No password update after email link | `ResetPassword` page + `updateUser` |
| Google button did nothing | Removed (OAuth stub for later) |
| Messages indistinguishable | `MessageBubble` with alignment, color, labels |
| Manual ZIP entry for large cities | City → ZIP auto-population |

---

## Files Changed (key)

| Area | Files |
|------|-------|
| Password reset | `ResetPassword.tsx`, `auth.service.ts`, `AuthProvider.tsx`, `Guards.tsx`, `App.tsx`, `shared/passwordReset.ts` |
| OAuth | `client/lib/auth/oauth.ts`, `Login.tsx` |
| Messaging | `MessageBubble.tsx`, `MessagingPanel.tsx` |
| Region ZIPs | `RegionCityZipEditor.tsx`, `zip-codes-by-city.ts`, `AdminDashboard.tsx` |

---

## Database Migrations

No new migrations required for this sprint. Existing `launch_regions.city` + `zip_codes` columns used.

---

## Security

- Password recovery cannot access dashboards until password updated
- Turnstile + Cloudflare stack unchanged (no regressions)
- E2E security: 27/27 PASS (static + live probes)

---

## Verification

| Check | Result |
|-------|--------|
| `pnpm typecheck` | ✅ Pass |
| `pnpm test` | ✅ 112/112 |
| `pnpm build` | ✅ Pass |
| Security E2E | ✅ 27/27 |

---

## Remaining Recommendations

1. **Supabase dashboard** — confirm email template redirect URL includes `/reset-password`
2. **Google OAuth** — enable provider in Supabase, set `VITE_ENABLE_GOOGLE_OAUTH=true`, add `/auth/callback` route when ready
3. **ZIP dataset** — expand `zip-codes-by-city.ts` as new states launch
4. **Dashboard password change** — wire family/chef settings forms to `updateUser` (currently cosmetic)
5. **Cloudflare rate limiting** — configure Pro rules per `CLOUDFLARE_SETUP_REPORT.md`

---

## Deployment

Push to `main` → Vercel auto-deploy → smoke test signup, login, reset password, messaging, admin region editor.
