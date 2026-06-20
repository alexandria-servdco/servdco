import { useMemo } from "react";
import { BrandSelect } from "@/components/ui/BrandSelect";
import { US_STATES, citiesForState, isValidCityForState } from "@/lib/us-locations";
import { cn } from "@/lib/utils";

type StateCitySelectProps = {
  state: string;
  city: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  stateError?: string;
  cityError?: string;
  className?: string;
};

export function StateCitySelect({
  state,
  city,
  onStateChange,
  onCityChange,
  stateError,
  cityError,
  className,
}: StateCitySelectProps) {
  const stateOptions = useMemo(
    () => US_STATES.map((s) => ({ value: s.name, label: s.name })),
    [],
  );

  const cityOptions = useMemo(() => {
    const cities = citiesForState(state);
    return cities.map((c) => ({ value: c, label: c }));
  }, [state]);

  const handleStateChange = (nextState: string) => {
    onStateChange(nextState);
    const cities = citiesForState(nextState);
    if (city && !cities.some((c) => c.toLowerCase() === city.toLowerCase())) {
      onCityChange("");
    }
  };

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", className)}>
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">
          State
        </label>
        <BrandSelect
          value={state}
          onValueChange={handleStateChange}
          options={stateOptions}
          placeholder="Select state"
        />
        {stateError && (
          <p className="text-[10px] text-red-400 font-medium">{stateError}</p>
        )}
      </div>
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">
          City
        </label>
        <BrandSelect
          value={city}
          onValueChange={onCityChange}
          options={cityOptions}
          placeholder={cityOptions.length ? "Select city" : "Choose state first"}
          disabled={cityOptions.length === 0}
        />
        {cityError && (
          <p className="text-[10px] text-red-400 font-medium">{cityError}</p>
        )}
      </div>
    </div>
  );
}

export function validateStateCityZip(
  state: string,
  city: string,
  zip: string,
): string | null {
  if (!state.trim()) return "Please select a state.";
  if (!city.trim()) return "Please select a city.";
  if (!isValidCityForState(city, state)) {
    return "City is not valid for the selected state.";
  }
  if (!/^\d{5}(-\d{4})?$/.test(zip.trim())) {
    return "Enter a valid 5-digit ZIP code.";
  }
  return null;
}
