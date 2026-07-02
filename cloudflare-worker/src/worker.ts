/**
 * ServdCo Cron Worker
 * ===================
 *
 * Pure scheduler — no business logic. Issues authenticated HTTP requests to
 * the existing ServdCo API on Vercel on a fixed schedule.
 *
 * Hardening:
 * - KV overlap lock (skip if a previous run is still in-flight)
 * - Per-run summary metrics parsed from API JSON responses
 * - /health exposes last run, failures, cron schedule
 * - Optional ALERT_WEBHOOK_URL after consecutive scheduled failures
 */

const WORKER_VERSION = "1.1.0";
const CRON_SCHEDULE = "*/15 * * * *";
const MAX_ATTEMPTS = 2;
const BASE_BACKOFF_MS = 500;
/** Align with Vercel maxDuration (30s) — leave 2s buffer. */
const REQUEST_TIMEOUT_MS = 28_000;
/** Skip new cron tick if a run lock is younger than this. */
const RUN_LOCK_TTL_SEC = 25 * 60;
const CONSECUTIVE_FAILURE_ALERT_THRESHOLD = 3;

const LOCK_KEY = "run_lock";
const STATE_KEY = "run_state";

interface Env {
  SITE_URL: string;
  CRON_SECRET: string;
  WORKER_VERSION?: string;
  /** ISO timestamp set at deploy time (optional). */
  DEPLOYED_AT?: string;
  /** Discord/Slack/generic webhook URL for repeated failure alerts. */
  ALERT_WEBHOOK_URL?: string;
  CRON_STATE: KVNamespace;
}

interface CronJob {
  name: string;
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

interface PersistedRunState {
  deployedAt: string;
  cronSchedule: string;
  lastSuccessfulRun: string | null;
  lastFailedRun: string | null;
  lastSummary: RunSummary | null;
  consecutiveFailures: number;
}

function version(env: Env): string {
  return env.WORKER_VERSION ?? WORKER_VERSION;
}

function log(record: Record<string, unknown>): void {
  console.log(JSON.stringify({ source: "servdco-cron", ts: new Date().toISOString(), ...record }));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadState(env: Env): Promise<PersistedRunState> {
  const raw = await env.CRON_STATE.get(STATE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as PersistedRunState;
    } catch {
      /* fall through */
    }
  }
  return {
    deployedAt: env.DEPLOYED_AT ?? new Date().toISOString(),
    cronSchedule: CRON_SCHEDULE,
    lastSuccessfulRun: null,
    lastFailedRun: null,
    lastSummary: null,
    consecutiveFailures: 0,
  };
}

async function saveState(env: Env, state: PersistedRunState): Promise<void> {
  await env.CRON_STATE.put(STATE_KEY, JSON.stringify(state));
}

async function tryAcquireRunLock(env: Env, trigger: string): Promise<boolean> {
  const existing = await env.CRON_STATE.get(LOCK_KEY);
  if (existing) {
    log({
      event: "run_skipped_overlap",
      version: version(env),
      trigger,
      reason: "Previous run lock still held — skipping to avoid concurrent reconciliation",
      lock: JSON.parse(existing),
    });
    return false;
  }

  await env.CRON_STATE.put(
    LOCK_KEY,
    JSON.stringify({ trigger, startedAt: new Date().toISOString() }),
    { expirationTtl: RUN_LOCK_TTL_SEC },
  );
  return true;
}

async function releaseRunLock(env: Env): Promise<void> {
  await env.CRON_STATE.delete(LOCK_KEY);
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

function buildRunSummary(
  trigger: string,
  runStarted: number,
  results: JobResult[],
): RunSummary {
  const payments = results.find((r) => r.job === "payments-reconcile-batch");
  const transfers = results.find((r) => r.job === "transfers-process");
  const subscriptions = results.find((r) => r.job === "subscription-reconcile-batch");

  const pm = payments?.metrics ?? {};
  const tm = transfers?.metrics ?? {};
  const sm = subscriptions?.metrics ?? {};

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

function num(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
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

async function sendFailureAlert(env: Env, state: PersistedRunState, summary: RunSummary): Promise<void> {
  if (!env.ALERT_WEBHOOK_URL) return;

  const text = [
    "⚠️ ServdCo Cron Worker — repeated failures",
    `Consecutive failed runs: ${state.consecutiveFailures}`,
    `Last run: ${summary.completedAt}`,
    `Jobs failed: ${summary.jobsFailed}/${summary.jobsTotal}`,
    `Payments repaired: ${summary.paymentsRepaired ?? "n/a"}`,
    `Transfers processed: ${summary.transfersProcessed ?? "n/a"}`,
    `Subscriptions repaired: ${summary.subscriptionsRepaired ?? "n/a"}`,
    `Site: ${env.SITE_URL}`,
  ].join("\n");

  try {
    await fetch(env.ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, text }),
    });
    log({ event: "alert_sent", consecutiveFailures: state.consecutiveFailures });
  } catch (err) {
    log({
      event: "alert_failed",
      message: err instanceof Error ? err.message : "unknown",
    });
  }
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

  const isScheduled = trigger.startsWith("cron:");
  if (isScheduled) {
    const acquired = await tryAcquireRunLock(env, trigger);
    if (!acquired) return [];
  }

  const results: JobResult[] = [];
  try {
    for (const job of JOBS) {
      results.push(await callEndpoint(env, job));
    }
  } finally {
    if (isScheduled) {
      await releaseRunLock(env);
    }
  }

  const summary = buildRunSummary(trigger, runStarted, results);
  const allOk = summary.jobsFailed === 0;

  log({
    event: "run_summary",
    version: version(env),
    ...summary,
    humanReadable: formatSummaryLine(summary),
  });

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

  const state = await loadState(env);
  state.lastSummary = summary;
  if (allOk) {
    state.lastSuccessfulRun = summary.completedAt;
    state.consecutiveFailures = 0;
  } else {
    state.lastFailedRun = summary.completedAt;
    if (isScheduled) {
      state.consecutiveFailures += 1;
      if (
        state.consecutiveFailures >= CONSECUTIVE_FAILURE_ALERT_THRESHOLD &&
        env.ALERT_WEBHOOK_URL
      ) {
        await sendFailureAlert(env, state, summary);
      }
    }
  }
  await saveState(env, state);

  return results;
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

export default {
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runAllJobs(env, `cron:${event.cron}`));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      const state = await loadState(env);
      const lockHeld = Boolean(await env.CRON_STATE.get(LOCK_KEY));
      return Response.json({
        status: "ok",
        worker: "servdco-cron",
        version: version(env),
        deployedAt: state.deployedAt,
        cronSchedule: state.cronSchedule,
        siteUrl: env.SITE_URL ?? null,
        cronConfigured: true,
        runLockHeld: lockHeld,
        lastSuccessfulRun: state.lastSuccessfulRun,
        lastFailedRun: state.lastFailedRun,
        consecutiveFailures: state.consecutiveFailures,
        lastSummary: state.lastSummary,
        jobs: JOBS.map((j) => j.path),
        alertWebhookConfigured: Boolean(env.ALERT_WEBHOOK_URL),
        timestamp: new Date().toISOString(),
      });
    }

    if (url.pathname === "/run") {
      const auth = request.headers.get("authorization");
      if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const results = await runAllJobs(env, "manual");
      const state = await loadState(env);
      return Response.json({
        triggered: "manual",
        summary: state.lastSummary,
        results,
      });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
};
