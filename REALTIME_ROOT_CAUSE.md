# Realtime Root Cause Analysis

**Date:** 2026-06-20  
**Issue:** LC-1 / Master audit reported "Family booking realtime UPDATE failed"

## Findings

### 1. False negative in audit script (primary)

`scripts/phase1-realtime-test.mjs` used the **service role key** for Realtime subscriptions but did not mirror browser auth sessions. Sequential tests also closed channels before events propagated (`subscribeStatus: CLOSED`).

**Authenticated retest** (`scripts/realtime-final-verification.mjs` with `signInWithPassword`):

| Test | Result |
|------|--------|
| Family `family_id=eq.{uuid}` booking UPDATE | **PASS** (`eventReceived: true`) |
| Cook `chef_profile_id=eq.{uuid}` booking UPDATE | **WARN** (test cook account credentials — family path is the audit blocker) |

### 2. Client hook gaps (fixed in `1dcca17`)

| Gap | Fix |
|-----|-----|
| Role only from `profile?.role` after slow profile fetch | `resolveDashboardRole()` also reads `user.user_metadata.role` |
| No notifications channel | All roles subscribe to `notifications` for `user_id=eq.{userId}` |
| `onAdminRefresh` in effect deps caused resubscribe churn | Moved to `useRef` |
| Booking/payment invalidation didn't refresh notifications | Family/cook handlers now invalidate notifications |

### 3. Infrastructure (already correct)

- `REPLICA IDENTITY FULL` on `bookings`, `payments`, etc. (`20250620120030_realtime_replica_identity.sql`)
- Tables in `supabase_realtime` publication (`20250612150029_realtime_dashboard_tables.sql`)
- RLS policies allow family SELECT on own bookings

## Conclusion

Family dashboard realtime was **not broken at the database layer**. The audit failure was caused by **non-authenticated test harness behavior** plus **delayed role binding** in the React hook. Both are addressed in commit `1dcca17`.
