# ServdCo Frontend → PHP Backend Handoff Guide

## Executive Summary

The ServdCo frontend is **UI-complete** and **API-wired** through a single gateway (`client/lib/api.ts`). All user flows call this layer, which today uses a high-fidelity mock (`client/lib/mockLaunchControl.ts`) when `USE_MOCK_API: true`.

**To go live:** implement the PHP endpoints listed below, set `USE_MOCK_API: false` in `client/lib/apiConfig.ts`, and deploy the `/api` folder.

---

## Quick Start for Backend Team

1. Read shared contracts: `shared/api.ts`
2. Implement endpoints matching `client/lib/api.ts` fetch URLs
3. Match request/response shapes from `client/lib/mockLaunchControl.ts` types
4. Flip `USE_MOCK_API` to `false`
5. Add real auth (JWT/session) — see Critical Gaps below

---

## Architecture

```
React Pages → Services (auth, booking, etc.) → api.ts → PHP /api/*.php
                                              ↘ mockLaunchControl (dev)
```

- **Routes:** `client/App.tsx` (25+ pages)
- **Auth guards:** `client/components/Guards.tsx` (localStorage today)
- **Notifications:** `useNotificationStore` + Sonner toasts + `api.getUserNotifications`
- **Uploads:** Cloudinary unsigned (`VITE_CLOUDINARY_*` env vars)

---

## Page Readiness Matrix

| Area | Status | Notes |
|------|--------|-------|
| Marketing (Index, About, FAQ, Pricing, Blog, How It Works, For Cooks) | ✅ UI complete | Blog articles are static previews |
| Browse Cooks / Cook Profile | ✅ API-wired | Uses `getChefs()` / `getChefById()` |
| Booking creation | ✅ API-wired | `POST create-booking.php` needed |
| Contact form | ✅ API-wired | `POST contact.php` needed |
| Waitlist / Interest | ✅ API-wired | Best-tested flows |
| Login / Register | ⚠️ Partial | No password validation; needs `login.php` |
| Family Dashboard | ✅ Functional | Bookings, profile, notifications |
| Cook Dashboard | ⚠️ Partial | Hardcoded cook ID in some tabs; needs profile API |
| Admin Dashboard | ✅ Mostly complete | Payouts/moderation/announcements are static UI |
| Stripe / Payments | ❌ Not built | See `docs/servdco-stripe-backend-requirements.md` |
| Google OAuth | ❌ Button only | No implementation |

---

## PHP Endpoints Required

### Already referenced in `api.ts` (implement first)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/regions.php` | Launch regions + admin alerts |
| POST | `/api/update-region.php` | Update region settings |
| POST | `/api/initialize-state.php` | Add new state |
| POST | `/api/register-user.php` | Family/cook registration |
| GET | `/api/waitlist-stats.php?state=` | Waitlist counts |
| POST | `/api/register-interest.php` | City interest form |
| GET | `/api/interest-requests.php` | Admin interest list |
| GET | `/api/users.php` | All users |
| POST | `/api/update-user.php` | Edit user |
| POST | `/api/update-user-status.php` | Suspend/activate |
| POST | `/api/delete-user.php` | Delete user |
| GET | `/api/chefs.php` | Public cook directory |
| GET | `/api/chef.php?id=` | Single cook profile |
| POST | `/api/update-chef-status.php` | Admin verification |
| GET | `/api/bookings.php` | All bookings |
| POST | `/api/create-booking.php` | **New booking** |
| POST | `/api/update-booking-status.php` | Confirm/cancel |
| GET | `/api/documents.php` | Verification docs |
| POST | `/api/submit-documents.php` | Cook onboarding uploads |
| POST | `/api/update-document-status.php` | Approve/reject docs |
| POST | `/api/contact.php` | Contact form |
| GET | `/api/notifications.php?user_id=` | User notifications |
| POST | `/api/notifications.php` | Create notification |

### Still needed for production (not in api.ts yet)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/login.php` | Email + password auth, return JWT |
| `POST /api/logout.php` | Invalidate session |
| `PUT /api/chef-profile.php` | Cook bio, cuisines, availability |
| `PUT /api/family-profile.php` | Family profile fields |
| `GET/POST /api/favorites.php` | Saved cooks |
| `GET/POST /api/reviews.php` | Cook reviews |
| Stripe endpoints | See stripe requirements doc |

---

## Data Shape Notes

The UI maps API `Chef` records via `client/lib/cookMapper.ts`:

| API field | UI field |
|-----------|----------|
| `cuisine` | `specialty` / `specialties` |
| `avatar` | `image` |
| `bookings_count` | `reviews` label |
| `id` (e.g. `ch_1`) | Route `/chef/ch_1` |

Booking records use `chef_name`, `family_name`, `service_type` — family dashboard also accepts camelCase fallbacks.

---

## Environment Variables

```env
# Frontend (.env)
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=

# Backend (PHP)
DATABASE_URL=
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Critical Gaps (Backend Must Solve)

1. **Authentication** — Passwords ignored today; guards check localStorage only
2. **Stripe** — No payment UI; legal pages reference Stripe only
3. **JWT/session** — Required before production
4. **Cook profile persistence** — Availability still in localStorage
5. **Admin static modules** — Payouts, moderation, announcements need APIs

---

## Testing Checklist Before Handoff Sign-off

- [ ] Set `USE_MOCK_API: false` and verify all pages load without 404
- [ ] Register family → browse cooks → create booking → see in dashboards
- [ ] Register cook → upload docs → appear in admin verification
- [ ] Admin: approve cook, manage bookings, launch control
- [ ] Contact form delivers to backend/email
- [ ] Notifications persist per user
- [ ] Login with real credentials (once `login.php` exists)

---

## Files the Backend Team Should Read

| File | Why |
|------|-----|
| `shared/api.ts` | Type contracts + endpoint map |
| `client/lib/api.ts` | Exact fetch calls to mirror |
| `client/lib/mockLaunchControl.ts` | Mock response shapes + seed data |
| `docs/servdco-stripe-backend-requirements.md` | Payment integration spec |
| `docs/servdco-stripe-blueprint.md` | Architecture blueprint |
