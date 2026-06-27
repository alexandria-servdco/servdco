import { useCallback, useId, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/FormInput";
import { StateCitySelect } from "@/components/ui/StateCitySelect";
import { GeolocationError, getCurrentPosition, isGeolocationSupported } from "@/lib/location/geolocation";
import { LocationApi } from "@/lib/location/locationApi";
import type { LocationFormValue } from "@shared/location";
import { cn } from "@/lib/utils";

type LocationPickerProps = {
  value: LocationFormValue;
  onChange: (value: LocationFormValue) => void;
  stateError?: string;
  cityError?: string;
  zipError?: string;
  className?: string;
  showHeading?: boolean;
  compact?: boolean;
};

export function LocationPicker({
  value,
  onChange,
  stateError,
  cityError,
  zipError,
  className,
  showHeading = true,
  compact = false,
}: LocationPickerProps) {
  const headingId = useId();
  const [detecting, setDetecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"info" | "error">("info");

  const markManual = useCallback(
    (patch: Partial<LocationFormValue>) => {
      onChange({
        ...value,
        ...patch,
        locationSource: "manual",
        latitude: patch.latitude !== undefined ? patch.latitude : null,
        longitude: patch.longitude !== undefined ? patch.longitude : null,
      });
    },
    [onChange, value],
  );

  const detectLocation = async () => {
    setDetecting(true);
    setStatusMessage(null);
    try {
      if (!isGeolocationSupported()) {
        throw new GeolocationError(
          "unsupported",
          "Your browser does not support location detection.",
        );
      }

      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      const resolved = await LocationApi.reverseGeocode(latitude, longitude);

      onChange({
        state: resolved.state,
        city: resolved.city,
        zip: resolved.zip,
        country: resolved.country,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        locationSource: "gps",
      });

      setStatusTone("info");
      setStatusMessage(
        `Detected ${resolved.city}, ${resolved.state} ${resolved.zip}. You can edit before continuing.`,
      );
    } catch (err) {
      setStatusTone("error");
      if (err instanceof GeolocationError) {
        setStatusMessage(err.message);
      } else if (err instanceof Error) {
        setStatusMessage(err.message);
      } else {
        setStatusMessage("Could not detect location. Enter your address manually.");
      }
    } finally {
      setDetecting(false);
    }
  };

  return (
    <section
      className={cn("space-y-4", className)}
      aria-labelledby={showHeading ? headingId : undefined}
    >
      {showHeading && (
        <div className="space-y-1">
          <h3 id={headingId} className="text-sm font-bold text-white font-serif">
            Where are you located?
          </h3>
          <p className="text-[11px] text-[#A8A8A8]">
            We use your location for launch availability and nearby cook matching.
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full border-[#FF7A59]/30 text-[#FF7A59] hover:bg-[#FF7A59]/10 min-h-[44px] touch-target",
          compact && "text-xs",
        )}
        onClick={() => void detectLocation()}
        disabled={detecting}
        aria-busy={detecting}
      >
        {detecting ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden />
        ) : (
          <MapPin className="w-4 h-4 mr-2" aria-hidden />
        )}
        {detecting ? "Detecting location…" : "Use My Current Location"}
      </Button>

      {statusMessage && (
        <p
          role="status"
          className={cn(
            "text-[11px] leading-relaxed px-1",
            statusTone === "error" ? "text-amber-300" : "text-[#A8A8A8]",
          )}
        >
          {statusMessage}
        </p>
      )}

      <div className="relative flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8A8A8]">
          Or enter manually
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <FormInput
        type="text"
        label="ZIP Code"
        id="location-zip"
        inputMode="numeric"
        autoComplete="postal-code"
        value={value.zip}
        onChange={(e) =>
          markManual({
            zip: e.target.value.replace(/\D/g, "").slice(0, 5),
          })
        }
        icon={<MapPin size={16} />}
        required
        error={
          zipError ||
          (value.zip && !/^\d{5}$/.test(value.zip)
            ? "Enter a valid 5-digit ZIP code."
            : undefined)
        }
      />

      <StateCitySelect
        state={value.state}
        city={value.city}
        zip={value.zip}
        onStateChange={(state) => markManual({ state, city: "" })}
        onCityChange={(city) => markManual({ city })}
        stateError={stateError}
        cityError={cityError}
      />
    </section>
  );
}
