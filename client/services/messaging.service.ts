import { isMessagingEnabled } from "@/services/featureFlags.service";
import { ConversationsSupabaseService } from "@/services/supabase/conversations.service";
import { MessagesSupabaseService } from "@/services/supabase/messages.service";

async function assertEnabled(): Promise<void> {
  const enabled = await isMessagingEnabled();
  if (!enabled) {
    throw new Error("Messaging is disabled.");
  }
}

export const MessagingService = {
  isEnabled: isMessagingEnabled,

  async listConversations() {
    await assertEnabled();
    return ConversationsSupabaseService.listForCurrentUser();
  },

  async getConversation(conversationId: string) {
    await assertEnabled();
    return ConversationsSupabaseService.getById(conversationId);
  },

  async openBookingConversation(bookingId: string) {
    await assertEnabled();
    return ConversationsSupabaseService.getOrCreateForBooking(bookingId);
  },

  async listMessages(conversationId: string, cursor?: string | null) {
    await assertEnabled();
    return MessagesSupabaseService.listMessages(conversationId, cursor);
  },

  async sendMessage(conversationId: string, body: string) {
    await assertEnabled();
    return MessagesSupabaseService.sendMessage(conversationId, body);
  },

  async markRead(conversationId: string) {
    await assertEnabled();
    return MessagesSupabaseService.markConversationRead(conversationId);
  },

  async getUnreadTotal() {
    await assertEnabled();
    return ConversationsSupabaseService.getTotalUnreadCount();
  },

  async listAdminConversations() {
    await assertEnabled();
    return ConversationsSupabaseService.listAllForAdmin();
  },

  async getConversationForAdmin(conversationId: string) {
    await assertEnabled();
    return ConversationsSupabaseService.getByIdForAdmin(conversationId);
  },
};
