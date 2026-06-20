# Phase 2 Email Notifications Audit

**Date:** 2026-06-12  
**Provider:** Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFY_EMAIL`)  
**Supabase Auth email:** Not used for transactional booking/contact flows.

## Summary

| Event | Resend Email | In-App Notification | Trigger Location | Status |
|-------|--------------|---------------------|------------------|--------|
| Booking requested | Family | Cook + Family (DB trigger) | `ChefProfile` → `EmailService.sendBookingEvent` | **PASS** |
| Booking accepted | Family | Cook action (DB trigger) | `useCookAcceptBooking` → `dispatchBookingStatusEmails` | **PASS** |
| Payment required | Family | DB trigger on accept | `useCookAcceptBooking` → `dispatchBookingStatusEmails` | **PASS** |
| Payment completed | Family | Stripe webhook notification | `api/_lib/stripe/webhook-handlers.ts` | **PASS** |
| Cook en route | Family | DB trigger | `useCookProgressBooking` → `dispatchBookingStatusEmails` | **PASS** |
| Cook arrived | Family | DB trigger | `useCookProgressBooking` | **PASS** |
| Cooking started | Family | DB trigger | `useCookProgressBooking` | **PASS** |
| Cooking completed | Family | DB trigger | `useCookProgressBooking` | **PASS** |
| Family confirmation required | Family | DB trigger | `useCookProgressBooking` | **PASS** |
| Booking completed | Family | DB trigger | `useFamilyConfirmCompletion` | **PASS** |
| Document approved | Cook | DB trigger | `useDocumentModeration` → `EmailService.sendDocumentEvent` | **PASS** |
| Document rejected | Cook | DB trigger | `useDocumentModeration` | **PASS** |
| Document resubmission requested | Cook | DB trigger | `useDocumentModeration` | **PASS** |
| Contact form submission | alexandria@servdco.com | Admin users | `api/contact/submit.ts` | **PASS** |

## Implementation Notes

- **API route:** `POST /api/emails/booking-event` handles booking events (family recipient) and document events (cook recipient).
- **Non-blocking:** Client email calls are fire-and-forget; in-app notifications remain the primary UX if Resend is unavailable.
- **Payment email:** Sent server-side from Stripe webhook after checkout completion — ensures delivery even if the family closes the browser.
- **Meal request:** Included in booking event email HTML when present.

## Environment Variables Required (Production)

```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="Servd Co <hello@servdco.com>"
ADMIN_NOTIFY_EMAIL=alexandria@servdco.com
```

## Verification Checklist

- [ ] Confirm `RESEND_API_KEY` is set in Vercel production
- [ ] Submit test contact form → verify alexandria@servdco.com receives email
- [ ] Create test booking → verify family receives "Booking Request Received"
- [ ] Accept booking as cook → verify "Payment Required" email
- [ ] Complete Stripe test checkout → verify "Payment Confirmed" email
- [ ] Moderate document in admin → verify cook receives document email

## WARN Items

| Item | Notes |
|------|-------|
| Cook booking emails | Cooks receive in-app notifications only for new booking requests (by design — family is email recipient for booking lifecycle). |
| Resend sandbox | If API key is in sandbox mode, emails only deliver to verified addresses until domain is verified. |

## FAIL Items

None.
