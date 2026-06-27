import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { requireAdmin, verifySupabaseUser } from "../auth.js";
import { deleteAuthUser } from "../supabase/authAdminRest.js";
import { sendUserError } from "../userErrors.js";

const bodySchema = z.object({
  userId: z.string().uuid(),
  confirmEmail: z.string().email(),
});

export async function handleAdminPermanentDelete(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  if (!token) {
    return sendUserError(res, 401, "AUTHORIZATION_DENIED");
  }

  const caller = await verifySupabaseUser(token);
  if (!caller?.id || !(await requireAdmin(caller.id))) {
    return sendUserError(res, 403, "AUTHORIZATION_DENIED");
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return sendUserError(res, 400, "VALIDATION_ERROR", {
      message: "Invalid permanent delete request.",
    });
  }

  const { userId, confirmEmail } = parsed.data;
  const admin = getServiceRoleClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return sendUserError(res, 404, "NOT_FOUND", {
      message: "User profile not found.",
    });
  }

  if (profile.email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
    return sendUserError(res, 400, "VALIDATION_ERROR", {
      message: "Confirmation email does not match this account.",
    });
  }

  if (profile.role === "admin") {
    return sendUserError(res, 403, "AUTHORIZATION_DENIED", {
      message: "Admin accounts cannot be permanently deleted via this action.",
    });
  }

  const { data: chefProfile } = await admin
    .from("chef_profiles")
    .select("id, stripe_account_ref")
    .eq("user_id", userId)
    .maybeSingle();

  if (chefProfile?.id) {
    await admin.from("chef_documents").delete().eq("chef_profile_id", chefProfile.id);
    await admin.from("chef_availability").delete().eq("chef_profile_id", chefProfile.id);
    await admin.from("chef_portfolio_images").delete().eq("chef_profile_id", chefProfile.id);
    await admin.from("chef_profiles").delete().eq("id", chefProfile.id);
  }

  if (chefProfile?.stripe_account_ref) {
    await admin.from("stripe_accounts").delete().eq("id", chefProfile.stripe_account_ref);
  }

  await admin.from("user_region_access").delete().eq("user_id", userId);
  await admin.from("notifications").delete().eq("user_id", userId);
  await admin.from("profiles").delete().eq("id", userId);

  const { error: authDeleteError } = await deleteAuthUser(userId);
  if (authDeleteError) {
    console.error("[admin.permanentDelete] auth:", authDeleteError);
    return sendUserError(res, 500, "SERVER_ERROR", {
      message: "Profile data removed but auth user deletion failed. Retry or contact support.",
    });
  }

  return res.status(200).json({ success: true });
}
