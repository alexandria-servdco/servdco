import { useMemo, useState } from "react";
import { Search, X, MapPin, Plus } from "lucide-react";
import { citiesForState } from "@/lib/us-locations";
import {
  citiesAvailableForState,
  formatCommaList,
  getZipsForCity,
  mergeUniqueZips,
  mergeZipsForCities,
  normalizeCityName,
  parseCommaList,
} from "@/lib/zip-codes-by-city";
import { resolveStateCode } from "@/lib/us-locations";

export type RegionCityZipEditorProps = {
  stateCode: string;
  cities: string;
  zipCodes: string;
  onCitiesChange: (cities: string) => void;
  onZipCodesChange: (zipCodes: string) => void;
};

export function RegionCityZipEditor({
  stateCode,
  cities,
  zipCodes,
  onCitiesChange,
  onZipCodesChange,
}: RegionCityZipEditorProps) {
  const [search, setSearch] = useState("");
  const code = resolveStateCode(stateCode) ?? stateCode.toUpperCase();

  const selectedCities = useMemo(() => parseCommaList(cities), [cities]);
  const selectedZips = useMemo(() => parseCommaList(zipCodes), [zipCodes]);

  const availableCities = useMemo(() => {
    const fromDataset = citiesAvailableForState(code);
    const fromStateList = citiesForState(code);
    const set = new Set<string>([...fromDataset, ...fromStateList]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [code]);

  const filteredCities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableCities;
    return availableCities.filter((c) => c.toLowerCase().includes(q));
  }, [availableCities, search]);

  const addCity = (city: string) => {
    const normalized = normalizeCityName(city);
    if (selectedCities.some((c) => c.toLowerCase() === normalized.toLowerCase())) {
      return;
    }
    const nextCities = [...selectedCities, normalized];
    const newZips = getZipsForCity(code, normalized);
    onCitiesChange(formatCommaList(nextCities));
    onZipCodesChange(formatCommaList(mergeUniqueZips(selectedZips, newZips)));
  };

  const removeCity = (city: string) => {
    const nextCities = selectedCities.filter(
      (c) => c.toLowerCase() !== city.toLowerCase(),
    );
    const zipsFromRemaining = mergeZipsForCities(code, nextCities);
    onCitiesChange(formatCommaList(nextCities));
    onZipCodesChange(formatCommaList(zipsFromRemaining));
  };

  const removeZip = (zip: string) => {
    onZipCodesChange(
      formatCommaList(selectedZips.filter((z) => z !== zip)),
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider mb-2">
          Add cities (auto-expands ZIP codes)
        </label>
        <div className="relative mb-2">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A8A8]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cities in this state…"
            className="w-full pl-9 pr-3 py-2.5 bg-[#111111] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]"
            aria-label="Search cities"
          />
        </div>
        <div className="max-h-32 overflow-y-auto border border-white/10 rounded-xl bg-[#111111] divide-y divide-white/5">
          {filteredCities.length === 0 ? (
            <p className="text-xs text-[#A8A8A8] p-3">No cities match your search.</p>
          ) : (
            filteredCities.slice(0, 50).map((city) => {
              const isSelected = selectedCities.some(
                (c) => c.toLowerCase() === city.toLowerCase(),
              );
              const zipCount = getZipsForCity(code, city).length;
              return (
                <button
                  key={city}
                  type="button"
                  disabled={isSelected}
                  onClick={() => addCity(city)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2 text-white font-medium">
                    <MapPin size={12} className="text-[#FF7A59]" />
                    {city}
                  </span>
                  <span className="text-[#A8A8A8]">
                    {zipCount > 0 ? `${zipCount} ZIPs` : "No ZIP data"}
                    {!isSelected && <Plus size={12} className="inline ml-1" />}
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
          <div className="flex flex-wrap gap-2">
            {selectedCities.map((city) => (
              <span
                key={city}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF7A59]/10 border border-[#FF7A59]/20 text-[11px] font-semibold text-[#FF7A59]"
              >
                {city}
                <button
                  type="button"
                  onClick={() => removeCity(city)}
                  className="hover:text-white"
                  aria-label={`Remove ${city}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider mb-2">
          ZIP codes covered ({selectedZips.length})
        </label>
        <textarea
          value={zipCodes}
          onChange={(e) => onZipCodesChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 bg-[#111111] border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#FF7A59] resize-y min-h-[72px]"
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
                className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#A8A8A8] hover:bg-white/10 font-mono"
                title="Click to remove"
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
