# Launch Control — Production Architecture

## Overview

Launch Control is the **authoritative runtime system** governing marketplace access across Servd Co. Every signup, dashboard route, booking, payment, message, and review flows through region resolution and permission checks.

## Data Model

### `launch_regions` (extended)

| Field | Purpose |
|-------|---------|
| `status` | `active`, `waitlist`, `paused`, `maintenance`, `internal_beta`, `coming_soon` |
| `city` / `zip_codes` | **Ops metadata** during rollout — geography gates access only while `status` is `waitlist` or `coming_soon`. When `status` is `active` or `internal_beta`, access is **statewide**. |
| `allow_*` flags | Per-capability toggles (bookings, payments, messages, reviews, signups) |
| `maintenance_mode` / `maintenance_message` | Temporary outage UX |
| `auto_launch` + `min_chefs` / `min_families` | Automated activation thresholds |
| `feature_flags` | Per-region feature toggles (JSON) |
| `is_active` / `is_waitlist` | Legacy columns — synced from `status` via DB trigger |

### `user_region_access`

Persists each user's resolved launch state (survives login/logout):

- `profile_id`, `state`, `city`, `zip`, `region_id`
- `launch_status`, `permissions` (JSON), `reason`
- `waitlisted_at`, `activated_at`, `source`

## Resolution Flow

```
ZIP → geo_city_for_zip → City
State → resolveRegionId → Region ID
Region config + geography → effectiveStatus
effectiveStatus + flags → permissions
```

**Example (waitlist):** Ohio waitlist with Columbus/Cleveland/Cincinnati only → Dayton user gets `effectiveStatus: waitlist`, `reason: city_not_launched`.

**Example (active):** Ohio active with Columbus only in city list → Dayton user still gets `effectiveStatus: active` (statewide launch). Suburban ZIPs like 43004 (Blacklick) are included automatically.

## Enforcement Layers

| Layer | Location | Scope |
|-------|----------|-------|
| 1. Shared logic | `shared/launchControl.ts` | Permission matrix, geography |
| 2. API resolution | `api/_lib/launch/regionResolve.ts` | Server-side resolve + geo lookup |
| 3. User persistence | `api/_lib/launch/userRegionAccess.ts` | `user_region_access` upsert |
| 4. Security enforce | `api/_lib/handlers/securityEnforce.ts` | Bookings, messages, reviews |
| 5. Stripe checkout | `api/_lib/stripe/checkout.ts` | `payment_create` permission |
| 6. DB RLS | `bookings_insert_family` | `profile_launch_permission('booking_create')` |
| 7. Client guard | `LaunchRegionGuard` | Dashboard routes |
| 8. Signup | `api/_lib/handlers/authSignup.ts` | Pre-create access check |

## Route Protection Matrix

| Route | Auth | Role | Launch Guard |
|-------|------|------|--------------|
| `/family-dashboard/*` | ✓ | family | ✓ |
| `/chef-dashboard/*` | ✓ | chef | ✓ |
| `/waitlist-dashboard` | ✓ | any | ✗ (destination) |
| `/maintenance` | public | — | ✗ |
| `/admin-dashboard/*` | ✓ | admin | ✗ |
| `/browse-chefs` | public | — | booking via API enforce |

## Permission Matrix

| Status | Dashboard | Bookings | Payments | Messages | Reviews |
|--------|-----------|----------|----------|----------|---------|
| active (geo OK) | ✓ | ✓ | ✓ | ✓ | ✓ |
| waitlist | ✗ → waitlist dashboard | ✗ | ✗ | ✗ | ✗ |
| paused | ✓ | existing only | ✗ new | reply only | ✗ |
| maintenance | ✗ → maintenance page | ✗ | ✗ | ✗ | ✗ |
| internal_beta | ✓ (within limits) | ✓ | ✓ | ✓ | ✓ |

## Region Lifecycle

### Activation (admin or auto-launch cron)

1. Update `launch_regions.status` → `active`
2. `activateUsersInRegion()` — re-resolve all users in region
3. Set `activated_at`, update `permissions`
4. Audit log `region.active`

### Pause

1. `status` → `paused`, disable `allow_bookings` / `allow_payments`
2. Existing bookings remain accessible
3. Users retain dashboard with limited permissions

### Auto-launch (`/api/launch/auto-check` — every 6h)

When `auto_launch` + thresholds met → activate region + users.

## API Endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /api/launch/resolve` | public | Pre-signup region check |
| `POST /api/launch/sync-user` | user | Refresh persisted access |
| `POST /api/launch/lifecycle` | admin | Activate/pause/maintenance |
| `POST /api/launch/auto-check` | cron/admin | Auto-launch candidates |
| `POST /api/security/enforce` | user | Scope permission check |

## Migration

Apply launch control + geo migrations:

```bash
node scripts/run-pending-migrations.mjs
```

Key migrations:
- `20250629120000_launch_control_production.sql` — launch control tables + RPCs
- `20250701120000_full_us_geo_zips.sql` — full US city/ZIP dataset (~33k rows)

Regenerate geo data: `node scripts/generate-full-us-geo-migration.mjs`

Backfills `user_region_access` from existing profiles.

## Testing

```bash
pnpm test shared/launchControl.test.ts
```

## Rollback Strategy

1. Revert client `LaunchRegionGuard` routes in `App.tsx`
2. Restore `securityEnforce.ts` to allow-all
3. Migration is additive — legacy `is_active` columns remain functional
4. Drop RLS booking policy change if needed (restore prior migration policy)

## Manual QA Checklist

- [ ] Ohio Columbus ZIP → active dashboard (when Ohio active)
- [ ] Ohio Dayton ZIP → waitlist dashboard while Ohio is waitlist; active dashboard once Ohio is active
- [ ] Waitlist user logout/login → still waitlist dashboard
- [ ] Admin activate Ohio → waitlisted users gain access
- [ ] Admin pause region → new bookings blocked, existing visible
- [ ] Booking create from waitlist → 403 with message
- [ ] Stripe checkout from paused region → blocked
- [ ] Auto-launch cron (or manual `/api/launch/auto-check`)

## Remaining Phase Work

- Region announcement UI (table created)
- Interest request analytics dashboard (Phase 17)
- Resend emails on activation (Phase 20)
- Expanded admin analytics heatmaps (Phase 18)
- E2E Playwright suite (Phase 24)
