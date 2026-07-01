import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { json, readBearerToken } from "../http.js";
import { requireAdmin, verifySupabaseUser } from "../auth.js";
import {
  getConnectAccountDiagnostics,
  syncConnectAccountByChefProfileId,
} from "../stripe/connect.js";
import { apiLogger } from "../logger.js";
import { writeAdminAuditLog } from "../stripe/ledger.js";

const diagnosticsSchema = z.object({
  chefProfileId: z.string().uuid(),
});

export async function handleAdminStripeConnectDiagnostics(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
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

  const parsed = diagnosticsSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    json(res, 400, { error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const diagnostics = await getConnectAccountDiagnostics(
    parsed.data.chefProfileId,
  );

  json(res, 200, diagnostics as unknown as Record<string, unknown>);
}

export async function handleAdminStripeConnectSync(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
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

  const parsed = diagnosticsSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    json(res, 400, { error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await syncConnectAccountByChefProfileId(
      parsed.data.chefProfileId,
    );
    apiLogger.info("Admin triggered Stripe Connect sync", {
      route: "/api/admin/stripe-connect-sync",
      adminUserId: user.id,
      chefProfileId: parsed.data.chefProfileId,
      rowsUpdated: result.rowsUpdated,
    });
    await writeAdminAuditLog({
      action: "admin.stripe_connect.sync",
      adminUserId: user.id,
      entityType: "stripe_accounts",
      entityId: parsed.data.chefProfileId,
      result: "success",
      metadata: {
        stripe_account_id: result.stripeAccountId,
        payouts_enabled: result.payouts_enabled,
        rows_updated: result.rowsUpdated,
      },
    });
    json(res, 200, {
      ...result,
      last_synced_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    await writeAdminAuditLog({
      action: "admin.stripe_connect.sync",
      adminUserId: user.id,
      entityType: "stripe_accounts",
      entityId: parsed.data.chefProfileId,
      result: "failed",
      metadata: { error: message },
    });
    json(res, 500, { error: message });
  }
}
