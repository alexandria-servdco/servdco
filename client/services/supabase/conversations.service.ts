import { getSupabaseClient } from "@/lib/supabase/client";
import type { UiConversation } from "@/lib/messagingTypes";
import { SupabaseQueryError } from "./fallback";

export const conversationQueryKeys = {
  all: ["conversations"] as const,
  list: () => [...conversationQueryKeys.all, "list"] as const,
  adminList: () => [...conversationQueryKeys.all, "admin", "list"] as const,
  detail: (id: string) => [...conversationQueryKeys.all, "detail", id] as const,
  adminDetail: (id: string) =>
    [...conversationQueryKeys.all, "admin", "detail", id] as const,
  byBooking: (bookingId: string) =>
    [...conversationQueryKeys.all, "booking", bookingId] as const,
};

async function resolveParticipantNames(
  familyIds: string[],
  chefProfileIds: string[],
): Promise<{
  families: Map<string, string>;
  chefs: Map<string, { name: string; userId: string }>;
}> {
  const client = getSupabaseClient();
  const families = new Map<string, string>();
  const chefs = new Map<string, { name: string; userId: string }>();
  if (!client) return { families, chefs };

  if (familyIds.length > 0) {
    const { data } = await client
      .from("profiles")
      .select("id, full_name, email")
      .in("id", familyIds);
    for (const row of data ?? []) {
      families.set(row.id, row.full_name ?? row.email);
    }
  }

  if (chefProfileIds.length > 0) {
    const { data } = await client
      .from("chef_profiles")
      .select("id, display_name, user_id")
      .in("id", chefProfileIds);
    for (const row of data ?? []) {
      chefs.set(row.id, {
        name: row.display_name ?? "Cook",
        userId: row.user_id,
      });
    }
  }

  return { families, chefs };
}

async function resolveUnreadCounts(
  conversationIds: string[],
  userId: string,
): Promise<Map<string, number>> {
  const client = getSupabaseClient();
  const map = new Map<string, number>();
  if (!client || conversationIds.length === 0) return map;

  const { data, error } = await client
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", conversationIds)
    .neq("sender_id", userId)
    .is("read_at", null)
    .is("deleted_at", null);

  if (error) throw new SupabaseQueryError(error.message, error);

  for (const row of data ?? []) {
    map.set(row.conversation_id, (map.get(row.conversation_id) ?? 0) + 1);
  }
  return map;
}

async function resolveLastPreviews(
  conversationIds: string[],
): Promise<Map<string, string>> {
  const client = getSupabaseClient();
  const map = new Map<string, string>();
  if (!client || conversationIds.length === 0) return map;

  for (const convId of conversationIds) {
    const { data } = await client
      .from("messages")
      .select("body")
      .eq("conversation_id", convId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.body) map.set(convId, data.body);
  }
  return map;
}

function mapConversationRow(
  row: {
    id: string;
    booking_id: string | null;
    family_id: string;
    chef_profile_id: string;
    last_message_at: string | null;
    created_at: string;
  },
  currentUserId: string,
  names: Awaited<ReturnType<typeof resolveParticipantNames>>,
  unread: Map<string, number>,
  previews: Map<string, string>,
): UiConversation {
  const isFamily = row.family_id === currentUserId;
  const chef = names.chefs.get(row.chef_profile_id);
  const participantName = isFamily
    ? (chef?.name ?? "Cook")
    : (names.families.get(row.family_id) ?? "Family");

  return {
    id: row.id,
    booking_id: row.booking_id,
    family_id: row.family_id,
    chef_profile_id: row.chef_profile_id,
    last_message_at: row.last_message_at,
    created_at: row.created_at,
    participant_name: participantName,
    last_message_preview: previews.get(row.id) ?? null,
    unread_count: unread.get(row.id) ?? 0,
  };
}

async function verifyBookingParticipant(
  bookingId: string,
  userId: string,
): Promise<{
  family_id: string;
  chef_profile_id: string;
}> {
  const client = getSupabaseClient();
  if (!client) throw new SupabaseQueryError("Supabase client unavailable");

  const { data: booking, error } = await client
    .from("bookings")
    .select("id, family_id, chef_profile_id, status")
    .eq("id", bookingId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new SupabaseQueryError(error.message, error);
  if (!booking) throw new SupabaseQueryError("Booking not found.");
  if (booking.status === "cancelled") {
    throw new SupabaseQueryError("Messaging is not available for cancelled bookings.");
  }

  const isFamily = booking.family_id === userId;

  let isChef = false;
  if (!isFamily) {
    const { data: chefProfile } = await client
      .from("chef_profiles")
      .select("id")
      .eq("user_id", userId)
      .eq("id", booking.chef_profile_id)
      .maybeSingle();
    isChef = Boolean(chefProfile);
  }

  if (!isFamily && !isChef) {
    throw new SupabaseQueryError("You are not a participant on this booking.");
  }

  return {
    family_id: booking.family_id,
    chef_profile_id: booking.chef_profile_id,
  };
}

export const ConversationsSupabaseService = {
  async listForCurrentUser(): Promise<UiConversation[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw new SupabaseQueryError(authError.message, authError);
    const userId = authData.user?.id;
    if (!userId) return [];

    const { data: chefProfiles } = await client
      .from("chef_profiles")
      .select("id")
      .eq("user_id", userId);

    const chefIds = (chefProfiles ?? []).map((c) => c.id);

    let query = client
      .from("conversations")
      .select("*")
      .is("archived_at", null)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (chefIds.length > 0) {
      query = query.or(
        `family_id.eq.${userId},chef_profile_id.in.(${chefIds.join(",")})`,
      );
    } else {
      query = query.eq("family_id", userId);
    }

    const { data, error } = await query;
    if (error) throw new SupabaseQueryError(error.message, error);

    const rows = data ?? [];
    const convIds = rows.map((r) => r.id);
    const [names, unread, previews] = await Promise.all([
      resolveParticipantNames(
        [...new Set(rows.map((r) => r.family_id))],
        [...new Set(rows.map((r) => r.chef_profile_id))],
      ),
      resolveUnreadCounts(convIds, userId),
      resolveLastPreviews(convIds),
    ]);

    return rows.map((row) =>
      mapConversationRow(row, userId, names, unread, previews),
    );
  },

  async getById(conversationId: string): Promise<UiConversation | null> {
    const list = await this.listForCurrentUser();
    return list.find((c) => c.id === conversationId) ?? null;
  },

  async getByBookingId(bookingId: string): Promise<UiConversation | null> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("conversations")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (error) throw new SupabaseQueryError(error.message, error);
    if (!data) return null;

    const conv = await this.getById(data.id);
    return conv;
  },

  /** Creates conversation only when booking links family ↔ chef (RLS + service check). */
  async getOrCreateForBooking(bookingId: string): Promise<UiConversation> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw new SupabaseQueryError(authError.message, authError);
    const userId = authData.user?.id;
    if (!userId) throw new SupabaseQueryError("Authentication required");

    const existing = await this.getByBookingId(bookingId);
    if (existing) return existing;

    const participants = await verifyBookingParticipant(bookingId, userId);

    const now = new Date().toISOString();
    const { data, error } = await client
      .from("conversations")
      .insert({
        booking_id: bookingId,
        family_id: participants.family_id,
        chef_profile_id: participants.chef_profile_id,
        created_at: now,
      })
      .select("*")
      .single();

    if (error) {
      if (error.message.includes("duplicate")) {
        const retry = await this.getByBookingId(bookingId);
        if (retry) return retry;
      }
      throw new SupabaseQueryError(error.message, error);
    }

    const conv = await this.getById(data.id);
    if (!conv) throw new SupabaseQueryError("Conversation created but not readable.");
    return conv;
  },

  async getTotalUnreadCount(): Promise<number> {
    const list = await this.listForCurrentUser();
    return list.reduce((sum, c) => sum + c.unread_count, 0);
  },

  /** Admin moderation — all non-archived conversations (RLS: messaging_admin_all). */
  async listAllForAdmin(): Promise<UiConversation[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("conversations")
      .select("*")
      .is("archived_at", null)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) throw new SupabaseQueryError(error.message, error);

    const rows = data ?? [];
    const convIds = rows.map((r) => r.id);
    const [names, previews] = await Promise.all([
      resolveParticipantNames(
        [...new Set(rows.map((r) => r.family_id))],
        [...new Set(rows.map((r) => r.chef_profile_id))],
      ),
      resolveLastPreviews(convIds),
    ]);

    return rows.map((row) => {
      const familyName = names.families.get(row.family_id) ?? "Family";
      const chefName = names.chefs.get(row.chef_profile_id)?.name ?? "Cook";
      return {
        id: row.id,
        booking_id: row.booking_id,
        family_id: row.family_id,
        chef_profile_id: row.chef_profile_id,
        last_message_at: row.last_message_at,
        created_at: row.created_at,
        participant_name: `${familyName} ↔ ${chefName}`,
        last_message_preview: previews.get(row.id) ?? null,
        unread_count: 0,
      };
    });
  },

  async getByIdForAdmin(conversationId: string): Promise<UiConversation | null> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle();

    if (error) throw new SupabaseQueryError(error.message, error);
    if (!data) return null;

    const [names, previews] = await Promise.all([
      resolveParticipantNames([data.family_id], [data.chef_profile_id]),
      resolveLastPreviews([data.id]),
    ]);

    const familyName = names.families.get(data.family_id) ?? "Family";
    const chefName = names.chefs.get(data.chef_profile_id)?.name ?? "Cook";

    return {
      id: data.id,
      booking_id: data.booking_id,
      family_id: data.family_id,
      chef_profile_id: data.chef_profile_id,
      last_message_at: data.last_message_at,
      created_at: data.created_at,
      participant_name: `${familyName} ↔ ${chefName}`,
      last_message_preview: previews.get(data.id) ?? null,
      unread_count: 0,
    };
  },
};
