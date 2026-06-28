# ServdCo — Local Stripe Testing (Test Mode + Stripe CLI)

Use **Stripe test mode** (`sk_test_…`) and **Stripe CLI forwarding** only.  
Do **not** create dashboard webhooks for localhost. Do **not** change the production webhook at `https://servdco-one.vercel.app/api/stripe/webhook`.

---

## Prerequisites

| Requirement | File / command |
|-------------|----------------|
| Test secret key | `.env.local` → `STRIPE_SECRET_KEY=sk_test_…` |
| Test premium IDs | `.env.local` → `STRIPE_PREMIUM_PRODUCT_ID`, `STRIPE_PREMIUM_PRICE_ID` |
| Stripe enabled | `VITE_ENABLE_STRIPE_CHECKOUT=true`, `ENABLE_STRIPE_CHECKOUT=true` |
| Supabase keys | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Cron auth | `CRON_SECRET` (non-placeholder) |

---

## 1. Install Stripe CLI

**Windows (winget):**
```powershell
winget install Stripe.StripeCli
```

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

Verify:
```bash
stripe --version
```

---

## 2. Login

```bash
stripe login
```

Complete browser auth. Confirm test mode in Dashboard (toggle **Test mode**).

---

## 3. Start API (Terminal 1)

From repo root:

```bash
pnpm dev:api
```

This runs `vercel dev --listen 3000` with `.env.local` injected (see `scripts/vercel-dev.mjs`).

Verify:
```bash
curl http://localhost:3000/api/health
# {"ok":true,"route":"/api/health"}
```

---

## 4. Start SPA (Terminal 2, optional)

```bash
pnpm dev
```

Vite on `http://localhost:8080` proxies `/api/*` → `http://localhost:3000` (see `vite.config.ts`).

---

## 5. Start Stripe CLI webhook forwarding (Terminal 3)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the signing secret from output:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxx
```

---

## 6. Set local webhook secret

In `.env.local` (local only — **never** commit real secrets):

```env
STRIPE_WEBHOOK_SECRET_LOCAL=whsec_xxxxxxxx
```

Leave `STRIPE_WEBHOOK_SECRET` as the **production** Vercel value.  
When `STRIPE_WEBHOOK_SECRET_LOCAL` is set, `api/stripe/webhook.ts` uses it via `getStripeWebhookSecret()` in `api/_lib/stripe/env.ts`.

Restart `pnpm dev:api` after updating the secret.

**Secret resolution order:**
1. `STRIPE_WEBHOOK_SECRET_LOCAL` (Stripe CLI)
2. `STRIPE_WEBHOOK_SECRET` (production dashboard)

---

## 7. Test payment (booking)

1. Family signs in on `http://localhost:8080`
2. Create booking with approved chef
3. Chef accepts → family pays
4. Card: `4242 4242 4242 4242`, any future expiry, any CVC

Watch Terminal 3 for forwarded events:
- `checkout.session.completed`
- `payment_intent.succeeded`

Verify in Supabase:
```sql
SELECT id, status, amount_cents, stripe_checkout_session_id
FROM payments ORDER BY created_at DESC LIMIT 1;

SELECT id, status FROM bookings WHERE id = '<booking_id>';

SELECT id, title, metadata FROM notifications
WHERE user_id = '<family_or_chef_id>' ORDER BY created_at DESC LIMIT 5;

SELECT action, entity_type, metadata FROM audit_logs
WHERE entity_type = 'payments' ORDER BY created_at DESC LIMIT 5;
```

---

## 8. Verify webhook delivery

**CLI terminal:** `200` responses for forwarded events.

**Database:**
```sql
SELECT stripe_event_id, event_type, processed, processing_error
FROM stripe_events ORDER BY created_at DESC LIMIT 10;
```

**Trigger test event (optional):**
```bash
stripe trigger checkout.session.completed
```

---

## 9. Other flows

| Flow | Endpoint | Notes |
|------|----------|-------|
| Connect onboarding | `POST /api/stripe/connect/onboarding` | Chef JWT; reuses existing `stripe_accounts` row |
| Premium | `POST /api/stripe/subscription/checkout-session` | Uses `STRIPE_PREMIUM_PRICE_ID` |
| Tips | `POST /api/stripe/tips/create-checkout-session` | Completed booking only |
| Refund | `POST /api/stripe/refund` | Admin JWT |
| Transfers | `POST /api/stripe/transfers/process` | `Authorization: Bearer <CRON_SECRET>` |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `SUPABASE_ANON_KEY is not configured` | API env not loaded | Use `pnpm dev:api`, not raw `vercel dev` |
| Webhook `400` signature error | Wrong secret | Set `STRIPE_WEBHOOK_SECRET_LOCAL` from `stripe listen` |
| Stripe UI hidden | Client flag off | `VITE_ENABLE_STRIPE_CHECKOUT=true` |
| `503 Stripe checkout is disabled` | Server flag + DB | `ENABLE_STRIPE_CHECKOUT=true` |
| `/api` 404 on port 8080 | SPA only | Start `pnpm dev:api` or use proxy |

---

## Production vs local

| Item | Production (Vercel) | Local |
|------|---------------------|-------|
| Webhook URL | `https://servdco-one.vercel.app/api/stripe/webhook` | `stripe listen` → `localhost:3000/api/stripe/webhook` |
| Webhook secret | `STRIPE_WEBHOOK_SECRET` (dashboard) | `STRIPE_WEBHOOK_SECRET_LOCAL` (CLI) |
| Stripe key | `sk_live_…` on Vercel | `sk_test_…` in `.env.local` |

Do **not** add localhost URLs to the Stripe Dashboard webhook list.
