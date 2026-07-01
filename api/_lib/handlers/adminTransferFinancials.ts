import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, readBearerToken } from "../http.js";
import { requireAdmin, verifySupabaseUser } from "../auth.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { getStripe } from "../stripe/server.js";
import { apiLogger } from "../logger.js";

export interface TransferFinancialSummary {
  pendingTransfers: { count: number; totalCents: number };
  retryScheduled: { count: number; totalCents: number };
  failedTransfers: { count: number; totalCents: number };
  actionRequired: { count: number; totalCents: number };
  completedToday: { count: number; totalCents: number };
  platformBalance: { availableCents: number; pendingCents: number; currency: string };
  outstandingLiabilityCents: number;
  generatedAt: string;
}

function sumNetCents(
  rows: { net_amount_cents: number }[] | null | undefined,
): number {
  return (rows ?? []).reduce((sum, row) => sum + row.net_amount_cents, 0);
}

export async function getTransferFinancialSummary(): Promise<TransferFinancialSummary> {
  const client = getServiceRoleClient();
  const stripe = getStripe();
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startIso = startOfDay.toISOString();
  const endIso = now.toISOString();

  const [
    pendingRes,
    retryRes,
    failedRes,
    actionRes,
    completedTodayRes,
    liabilityRes,
  ] = await Promise.all([
    client
      .from("transfers")
      .select("net_amount_cents")
      .in("status", ["pending", "scheduled"]),
    client
      .from("transfers")
      .select("net_amount_cents")
      .eq("status", "retry_scheduled"),
    client
      .from("transfers")
      .select("net_amount_cents")
      .eq("status", "failed")
      .is("next_retry_at", null),
    client
      .from("transfers")
      .select("net_amount_cents")
      .eq("status", "action_required"),
    client
      .from("transfers")
      .select("net_amount_cents")
      .eq("status", "paid")
      .gte("transferred_at", startIso)
      .lte("transferred_at", endIso),
    client
      .from("transfers")
      .select("net_amount_cents")
      .in("status", [
        "pending",
        "scheduled",
        "processing",
        "failed",
        "retry_scheduled",
        "action_required",
      ]),
  ]);

  for (const res of [
    pendingRes,
    retryRes,
    failedRes,
    actionRes,
    completedTodayRes,
    liabilityRes,
  ]) {
    if (res.error) throw res.error;
  }

  let availableCents = 0;
  let pendingCents = 0;
  let currency = "usd";

  try {
    const balance = await stripe.balance.retrieve();
    const available = balance.available.find((b) => b.currency === "usd");
    const pending = balance.pending.find((b) => b.currency === "usd");
    availableCents = available?.amount ?? 0;
    pendingCents = pending?.amount ?? 0;
    currency = available?.currency ?? pending?.currency ?? "usd";
  } catch (err) {
    apiLogger.warn("Unable to retrieve Stripe platform balance", {
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return {
    pendingTransfers: {
      count: pendingRes.data?.length ?? 0,
      totalCents: sumNetCents(pendingRes.data),
    },
    retryScheduled: {
      count: retryRes.data?.length ?? 0,
      totalCents: sumNetCents(retryRes.data),
    },
    failedTransfers: {
      count: failedRes.data?.length ?? 0,
      totalCents: sumNetCents(failedRes.data),
    },
    actionRequired: {
      count: actionRes.data?.length ?? 0,
      totalCents: sumNetCents(actionRes.data),
    },
    completedToday: {
      count: completedTodayRes.data?.length ?? 0,
      totalCents: sumNetCents(completedTodayRes.data),
    },
    platformBalance: {
      availableCents,
      pendingCents,
      currency,
    },
    outstandingLiabilityCents: sumNetCents(liabilityRes.data),
    generatedAt: now.toISOString(),
  };
}

export async function handleAdminTransferFinancials(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "GET") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  const token = readBearerToken(req);
  if (!token) {
    json(res, 401, { error: "Unauthorized" });
    return;
  }

  const user = await verifySupabaseUser(token);
  if (!user || !(await requireAdmin(user.id))) {
    json(res, 403, { error: "Admin required" });
    return;
  }

  const summary = await getTransferFinancialSummary();
  json(res, 200, summary as unknown as Record<string, unknown>);
}
