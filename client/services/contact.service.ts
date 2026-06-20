import { ContactSupabaseService } from "@/services/supabase/contact.service";
import { assertSupabaseConfigured } from "@/services/supabase/fallback";

export const ContactService = {
  async listMessages() {
    assertSupabaseConfigured();
    return ContactSupabaseService.list();
  },

  async submitViaApi(params: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    return ContactSupabaseService.submitViaApi(params);
  },

  async submit(params: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    return ContactSupabaseService.submitViaApi(params);
  },

  async updateStatus(id: string, status: "new" | "read" | "archived") {
    assertSupabaseConfigured();
    return ContactSupabaseService.updateStatus(id, status);
  },
};
