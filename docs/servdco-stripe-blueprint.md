# ServdCo Stripe Integration Blueprint

Date: 2026-05-31

This document is based on the current ServdCo codebase only. It does not assume an existing Stripe backend because none exists in the workspace yet.

## 1. Executive Summary

ServdCo is currently a frontend-first marketplace. Payment math, premium pricing, and payout concepts exist in the UI and local stores, but there is no real payment backend, no Stripe SDK, no webhook receiver, and no PHP API implementation in the repository.

The right Stripe architecture for ServdCo is:

- Stripe Checkout for family booking payments
- Stripe Connect Express for cook onboarding and payouts
- Stripe Billing for cook premium memberships
- Stripe webhooks for all authoritative financial state changes
- Stripe Customer Portal for self-service billing management
- Stripe Identity only if Alexandria wants stronger identity verification than the current document upload flow

Best marketplace model: Separate Charges and Transfers.

Why:

- Families pay ServdCo first
- ServdCo can hold funds until service completion
- Platform fee can be controlled centrally
- Payout timing can be delayed until completion and dispute windows clear
- Refunds, partial refunds, disputes, and failed payouts are easier to manage

## 2. Current Codebase Audit

### Payment touchpoints already present

- Platform fee math exists in [client/utils/platformFee.ts](../client/utils/platformFee.ts)
- Platform fee and premium price are persisted in localStorage via [client/store/usePlatformStore.ts](../client/store/usePlatformStore.ts)
- Admin fee editing is UI-only in [client/components/admin/PlatformSettings.tsx](../client/components/admin/PlatformSettings.tsx)
- Chef booking quote math is displayed in [client/pages/ChefProfile.tsx](../client/pages/ChefProfile.tsx)
- The home page and chef landing page both reuse the same client-side earnings math in [client/pages/Index.tsx](../client/pages/Index.tsx) and [client/pages/ForChefs.tsx](../client/pages/ForChefs.tsx)

### Premium membership touchpoints already present

- Premium ranking tie-breaker exists in [client/pages/BrowseChefs.tsx](../client/pages/BrowseChefs.tsx)
- Premium badge display exists in [client/pages/ChefProfile.tsx](../client/pages/ChefProfile.tsx)
- Premium analytics gating exists in [client/pages/ChefDashboard.tsx](../client/pages/ChefDashboard.tsx)
- Admin premium pricing UI exists in [client/components/admin/PlatformSettings.tsx](../client/components/admin/PlatformSettings.tsx)

### Booking flow already present

- Family registration exists in [client/pages/FamilyRegistration.tsx](../client/pages/FamilyRegistration.tsx)
- Booking request UI exists in [client/pages/ChefProfile.tsx](../client/pages/ChefProfile.tsx)
- Booking state and update methods exist in [client/store/useBookingStore.ts](../client/store/useBookingStore.ts)
- Booking service wrapper exists in [client/services/booking.service.ts](../client/services/booking.service.ts)
- Family dashboard reads bookings and allows cancellation in [client/pages/Dashboard.tsx](../client/pages/Dashboard.tsx)

### Payout and admin touchpoints already present

- Payout UI exists in [client/components/admin/PayoutControl.tsx](../client/components/admin/PayoutControl.tsx)
- Cook earnings/payout logs exist in [client/components/chef/PayoutLogs.tsx](../client/components/chef/PayoutLogs.tsx)
- Admin dashboard includes payouts, analytics, and settings tabs in [client/pages/AdminDashboard.tsx](../client/pages/AdminDashboard.tsx)

### Notification and service layer

- Notifications are client-side only in [client/store/useNotificationStore.ts](../client/store/useNotificationStore.ts)
- API adapter is mock-first and switches to PHP later in [client/lib/api.ts](../client/lib/api.ts)
- Current backend endpoint references are placeholder PHP URLs only; no PHP files exist in the repo

### Missing payment components

- No Stripe SDK dependency
- No checkout session endpoint
- No payment intent endpoint
- No connect onboarding endpoint
- No webhook receiver
- No subscription lifecycle persistence
- No payout ledger
- No refund ledger
- No financial audit log
- No server-authoritative pricing source

## 3. Current Flow Map

### Family user flow

1. Family registers in [client/pages/FamilyRegistration.tsx](../client/pages/FamilyRegistration.tsx)
2. Family logs in through the mock auth service
3. Family browses cooks in [client/pages/BrowseChefs.tsx](../client/pages/BrowseChefs.tsx)
4. Family opens a cook profile in [client/pages/ChefProfile.tsx](../client/pages/ChefProfile.tsx)
5. Family selects date, service type, and guest count
6. Current UI only marks the request as submitted; no payment happens
7. Family dashboard later shows bookings from mock data

### Cook user flow

1. Cook registers in [client/pages/ChefRegistration.tsx](../client/pages/ChefRegistration.tsx)
2. Cook uploads ServSafe, insurance, and background documents
3. Cook lands on a dashboard with profile, earnings, availability, and premium sections
4. Premium analytics are gated in [client/pages/ChefDashboard.tsx](../client/pages/ChefDashboard.tsx)
5. Payout logs are displayed in [client/components/chef/PayoutLogs.tsx](../client/components/chef/PayoutLogs.tsx)
6. No real Stripe connect or billing flow exists yet

### Admin flow

1. Admin views launch regions, users, cooks, bookings, and documents
2. Admin can suspend users, approve documents, and update booking status in mock state
3. Admin can edit platform fee and premium price in localStorage-backed settings
4. Admin can visually approve or hold payouts, but no backend action exists

## 4. Stripe Product Recommendations

### Stripe Payments

Needed for:

- Family booking charges
- Future one-time charges such as cancellation fees, no-show fees, or add-ons

Integrates at:

- Booking checkout step

Frontend support:

- Booking summary and total calculation already exist

Backend must build:

- PaymentIntent creation or Checkout session creation
- Payment status storage
- Refund handling
- Dispute handling

### Stripe Checkout

Needed for:

- Fastest path to a secure card flow
- Reduced PCI burden
- One flow for bookings and one flow for premium subscriptions

Integrates at:

- Family booking payment step
- Chef premium upgrade step

Frontend support:

- The app already has a clean booking summary and premium upgrade CTA

Backend must build:

- Checkout session creation
- Metadata binding to booking and subscription records
- Success and cancel return handling

### Stripe Connect

Needed for:

- Cook onboarding
- Bank account setup
- Payout readiness
- Marketplace transfer flow

Integrates at:

- Cook registration and chef dashboard
- Admin payout tooling

Frontend support:

- Document upload and trust flow already exist
- Payout and earnings screens already exist

Backend must build:

- Connected account creation
- Account onboarding links
- Account refresh links
- Account status sync
- Transfer creation

### Stripe Billing

Needed for:

- Monthly cook premium membership

Integrates at:

- Chef dashboard premium tab
- Admin pricing controls

Frontend support:

- Premium UI and price display already exist

Backend must build:

- Subscription checkout session
- Subscription lifecycle tracking
- Entitlement management
- Customer Portal session creation

### Stripe Webhooks

Needed for:

- Payment truth
- Subscription truth
- Payout truth
- Connect truth

Integrates at:

- Dedicated PHP webhook endpoint

Frontend support:

- None directly; webhooks are backend only

Backend must build:

- Signature verification
- Idempotent event processing
- Webhook log table
- Event-driven state updates

### Stripe Customer Portal

Needed for:

- Cook self-service billing management
- Card update and cancellation flows

Integrates at:

- Chef dashboard premium area

Frontend support:

- Existing premium screen can link to portal

Backend must build:

- Portal session creation
- Return URL routing

### Stripe Identity

Optional for:

- Stronger identity verification for cooks

Integrates at:

- Cook onboarding

Frontend support:

- Current upload flow can remain as the document intake step

Backend must build:

- Identity session creation
- Result mapping into cook verification status

Recommendation: optional for v1.

## 5. Marketplace Architecture Recommendation

### Option comparison

#### Option A: Direct Charges

- Not recommended
- Harder to centrally manage marketplace settlement and payout timing
- Not a good fit for delayed release after completion

#### Option B: Destination Charges

- Better than direct charges
- Still too coupled to the connected account for ServdCo’s desired control model

#### Option C: Separate Charges and Transfers

- Recommended
- Best support for platform-held funds, delayed payout, refunds, disputes, and fee control
- Best match for ServdCo’s marketplace behavior

### Recommendation

Use Separate Charges and Transfers.

Reasoning:

- Families pay ServdCo
- ServdCo stores the platform fee and cook net amount separately
- ServdCo schedules payout after completion
- Refund and dispute handling stay under platform control
- Admin can intervene before transfer release

## 6. Connect Onboarding Design

### Onboarding steps

1. Cook completes current registration and document upload flow
2. Backend creates a Stripe Connect Express account
3. Backend stores stripe_account_id on the cook profile
4. Backend generates an onboarding link and redirects the cook to Stripe
5. Cook submits business details, identity data, and bank details inside Stripe
6. Webhook account.updated syncs payout readiness
7. Cook sees payout-ready status in the dashboard
8. If Stripe needs more information later, backend generates a refresh link

### What cooks should be able to do

- Connect a Stripe account
- Complete onboarding
- Receive payouts
- Update payout information through Stripe-hosted account links

### What backend must persist

- Stripe account ID
- Charges enabled
- Payouts enabled
- Requirements status
- Onboarding completion timestamp

## 7. Premium Membership Design

### Model

- One monthly premium subscription per cook
- Use Stripe Billing with one active product and one active monthly price

### Lifecycle

#### Activation

1. Cook clicks Upgrade to Premium
2. Backend creates a Stripe Billing Checkout session
3. Cook pays
4. Webhook customer.subscription.created or invoice.payment_succeeded marks premium active
5. UI unlocks analytics, badge, and ranking features

#### Renewal

1. Stripe renews the subscription monthly
2. Webhook invoice.payment_succeeded keeps premium active

#### Cancellation

1. Cook cancels in dashboard or Stripe Customer Portal
2. Subscription continues until period end if policy allows
3. Webhook customer.subscription.updated or deleted syncs entitlement changes

#### Upgrade and downgrade

1. If future tiers are added, backend creates a new Price and applies proration rules
2. Entitlements update from the new subscription price

### Frontend support already present

- Premium tab in cook dashboard
- Premium badge in browse and profile pages
- Premium price admin control

### Backend requirements

- Subscription records
- Entitlement records
- Customer Portal session endpoint
- Webhook sync for all subscription changes

## 8. Booking Payment Flow

### Recommended flow

Family
→ Select Cook
→ Select Service
→ Select Date and Guest Count
→ Server calculates final price
→ Stripe Checkout session created
→ Family pays
→ checkout.session.completed webhook fires
→ Booking record finalized
→ Payment record stored
→ Cook notified
→ Platform fee recorded
→ Payout scheduled after completion

### Server-side must calculate

- Base rate
- Guest fee
- Platform fee
- Any cancellation or reservation fee
- Final gross total
- Cook net payout

### Important rule

Do not trust the client-side amount from [client/pages/ChefProfile.tsx](../client/pages/ChefProfile.tsx).
Server must quote the amount and own the final totals.

## 9. Payout System Design

### Suggested payout timing

- Create payout schedule after booking completion
- Release payout after completion and dispute window checks
- Use daily or twice-weekly batch processing

### Suggested payout statuses

- pending
- scheduled
- processing
- paid
- on_hold
- failed
- reversed

### Dispute handling

- Hold future payouts when a dispute is opened
- Prevent new transfer release until review completes
- Allow admin annotation and partial resolution

### Refund handling

- Full refund before completion prevents payout
- Partial refund can keep a reservation fee if policy allows
- Post-payout refund requires compensating ledger entries

### Failed payout handling

- Mark payout failed
- Notify cook
- Require Stripe account remediation or bank update

## 10. Admin Controls Required

Admin needs control over:

- Platform fee percentage
- Premium monthly pricing
- Refund approval
- Payout hold, release, and retry
- Subscription cancellation overrides
- Subscription entitlement overrides
- Connected account readiness
- Financial reporting

### Current UI support

- Platform fee and premium price UI already exist
- Payout control UI already exists
- Booking, user, cook, and analytics tabs already exist

### Missing backend controls

- Audit logs
- Role checks
- Stripe API actions
- Server-side persistence

## 11. Webhook Architecture

### Required events and behavior

#### checkout.session.completed

- Confirm booking or subscription checkout completed
- Create or finalize booking and payment records
- Trigger notifications

#### payment_intent.succeeded

- Mark payment captured or successful
- Update payment record
- Useful if using PaymentIntents directly

#### payout.paid

- Mark payout settled
- Update cook earnings ledger

#### customer.subscription.created

- Activate premium entitlement
- Store subscription ID and related price ID

#### customer.subscription.updated

- Sync status changes, plan changes, and cancel-at-period-end

#### customer.subscription.deleted

- Remove premium entitlement
- Downgrade cook access

#### account.updated

- Sync Connect onboarding and payout readiness

#### charge.refunded

- Update refund amount and booking settlement state

#### charge.dispute.created

- Hold payouts and flag the booking for review

#### transfer.reversed

- Reconcile payout reversals and negative balance events

### Webhook implementation rules

- Verify Stripe signature
- Log every event
- Make processing idempotent
- Never trust client state for money or entitlements

## 12. Database Design

### users

Fields:

- id
- email
- name
- role
- status
- city
- state
- zip
- phone
- avatar_url
- stripe_customer_id
- created_at
- updated_at

### cooks

Fields:

- id
- user_id
- cuisine
- bio
- verification_status
- premium_status
- profile_visibility
- admin_visibility_override
- bookings_count
- rating
- stripe_account_id
- charges_enabled
- payouts_enabled
- onboarding_status
- created_at
- updated_at

### stripe_accounts

Fields:

- id
- cook_id
- stripe_account_id
- account_type
- country
- charges_enabled
- payouts_enabled
- details_submitted
- requirements_json
- last_onboarded_at
- created_at
- updated_at

### bookings

Fields:

- id
- family_id
- cook_id
- service_type
- scheduled_at
- guest_count
- gross_amount
- platform_fee_amount
- cook_net_amount
- currency
- status
- cancellation_reason
- completed_at
- created_at
- updated_at

### payments

Fields:

- id
- booking_id
- family_id
- cook_id
- stripe_checkout_session_id
- stripe_payment_intent_id
- stripe_charge_id
- amount_gross
- platform_fee_amount
- cook_net_amount
- currency
- status
- captured_at
- refunded_amount
- created_at
- updated_at

### payouts

Fields:

- id
- booking_id
- cook_id
- stripe_transfer_id
- stripe_payout_id
- amount
- currency
- status
- scheduled_for
- processed_at
- failure_reason
- created_at
- updated_at

### subscriptions

Fields:

- id
- cook_id
- stripe_customer_id
- stripe_subscription_id
- stripe_price_id
- plan_name
- status
- current_period_start
- current_period_end
- cancel_at_period_end
- trial_end
- created_at
- updated_at

### webhook_logs

Fields:

- id
- stripe_event_id
- event_type
- payload_json
- processing_status
- error_message
- received_at
- processed_at

### refunds

Fields:

- id
- payment_id
- stripe_refund_id
- amount
- currency
- reason
- status
- processed_at
- created_at

## 13. Stripe Dashboard Configuration Guide

### 1. Stripe account setup

- Create separate test and production modes
- Confirm legal business entity
- Set support email and public statement descriptor

### 2. Business settings

- Add ServdCo branding
- Add address and support contact
- Set customer service email and phone

### 3. Connect configuration

- Enable Stripe Connect
- Choose Express accounts
- Enable required payment and transfer capabilities
- Configure onboarding and account update links

### 4. Billing configuration

- Create one Premium product for cooks
- Create a monthly price for the current premium plan
- Configure dunning and payment retries

### 5. Tax settings

- Review whether bookings and premium subscriptions are taxable in launch states
- Decide whether Stripe Tax is needed at v1

### 6. Branding settings

- Upload logo
- Match the orange and dark marketplace theme
- Configure checkout and email branding

### 7. Webhook setup

- Create a live webhook endpoint
- Subscribe to the events listed above
- Store the signing secret in backend env vars only

### 8. API keys

- Use publishable keys only in the frontend if Stripe.js is ever added
- Keep secret keys in the PHP backend only

### 9. Restricted keys

- Use restricted keys if you want to limit backend permissions
- Separate test and live keys

### 10. Production launch checklist

- Verify one cook can onboard fully
- Verify one family can pay for a booking
- Verify one premium subscription can activate
- Verify one refund works
- Verify webhooks are idempotent
- Verify payouts can be scheduled and released

## 14. PHP Backend Requirements

The repository currently has no PHP files. The following endpoints must be created from scratch.

### /auth

POST /auth/register

- Request: name, email, role, city, state, zip, phone
- Response: user object, session token, role, entitlement flags

POST /auth/login

- Request: email, password or magic-link token
- Response: user object, token, role, entitlement flags

GET /auth/me

- Response: current user, cook entitlement, premium status, connect readiness

POST /auth/logout

- Response: success boolean

### /bookings

POST /bookings/quote

- Request: cook_id, service_type, guest_count, date
- Response: base_amount, guest_fee, platform_fee, gross_total, cook_net_amount, tax estimate if applicable

POST /bookings

- Request: quote or booking draft data
- Response: booking object

GET /bookings

- Response: bookings list for the current user or admin

GET /bookings/:id

- Response: booking, payment, payout, refund summary

PATCH /bookings/:id/status

- Response: updated booking object

POST /bookings/:id/cancel

- Request: cancellation reason
- Response: cancellation outcome, refund eligibility, payout hold decision

### /payments

POST /payments/checkout-session

- Request: booking_id
- Response: checkout_url, checkout_session_id

POST /payments/confirm

- Response: payment finalization state

GET /payments/:id

- Response: payment object and settlement state

POST /payments/:id/refund

- Request: amount, reason
- Response: refund object

POST /payments/:id/void

- Response: void outcome

### /payouts

GET /payouts

- Response: payout list

GET /payouts/:id

- Response: payout details

POST /payouts/schedule

- Request: booking_id
- Response: payout schedule entry

POST /payouts/:id/release

- Response: payout release result

POST /payouts/:id/hold

- Response: hold result

POST /payouts/:id/retry

- Response: retry result

### /subscriptions

POST /subscriptions/checkout-session

- Request: cook_id or authenticated cook context
- Response: checkout_url, subscription_session_id

GET /subscriptions/me

- Response: current subscription and entitlement state

POST /subscriptions/:id/cancel

- Response: cancellation result

POST /subscriptions/:id/change-plan

- Response: proration or migration result

POST /subscriptions/:id/portal

- Response: customer portal session URL

### /webhooks

POST /webhooks/stripe

- Request: raw Stripe webhook payload with signature header
- Response: 2xx only after persistence succeeds

### /stripe-connect

POST /stripe-connect/account-create

- Request: cook_id
- Response: stripe_account_id

POST /stripe-connect/account-link

- Request: cook_id
- Response: onboarding link URL

GET /stripe-connect/account-status

- Response: charges_enabled, payouts_enabled, requirements, onboarding state

POST /stripe-connect/account-refresh

- Response: remediation link URL

## 15. Recommended Implementation Sequence

1. Add Stripe SDKs to the backend
2. Replace localStorage fee and premium controls with DB-backed settings
3. Build cook Connect onboarding
4. Build booking quote and Checkout session creation
5. Build webhook ingestion and idempotent state sync
6. Build payments, payouts, and refund ledgers
7. Build premium Billing and Customer Portal
8. Build admin controls for refunds, holds, and platform fee edits
9. Test all flows in Stripe test mode
10. Launch with restricted live keys and monitored webhooks

## 16. Final Recommendation

Use Stripe Checkout + Stripe Connect Express + Stripe Billing + Stripe Webhooks.

Use Separate Charges and Transfers.

Store all money state server-side.

Treat the client as presentation only for pricing and status.

If you want the next step, I can turn this into a developer-ready PHP spec with request/response JSON examples for every endpoint.