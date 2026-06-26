import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { enumToLegacyFlags } from "./launchControl.js";
import type { LaunchRegionStatus } from "./launchControl.js";
import { activateUsersInRegion } from "./userRegionAccess.js";

export type RegionLifecycleUpdate = {
  status?: LaunchRegionStatus;
  maintenance_mode?: boolean;
  maintenance_message?: string | null;
  pause_reason?: string | null;
  pause_until?: string | null;
  pause_banner_message?: string | null;
  allow_new_family_signup?: boolean;
  allow_new_cook_signup?: boolean;
  allow_bookings?: boolean;
  allow_payments?: boolean;
  allow_messages?: boolean;
  allow_reviews?: boolean;
  launch_date?: string | null;
  updated_by?: string | null;
};

export async function applyRegionLifecycleUpdate(
  regionId: string,
  updates: RegionLifecycleUpdate,
  actorId?: string | null,
): Promise<{ activatedUsers: number }> {
  const client = getServiceRoleClient();
  const now = new Date().toISOString();

  const payload: Record<string, unknown> = {
    ...updates,
    updated_at: now,
    updated_by: actorId ?? updates.updated_by ?? null,
  };

  if (updates.status) {
    const legacy = enumToLegacyFlags(updates.status);
    payload.is_active = legacy.is_active;
    payload.is_waitlist = legacy.is_waitlist;
    if (updates.status === "active" || updates.status === "internal_beta") {
      payload.launch_date = updates.launch_date ?? now;
    }
    if (updates.status === "paused") {
      payload.allow_bookings = false;
      payload.allow_payments = false;
    }
    if (updates.status === "maintenance") {
      payload.maintenance_mode = true;
    }
  }

  const { error } = await client
    .from("launch_regions")
    .update(payload)
    .eq("id", regionId);

  if (error) {
    throw new Error(error.message);
  }

  let activatedUsers = 0;
  if (
    updates.status === "active" ||
    updates.status === "internal_beta"
  ) {
    activatedUsers = await activateUsersInRegion(regionId);
  }

  if (actorId) {
    await client.from("audit_logs").insert({
      actor_id: actorId,
      action: `region.${updates.status ?? "updated"}`,
      entity_type: "launch_region",
      entity_id: regionId,
      new_values: payload,
      metadata: { activated_users: activatedUsers },
    });
  }

  return { activatedUsers };
}
