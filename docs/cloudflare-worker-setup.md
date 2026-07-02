# Cloudflare Workers Cron — Setup & Operations Guide

This guide migrates ServdCo's scheduled reconciliation jobs from GitHub Actions
to **Cloudflare Workers Cron**. It assumes you have **never used Cloudflare
Workers before** and explains every click.

> **Infrastructure only.** Nothing about the application changes. Vercel still
> hosts the frontend, the API, and receives Stripe webhooks. Cloudflare only
> runs the *schedule* that pokes the existing API endpoints.

---

## 1. Architecture

```
BEFORE                              AFTER
──────                              ─────
GitHub Actions (*/15)              Cloudflare Workers Cron (*/15)
      │                                   │
      ▼                                   ▼
Bearer CRON_SECRET                  Bearer CRON_SECRET
      │                                   │
      ▼                                   ▼
ServdCo API on Vercel  ◄── identical ──►  ServdCo API on Vercel
      │                                   │
      ▼                                   ▼
Stripe / Supabase                   Stripe / Supabase
(business logic unchanged)          (business logic unchanged)
```

### Cloudflare flow (per scheduled tick)

```
Cron trigger fires (*/15 * * * *)
        │
        ▼
worker.scheduled()  ──► runAllJobs()
        │
        ├─► POST /api/stripe/payments/reconcile-batch     (retry ×1)
        ├─► POST /api/stripe/transfers/process            (retry ×1)
        └─► POST /api/stripe/subscription/reconcile-batch (retry ×1)
        │
        ▼
run_complete { succeeded, failed, results[] }  (structured log)
```

### Authentication flow

```
Worker ── Authorization: Bearer <CRON_SECRET> ──► ServdCo API
                                                     │
                        isAuthorizedCronRequest(req) │ compares to
                        process.env.CRON_SECRET  ◄───┘  Vercel env var
```

The Worker and Vercel share the **same** `CRON_SECRET`. No new auth system.

### Retry flow

```
attempt 1 ──ok?──► done
    │ no
    ▼
wait 500ms (exponential base)
    │
attempt 2 ──ok?──► done
    │ no
    ▼
record failure, CONTINUE to next job   (never aborts remaining jobs)
```

### Logging flow

Every attempt, retry, and the final summary emit one structured JSON line
(`event: job_success | job_attempt_failed | job_retry | run_complete`),
visible in `wrangler tail` and the Cloudflare dashboard **Logs** tab.

---

## 2. Prerequisites

- A Cloudflare account (free plan is fine — Workers Cron is included).
- The `CRON_SECRET` value currently set in your Vercel project
  (Vercel → Project → Settings → Environment Variables → `CRON_SECRET`).
- The production API base URL: `https://servdco.vercel.app`
  (later `https://servdco.com`).

There are **two ways** to deploy. Do **one**:

- **Path A — Dashboard + GitHub connection** (recommended, no terminal).
- **Path B — Wrangler CLI** (for developers).

---

## 3. Path A — Deploy via Cloudflare Dashboard (click-by-click)

### 3.1 Open the dashboard

1. Go to <https://dash.cloudflare.com> and log in.
2. In the **left sidebar**, click **Workers & Pages**.

### 3.2 Create the Worker from GitHub

3. Click the blue **Create** button (top right).
4. Choose the **Workers** tab (not Pages).
5. Click **Import a repository** (or **Connect to Git**).
6. Click **Connect GitHub** and authorize Cloudflare if prompted.
7. **Repository selection:** pick `alexandria-servdco/servdco`.

### 3.3 Root Directory — VERY IMPORTANT

8. On the build configuration screen, find **Root directory** (sometimes under
   "Build configuration" / "Advanced").
9. Set **Root directory** to:

   ```
   cloudflare-worker
   ```

   > This is critical. Cloudflare must build ONLY the `cloudflare-worker`
   > folder. It must **never** build the React app at the repo root.

### 3.4 Build & Deploy commands

10. **Build command:**

    ```
    npm install
    ```

11. **Deploy command:**

    ```
    npx wrangler deploy
    ```

    (Cloudflare reads `cloudflare-worker/wrangler.toml`, which points to
    `src/worker.ts` and defines the cron trigger.)

12. Click **Save and Deploy**. The first deploy will succeed but jobs will be
    unauthorized until you add the secret (next step).

### 3.5 Add Worker secrets & variables

13. Open the deployed Worker → **Settings** → **Variables and Secrets**.
14. Confirm the **Variable** `SITE_URL` exists (it comes from `wrangler.toml`).
    If missing, add:
    - Name: `SITE_URL`
    - Value: `https://servdco.vercel.app`
    - Type: **Text** (plaintext var)
15. Add the **secret**:
    - Click **Add** → set Type to **Secret**.
    - Name: `CRON_SECRET`
    - Value: *(paste the exact same value as in Vercel)*
    - Click **Save**.

### 3.6 Cron trigger

16. Open the Worker → **Settings** → **Triggers** → **Cron Triggers**.
17. You should already see `*/15 * * * *` (from `wrangler.toml`). If not, click
    **Add Cron Trigger**, enter `*/15 * * * *`, and save.

### 3.7 Redeploy so secret takes effect

18. Go to **Deployments** → **Create deployment** (or push a commit). This
    ensures the running Worker picks up `CRON_SECRET`.

---

## 4. Path B — Deploy via Wrangler CLI

```bash
cd cloudflare-worker
npm install
npx wrangler login            # opens browser to authorize
npx wrangler secret put CRON_SECRET   # paste the Vercel value when prompted
npx wrangler deploy
```

`SITE_URL` and the cron schedule come from `wrangler.toml`. To point at
production later:

```bash
# edit wrangler.toml -> [vars] SITE_URL = "https://servdco.com"
npx wrangler deploy
```

---

## 5. Verify

### 5.1 Health check

Open in a browser (replace with your Worker URL shown after deploy):

```
https://servdco-cron.<your-subdomain>.workers.dev/health
```

Expected JSON:

```json
{ "status": "ok", "worker": "servdco-cron", "version": "1.0.0",
  "siteUrl": "https://servdco.vercel.app", "cronConfigured": true, ... }
```

### 5.2 Manually trigger a run

**Dashboard:** Worker → **Triggers** → find the cron → **Trigger** (or use
"Send test event" for scheduled events).

**CLI:**

```bash
npx wrangler tail           # in one terminal — live logs
# in another:
curl -X POST "https://servdco-cron.<subdomain>.workers.dev/run" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

### 5.3 Verify logs

Worker → **Logs** (or `wrangler tail`). You should see:

```
{"event":"run_start", ...}
{"event":"job_success","job":"payments-reconcile-batch","status":200, ...}
{"event":"job_success","job":"transfers-process","status":200, ...}
{"event":"job_success","job":"subscription-reconcile-batch","status":200, ...}
{"event":"run_complete","succeeded":3,"failed":0, ...}
```

`status: 200` on all three = success. A `401` means `CRON_SECRET` mismatch.
A `404` means the Vercel deploy hasn't shipped the consolidated API yet.

### 5.4 Verify the API side

In Vercel → Project → **Logs**, filter for `reconcile-batch` /
`transfers/process`. You should see the same reconciliation log lines that
GitHub Actions previously produced — identical behavior.

---

## 6. Disable GitHub Actions (after Cloudflare is verified)

The workflow `.github/workflows/reconcile-cron.yml` is already marked **LEGACY**
and its automatic `schedule` is commented out, so it no longer runs on its own.

To fully stop it in the GitHub UI as well:

1. GitHub repo → **Actions** tab.
2. Left sidebar → **Payment Reconciliation Cron (LEGACY)**.
3. Click the **`···`** menu (top right) → **Disable workflow**.

Leave the file in place until Cloudflare has run cleanly for ~48h; then it can
be deleted.

---

## 7. Rollback

If anything with Cloudflare misbehaves, reconciliation still works on the daily
Vercel crons (`vercel.json`), and you can instantly restore 15-minute cadence
via GitHub Actions:

**Option 1 — Re-enable GitHub Actions (fast):**
1. Edit `.github/workflows/reconcile-cron.yml`.
2. Uncomment the `schedule` block:
   ```yaml
   on:
     schedule:
       - cron: "*/15 * * * *"
     workflow_dispatch:
   ```
3. Ensure repo secrets `SITE_URL` and `CRON_SECRET` are set
   (GitHub → Settings → Secrets and variables → Actions).
4. Commit & push. GitHub resumes the schedule immediately.

**Option 2 — Pause Cloudflare Worker:**
- Worker → **Settings** → **Triggers** → delete the cron trigger, **or**
- Worker → **Manage** → **Delete** to remove entirely.

Neither rollback touches application code, Stripe, Supabase, or Vercel hosting.

---

## 8. Secrets summary

| Secret / Var  | Vercel | Cloudflare Worker | GitHub Actions (legacy) |
| ------------- | :----: | :---------------: | :---------------------: |
| `CRON_SECRET` |   ✅   |     ✅ (secret)   |    ✅ (repo secret)     |
| `SITE_URL`    |  n/a   |     ✅ (var)      |    ✅ (repo secret)     |

All three must use the **same** `CRON_SECRET` value.

---

## 9. Pre-deploy verification checklist

### 9.1 Cron overlap (can two runs execute simultaneously?)

**Worker level:** Yes, Cloudflare Cron does not wait for the previous tick to finish.
The worker now uses a **KV run lock** (`run_lock`, 25-minute TTL). If a prior run
is still in-flight, the next tick logs `run_skipped_overlap` and exits without
calling the API.

**API level — idempotency verified in code:**

| Job | Idempotent? | Mechanism |
| --- | :---------: | --------- |
| Transfers | **Yes** | `claimTransferForProcessing()` atomically sets `status=processing`; second worker gets `null` and skips. Stripe transfer uses `cookTransferIdempotencyKey(transferId)`. Stale `processing` rows recovered via `isProcessingStale()`. |
| Payments batch | **Yes** | `confirmBookingFromPayment()` is documented idempotent; booking update uses `.in("status", PAYABLE_STATUSES)` so already-confirmed bookings are not re-confirmed. Duplicate payments flagged, not double-applied. |
| Subscriptions batch | **Yes** | `reconcileChefSubscription()` reads Stripe truth and only writes when `needsSync` is true. Re-running is a no-op when already in sync. |

**Verdict:** Safe to run every 15 minutes. Overlap is mitigated at the worker
(KV lock) and at the API (DB claims / conditional updates).

### 9.2 Worker timeout (20–30 second endpoints)

| Setting | Value |
| ------- | ----- |
| Per-request timeout | **28s** (2s under Vercel `maxDuration: 30`) |
| Retries per job | 1 (2 attempts total) |
| Worst-case per job | ~56s + 500ms backoff |
| Worst-case full run | ~3 jobs × 56s ≈ **2.8 min** |

**Behavior on timeout:**
1. Request aborted → logged as `timeout after 28000ms`
2. One retry after 500ms backoff
3. If still failing → job marked failed, **next job continues**
4. Partial success is possible (e.g. payments OK, transfers timeout)

### 9.3 Rate limiting

Cron batch handlers (`payments/reconcile-batch`, `transfers/process`,
`subscription/reconcile-batch`) **do not call** `enforceRateLimit()`. Only
user-facing Stripe endpoints (checkout, refund, etc.) are rate-limited.

Worker traffic: 3 POSTs per run, max 6 with retries — well under any limit.

**Cloudflare WAF:** If you rate-limit `servdco.vercel.app` at the edge, add a
WAF rule to **bypass** requests with `Authorization: Bearer <CRON_SECRET>` or
whitelist the Worker egress IPs.

### 9.4 Observability

Every run emits a `run_summary` log with human-readable line:

```
Run: payments repaired=3, transfers processed=9, subscriptions repaired=2, duration=5.8s, failures=0
```

Parsed from API JSON responses (`repaired`, `processed`, `scanned`, etc.).

### 9.5 Health endpoint (`GET /health`)

Returns:

- `version`, `deployedAt`, `cronSchedule`
- `lastSuccessfulRun`, `lastFailedRun`, `consecutiveFailures`
- `lastSummary` (full metrics object)
- `runLockHeld` (is a run currently in-flight?)
- `alertWebhookConfigured`

### 9.6 Failure notifications

Set optional secret `ALERT_WEBHOOK_URL` (Discord or Slack incoming webhook).

After **3 consecutive failed scheduled runs**, the worker POSTs an alert with
run summary. Manual `/run` failures do not increment the counter.

Reset: any fully successful scheduled run sets `consecutiveFailures` to 0.
