import { getSupabaseClient } from "@/lib/supabase/client";
import { SupabaseQueryError } from "./fallback";

export interface MessageAttachment {
  id: string;
  message_id: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  public_url?: string;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export const MessageAttachmentsSupabaseService = {
  async uploadForMessage(
    messageId: string,
    file: File,
  ): Promise<MessageAttachment> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    if (!ALLOWED_TYPES.has(file.type)) {
      throw new SupabaseQueryError("Only JPEG, PNG, WebP, and PDF files are allowed.");
    }
    if (file.size > MAX_BYTES) {
      throw new SupabaseQueryError("File must be 10 MB or smaller.");
    }

    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw new SupabaseQueryError(authError.message, authError);
    const userId = authData.user?.id;
    if (!userId) throw new SupabaseQueryError("Authentication required");

    const ext = file.name.split(".").pop() ?? "bin";
    const storagePath = `${userId}/${messageId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await client.storage
      .from("message-attachments")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) throw new SupabaseQueryError(uploadError.message);

    const { data, error } = await client
      .from("message_attachments")
      .insert({
        message_id: messageId,
        storage_bucket: "message-attachments",
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
      })
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);

    const { data: signed } = await client.storage
      .from("message-attachments")
      .createSignedUrl(storagePath, 3600);

    return {
      ...(data as MessageAttachment),
      public_url: signed?.signedUrl,
    };
  },

  async listForMessage(messageId: string): Promise<MessageAttachment[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("message_attachments")
      .select("*")
      .eq("message_id", messageId);

    if (error) throw new SupabaseQueryError(error.message, error);

    const rows = (data ?? []) as MessageAttachment[];
    const withUrls: MessageAttachment[] = [];

    for (const row of rows) {
      const { data: signed } = await client.storage
        .from(row.storage_bucket)
        .createSignedUrl(row.storage_path, 3600);
      withUrls.push({ ...row, public_url: signed?.signedUrl });
    }

    return withUrls;
  },

  async softDeleteMessage(messageId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const now = new Date().toISOString();
    const { error } = await client
      .from("messages")
      .update({ deleted_at: now, body: "[Message removed by moderator]" })
      .eq("id", messageId);

    if (error) throw new SupabaseQueryError(error.message, error);
  },
};
