import { getSupabaseClient } from "@/lib/supabase/client";
import { toJson } from "@/lib/supabase/json";
import type { Database, Tables } from "@/lib/supabase/types";
import { SupabaseQueryError } from "./fallback";
import { getSessionUserId } from "@/lib/supabase/sessionUser";

type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];

export type NotificationRow = Tables<"notifications">;

export interface UiNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  created_at: string;
}

export const notificationQueryKeys = {
  all: ["notifications"] as const,
  own: () => [...notificationQueryKeys.all, "own"] as const,
};

function mapNotificationRow(row: NotificationRow): UiNotification {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type,
    read: row.read,
    created_at: row.created_at,
  };
}

export const NotificationsSupabaseService = {
  async listOwn(): Promise<UiNotification[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const userId = await getSessionUserId(client);
    if (!userId) return [];

    const { data, error } = await client
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);
    return (data ?? []).map(mapNotificationRow);
  },

  async markRead(id: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { error } = await client
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new SupabaseQueryError(error.message, error);
  },

  async listAdminRecent(limit = 30): Promise<UiNotification[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new SupabaseQueryError(error.message, error);
    return (data ?? []).map(mapNotificationRow);
  },

  async createForUser(params: {
    userId: string;
    title: string;
    message: string;
    type: UiNotification["type"];
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { error } = await client.from("notifications").insert({
      user_id: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      metadata: toJson(params.metadata ?? {}),
    } as NotificationInsert);

    if (error) throw new SupabaseQueryError(error.message, error);
  },

  async markAllRead(): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const userId = await getSessionUserId(client);
    if (!userId) return;

    const { error } = await client
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw new SupabaseQueryError(error.message, error);
  },
};
