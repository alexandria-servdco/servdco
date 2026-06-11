import { ContactSupabaseService } from "@/services/supabase/contact.service";
import { assertSupabaseConfigured } from "@/services/supabase/fallback";

export const ContactService = {
  async listMessages() {
    assertSupabaseConfigured();
    return ContactSupabaseService.list();
  },

  async submit(params: { name: string; email: string; message: string }) {
    assertSupabaseConfigured();
    return ContactSupabaseService.submit(params);
  },

  async updateStatus(id: string, status: "new" | "read" | "archived") {
    assertSupabaseConfigured();
    return ContactSupabaseService.updateStatus(id, status);
  },
};
