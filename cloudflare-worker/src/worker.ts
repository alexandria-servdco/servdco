/**
 * ServdCo Cron Worker
 * ===================
 *
 * A PURE SCHEDULER. This Worker contains no business logic. On every scheduled
 * tick it issues authenticated HTTP requests to the existing ServdCo API on
 * Vercel, which performs all reconciliation / transfer / subscription work
 * exactly as it does today.
 *
 * Responsibilities per run (in order):
 *   1. POST /api/stripe/payments/reconcile-batch
 *   2. POST /api/stripe/transfers/process
 *   3. POST /api/stripe/subscription/reconcile-batch
 *
 * Each job is retried once with a small exponential backoff on failure. A
 * failing job never aborts the remaining jobs. All output is structured JSON.
 *
 * There is NO Stripe SDK, NO Supabase SDK, NO database access here.
 */

const WORKER_VERSION = "1.0.0";

interface Env {
  /** Base URL of the ServdCo API on Vercel, e.g. https://servdco.vercel.app */
  SITE_URL: string;
  /** Shared secret. Sent as `Authorization: Bearer <CRON_SECRET>`. */
  CRON_SECRET: string;
  /** Optional override; falls back to compiled constant. */
  WORKER_VERSION?: string;
}

/** One scheduled job = one authenticated call to a ServdCo cron endpoint. */
interface CronJob {
  name: string;
  /** Path relative to SITE_URL. Public URL is preserved exactly as today. */
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

const MAX_ATTEMPTS = 2; // initial attempt + 1 retry
const BASE_BACKOFF_MS = 500;
const REQUEST_TIMEOUT_MS = 25_000;

function version(env: Env): string {
  return env.WORKER_VERSION ?? WORKER_VERSION;
}

function log(record: Record<string, unknown>): void {
  // Structured single-line JSON — readable in `wrangler tail` and dashboard.
  console.log(JSON.stringify({ source: "servdco-cron", ...record }));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface JobResult {
  job: string;
  endpoint: string;
  attempts: number;
  ok: boolean;
  status: number | null;
  durationMs: number;
  failureReason?: string;
}

async function callEndpoint(env: Env, job: CronJob): Promise<JobResult> {
  const base = env.SITE_URL.replace(/\/$/, "");
  const endpoint = `${base}${job.path}`;
  const started = Date.now();
  let lastStatus: number | null = null;
  let lastReason: string | undefined;

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

      if (res.ok) {
        log({
          event: "job_success",
          version: version(env),
          job: job.name,
          endpoint,
          attempt,
          status: res.status,
          durationMs: Date.now() - attemptStarted,
        });
        return {
          job: job.name,
          endpoint,
          attempts: attempt,
          ok: true,
          status: res.status,
          durationMs: Date.now() - started,
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
        failureReason: lastReason,
      });
    } catch (err) {
      clearTimeout(timeout);
      lastReason = err instanceof Error ? err.message : "unknown error";
      log({
        event: "job_attempt_error",
        version: version(env),
        job: job.name,
        endpoint,
        attempt,
        durationMs: Date.now() - attemptStarted,
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
  };
}

async function runAllJobs(env: Env, trigger: string): Promise<JobResult[]> {
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
    return [];
  }

  const results: JobResult[] = [];
  for (const job of JOBS) {
    // Sequential: wait + log each before continuing. A failure never aborts.
    results.push(await callEndpoint(env, job));
  }

  const succeeded = results.filter((r) => r.ok).length;
  log({
    event: "run_complete",
    version: version(env),
    trigger,
    total: results.length,
    succeeded,
    failed: results.length - succeeded,
    durationMs: Date.now() - runStarted,
    results,
  });

  return results;
}

export default {
  /** Cloudflare Cron trigger entrypoint. */
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runAllJobs(env, `cron:${event.cron}`));
  },

  /**
   * Optional HTTP entrypoint.
   *   GET  /health          → worker status
   *   POST /run  (or GET)    → manually trigger all jobs (requires CRON_SECRET)
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
        worker: "servdco-cron",
        version: version(env),
        environment: env.SITE_URL?.includes("vercel.app") ? "staging-or-default" : "custom",
        siteUrl: env.SITE_URL ?? null,
        cronConfigured: true,
        jobs: JOBS.map((j) => j.path),
        timestamp: new Date().toISOString(),
      });
    }

    if (url.pathname === "/run") {
      // Manual trigger — protect with the same shared secret.
      const auth = request.headers.get("authorization");
      if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const results = await runAllJobs(env, "manual");
      const succeeded = results.filter((r) => r.ok).length;
      return Response.json({
        triggered: "manual",
        total: results.length,
        succeeded,
        failed: results.length - succeeded,
        results,
      });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
};
