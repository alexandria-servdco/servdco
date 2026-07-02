# Booking Payment Reconciliation — Launch Audit

**Date:** 2026-07-02  
**Status:** IMPLEMENTED — Stripe is source of truth; bookings converge to paid automatically

---

## Root cause (proven)

Production showed: **Stripe Payment Succeeded ×2**, **bank charged ×2**, but **booking stayed `accepted`** with **Pay Now** visible.

### Failure chain

1. **`checkout.session.completed` webhook** is the only path that previously confirmed bookings.
2. If webhook **failed** (amount mismatch throw, stuck `stripe_events` row, delayed delivery), payment row could stay `pending` while Stripe was `paid`.
3. **No return-URL reconciliation** — `?booking=success` was never handled; UI depended on webhook + realtime only.
4. **Pay Now ignored `payments.status`** — button showed for any `accepted`/`awaiting_payment` booking.
5. **Second checkout allowed** — without succeeded row in DB, `createBookingCheckoutSession` created another Stripe charge.
6. **`payment_intent.succeeded` did not confirm booking** — only updated payment row (if at all).

### Evidence from codebase (pre-fix)

| Gap | File | Impact |
|-----|------|--------|
| Booking update not asserted | `webhook-handlers.ts` | 0-row update silent |
| Amount mismatch throws | `verifyCheckoutAmountCents` | Webhook aborts |
| Stuck in-flight events | `events.ts` | No retry without `processing_error` |
| PI succeeded no booking confirm | `handlePaymentIntentSucceeded` | Split-brain state |
| No success URL handler | `Dashboard.tsx` | Stale UI after pay |
| Pay Now = status only | `BookingOperationalPanel.tsx` | Button after Stripe paid |

---

## Architecture (post-fix)

```
Family → Pay Now
    → reconcileBookingPayment() [repair first]
    → createCheckoutSession (booking_id idempotency key)
    → Stripe Checkout → PaymentIntent
    → Webhook: checkout.session.completed OR payment_intent.succeeded
        → confirmBookingFromPayment() [idempotent, duplicate-safe]
    → Return URL: reconcile + invalidate React Query
    → Cron every 15m: reconcileAllPaymentMismatches()
```

### Central modules

| Module | Role |
|--------|------|
| `api/_lib/stripe/paymentIntegrity.ts` | `confirmBookingFromPayment`, `reconcileBookingPayment`, `reconcileAllPaymentMismatches`, `buildPaymentLedger` |
| `shared/bookingPaymentStatus.ts` | `resolveBookingPaymentStatus()` — single UI truth |
| `api/_lib/stripe/checkout.ts` | Pre-checkout reconcile, duplicate block, booking-level idempotency |
| `api/_lib/stripe/events.ts` | Stale in-flight webhook retry (5 min) |

### API endpoints

| Route | Auth | Purpose |
|-------|------|---------|
| `POST /api/stripe/payments/reconcile` | Family / Admin | Repair single booking |
| `GET/POST /api/stripe/payments/reconcile-batch` | Cron | Batch repair |
| `GET/POST /api/admin/payment-ledger` | Admin | Full payment timeline + repair |

### Database

Migration `20250702160000_payment_reconciliation_integrity.sql`:
- Partial unique index: one primary `succeeded` payment per booking
- Duplicates flagged via `metadata.duplicate = true`

---

## Guarantees

| Scenario | Behavior |
|----------|----------|
| Browser closes after pay | Cron + return URL reconcile → booking `confirmed` |
| Webhook delayed | Return URL reconcile; cron backup |
| Webhook duplicated | `confirmBookingFromPayment` idempotent |
| Double Pay Now click | Same checkout idempotency key per `booking_id` |
| Second successful charge | Marked `duplicate` in metadata; admin notified |
| Payment succeeded, booking accepted | Reconcile promotes to `confirmed` |
| Amount mismatch session vs row | Sync to Stripe amount (warn, don't abort) |

---

## Recovering current production duplicates ($45 × 2)

1. Apply migration: `pnpm verify:transfer-migration` pattern or Supabase SQL for `20250702160000`
2. Identify booking ID for James Lopez Jul 2 breakfast (Mechanicsburg)
3. Admin → Payouts → **Payment Reconciliation & Ledger** → enter booking ID → **Repair**
4. Second payment auto-flagged `metadata.duplicate = true`
5. Admin refund via existing **Refund** on payment ledger row

---

## Remaining operational steps

1. **Apply migration** to production Supabase
2. **Verify Stripe webhook** subscribed to `checkout.session.completed` + `payment_intent.succeeded`
3. **Set CRON_SECRET** in Vercel (cron runs every 15 minutes)
4. **Repair affected booking** via admin ledger
5. **Issue refund** for duplicate $45 via admin refund flow

---

## Tests

- `shared/bookingPaymentStatus.test.ts` — UI status resolver (5 cases)
- Existing webhook tests still pass
- **191 tests passing** after implementation

---

## Acceptance criteria

| Criterion | Status |
|-----------|--------|
| Successful Stripe payment never lost | ✅ Reconcile paths |
| One primary payment per booking | ✅ DB index + logic |
| Booking → Paid without browser | ✅ Webhook + cron |
| No duplicate charges on repeat click | ✅ Booking idempotency key |
| Duplicates detectable & traceable | ✅ metadata + admin ledger |
| Full audit trail | ✅ audit_logs + ledger |
| Admin visibility | ✅ Payment Reconciliation panel |
