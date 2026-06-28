# Pricing Consistency Report

**Date:** 2026-06-28  
**Status:** PASS — single pricing engine enforced

---

## Single source of truth

All session pricing constants and calculations live in:

- `shared/bookingPricing.ts` — implementation
- `shared/pricing.ts` — canonical re-exports (import from here)

### Constants (one place only)

| Rule | Value |
|------|-------|
| Breakfast base | $40 (includes 4 guests) |
| Dinner base | $60 (includes 4 guests) |
| Meal prep base | $70 (includes 1 guest) |
| Extra guest — breakfast/dinner | +$5 per guest above included |
| Extra guest — meal prep | +$10 per guest above 1 |
| Default platform fee | 13% (overridden by `platform_settings`) |
| Default family platform fee | $5/booking (overridden by `platform_settings`) |

---

## Unified estimator

`estimateBookingFinancials({ mealType, guests, platformFeePercentage, familyPlatformFeeDollars, ... })`

Returns: `basePrice`, `guestFees`, `subtotal`, `familyPlatformFee`, `familyTotal`, `platformFee`, `cookPayout`, `breakdown`.

`estimateWeeklyCookEarnings()` aggregates per-session estimates for the cook calculator.

---

## Consumer audit

| Consumer | Uses shared pricing? | Notes |
|----------|---------------------|-------|
| `client/pages/ChefProfile.tsx` | Yes | `calculateSessionPrice` |
| `client/services/supabase/bookings.service.ts` | Yes | Validates price on create |
| `api/_lib/stripe/checkout.ts` | Yes | Uses stored `price_cents` from validated booking |
| `client/components/CookEarningsCalculator.tsx` | Yes | `estimateWeeklyCookEarnings` |
| `client/pages/ForChefs.tsx` | Yes | Uses calculator component |
| `client/pages/Index.tsx` | Yes | Uses calculator component |
| `client/utils/platformFee.ts` | Yes | `splitSessionAmounts` from shared |
| `lib/stripe/fees.ts` | Partial | Server reads DB settings; split logic mirrors shared |
| `client/pages/Pricing.tsx` | Display only | Marketing copy updated to match rules |
| `client/pages/FAQ.tsx` | Display only | Already correct |

---

## Bug fixed

**Before:** Cook earnings calculator used hardcoded `$40/$60/$70` + flat `+$10/session` toggle — **incorrect**.

**After:** Option B — per session type: sessions/week + average guests. Uses same engine as booking checkout.

### Example verification

Dinner, 6 guests:
- Session total: $60 + (2 × $5) = **$70**
- Family charged: $70 + $5 family fee = **$75**
- Platform fee (13%): **$9.10**
- Cook payout: **$60.90**

Tests: `shared/bookingPricing.test.ts` (11 tests passing).

---

## Remaining display-only hardcoding

Marketing pages show dollar amounts in UI copy (`Pricing.tsx` cards). These reference the same numbers as `BASE_RATES` but are not computed dynamically. Acceptable for marketing; update manually if rates change in `shared/pricing.ts`.

---

## Platform fee note

Runtime platform fee % and family fee come from `platform_settings` table (seeded in migrations). Calculator hydrates via `PlatformSettingsHydrator` + `usePlatformStore`.
