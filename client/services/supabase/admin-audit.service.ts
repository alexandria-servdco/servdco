import { getSupabaseClient } from "@/lib/supabase/client";
import { toJson } from "@/lib/supabase/json";
import type { Database } from "@/lib/supabase/types";
import { SupabaseQueryError } from "./fallback";

type AuditLogInsert = Database["public"]["Tables"]["audit_logs"]["Insert"];

export type AdminAuditAction =
  | "chef.approved"
  | "chef.rejected"
  | "chef.suspended"
  | "document.approved"
  | "document.rejected"
  | "document.resubmit_requested"
  | "user.suspended"
  | "user.reactivated"
  | "user.deleted"
  | "booking.status_changed"
  | "refund.issued";

export const AdminAuditService = {
  async log(params: {
    action: AdminAuditAction | string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    oldValues?: Record<string, unknown>;
  }): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw new SupabaseQueryError(authError.message, authError);

    const actorId = authData.user?.id;
    if (!actorId) return;

    const { data: profile } = await client
      .from("profiles")
      .select("role")
      .eq("id", actorId)
      .maybeSingle();

    if (profile?.role !== "admin") return;

    const { error } = await client.from("audit_logs").insert({
      actor_id: actorId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      metadata: toJson(params.metadata ?? {}),
      new_values: params.newValues ? toJson(params.newValues) : null,
      old_values: params.oldValues ? toJson(params.oldValues) : null,
    } as AuditLogInsert);

    if (error) {
      console.error("Admin audit log failed:", error.message);
    }
  },

  async listRecent(limit = 50) {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new SupabaseQueryError(error.message, error);
    return data ?? [];
  },
};
