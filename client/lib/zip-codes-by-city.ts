/**
 * @deprecated Runtime lookups use GeoZipService. Kept for offline fallback in dev.
 */
import { mergeUniqueZips } from "@shared/geoZip";
import { ZIP_CODES_BY_CITY } from "./zip-codes-by-city-data";

export function findCityByZip(stateCode: string, zip: string): string | null {
  const state = ZIP_CODES_BY_CITY[stateCode.toUpperCase()];
  if (!state) return null;
  const normalizedZip = zip.trim().slice(0, 5);
  for (const [city, zips] of Object.entries(state)) {
    if (zips.includes(normalizedZip)) return city;
  }
  return null;
}

export function getZipsForCity(stateCode: string, city: string): string[] {
  const state = ZIP_CODES_BY_CITY[stateCode.toUpperCase()];
  if (!state) return [];
  const normalized = city.trim().replace(/\s+/g, " ");
  const exact = state[normalized];
  if (exact) return [...exact];
  const match = Object.entries(state).find(
    ([name]) => name.toLowerCase() === normalized.toLowerCase(),
  );
  return match ? [...match[1]] : [];
}

export function mergeZipsForCities(stateCode: string, cities: string[]): string[] {
  const zips: string[] = [];
  for (const city of cities) {
    zips.push(...getZipsForCity(stateCode, city));
  }
  return mergeUniqueZips([], zips);
}

export function citiesAvailableForState(stateCode: string): string[] {
  const state = ZIP_CODES_BY_CITY[stateCode.toUpperCase()];
  if (!state) return [];
  return Object.keys(state).sort((a, b) => a.localeCompare(b));
}
