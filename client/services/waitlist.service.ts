import { WaitlistSupabaseService } from "@/services/supabase/waitlist.service";
import { SecurityApi } from "@/lib/securityApi";
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
    turnstileToken?: string | null;
  }) {
    if (params.profileId) {
      assertSupabaseConfigured();
      return WaitlistSupabaseService.register(params);
    }

    return SecurityApi.submitWaitlist({
      turnstileToken: params.turnstileToken,
      name: params.name,
      email: params.email,
      role: params.role,
      state: params.state,
      city: params.city,
      zip: params.zip,
    });
  },
};
