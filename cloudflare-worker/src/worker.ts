/**
 * ServdCo Cron Worker
 * ===================
 *
 * A PURE SCHEDULER. Contains no business logic, no Stripe SDK, no Supabase SDK,
 * no database access, and no persistent state. On every scheduled tick it issues
 * authenticated HTTP requests to the existing ServdCo API on Vercel, which runs
 * all reconciliation / transfer / subscription logic exactly as it does today.
 *
 * Responsibilities per run (in order, each retried once, never aborting the rest):
 *   1. POST /api/stripe/payments/reconcile-batch
 *   2. POST /api/stripe/transfers/process
 *   3. POST /api/stripe/subscription/reconcile-batch
 *
 * Overlap safety:
 *   - A full run is bounded to well under the 15-minute cron interval
 *     (3 jobs x max 2 attempts x 28s = worst case ~2.8 min).
 *   - The ServdCo API is already fully idempotent (DB claim locks, Stripe
 *     idempotency keys, conditional status updates), so even a rare overlap
 *     cannot double-apply payments, transfers, or subscription changes.
 *
 * No KV / Durable Objects / Queues / D1 / R2 are used — deployment is a single
 * `wrangler deploy` with two secrets and (optionally) two variables.
 */

const WORKER_VERSION = "2.0.0";
const CRON_SCHEDULE = "*/15 * * * *";
const MAX_ATTEMPTS = 2; // initial attempt + 1 retry
const BASE_BACKOFF_MS = 500;
/** Per-request timeout — 2s under Vercel's 30s function maxDuration. */
const REQUEST_TIMEOUT_MS = 28_000;

interface Env {
  /** Base URL of the ServdCo API on Vercel. Set as a Cloudflare variable. */
  SITE_URL: string;
  /** Shared secret, sent as `Authorization: Bearer <CRON_SECRET>`. Cloudflare secret. */
  CRON_SECRET: string;
  /** Optional version override (variable). */
  WORKER_VERSION?: string;
  /** Optional Discord/Slack webhook for failure alerts (secret). */
  ALERT_WEBHOOK_URL?: string;
}

interface CronJob {
  name: string;
  /** Path relative to SITE_URL — public URL is unchanged from today. */
  path: string;
  method: "GET" | "POST";
}

const JOBS: CronJob[] = [
  {
    name: "payments-reconcile-batch",
    path: "/api/stripe/payments/reconcile-batch",
    method: "POST",
  },
  {
    name: "transfers-process",
    path: "/api/stripe/transfers/process",
    method: "POST",
  },
  {
    name: "subscription-reconcile-batch",
    path: "/api/stripe/subscription/reconcile-batch",
    method: "POST",
  },
];

interface JobResult {
  job: string;
  endpoint: string;
  attempts: number;
  ok: boolean;
  status: number | null;
  durationMs: number;
  failureReason?: string;
  metrics?: Record<string, unknown>;
}

interface RunSummary {
  trigger: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  jobsTotal: number;
  jobsSucceeded: number;
  jobsFailed: number;
  paymentsScanned?: number;
  paymentsRepaired?: number;
  paymentsDuplicates?: number;
  transfersProcessed?: number;
  transfersFailed?: number;
  transfersSkipped?: number;
  tipsRetried?: number;
  tipsSucceeded?: number;
  subscriptionsScanned?: number;
  subscriptionsRepaired?: number;
  failures: number;
}

function version(env: Env): string {
  return env.WORKER_VERSION ?? WORKER_VERSION;
}

function log(record: Record<string, unknown>): void {
  console.log(
    JSON.stringify({ source: "servdco-cron", ts: new Date().toISOString(), ...record }),
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Constant-time string compare — prevents Bearer token timing attacks on POST /run. */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.byteLength !== bBytes.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.byteLength; i++) {
    diff |= aBytes[i]! ^ bBytes[i]!;
  }
  return diff === 0;
}

function isAuthorizedCronBearer(authHeader: string | null, secret: string): boolean {
  if (!authHeader || !secret) return false;
  return timingSafeEqual(authHeader, `Bearer ${secret}`);
}

function num(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function extractMetrics(jobName: string, body: unknown): Record<string, unknown> | undefined {
  if (!body || typeof body !== "object") return undefined;
  const data = body as Record<string, unknown>;

  switch (jobName) {
    case "payments-reconcile-batch":
      return {
        scanned: data.scanned,
        repaired: data.repaired,
        duplicates: data.duplicates,
        errorCount: Array.isArray(data.errors) ? data.errors.length : 0,
      };
    case "transfers-process": {
      const tips = data.tips as Record<string, unknown> | undefined;
      return {
        processed: data.processed,
        failed: data.failed,
        skipped: data.skipped,
        tipsRetried: tips?.retried,
        tipsSucceeded: tips?.succeeded,
      };
    }
    case "subscription-reconcile-batch":
      return {
        scanned: data.scanned,
        repaired: data.repaired,
        errorCount: Array.isArray(data.errors) ? data.errors.length : 0,
      };
    default:
      return undefined;
  }
}

async function callEndpoint(env: Env, job: CronJob): Promise<JobResult> {
  const base = env.SITE_URL.replace(/\/$/, "");
  const endpoint = `${base}${job.path}`;
  const started = Date.now();
  let lastStatus: number | null = null;
  let lastReason: string | undefined;
  let lastMetrics: Record<string, unknown> | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const attemptStarted = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(endpoint, {
        method: job.method,
        headers: {
          Authorization: `Bearer ${env.CRON_SECRET}`,
          "Content-Type": "application/json",
          "User-Agent": `servdco-cron/${version(env)}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      lastStatus = res.status;

      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }

      if (res.ok) {
        lastMetrics = extractMetrics(job.name, body);
        log({
          event: "job_success",
          version: version(env),
          job: job.name,
          endpoint,
          attempt,
          status: res.status,
          durationMs: Date.now() - attemptStarted,
          metrics: lastMetrics,
        });
        return {
          job: job.name,
          endpoint,
          attempts: attempt,
          ok: true,
          status: res.status,
          durationMs: Date.now() - started,
          metrics: lastMetrics,
        };
      }

      lastReason = `HTTP ${res.status}`;
      log({
        event: "job_attempt_failed",
        version: version(env),
        job: job.name,
        endpoint,
        attempt,
        status: res.status,
        durationMs: Date.now() - attemptStarted,
        error: lastReason,
        failureReason: lastReason,
      });
    } catch (err) {
      clearTimeout(timeout);
      lastReason =
        err instanceof Error && err.name === "AbortError"
          ? `timeout after ${REQUEST_TIMEOUT_MS}ms`
          : err instanceof Error
            ? err.message
            : "unknown error";
      log({
        event: "job_attempt_error",
        version: version(env),
        job: job.name,
        endpoint,
        attempt,
        durationMs: Date.now() - attemptStarted,
        error: lastReason,
        failureReason: lastReason,
      });
    }

    if (attempt < MAX_ATTEMPTS) {
      const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1);
      log({ event: "job_retry", version: version(env), job: job.name, backoffMs: backoff });
      await sleep(backoff);
    }
  }

  return {
    job: job.name,
    endpoint,
    attempts: MAX_ATTEMPTS,
    ok: false,
    status: lastStatus,
    durationMs: Date.now() - started,
    failureReason: lastReason ?? "exhausted retries",
    metrics: lastMetrics,
  };
}

function buildRunSummary(trigger: string, runStarted: number, results: JobResult[]): RunSummary {
  const pm = results.find((r) => r.job === "payments-reconcile-batch")?.metrics ?? {};
  const tm = results.find((r) => r.job === "transfers-process")?.metrics ?? {};
  const sm = results.find((r) => r.job === "subscription-reconcile-batch")?.metrics ?? {};
  const jobsFailed = results.filter((r) => !r.ok).length;

  return {
    trigger,
    startedAt: new Date(runStarted).toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - runStarted,
    jobsTotal: results.length,
    jobsSucceeded: results.length - jobsFailed,
    jobsFailed,
    paymentsScanned: num(pm.scanned),
    paymentsRepaired: num(pm.repaired),
    paymentsDuplicates: num(pm.duplicates),
    transfersProcessed: num(tm.processed),
    transfersFailed: num(tm.failed),
    transfersSkipped: num(tm.skipped),
    tipsRetried: num(tm.tipsRetried),
    tipsSucceeded: num(tm.tipsSucceeded),
    subscriptionsScanned: num(sm.scanned),
    subscriptionsRepaired: num(sm.repaired),
    failures: jobsFailed,
  };
}

function formatSummaryLine(s: RunSummary): string {
  return [
    `Run: payments repaired=${s.paymentsRepaired ?? 0}`,
    `transfers processed=${s.transfersProcessed ?? 0}`,
    `subscriptions repaired=${s.subscriptionsRepaired ?? 0}`,
    `duration=${(s.durationMs / 1000).toFixed(1)}s`,
    `failures=${s.failures}`,
  ].join(", ");
}

async function sendFailureAlert(env: Env, summary: RunSummary): Promise<void> {
  if (!env.ALERT_WEBHOOK_URL) return;
  const text = [
    "⚠️ ServdCo Cron Worker — run had failures",
    `Jobs failed: ${summary.jobsFailed}/${summary.jobsTotal}`,
    `Trigger: ${summary.trigger}`,
    `Completed: ${summary.completedAt}`,
    `Site: ${env.SITE_URL}`,
    formatSummaryLine(summary),
  ].join("\n");

  try {
    await fetch(env.ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, text }),
    });
    log({ event: "alert_sent", jobsFailed: summary.jobsFailed });
  } catch (err) {
    log({ event: "alert_failed", message: err instanceof Error ? err.message : "unknown" });
  }
}

async function runAllJobs(env: Env, trigger: string): Promise<RunSummary> {
  const runStarted = Date.now();
  log({ event: "run_start", version: version(env), trigger, siteUrl: env.SITE_URL, jobs: JOBS.length });

  if (!env.CRON_SECRET || !env.SITE_URL) {
    log({
      event: "run_misconfigured",
      version: version(env),
      hasSiteUrl: Boolean(env.SITE_URL),
      hasCronSecret: Boolean(env.CRON_SECRET),
      failureReason: "Missing SITE_URL or CRON_SECRET",
    });
    return buildRunSummary(trigger, runStarted, []);
  }

  const results: JobResult[] = [];
  for (const job of JOBS) {
    // Sequential; a failure never aborts remaining jobs.
    results.push(await callEndpoint(env, job));
  }

  const summary = buildRunSummary(trigger, runStarted, results);

  log({ event: "run_summary", version: version(env), ...summary, humanReadable: formatSummaryLine(summary) });
  log({
    event: "run_complete",
    version: version(env),
    trigger,
    total: results.length,
    succeeded: summary.jobsSucceeded,
    failed: summary.jobsFailed,
    durationMs: summary.durationMs,
    results,
  });

  if (summary.jobsFailed > 0) {
    await sendFailureAlert(env, summary);
  }

  return summary;
}

export default {
  /** Cloudflare Cron trigger entrypoint. */
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runAllJobs(env, `cron:${event.cron}`));
  },

  /**
   * HTTP entrypoint.
   *   GET  /health → public, non-sensitive status (safe to expose)
   *   POST /run    → manual trigger, requires `Authorization: Bearer CRON_SECRET`
   *   everything else → 404
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({
        status: "ok",
        worker: "servdco-cron",
        version: version(env),
        cronSchedule: CRON_SCHEDULE,
        cronConfigured: true,
        siteUrlConfigured: Boolean(env.SITE_URL),
        cronSecretConfigured: Boolean(env.CRON_SECRET),
        alertWebhookConfigured: Boolean(env.ALERT_WEBHOOK_URL),
        jobs: JOBS.map((j) => j.path),
        timestamp: new Date().toISOString(),
      });
    }

    if (url.pathname === "/run") {
      if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
      }
      if (!isAuthorizedCronBearer(request.headers.get("authorization"), env.CRON_SECRET)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const summary = await runAllJobs(env, "manual");
      return Response.json({ triggered: "manual", summary });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
};
