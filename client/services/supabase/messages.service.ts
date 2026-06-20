import { getSupabaseClient } from "@/lib/supabase/client";
import type { MessagesPage, UiMessage } from "@/lib/messagingTypes";
import { messageBodySchema, formatZodError } from "@shared/validation";
import { sanitizePlainText } from "@/lib/sanitize";
import { SupabaseQueryError } from "./fallback";

const PAGE_SIZE = 30;

export const messageQueryKeys = {
  all: ["messages"] as const,
  list: (conversationId: string) =>
    [...messageQueryKeys.all, "list", conversationId] as const,
};

function mapMessageRow(
  row: {
    id: string;
    conversation_id: string;
    sender_id: string;
    body: string;
    status: string;
    created_at: string;
    read_at: string | null;
  },
  currentUserId: string,
): UiMessage {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    body: row.body,
    status: row.status as UiMessage["status"],
    created_at: row.created_at,
    read_at: row.read_at,
    is_own: row.sender_id === currentUserId,
  };
}

export const MessagesSupabaseService = {
  async listMessages(
    conversationId: string,
    cursor?: string | null,
  ): Promise<MessagesPage> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw new SupabaseQueryError(authError.message, authError);
    const userId = authData.user?.id;
    if (!userId) throw new SupabaseQueryError("Authentication required");

    let query = client
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data, error } = await query;
    if (error) throw new SupabaseQueryError(error.message, error);

    const rows = data ?? [];
    const hasMore = rows.length > PAGE_SIZE;
    const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    return {
      messages: pageRows
        .map((row) => mapMessageRow(row, userId))
        .reverse(),
      hasMore,
      nextCursor: hasMore
        ? (pageRows[pageRows.length - 1]?.created_at ?? null)
        : null,
    };
  },

  async sendMessage(conversationId: string, body: string): Promise<UiMessage> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const parsed = messageBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new SupabaseQueryError(formatZodError(parsed.error));
    }
    const trimmed = sanitizePlainText(parsed.data);

    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw new SupabaseQueryError(authError.message, authError);
    const userId = authData.user?.id;
    if (!userId) throw new SupabaseQueryError("Authentication required");

    const now = new Date().toISOString();
    const { data, error } = await client
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        body: trimmed,
        status: "sent",
        metadata: {},
        created_at: now,
      })
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);
    return mapMessageRow(data, userId);
  },

  async markConversationRead(conversationId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw new SupabaseQueryError(authError.message, authError);
    const userId = authData.user?.id;
    if (!userId) return;

    const now = new Date().toISOString();
    const { error } = await client
      .from("messages")
      .update({ read_at: now, status: "read" })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .is("read_at", null)
      .is("deleted_at", null);

    if (error) throw new SupabaseQueryError(error.message, error);
  },

  /** Optional typing indicator via Realtime broadcast — never blocks send. */
  async broadcastTyping(conversationId: string, isTyping: boolean): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const { data: authData } = await client.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) return;

    const channel = client.channel(`typing:${conversationId}:${userId}`);

    try {
      await Promise.race([
        new Promise<void>((resolve) => {
          channel.subscribe((status) => {
            if (
              status === "SUBSCRIBED" ||
              status === "CHANNEL_ERROR" ||
              status === "TIMED_OUT" ||
              status === "CLOSED"
            ) {
              resolve();
            }
          });
        }),
        new Promise<void>((resolve) => {
          setTimeout(resolve, 1500);
        }),
      ]);

      await channel.send({
        type: "broadcast",
        event: "typing",
        payload: { user_id: userId, is_typing: isTyping },
      });
    } catch {
      // Typing is best-effort only
    } finally {
      client.removeChannel(channel);
    }
  },
};
