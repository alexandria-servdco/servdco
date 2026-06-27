import { useCallback, useEffect, useMemo, useState } from "react";
import { BrandSelect } from "@/components/ui/BrandSelect";
import { US_STATES, resolveStateCode } from "@/lib/us-locations";
import { citiesAvailableForState, findCityByZip } from "@/lib/zip-codes-by-city";
import { GeoZipService } from "@/services/supabase/geo-zip.service";
import { cn } from "@/lib/utils";

type StateCitySelectProps = {
  state: string;
  city: string;
  zip?: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  stateError?: string;
  cityError?: string;
  className?: string;
};

const CITY_PATTERN = /^[\p{L}\s.'-]+$/u;

export function isReasonableCityName(city: string): boolean {
  const trimmed = city.trim();
  return trimmed.length >= 2 && trimmed.length <= 120 && CITY_PATTERN.test(trimmed);
}

export function StateCitySelect({
  state,
  city,
  zip = "",
  onStateChange,
  onCityChange,
  stateError,
  cityError,
  className,
}: StateCitySelectProps) {
  const stateCode = resolveStateCode(state) ?? "";
  const [cityQuery, setCityQuery] = useState(city);
  const [remoteCities, setRemoteCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    setCityQuery(city);
  }, [city]);

  const stateOptions = useMemo(
    () => US_STATES.map((s) => ({ value: s.name, label: s.name })),
    [],
  );

  const bundledCities = useMemo(() => {
    if (!stateCode) return [];
    return citiesAvailableForState(stateCode);
  }, [stateCode]);

  const loadCitySuggestions = useCallback(
    async (query: string) => {
      if (!stateCode) {
        setRemoteCities([]);
        return;
      }

      setLoadingCities(true);
      try {
        const results = await GeoZipService.searchCities(stateCode, query, 80);
        const names = results.map((r) => r.cityName);
        setRemoteCities(names);
      } catch {
        setRemoteCities([]);
      } finally {
        setLoadingCities(false);
      }
    },
    [stateCode],
  );

  useEffect(() => {
    if (!stateCode) return;
    const timer = window.setTimeout(() => {
      void loadCitySuggestions(cityQuery.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [stateCode, cityQuery, loadCitySuggestions]);

  useEffect(() => {
    const normalizedZip = zip.replace(/\D/g, "").slice(0, 5);
    if (!stateCode || normalizedZip.length !== 5 || city.trim()) return;

    let cancelled = false;
    void (async () => {
      const matches = await GeoZipService.lookupCityByZip(stateCode, normalizedZip);
      if (cancelled || matches.length === 0) {
        const fallback = findCityByZip(stateCode, normalizedZip);
        if (!cancelled && fallback) onCityChange(fallback);
        return;
      }
      if (!cancelled) onCityChange(matches[0].cityName);
    })();

    return () => {
      cancelled = true;
    };
  }, [stateCode, zip, city, onCityChange]);

  const suggestionList = useMemo(() => {
    const merged = new Map<string, string>();
    for (const name of [...remoteCities, ...bundledCities]) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      merged.set(trimmed.toLowerCase(), trimmed);
    }
    const q = cityQuery.trim().toLowerCase();
    const all = [...merged.values()].sort((a, b) => a.localeCompare(b));
    if (!q) return all.slice(0, 80);
    return all
      .filter((name) => name.toLowerCase().includes(q))
      .slice(0, 80);
  }, [remoteCities, bundledCities, cityQuery]);

  const handleStateChange = (nextState: string) => {
    setCityQuery("");
    setRemoteCities([]);
    onStateChange(nextState);
    onCityChange("");
  };

  const listId = `city-suggestions-${stateCode || "state"}`;

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
        <label
          htmlFor="signup-city"
          className="block text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider"
        >
          City
        </label>
        <input
          id="signup-city"
          list={listId}
          value={cityQuery}
          onChange={(e) => {
            const next = e.target.value;
            setCityQuery(next);
            onCityChange(next);
          }}
          onBlur={() => {
            const trimmed = cityQuery.trim();
            if (trimmed !== cityQuery) {
              setCityQuery(trimmed);
              onCityChange(trimmed);
            }
          }}
          placeholder={
            stateCode
              ? "Search or type your city"
              : "Choose state first"
          }
          disabled={!stateCode}
          autoComplete="address-level2"
          className={cn(
            "flex h-10 w-full rounded-xl border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white",
            "placeholder:text-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-[#FF7A59]/40",
            !stateCode && "opacity-60 cursor-not-allowed",
          )}
        />
        <datalist id={listId}>
          {suggestionList.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <p className="text-[10px] text-[#6B6B6B] leading-snug">
          {loadingCities
            ? "Loading cities…"
            : "Pick from suggestions or type your city — availability is verified from your ZIP."}
        </p>
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
  if (!isReasonableCityName(city)) {
    return "Enter a valid city name (letters, spaces, hyphens).";
  }
  if (!/^\d{5}(-\d{4})?$/.test(zip.trim())) {
    return "Enter a valid 5-digit ZIP code.";
  }
  return null;
}
