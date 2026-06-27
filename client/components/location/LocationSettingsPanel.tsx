import { useEffect, useState } from "react";
import { MapPin, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/location/LocationPicker";
import { LocationApi } from "@/lib/location/locationApi";
import type { LocationFormValue, ServiceRadiusMiles } from "@shared/location";
import { SERVICE_RADIUS_OPTIONS } from "@shared/location";
import { BrandSelect } from "@/components/ui/BrandSelect";
import { useQueryClient } from "@tanstack/react-query";
import { profileQueryKeys } from "@/services/supabase/profiles.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  initial: LocationFormValue;
  role: "family" | "chef";
  serviceRadiusMiles?: ServiceRadiusMiles | null;
  className?: string;
};

export function LocationSettingsPanel({
  initial,
  role,
  serviceRadiusMiles: initialRadius = null,
  className,
}: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState<LocationFormValue>(initial);
  const [radius, setRadius] = useState<ServiceRadiusMiles | null>(initialRadius);

  useEffect(() => {
    setValue(initial);
    setRadius(initialRadius ?? null);
  }, [initial, initialRadius]);

  const hasLocation = Boolean(value.state && value.city && value.zip);

  const save = async () => {
    if (!/^\d{5}$/.test(value.zip)) {
      toast.error("Enter a valid 5-digit ZIP code.");
      return;
    }
    setSaving(true);
    try {
      await LocationApi.saveLocation({
        state: value.state,
        city: value.city,
        zip: value.zip,
        country: value.country,
        latitude: value.latitude,
        longitude: value.longitude,
        locationSource: value.locationSource === "gps" ? "gps" : "manual",
        serviceRadiusMiles: role === "chef" ? radius : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: profileQueryKeys.all });
      toast.success("Location updated.");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save location.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={cn(
        "velvet-card p-6 space-y-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
            <MapPin size={18} className="text-[#FF7A59]" />
            Location Settings
          </h3>
          <p className="text-xs text-[#A8A8A8] mt-1">
            Used for launch access and future nearby cook matching.
          </p>
        </div>
        {!editing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/10 shrink-0"
            onClick={() => setEditing(true)}
          >
            <Pencil size={14} className="mr-1.5" />
            Edit
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#A8A8A8]">
            Current location
          </p>
          {hasLocation ? (
            <>
              <p className="text-sm font-semibold text-white">
                {value.city}, {value.state}
              </p>
              <p className="text-xs text-[#A8A8A8]">{value.zip}</p>
              {value.locationSource === "gps" && (
                <p className="text-[10px] text-[#2E7D66] mt-1">GPS verified</p>
              )}
            </>
          ) : (
            <p className="text-sm text-[#A8A8A8]">No location saved yet.</p>
          )}
          {role === "chef" && radius && (
            <p className="text-[11px] text-[#A8A8A8] pt-2">
              Service radius: {radius} miles
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <LocationPicker
            value={value}
            onChange={setValue}
            showHeading={false}
            compact
          />

          {role === "chef" && (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-[#FF7A59] uppercase tracking-wider">
                Service radius (optional)
              </label>
              <BrandSelect
                value={radius ? String(radius) : "none"}
                onValueChange={(v) =>
                  setRadius(v === "none" ? null : (Number(v) as ServiceRadiusMiles))
                }
                placeholder="Select radius"
                options={[
                  { value: "none", label: "Not set" },
                  ...SERVICE_RADIUS_OPTIONS.map((m) => ({
                    value: String(m),
                    label: `${m} miles`,
                  })),
                ]}
              />
              <p className="text-[10px] text-[#A8A8A8]">
                For future discovery features — not used for bookings yet.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              className="bg-[#FF7A59] hover:bg-[#e96a49]"
              onClick={() => void save()}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-white/10"
              onClick={() => {
                setValue(initial);
                setRadius(initialRadius ?? null);
                setEditing(false);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
