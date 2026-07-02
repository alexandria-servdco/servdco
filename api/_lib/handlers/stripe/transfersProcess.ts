import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed, readBearerToken } from "../../http.js";
import { isAuthorizedCronRequest } from "../../cronAuth.js";
import { verifySupabaseUser, requireAdmin } from "../../auth.js";
import { isStripeCheckoutEnabled } from "../../stripe/featureFlag.js";
import { apiLogger } from "../../logger.js";

/**
 * GET|POST /api/stripe/transfers/process — transfer + tip retry processor.
 *
 * Auth (in order):
 * 1. Cron — GET or POST with `Authorization: Bearer CRON_SECRET`
 * 2. Admin — POST with Supabase JWT
 *
 * Batch always returns HTTP 200 when auth succeeds — per-transfer failures are
 * recoverable and reported in `results` with structured Stripe diagnostics.
 */
export async function handleTransfersProcess(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "GET" && req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  if (!(await isStripeCheckoutEnabled())) {
    json(res, 503, { error: "Stripe checkout is disabled." });
    return;
  }

  const isCron = isAuthorizedCronRequest(req);

  if (!isCron) {
    if (req.method === "GET") {
      json(res, 401, { error: "Unauthorized cron request." });
      return;
    }
    const token = readBearerToken(req);
    if (!token) {
      json(res, 401, { error: "Unauthorized" });
      return;
    }
    const user = await verifySupabaseUser(token);
    if (!user || !(await requireAdmin(user.id))) {
      json(res, 403, { error: "Admin required." });
      return;
    }
  }

  const started = Date.now();

  let processEligibleTransfers: typeof import("../../stripe/transfers.js").processEligibleTransfers;
  let processPendingTipTransfers: typeof import("../../stripe/tips.js").processPendingTipTransfers;
  let isDevelopmentRuntime: typeof import("../../stripe/transferDiagnostics.js").isDevelopmentRuntime;

  try {
    ({ processEligibleTransfers } = await import("../../stripe/transfers.js"));
    ({ processPendingTipTransfers } = await import("../../stripe/tips.js"));
    ({ isDevelopmentRuntime } = await import("../../stripe/transferDiagnostics.js"));
  } catch (err) {
    const reason =
      err instanceof Error ? err.message : "Transfer module load failed";
    apiLogger.error("Transfer batch module import failed", {
      route: "/api/stripe/transfers/process",
      reason,
      cron: isCron,
    });
    json(res, 200, {
      ok: false,
      processed: 0,
      failed: 0,
      skipped: 0,
      results: [],
      batchError: {
        reason,
        recoveryAction: "action_required",
        stack:
          err instanceof Error && process.env.NODE_ENV === "development"
            ? err.stack
            : undefined,
      },
      tips: { retried: 0, succeeded: 0 },
      durationMs: Date.now() - started,
    });
    return;
  }

  const transfers = await processEligibleTransfers();

  let tips: { retried: number; succeeded: number; error?: string } = {
    retried: 0,
    succeeded: 0,
  };

  try {
    tips = await processPendingTipTransfers();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Tip transfer batch failed";
    apiLogger.error("Tip transfer batch failed (non-fatal)", {
      message,
      cron: isCron,
    });
    tips = { retried: 0, succeeded: 0, error: message };
  }

  const durationMs = Date.now() - started;
  const ok =
    !transfers.batchError &&
    transfers.results.every(
      (row) =>
        row.success ||
        row.recoveryAction === "skipped" ||
        row.recoveryAction === "retry_scheduled" ||
        row.recoveryAction === "action_required" ||
        row.recoveryAction === "cancelled",
    );

  apiLogger.info("Transfer batch processed", {
    route: "/api/stripe/transfers/process",
    method: req.method,
    cron: isCron,
    ok,
    processed: transfers.processed,
    failed: transfers.failed,
    skipped: transfers.skipped,
    resultCount: transfers.results.length,
    tipsRetried: tips.retried,
    tipsSucceeded: tips.succeeded,
    durationMs,
    batchError: transfers.batchError?.reason ?? null,
  });

  json(res, 200, {
    ok,
    processed: transfers.processed,
    failed: transfers.failed,
    skipped: transfers.skipped,
    results: transfers.results.map((row) => ({
      transferId: row.transferId,
      bookingId: row.bookingId,
      chefProfileId: row.chefProfileId,
      stripeAccountId: row.stripeAccountId,
      stripeTransferId: row.stripeTransferId,
      amountCents: row.amountCents,
      success: row.success,
      recoveryAction: row.recoveryAction,
      reason: row.reason ?? null,
      retryCount: row.retryCount ?? null,
      durationMs: row.durationMs,
      stripe: row.stripe
        ? {
            code: row.stripe.code,
            type: row.stripe.type,
            message: row.stripe.message,
            requestId: row.stripe.requestId,
          }
        : null,
      ...(isDevelopmentRuntime() && row.stack ? { stack: row.stack } : {}),
    })),
    batchError: transfers.batchError ?? null,
    tips,
    durationMs,
  });
}
