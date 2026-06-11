import { getSupabaseClient } from "@/lib/supabase/client";
import type { ContactMessage } from "@/lib/launchOpsTypes";
import { SupabaseQueryError } from "./fallback";

export const contactQueryKeys = {
  all: ["contact_messages"] as const,
  list: () => [...contactQueryKeys.all, "list"] as const,
};

export const ContactSupabaseService = {
  async list(): Promise<ContactMessage[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.full_name,
      email: row.email,
      message: row.message,
      status: row.status,
      created_at: row.created_at,
    }));
  },

  async submit(params: {
    name: string;
    email: string;
    message: string;
  }): Promise<{ success: boolean; message: string }> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { error } = await client.from("contact_messages").insert({
      full_name: params.name,
      email: params.email,
      message: params.message,
      status: "new",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw new SupabaseQueryError(error.message, error);
    return {
      success: true,
      message: "Thank you for reaching out. Our team will respond within 24 hours.",
    };
  },

  async updateStatus(
    id: string,
    status: "new" | "read" | "archived",
  ): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData } = await client.auth.getUser();
    const { error } = await client
      .from("contact_messages")
      .update({
        status,
        handled_by: authData.user?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new SupabaseQueryError(error.message, error);
  },
};
