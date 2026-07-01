import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { json, readBearerToken } from "../http.js";
import { requireAdmin, verifySupabaseUser } from "../auth.js";
import { retryTransferById } from "../stripe/transfers.js";
import { apiLogger } from "../logger.js";

const retrySchema = z.object({
  transferId: z.string().uuid(),
});

export async function handleAdminTransferRetry(
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

  const parsed = retrySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    json(res, 400, { error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await retryTransferById(parsed.data.transferId, {
      adminUserId: user.id,
    });
    apiLogger.info("Admin transfer retry attempted", {
      route: "/api/admin/transfers-retry",
      adminUserId: user.id,
      transferId: parsed.data.transferId,
      success: result.success,
      reason: result.reason,
    });
    json(res, result.success ? 200 : 422, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Retry failed";
    json(res, 500, { error: message });
  }
}
