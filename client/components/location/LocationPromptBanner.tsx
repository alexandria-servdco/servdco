import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentPosition } from "@/lib/location/geolocation";
import { LocationApi } from "@/lib/location/locationApi";
import { useQueryClient } from "@tanstack/react-query";
import { profileQueryKeys } from "@/services/supabase/profiles.service";
import { toast } from "sonner";

const DISMISS_KEY = "servdco_location_prompt_dismissed";

type Props = {
  userId: string;
};

export function LocationPromptBanner({ userId }: Props) {
  const queryClient = useQueryClient();
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(`${DISMISS_KEY}:${userId}`) === "1";
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(false);

  if (hidden) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(`${DISMISS_KEY}:${userId}`, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  const useLocation = async () => {
    setLoading(true);
    try {
      const position = await getCurrentPosition();
      const resolved = await LocationApi.reverseGeocode(
        position.coords.latitude,
        position.coords.longitude,
      );
      await LocationApi.saveLocation({
        state: resolved.state,
        city: resolved.city,
        zip: resolved.zip,
        country: resolved.country,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        locationSource: "gps",
      });
      await queryClient.invalidateQueries({ queryKey: profileQueryKeys.all });
      toast.success("Location saved.");
      dismiss();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not detect location.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="bg-gradient-to-r from-[#2E7D66]/10 to-[#FF7A59]/10 border-b border-[#2E7D66]/20 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      role="region"
      aria-label="Improve location matching"
    >
      <div className="flex items-start gap-3 min-w-0">
        <MapPin className="w-5 h-5 text-[#2E7D66] shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="text-sm font-bold text-white">
            Help us improve nearby cook matching
          </p>
          <p className="text-xs text-[#A8A8A8] mt-0.5">
            Share your location once to improve recommendations. You can change it anytime in settings.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
        <Button
          type="button"
          size="sm"
          className="bg-[#2E7D66] hover:bg-[#256b58] flex-1 sm:flex-none min-h-[44px] touch-target"
          onClick={() => void useLocation()}
          disabled={loading}
        >
          {loading ? "Detecting…" : "Use Current Location"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-[#A8A8A8] min-h-[44px] touch-target"
          onClick={dismiss}
        >
          Skip
        </Button>
        <button
          type="button"
          className="p-2 text-[#A8A8A8] hover:text-white sm:hidden"
          onClick={dismiss}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export function shouldShowLocationPrompt(profile: {
  state?: string | null;
  city?: string | null;
  zip?: string | null;
} | null): boolean {
  if (!profile) return false;
  const hasCore = Boolean(profile.state?.trim() && profile.city?.trim() && profile.zip?.trim());
  return !hasCore;
}
