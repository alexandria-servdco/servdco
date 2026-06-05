# ServdCo — Stripe Backend Requirements

Purpose: a single, shareable document for backend engineers to implement Stripe for ServdCo (Marketplace:
families pay; cooks receive payouts; platform keeps a fee). Covers Connect Express, Separate Charges & Transfers,
Stripe Checkout, Billing, Webhooks, endpoints, DB schema, testing, and ops.

Assumptions
- Marketplace model: Separate Charges & Transfers (platform charges family, platform transfers to cook after hold)
- Stripe products used: Connect Express, Stripe Checkout/PaymentIntents, Stripe Billing (subscriptions), Customer Portal,
  Webhooks
- Currency: single default currency for launch (adjust later for multi-currency)

1. Environment & Secrets
- STRIPE_API_KEY (live secret key) — store in secret manager
- STRIPE_API_KEY_TEST (test secret key)
- STRIPE_WEBHOOK_SECRET (live)
- STRIPE_WEBHOOK_SECRET_TEST
- STRIPE_CLIENT_ID (Connect client id)
- STRIPE_API_VERSION (pin to a date like 2024-11-08)
- DATABASE_URL, REDIS_URL (for locks/queues)
- SENTRY_DSN / LOGGING config
- KMS keys for secret rotation

2. Libraries & Configuration
- Use official Stripe library for backend language (node/py/php/dotnet). Pin versions.
- Configure HTTP client timeouts, retries, and idempotency support.
- Set environment-based configuration (test vs live API keys, webhook secrets).

3. High-level Backend Responsibilities
- Create Checkout sessions / PaymentIntents server-side.
- Create and persist Stripe Customer objects for families (and cooks if needed).
- Create connected accounts (Express) and AccountLinks for onboarding.
- Poll or listen to account.updated to track `payouts_enabled` and capabilities.
- Create Transfers to connected accounts after hold periods.
- Create and manage subscriptions (Billing) and entitlements.
- Receive and process all relevant webhooks (verify signature, idempotent processing).
- Maintain reconciliation and ledger records for payments, fees, refunds, transfers, payouts.

4. API Endpoints (suggested contract)
Notes: Use authentication (JWT/session), validate permissions, and support idempotency headers from clients.

- POST /api/payments/checkout-session
  - Purpose: create a Stripe Checkout session for a booking charge
  - Body: { booking_id, amount_cents, currency, family_id, chef_id, return_url, cancel_url }
  - Response: { sessionId }

- POST /api/payments/payment-intent
  - Purpose: create PaymentIntent (optional custom flows)
  - Body: { amount_cents, currency, customer_id?, metadata }
  - Response: { client_secret, payment_intent_id }

- POST /api/stripe/webhooks
  - Purpose: receive and process Stripe webhooks
  - Requirements: verify signature with STRIPE_WEBHOOK_SECRET, store raw event, dedupe by stripe_event_id

- POST /api/connect/create-account
  - Purpose: create a connected Express account object server-side
  - Body: { chef_id, country, email, business_type, metadata }
  - Response: { stripe_account_id }

- GET /api/connect/account-link?account_id=acct_...
  - Purpose: create an AccountLink for Express onboarding (return url, refresh url)
  - Response: { url }

- GET /api/connect/account?account_id=acct_...
  - Purpose: retrieve connected account details and verification status

- POST /api/subscriptions/create-checkout-session
  - Purpose: create checkout session for `ServdCo Premium` subscription
  - Body: { chef_id, price_id }
  - Response: { sessionId }

- POST /api/payments/create-transfer
  - Purpose: create a Transfer to connected account after booking completion
  - Body: { payment_id, amount_cents, connected_account_id, booking_id }
  - Response: { transfer_id }

- POST /api/payments/refund
  - Purpose: issue refunds (full or partial)
  - Body: { payment_id, charge_id, amount_cents, reason }

- GET /api/stripe/balance
  - Purpose: read current Stripe balance for reconciliation UI

- GET /api/stripe/payouts?account_id=acct_...
  - Purpose: list payouts for platform or connected account

Add admin-only endpoints as needed (webhook replay, manual refunds). Always protect with role checks.

5. Database Schema (minimum set)
Store Stripe IDs and raw payloads for traceability.

- payments
  - id (uuid)
  - booking_id
  - family_id
  - chef_id
  - stripe_payment_intent_id
  - stripe_charge_id
  - amount_cents, currency
  - platform_fee_cents, chef_payout_cents, stripe_fee_cents
  - status (pending, succeeded, failed, refunded)
  - metadata JSON
  - created_at, updated_at

- customers
  - id, user_id, stripe_customer_id, default_payment_method_id, created_at

- bookings
  - id, family_id, chef_id, status, amount_cents, currency, platform_fee_pct, payment_id, created_at, completed_at

- connected_accounts
  - id, chef_id, stripe_account_id, onboarding_status, capabilities JSON, charges_enabled bool, payouts_enabled bool, created_at

- transfers
  - id, stripe_transfer_id, payment_id, connected_account_id, amount_cents, currency, status, created_at

- payouts
  - id, stripe_payout_id, connected_account_id, amount_cents, currency, status, arrival_date, created_at

- refunds
  - id, stripe_refund_id, payment_id, amount_cents, reason, status, created_at

- subscriptions
  - id, chef_id, stripe_subscription_id, status, current_period_start, current_period_end, price_cents

- webhook_events
  - id, stripe_event_id, type, raw_payload (jsonb), processed_at, processing_result

- ledger_entries (optional, recommended for bookkeeping)
  - id, related_type, related_id, amount_cents, side (debit/credit), account_type, created_at

6. Webhook Event Mapping (core events)

- checkout.session.completed
  - Action: create/confirm payment record, attach charge id, mark booking as `paid` (or `paid_pending_service`), trigger notification to chef/admin.

- payment_intent.succeeded / charge.succeeded
  - Action: mark payment succeeded, reconcile payments table.

- invoice.payment_succeeded
  - Action: mark subscription invoice paid; grant premium entitlement.

- invoice.payment_failed / invoice.payment_action_required
  - Action: mark subscription as past_due; notify chef; trigger retry logic.

- customer.subscription.updated / customer.subscription.deleted
  - Action: update subscription record and chef entitlement, handle cancellations and proration.

- charge.refunded
  - Action: create refunds record, update payment and booking state, notify finance.

- charge.dispute.created / charge.dispute.updated
  - Action: flag payment/booking and notify ops for manual review; store dispute data and evidence workflow.

- transfer.paid / transfer.failed
  - Action: update transfer record; alert finance on failures.

- payout.paid / payout.failed
  - Action: update payout status and create alerts for failed payout remediation.

- account.updated
  - Action: update `connected_accounts` status (capabilities, payouts_enabled). Prevent transfers if payouts not enabled.

7. Webhook Processing Rules (best practices)
- Verify signature with STRIPE_WEBHOOK_SECRET for live and test secrets for test mode.
- Persist raw payload and stripe_event_id before processing.
- Use stripe_event_id as dedupe key; only process once.
- Processing must be idempotent; use DB transactions and unique constraints.
- Return 2xx only when processing succeeded; on transient errors return 5xx to allow retry.

8. Idempotency & Concurrency
- Use Stripe Idempotency-Key headers for outbound calls that create payments/transfers.
- Create idempotency keys using business identifiers (e.g., `booking:{booking_id}:create_charge`).
- For webhook processing, use stripe_event_id as unique index in `webhook_events` table.
- Use row-level locks or optimistic concurrency when changing booking/payment state.

9. Metadata & Naming Conventions
- Always include: metadata.booking_id, metadata.family_id, metadata.chef_id, metadata.region when creating Stripe objects.
- Use consistent DB column names: `stripe_payment_intent_id`, `stripe_charge_id`, `stripe_account_id`, `stripe_transfer_id`.
- Statement descriptor: `SERVDCO` or `SERVDCO*BOOKING` (keep within Stripe limits).

10. Money math, rounding & fees
- Store amounts in smallest currency unit (cents) as integers.
- Define rounding policy (round half up) and document it.
- Decide whether platform or cook covers Stripe processing fees and adjust transfer calculations accordingly.
- Platform fee calculation: platform_fee_cents = round(amount_cents * platform_fee_pct / 100).

11. Transfers & Payout policy (operational)
- Decide transfer timing (e.g., 7 days after completion) and keep a scheduled job to create Transfers.
- Check `connected_account.payouts_enabled` before creating transfers.
- Keep funds in platform balance until safe to transfer (hold periods for refunds/disputes).

12. Subscriptions & Billing
- Create one `ServdCo Premium` Product and Price(s) in Stripe (test & live).
- Use Checkout or server-side subscription creation. Use metadata to bind subscription to `chef_id`.
- Listen to `invoice.*` and `customer.subscription.*` events to manage entitlement.
- Use Customer Portal sessions for self-serve billing management.

13. Refunds & Disputes
- Admin endpoint to create refunds: call Stripe refund API and record response.
- On dispute.created, pause related transfers and initiate manual review flow.

14. Identity & KYC
- For Connect Express, track `account.requirements` and `account.capabilities`.
- Surface missing requirements to cooks via the app (developer task) and block payouts until resolved.

15. Reconciliation & Reporting
- Persist all Stripe events and responses.
- Daily reconciliation job to compare Stripe balance and payout history with local `ledger_entries`.

16. Logging, Monitoring & Alerts
- Log every webhook raw payload, processing result, and outbox actions (transfers/refunds).
- Alerts: failed webhooks > 3 attempts, transfer/payout failures, spike in disputes/refunds.

17. Testing & QA
- Use Stripe test keys and the Stripe CLI to simulate webhooks and test connected account flows.
- Test scenarios: checkout success, payment failure, subscription lifecycle, refund, dispute lifecycle, connected account onboarding, transfer creation.

18. Security & Compliance
- Verify webhook signatures.
- Use HTTPS and secure secret storage.
- Enforce least privilege for admin endpoints.
- Use Stripe Checkout to minimize PCI scope.

19. Error handling & retries
- Retry transient Stripe errors with exponential backoff.
- Use 5xx responses for transient webhook failures so Stripe will retry.

20. Operations & Runbook
- How to rotate webhook secret safely (accept both secrets during rotation).
- How to replay events and how to pause/cancel transfers.

21. Metrics to expose
- GMV, net revenue (platform fees), refunds rate, disputes rate, transfer volume, payout success rate.

22. Developer deliverables
- API contract with endpoint examples
- DB migration scripts
- Webhook handler with signature verification and dedupe
- Scheduler for transfer creation and reconciliation
- Unit + integration tests
- Runbook for secret rotation and dispute escalation

23. Pre-launch backend QA checklist
- [ ] Test-mode Checkout completes and webhook updates booking/payment
- [ ] Subscription purchase updates chef entitlement
- [ ] Connected account onboarding completes and `payouts_enabled` true
- [ ] Transfers created and `transfer.paid` events reconciled
- [ ] Refund flow updates payment & booking states
- [ ] Webhook replay does not duplicate actions
- [ ] Daily reconciliation script reconciles balances
- [ ] Secrets stored in vault and not in code
- [ ] Monitoring/alerts configured and tested

Notes & gotchas
- Use metadata extensively for reconciliation.
- Never transfer funds to a connected account until `payouts_enabled` is true.
- Keep test and live environments strictly separated.

Next steps
- Generate an OpenAPI skeleton or Postman collection for the endpoints above (optional).

---
Document prepared for backend team handoff.
