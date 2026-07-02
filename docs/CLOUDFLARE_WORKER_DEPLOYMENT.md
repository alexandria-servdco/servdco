# Cloudflare Worker Cron — Production Deployment Guide

This document matches the **v2.0.0** implementation in `cloudflare-worker/`.
The Worker is a **pure HTTP scheduler** — no business logic, no Stripe/Supabase SDKs,
no database access, and no KV/Durable Objects/Queues/D1/R2 bindings.

---

## Architecture

```
Cloudflare Workers Cron (*/15 * * * * UTC)
        │
        ▼
worker.scheduled()  →  ctx.waitUntil(runAllJobs())
        │
        ├─► POST /api/stripe/payments/reconcile-batch     (max 2 attempts)
        ├─► POST /api/stripe/transfers/process            (max 2 attempts)
        └─► POST /api/stripe/subscription/reconcile-batch (max 2 attempts)
        │
        ▼
ServdCo API on Vercel  (all business logic unchanged)
```

Every outbound request sends:

```
Authorization: Bearer <CRON_SECRET>
Content-Type: application/json
User-Agent: servdco-cron/2.0.0
```

`CRON_SECRET` must match the value in Vercel → Project → Environment Variables.

---

## What the Worker does NOT do

| Forbidden | Status |
| --------- | :----: |
| Stripe SDK / direct Stripe API calls | ✅ Never |
| Supabase SDK / direct DB writes | ✅ Never |
| Business logic (reconciliation, transfers) | ✅ Never |
| KV / D1 / R2 / Durable Objects / Queues | ✅ Never |

---

## Environment

| Name | Type | Set via | Required |
| ---- | ---- | ------- | :------: |
| `SITE_URL` | var | `wrangler.toml` or dashboard | ✅ |
| `WORKER_VERSION` | var | `wrangler.toml` or dashboard | optional |
| `CRON_SECRET` | secret | `wrangler secret put CRON_SECRET` | ✅ |
| `ALERT_WEBHOOK_URL` | secret | `wrangler secret put ALERT_WEBHOOK_URL` | optional |

Current production values in `wrangler.toml`:

```toml
[vars]
SITE_URL = "https://servdco.vercel.app"
WORKER_VERSION = "2.0.0"

[triggers]
crons = ["*/15 * * * *"]
```

---

## Deployment steps (CLI — recommended)

```bash
cd cloudflare-worker
npm install
npm run typecheck          # must pass
npm run build              # dry-run deploy — must pass

npx wrangler login
npx wrangler secret put CRON_SECRET        # paste exact Vercel value
# optional:
# npx wrangler secret put ALERT_WEBHOOK_URL

npx wrangler deploy
npx wrangler tail          # watch first run
```

### Deployment steps (Cloudflare Dashboard + GitHub)

1. **Workers & Pages** → **Create** → **Workers** → **Import a repository**
2. Repository: `alexandria-servdco/servdco`
3. **Root directory:** `cloudflare-worker` ← critical
4. **Build command:** `npm install`
5. **Deploy command:** `npx wrangler deploy`
6. **Settings → Variables and Secrets:**
   - Confirm `SITE_URL` = `https://servdco.vercel.app`
   - Add secret `CRON_SECRET` (same as Vercel)
7. **Settings → Triggers → Cron Triggers:** confirm `*/15 * * * *`
8. Redeploy so secrets bind to the active version

---

## Health check URL

After deploy, Cloudflare assigns a URL like:

```
https://servdco-cron.<your-subdomain>.workers.dev/health
```

Expected response (no auth required):

```json
{
  "status": "ok",
  "worker": "servdco-cron",
  "version": "2.0.0",
  "cronSchedule": "*/15 * * * *",
  "cronConfigured": true,
  "siteUrlConfigured": true,
  "cronSecretConfigured": true,
  "alertWebhookConfigured": false,
  "jobs": [
    "/api/stripe/payments/reconcile-batch",
    "/api/stripe/transfers/process",
    "/api/stripe/subscription/reconcile-batch"
  ],
  "timestamp": "2026-07-02T12:00:00.000Z"
}
```

`cronSecretConfigured: false` means `CRON_SECRET` is not set — scheduled runs will log `run_misconfigured` and skip API calls.

---

## Manual test procedure

```bash
# 1. Health (no secret)
curl -s "https://servdco-cron.<subdomain>.workers.dev/health" | jq .

# 2. Manual run (requires secret)
curl -s -X POST "https://servdco-cron.<subdomain>.workers.dev/run" \
  -H "Authorization: Bearer <CRON_SECRET>" | jq .

# 3. Invalid secret must return 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://servdco-cron.<subdomain>.workers.dev/run" \
  -H "Authorization: Bearer wrong-secret"
# Expected: 401

# 4. Live logs
npx wrangler tail
```

Success criteria:

- All three jobs return HTTP 200 in the manual `/run` response
- `wrangler tail` shows `event: job_success` for each job
- `event: run_complete` shows `succeeded: 3, failed: 0`
- Vercel logs show matching `reconcile-batch` / `transfers/process` entries

---

## Cron verification procedure

1. Deploy Worker and confirm cron trigger `*/15 * * * *` in dashboard
2. Run `npx wrangler tail` and wait up to 15 minutes
3. Confirm log sequence:
   - `run_start`
   - `job_success` × 3 (or `job_attempt_failed` + `job_retry` on transient errors)
   - `run_summary`
   - `run_complete`
4. Cross-check Vercel → Logs for the three API routes at the same timestamps
5. Optional: compare metrics (`repaired`, `processed`, `scanned`) against prior GitHub Actions runs

---

## Retry & failure behavior

| Condition | Worker behavior |
| --------- | --------------- |
| HTTP 500 / 502 / 503 | Retry once after 500ms backoff |
| Request timeout (28s) | Abort, retry once after 500ms backoff |
| DNS / network error | Log `job_attempt_error`, retry once |
| Vercel unavailable | Same — retry then mark job failed |
| One job fails | **Remaining jobs still run** |
| All jobs fail | `run_complete` with `failed: 3`; optional `ALERT_WEBHOOK_URL` alert |

Worst-case run duration: 3 jobs × 2 attempts × 28s + backoff ≈ **2.8 minutes** (well under the 15-minute cron interval).

---

## Overlap & idempotency

Cloudflare Cron does **not** wait for the previous run to finish. Overlapping runs are safe because the ServdCo API is idempotent:

| Job | Idempotency mechanism |
| --- | --------------------- |
| Transfers | `claimTransferForProcessing()` DB lock; Stripe idempotency keys |
| Payments batch | Conditional status updates; duplicate payments flagged not re-applied |
| Subscriptions batch | `reconcileChefSubscription()` no-ops when already in sync |

The Worker holds **no run lock** and writes **no state** — overlap safety is entirely on the API side.

---

## Structured logging

Every log line is JSON with `source: "servdco-cron"` and `ts` (ISO timestamp).

| Event | Fields |
| ----- | ------ |
| `job_success` | `job`, `attempt`, `status`, `durationMs`, `metrics` |
| `job_attempt_failed` | `job`, `attempt`, `status`, `durationMs`, `error` |
| `job_attempt_error` | `job`, `attempt`, `durationMs`, `error` |
| `job_retry` | `job`, `backoffMs` |
| `run_summary` | full metrics + `humanReadable` line |
| `run_complete` | `succeeded`, `failed`, `durationMs`, `results[]` |

Secrets are **never** logged. `/health` exposes only `cronSecretConfigured: true/false`.

---

## Authentication

| Endpoint | Auth |
| -------- | ---- |
| `GET /health` | None (public, non-sensitive) |
| `POST /run` | `Authorization: Bearer <CRON_SECRET>` — timing-safe compare |
| Outbound API calls | `Authorization: Bearer <CRON_SECRET>` |
| Everything else | 404 |

Invalid or missing Bearer token on `/run` always returns **401**.

---

## Cloudflare Free plan compatibility

Verified against current implementation:

| Limit | Worker usage | Free plan | Status |
| ----- | ------------ | --------- | :----: |
| Bundle size | 9.64 KiB (gzip 2.98 KiB) | 3 MiB compressed | ✅ |
| CPU time | Minimal (3 fetch calls, JSON parse) | 10 ms CPU/invocation* | ✅ |
| Memory | Single script, no bindings | 128 MiB | ✅ |
| Cron triggers | 1 schedule (`*/15 * * * *`) | Included on free | ✅ |
| Daily requests | ~96 scheduled + manual | 100,000/day | ✅ |
| Paid bindings (KV, D1, etc.) | None used | N/A | ✅ |

\*I/O wait (fetch to Vercel) does not count toward CPU time.

---

## Rollback procedure

No application code changes required.

**Option A — Disable cron (instant):**

1. Cloudflare dashboard → Worker → **Settings** → **Triggers**
2. Delete the `*/15 * * * *` cron trigger

**Option B — Redeploy previous version:**

1. Worker → **Deployments**
2. Select the last known-good deployment → **Rollback**

Vercel daily crons in `vercel.json` continue as a safety net:

- `0 0 * * *` → transfers
- `0 2 * * *` → payments reconcile
- `0 3 * * *` → subscription reconcile

---

## Manual Cloudflare configuration still required

- [ ] Set `CRON_SECRET` secret (must match Vercel)
- [ ] Confirm `SITE_URL` variable points to production API base
- [ ] Confirm cron trigger `*/15 * * * *` is active
- [ ] (Optional) Set `ALERT_WEBHOOK_URL` for failure notifications
- [ ] Note the Worker URL for `/health` monitoring
- [ ] After 48h clean runs: disable legacy `.github/workflows/reconcile-cron.yml` in GitHub Actions UI

---

## Local development

```bash
cd cloudflare-worker
cp .dev.vars.example .dev.vars   # fill CRON_SECRET
npm run dev                      # http://localhost:8787
curl http://localhost:8787/health
curl -X POST http://localhost:8787/run -H "Authorization: Bearer <CRON_SECRET>"
```

Trigger the scheduled handler locally:

```bash
npx wrangler dev --test-scheduled
curl "http://localhost:8787/__scheduled?cron=*/15+*+*+*+*"
```
