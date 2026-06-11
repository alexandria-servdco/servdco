import { usePlatformSettings } from "@/hooks/usePlatformSettings";

/** Loads platform economics from Supabase into the in-memory store on boot. */
export function PlatformSettingsHydrator() {
  usePlatformSettings();
  return null;
}
