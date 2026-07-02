# ServdCo Cron Worker

A **pure scheduler** running on Cloudflare Workers Cron. It replaces the
temporary GitHub Actions scheduled jobs. It contains **no business logic** —
every reconciliation, transfer, and subscription job still runs inside the
existing ServdCo API on Vercel. This Worker only issues authenticated HTTP
requests on a schedule.

```
Cloudflare Workers Cron
        │  (every 15 min)
        ▼
Authenticated HTTPS POST  (Authorization: Bearer CRON_SECRET)
        │
        ▼
ServdCo API on Vercel  ──►  existing business logic (unchanged)
```

## What it calls

Every scheduled run, in order (each retried once on failure, never aborting the rest):

1. `POST {SITE_URL}/api/stripe/payments/reconcile-batch`
2. `POST {SITE_URL}/api/stripe/transfers/process`
3. `POST {SITE_URL}/api/stripe/subscription/reconcile-batch`

## Environment variables

| Name          | Type   | Where                              | Example                        |
| ------------- | ------ | ---------------------------------- | ------------------------------ |
| `SITE_URL`    | var    | `wrangler.toml` / dashboard var    | `https://servdco.vercel.app`   |
| `CRON_SECRET` | secret | `wrangler secret` / dashboard      | *(same value as Vercel)*       |

`CRON_SECRET` **must** match the `CRON_SECRET` set in the Vercel project — the
ServdCo API authenticates cron requests with `Authorization: Bearer <CRON_SECRET>`.
Nothing is hardcoded; to move to production simply change `SITE_URL` to
`https://servdco.com`.

## Local development

```bash
cd cloudflare-worker
pnpm install          # or npm install
cp .dev.vars.example .dev.vars   # fill in CRON_SECRET
pnpm typecheck        # tsc --noEmit
pnpm dev              # runs on http://localhost:8787
```

Manually trigger the schedule locally:

```bash
# In another terminal while `pnpm dev` runs:
curl http://localhost:8787/health

curl -X POST http://localhost:8787/run \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Or trigger the actual scheduled handler:

```bash
npx wrangler dev --test-scheduled
# then hit the scheduled endpoint wrangler prints, e.g.:
curl "http://localhost:8787/__scheduled?cron=*/15+*+*+*+*"
```

## Deploy (CLI)

```bash
cd cloudflare-worker
npx wrangler login
npx wrangler secret put CRON_SECRET     # paste the Vercel value
npx wrangler deploy
npx wrangler tail                       # live structured logs
```

Full click-by-click dashboard instructions (GitHub connection, root directory,
secrets, cron trigger, verification, rollback) live in
[`../docs/cloudflare-worker-setup.md`](../docs/cloudflare-worker-setup.md).

## Endpoints exposed by the Worker

| Method | Path      | Auth                       | Purpose                        |
| ------ | --------- | -------------------------- | ------------------------------ |
| GET    | `/health` | none                       | Version, SITE_URL, cron status |
| POST   | `/run`    | `Bearer CRON_SECRET`       | Manually run all jobs now      |

## Guarantees

- No Stripe SDK, no Supabase SDK, no DB access.
- Does not change any ServdCo API, URL, or behavior.
- Retries once with exponential backoff; one failing job never blocks others.
- Structured JSON logs for every attempt, retry, and completion summary.
