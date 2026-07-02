# Cloudflare Worker — Manual Steps

## Step 1

Go to https://dash.cloudflare.com and log in.

## Step 2

Click **Workers & Pages** in the left sidebar.

## Step 3

Click **Create**.

## Step 4

Select the **Workers** tab.

## Step 5

Click **Import a repository** (or **Connect to Git**).

## Step 6

Authorize GitHub if prompted.

## Step 7

Select repository **alexandria-servdco/servdco**.

## Step 8

Set **Root directory** to:

```
cloudflare-worker
```

## Step 9

Set **Build command** to:

```
npm ci
```

## Step 10

Set **Deploy command** to:

```
npm run deploy
```

## Step 11

Click **Save and Deploy**.

## Step 12

Open the deployed Worker.

## Step 13

Go to **Settings** → **Variables and Secrets**.

## Step 14

Confirm **SITE_URL** is set to `https://servdco.vercel.app`.

## Step 15

In Vercel → Project → **Settings** → **Environment Variables**, copy the value of **CRON_SECRET**.

## Step 16

In Cloudflare Worker → **Settings** → **Variables and Secrets** → **Add** → Type **Secret** → Name `CRON_SECRET` → paste the Vercel value → **Save**.

## Step 17

Go to **Settings** → **Triggers** → **Cron Triggers**.

## Step 18

Confirm `*/15 * * * *` is listed. If missing, click **Add Cron Trigger**, enter `*/15 * * * *`, and save.

## Step 19

Go to **Deployments** → **Create deployment** (or push a commit to trigger a new deploy).

## Step 20

Copy the Worker URL shown after deploy (format: `https://servdco-prod.<subdomain>.workers.dev`).

## Step 21

Open `https://servdco-prod.<subdomain>.workers.dev/health` in a browser.

## Step 22

Confirm `"cronSecretConfigured": true` in the response.

## Step 23

Run:

```
curl -X POST "https://servdco-prod.<subdomain>.workers.dev/run" -H "Authorization: Bearer <CRON_SECRET>"
```

## Step 24

Confirm the response shows `succeeded: 3` and `failed: 0`.

## Step 25

Go to GitHub → **Actions** → **Payment Reconciliation Cron (LEGACY)** → **⋯** → **Disable workflow**.

## Step 26 (optional)

In Cloudflare Worker → **Settings** → **Variables and Secrets** → **Add** → Type **Secret** → Name `ALERT_WEBHOOK_URL` → paste Discord or Slack webhook URL → **Save** → redeploy.

## Rollback — Step 1

Cloudflare dashboard → Worker → **Settings** → **Triggers** → delete the `*/15 * * * *` cron trigger.

## Rollback — Step 2 (alternative)

Cloudflare dashboard → Worker → **Deployments** → select previous deployment → **Rollback**.
