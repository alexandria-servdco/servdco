# Stripe Payout Pipeline — Deployment Requirements

## Mandatory Supabase migration

Apply **before** deploying transfer cron / admin retry code:

```
supabase/migrations/20250702150000_transfer_retry_and_action_required.sql
```

This migration adds:

- `transfers.retry_count`
- `transfers.next_retry_at`
- `transfers.last_retry_at`
- `transfers.last_retry_reason`
- `transfer_status` enum value `action_required`
- Platform settings: `transfer_max_retry_count`, `transfer_processing_timeout_minutes`

### Verify migration applied

```bash
pnpm verify:stripe-connect
```

Or in Supabase SQL:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'transfers'
  AND column_name IN ('retry_count', 'next_retry_at', 'last_retry_at', 'last_retry_reason');
```

Startup validation: the transfer processor calls `validateTransferSchemaOnStartup()` and logs a **CRITICAL** error if columns are missing. Transfer cron will throw until migration is applied.

## Stripe webhook events (production dashboard)

Ensure these events are enabled on the production webhook endpoint:

- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `account.updated`
- `transfer.created`
- `transfer.failed`
- `payout.paid`
- `payout.failed`
- `charge.refunded`

## Environment variables (Vercel production)

Required for payout pipeline:

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Live Stripe API (must match connected accounts) |
| `STRIPE_WEBHOOK_SECRET` | Production webhook signing secret |
| `SUPABASE_URL` | Production Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB writes |
| `CRON_SECRET` | Authorizes `/api/stripe/transfers/process` cron |
| `ENABLE_STRIPE_CHECKOUT` | `true` |

Use `.env.production` values only for production verification — not `.env.local`.

## Post-deploy verification

1. Admin → Payouts → Compare DB vs Stripe → Force Sync for any cook with mismatch
2. Confirm stuck `pending` transfer moves to `paid` after cron or admin retry
3. Stripe Dashboard → Transfers: exactly **one** `tr_` per booking transfer row
4. Vercel logs: no `CRITICAL: transfers retry migration missing`

## Financial integrity protections (deployed in final pass)

- **Atomic claim:** `UPDATE transfers SET status='processing' WHERE status IN ('scheduled','pending','failed') RETURNING *`
- **Stripe idempotency:** `servdco_cook_transfer_<transferId>` on every `stripe.transfers.create`
- **Concurrent cron safe:** second worker receives `Transfer already being processed by another worker`
