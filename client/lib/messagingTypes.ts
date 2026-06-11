/** In-app messaging types (conversations + messages). */

export type MessageStatus = "sent" | "delivered" | "read";

export interface UiMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  status: MessageStatus;
  created_at: string;
  read_at: string | null;
  is_own: boolean;
}

export interface UiConversation {
  id: string;
  booking_id: string | null;
  family_id: string;
  chef_profile_id: string;
  last_message_at: string | null;
  created_at: string;
  /** Display name for the other participant */
  participant_name: string;
  last_message_preview: string | null;
  unread_count: number;
}

export interface SendMessageInput {
  conversationId: string;
  body: string;
}

export interface MessagesPage {
  messages: UiMessage[];
  hasMore: boolean;
  nextCursor: string | null;
}
