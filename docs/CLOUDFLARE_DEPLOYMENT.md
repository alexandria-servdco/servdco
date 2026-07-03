# Cloudflare Worker — Manual Steps

## Workers Builds (GitHub checks)

Cloudflare runs `npx wrangler deploy` from the **root directory** configured in
Workers → Settings → Builds. If that directory is the repository root (not
`cloudflare-worker`), the repo-root `wrangler.toml` shim is required so Wrangler
does not autoconfigure this project as the Vite frontend.

**Recommended build settings** (root directory = `cloudflare-worker`):

| Setting | Value |
| ------- | ----- |
| Root directory | `cloudflare-worker` |
| Build command | `npm ci` |
| Deploy command | `npm run deploy` |

**Alternate** (root directory = repository root):

| Setting | Value |
| ------- | ----- |
| Root directory | *(empty / `.`)* |
| Build command | *(leave empty)* |
| Deploy command | `npx wrangler deploy` |

Workers Builds overrides the Worker `name` per connected project
(`servdco` and `servdco-prod`), so both Git integrations can share this repo.

---

## Step 1

Go to https://dash.cloudflare.com and log in.

## Step 2

Click **Workers & Pages** in the left sidebar.

## Step 3

On the Workers & Pages overview page, find **Your subdomain** at the top and click **Change**.

## Step 4

Enter a subdomain (e.g. `servdco`) and save.

## Step 5

Click **Create**.

## Step 6

Select the **Workers** tab.

## Step 7

Click **Import a repository** (or **Connect to Git**).

## Step 8

Authorize GitHub if prompted.

## Step 9

Select repository **alexandria-servdco/servdco**.

## Step 10

Set **Root directory** to:

```
cloudflare-worker
```

## Step 11

Set **Build command** to:

```
npm ci
```

## Step 12

Set **Deploy command** to:

```
npm run deploy
```

## Step 13

Click **Save and Deploy**.

## Step 13

Open the deployed Worker.

## Step 14

Go to **Settings** → **Variables and Secrets**.

## Step 15

Confirm **SITE_URL** is set to `https://servdco.vercel.app`.

## Step 16

In Vercel → Project → **Settings** → **Environment Variables**, copy the value of **CRON_SECRET**.

## Step 17

In Cloudflare Worker → **Settings** → **Variables and Secrets** → **Add** → Type **Secret** → Name `CRON_SECRET` → paste the Vercel value → **Save**.

## Step 18

Go to **Settings** → **Triggers** → **Cron Triggers**.

## Step 19

Confirm `*/15 * * * *` is listed. If missing, click **Add Cron Trigger**, enter `*/15 * * * *`, and save.

## Step 20

Go to **Deployments** → **Create deployment** (or push a commit to trigger a new deploy).

## Step 21

Copy the Worker URL shown after deploy (format: `https://servdco-prod.<subdomain>.workers.dev`).

## Step 22

Open `https://servdco-prod.<subdomain>.workers.dev/health` in a browser.

## Step 23

Confirm `"cronSecretConfigured": true` in the response.

## Step 24

Run:

```
curl -X POST "https://servdco-prod.<subdomain>.workers.dev/run" -H "Authorization: Bearer <CRON_SECRET>"
```

## Step 25

Confirm the response shows `succeeded: 3` and `failed: 0`.

## Step 26

Go to GitHub → **Actions** → **Payment Reconciliation Cron (LEGACY)** → **⋯** → **Disable workflow**.

## Step 27 (optional)

In Cloudflare Worker → **Settings** → **Variables and Secrets** → **Add** → Type **Secret** → Name `ALERT_WEBHOOK_URL` → paste Discord or Slack webhook URL → **Save** → redeploy.

## Rollback — Step 1

Cloudflare dashboard → Worker → **Settings** → **Triggers** → delete the `*/15 * * * *` cron trigger.

## Rollback — Step 2 (alternative)

Cloudflare dashboard → Worker → **Deployments** → select previous deployment → **Rollback**.
