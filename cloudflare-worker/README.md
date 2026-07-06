# ServdCo Cron Worker

A **pure scheduler** on Cloudflare Workers Cron (v2.0.0). It replaces the
temporary GitHub Actions 15-minute reconciliation schedule. It contains **no
business logic** — every reconciliation, transfer, and subscription job still
runs inside the existing ServdCo API on Vercel.

```
Cloudflare Workers Cron (*/15 * * * * UTC)
        │
        ▼
Authenticated HTTPS POST  (Authorization: Bearer CRON_SECRET)
        │
        ▼
ServdCo API on Vercel  ──►  existing business logic (unchanged)
```

## What it calls

Every scheduled run, in order (each retried once on failure; one failure never blocks the rest):

1. `POST {SITE_URL}/api/stripe/payments/reconcile-batch`
2. `POST {SITE_URL}/api/stripe/transfers/process`
3. `POST {SITE_URL}/api/stripe/subscription/reconcile-batch`

## Environment

| Name | Type | Where | Example |
| ---- | ---- | ----- | ------- |
| `SITE_URL` | var | Cloudflare dashboard only | `https://servdco.com` (production) |
| `WORKER_VERSION` | var | `wrangler.toml` / dashboard | `2.0.0` |
| `CRON_SECRET` | secret | `wrangler secret` / dashboard | *(same value as Vercel)* |
| `ALERT_WEBHOOK_URL` | secret (optional) | dashboard / `wrangler secret` | Discord or Slack webhook |

`CRON_SECRET` **must** match the `CRON_SECRET` set in the Vercel project.

**No KV, D1, R2, or other bindings are required.**

## Scripts

```bash
npm run typecheck   # tsc --noEmit
npm run build       # wrangler deploy --dry-run
npm run deploy      # wrangler deploy
npm run tail        # wrangler tail (live logs)
npm run dev         # wrangler dev
```

## Local development

```bash
cd cloudflare-worker
pnpm install
cp .dev.vars.example .dev.vars   # fill in CRON_SECRET
pnpm run dev                      # http://localhost:8787
```

```bash
curl http://localhost:8787/health
curl -X POST http://localhost:8787/run -H "Authorization: Bearer <CRON_SECRET>"
```

## Deploy

```bash
cd cloudflare-worker
pnpm install
npx wrangler login
npx wrangler secret put CRON_SECRET
pnpm run deploy
npx wrangler tail
```

## Endpoints

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/health` | none | Version, config flags, job list |
| POST | `/run` | `Bearer CRON_SECRET` (timing-safe) | Manually run all jobs |

## Guarantees

- No Stripe SDK, no Supabase SDK, no DB access, no persistent state.
- Does not change any ServdCo API URL or behavior.
- Retries once with exponential backoff; one failing job never blocks others.
- Structured JSON logs: `ts`, `job`, `durationMs`, `status`, `attempt`, `error`.
- Secrets are never logged.
