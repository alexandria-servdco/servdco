import { useCallback, useMemo, useState, useTransition, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, MapPin, Plus, Loader2, AlertCircle } from "lucide-react";
import { resolveStateCode } from "@/lib/us-locations";
import {
  formatCommaList,
  mergeUniqueZips,
  normalizeCityName,
  parseCommaList,
  sanitizeZipInput,
} from "@shared/geoZip";
import { GeoZipService } from "@/services/supabase/geo-zip.service";
import {
  citiesAvailableForState,
  getZipsForCity,
  mergeZipsForCities,
} from "@/lib/zip-codes-by-city";

export type RegionCityZipEditorProps = {
  stateCode: string;
  cities: string;
  zipCodes: string;
  onCitiesChange: (cities: string) => void;
  onZipCodesChange: (zipCodes: string) => void;
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function RegionCityZipEditor({
  stateCode,
  cities,
  zipCodes,
  onCitiesChange,
  onZipCodesChange,
}: RegionCityZipEditorProps) {
  const [search, setSearch] = useState("");
  const [pendingCity, setPendingCity] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const debouncedSearch = useDebouncedValue(search, 250);
  const code = resolveStateCode(stateCode) ?? stateCode.toUpperCase().slice(0, 2);
  const isZipSearch = /^\d{5}$/.test(debouncedSearch.trim());

  const selectedCities = useMemo(() => parseCommaList(cities), [cities]);
  const selectedZips = useMemo(() => parseCommaList(zipCodes), [zipCodes]);

  const citySearchQuery = useQuery({
    queryKey: ["geo-cities", code, debouncedSearch, isZipSearch],
    queryFn: () =>
      isZipSearch
        ? GeoZipService.lookupCityByZip(code, debouncedSearch.trim())
        : GeoZipService.searchCities(code, debouncedSearch, 50),
    staleTime: 60_000,
    retry: 1,
  });

  const dbCities = citySearchQuery.data ?? [];
  const useStaticFallback =
    citySearchQuery.isError ||
    (citySearchQuery.isSuccess && dbCities.length === 0 && !debouncedSearch);

  const filteredCities = useMemo(() => {
    if (!useStaticFallback && dbCities.length > 0) {
      return dbCities.map((c) => ({
        name: c.cityName,
        zipCount: c.zipCount,
      }));
    }
    const staticList = citiesAvailableForState(code);
    const q = debouncedSearch.trim().toLowerCase();
    const list = q
      ? staticList.filter((c) => c.toLowerCase().includes(q))
      : staticList;
    return list.slice(0, 50).map((name) => ({
      name,
      zipCount: getZipsForCity(code, name).length,
    }));
  }, [useStaticFallback, dbCities, code, debouncedSearch]);

  const resolveZipsForCity = useCallback(
    async (city: string): Promise<string[]> => {
      const fromDb = await GeoZipService.getZipsForCities(code, [city]);
      if (fromDb.length > 0) return fromDb;
      return getZipsForCity(code, city);
    },
    [code],
  );

  useEffect(() => {
    if (selectedCities.length === 0 || selectedZips.length > 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const fromDb = await GeoZipService.getZipsForCities(code, selectedCities);
        const zips =
          fromDb.length > 0 ? fromDb : mergeZipsForCities(code, selectedCities);
        if (!cancelled && zips.length > 0) {
          onZipCodesChange(formatCommaList(zips));
        }
      } catch {
        const fallback = mergeZipsForCities(code, selectedCities);
        if (!cancelled && fallback.length > 0) {
          onZipCodesChange(formatCommaList(fallback));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, selectedCities, selectedZips.length, onZipCodesChange]);

  const addCity = (city: string) => {
    const normalized = normalizeCityName(city);
    if (
      selectedCities.some((c) => c.toLowerCase() === normalized.toLowerCase())
    ) {
      setActionError(`${normalized} is already in this region.`);
      return;
    }

    setActionError(null);
    setPendingCity(normalized);
    const nextCities = [...selectedCities, normalized];
    onCitiesChange(formatCommaList(nextCities));

    startTransition(() => {
      void (async () => {
        try {
          const newZips = await resolveZipsForCity(normalized);
          const currentZips = parseCommaList(zipCodes);
          onZipCodesChange(
            formatCommaList(mergeUniqueZips(currentZips, newZips)),
          );
        } catch {
          setActionError(`Could not load ZIP codes for ${normalized}.`);
        } finally {
          setPendingCity(null);
        }
      })();
    });
  };

  const removeCity = (city: string) => {
    setActionError(null);
    const nextCities = selectedCities.filter(
      (c) => c.toLowerCase() !== city.toLowerCase(),
    );
    onCitiesChange(formatCommaList(nextCities));

    startTransition(() => {
      void (async () => {
        try {
          const zipsFromDb = await GeoZipService.zipsForRemainingCities(
            code,
            nextCities,
          );
          const zips =
            zipsFromDb.length > 0
              ? zipsFromDb
              : mergeZipsForCities(code, nextCities);
          onZipCodesChange(formatCommaList(zips));
        } catch {
          onZipCodesChange(formatCommaList(mergeZipsForCities(code, nextCities)));
        }
      })();
    });
  };

  const removeZip = (zip: string) => {
    onZipCodesChange(
      formatCommaList(selectedZips.filter((z) => z !== zip)),
    );
  };

  const handleZipManualEdit = (value: string) => {
    onZipCodesChange(sanitizeZipInput(value));
  };

  const isLoadingCities = citySearchQuery.isLoading && !useStaticFallback;

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="region-city-search"
          className="block text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider mb-2"
        >
          Add cities (auto-expands ZIP codes)
        </label>
        <div className="relative mb-2">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A8A8]"
            aria-hidden="true"
          />
          <input
            id="region-city-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cities or enter a 5-digit ZIP…"
            className="w-full pl-9 pr-3 py-2.5 bg-[#111111] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59] focus-visible:ring-2 focus-visible:ring-[#FF7A59]/40"
            aria-label="Search cities"
            aria-describedby="region-city-search-hint"
          />
        </div>
        <p id="region-city-search-hint" className="text-[10px] text-[#A8A8A8] mb-2">
          {useStaticFallback && !citySearchQuery.isLoading
            ? "Using offline city list — apply geo migration for full database search."
            : "Fuzzy search powered by production ZIP dataset."}
        </p>

        {actionError && (
          <div
            className="flex items-center gap-2 text-xs text-amber-400 mb-2"
            role="alert"
          >
            <AlertCircle size={14} aria-hidden="true" />
            {actionError}
          </div>
        )}

        <div
          className="max-h-36 overflow-y-auto border border-white/10 rounded-xl bg-[#111111] divide-y divide-white/5"
          role="listbox"
          aria-label="City search results"
        >
          {isLoadingCities ? (
            <p className="text-xs text-[#A8A8A8] p-3 flex items-center gap-2" role="status">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              Searching cities…
            </p>
          ) : filteredCities.length === 0 ? (
            <p className="text-xs text-[#A8A8A8] p-3">No cities match your search.</p>
          ) : (
            filteredCities.map(({ name, zipCount }) => {
              const isSelected = selectedCities.some(
                (c) => c.toLowerCase() === name.toLowerCase(),
              );
              const isAdding = pendingCity?.toLowerCase() === name.toLowerCase();
              return (
                <button
                  key={name}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={isSelected || isAdding || isPending}
                  onClick={() => addCity(name)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:bg-white/10"
                >
                  <span className="flex items-center gap-2 text-white font-medium">
                    <MapPin size={12} className="text-[#FF7A59]" aria-hidden="true" />
                    {name}
                  </span>
                  <span className="text-[#A8A8A8]">
                    {isAdding ? (
                      <Loader2 size={12} className="inline animate-spin" />
                    ) : zipCount > 0 ? (
                      `${zipCount} ZIPs`
                    ) : (
                      "No ZIP data"
                    )}
                    {!isSelected && !isAdding && (
                      <Plus size={12} className="inline ml-1" aria-hidden="true" />
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {selectedCities.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider mb-2">
            Selected cities ({selectedCities.length})
          </p>
          <div className="flex flex-wrap gap-2" role="list" aria-label="Selected cities">
            {selectedCities.map((city) => (
              <span
                key={city}
                role="listitem"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF7A59]/10 border border-[#FF7A59]/20 text-[11px] font-semibold text-[#FF7A59]"
              >
                {city}
                <button
                  type="button"
                  onClick={() => removeCity(city)}
                  className="hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                  aria-label={`Remove ${city}`}
                  disabled={isPending}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="region-zip-codes"
          className="block text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider mb-2"
        >
          ZIP codes covered ({selectedZips.length})
        </label>
        <textarea
          id="region-zip-codes"
          value={zipCodes}
          onChange={(e) => handleZipManualEdit(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 bg-[#111111] border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#FF7A59] focus-visible:ring-2 focus-visible:ring-[#FF7A59]/40 resize-y min-h-[72px]"
          placeholder="Auto-populated when you add cities. You can edit manually."
          aria-label="ZIP codes covered"
        />
        {selectedZips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 max-h-24 overflow-y-auto">
            {selectedZips.slice(0, 40).map((zip) => (
              <button
                key={zip}
                type="button"
                onClick={() => removeZip(zip)}
                className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#A8A8A8] hover:bg-white/10 font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A59]"
                aria-label={`Remove ZIP ${zip}`}
              >
                {zip} ×
              </button>
            ))}
            {selectedZips.length > 40 && (
              <span className="text-[10px] text-[#A8A8A8]">
                +{selectedZips.length - 40} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
