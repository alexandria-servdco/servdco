import type { PlatformSettingsValues } from "@/lib/launchOpsTypes";
import { PlatformSettingsSupabaseService } from "@/services/supabase/platform-settings.service";
import { assertSupabaseConfigured } from "@/services/supabase/fallback";

export const PlatformSettingsService = {
  async getPublicSettings(): Promise<PlatformSettingsValues> {
    assertSupabaseConfigured();
    return PlatformSettingsSupabaseService.getPublicSettings();
  },

  async update(updates: Partial<PlatformSettingsValues>) {
    assertSupabaseConfigured();
    return PlatformSettingsSupabaseService.updateSettings(updates);
  },
};
