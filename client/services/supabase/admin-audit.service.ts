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
    const page = await this.listPage({ page: 1, pageSize: limit });
    return page.rows;
  },

  async listPage(params: {
    page: number;
    pageSize: number;
    search?: string;
    action?: string;
    sortAscending?: boolean;
  }) {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const page = Math.max(1, params.page);
    const pageSize = Math.max(1, params.pageSize);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const search = params.search?.trim();

    let query = client
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: params.sortAscending ?? false });

    if (params.action && params.action !== "all") {
      query = query.eq("action", params.action);
    }

    if (search) {
      query = query.or(
        `action.ilike.%${search}%,entity_type.ilike.%${search}%,entity_id.ilike.%${search}%`,
      );
    }

    const { data, error, count } = await query.range(from, to);

    if (error) throw new SupabaseQueryError(error.message, error);

    return {
      rows: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    };
  },
};
