import { WaitlistSupabaseService } from "@/services/supabase/waitlist.service";
import { assertSupabaseConfigured } from "@/services/supabase/fallback";

export const WaitlistService = {
  async getStats(state: string) {
    assertSupabaseConfigured();
    return WaitlistSupabaseService.getStats(state);
  },

  async register(params: {
    name: string;
    email: string;
    role: "family" | "chef";
    state: string;
    city: string;
    zip: string;
    profileId?: string;
  }) {
    assertSupabaseConfigured();
    return WaitlistSupabaseService.register(params);
  },
};
