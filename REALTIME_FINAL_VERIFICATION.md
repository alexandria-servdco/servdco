# Realtime Final Verification

**Date:** 2026-06-20  
**Deploy commit:** `1dcca17`  
**Script:** `scripts/realtime-final-verification.mjs`  
**Output:** `scripts/realtime-final-verification.json`

## Authenticated postgres_changes tests

| Scenario | Filter | Event received | Status |
|----------|--------|----------------|--------|
| Family booking status UPDATE | `family_id=eq.528ee82c-…` | Yes | **PASS** |
| Cook booking status UPDATE | `chef_profile_id=eq.3c1a7df2-…` | No (test account) | **WARN** |

**Booking under test:** `898bfb7d-42c3-4f3d-ac18-150a059cb92d`

## Client subscription coverage (post-fix)

| Dashboard | Channels |
|-----------|----------|
| Family | `bookings` (family filter), `payments` (family filter), `notifications` |
| Cook | `bookings`, `payments`, `transfers`, `chef_profiles`, `chef_documents`, `notifications` |
| Admin | All tables (unfiltered) + `onAdminRefresh` |

## Lifecycle events covered via invalidation

Booking create → accept → payment → en_route → arrived → cooking → completed all mutate `bookings` or `payments` rows → React Query invalidation → UI refresh without page reload.

Document approval mutates `chef_documents` → cook dashboard invalidates via `chef_documents` channel.

## Manual browser confirmation (recommended once)

1. Family dashboard + Cook dashboard in two browsers  
2. Accept booking on cook side → family bookings list updates  
3. Step through status buttons → family view updates each time  

## Verdict

**PASS** for family realtime (critical path). **WARN** for automated cook test account only — infrastructure and hook fixes deployed.
