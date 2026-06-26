import { getSupabaseClient } from "@/lib/supabase/client";
import { assertSupabaseConfigured } from "@/services/supabase/fallback";
import {
  formatCommaList,
  mergeUniqueZips,
  normalizeCityName,
  parseCommaList,
} from "@shared/geoZip";

export type GeoCitySearchResult = {
  cityName: string;
  zipCount: number;
};

export const GeoZipService = {
  async lookupCityByZip(stateCode: string, zip: string): Promise<GeoCitySearchResult[]> {
    assertSupabaseConfigured();
    const client = getSupabaseClient();
    const code = stateCode.trim().toUpperCase().slice(0, 2);
    const normalizedZip = zip.trim().slice(0, 5);
    if (!/^\d{5}$/.test(normalizedZip)) return [];

    if (client) {
      const { data, error } = await client
        .from("geo_city_zip_codes")
        .select("city_name")
        .eq("state_code", code)
        .eq("zip_code", normalizedZip)
        .limit(5);

      if (!error && data && data.length > 0) {
        const unique = [...new Set(data.map((r) => r.city_name))];
        return unique.map((cityName) => ({ cityName, zipCount: 1 }));
      }
    }

    const { findCityByZip } = await import("@/lib/zip-codes-by-city");
    const city = findCityByZip(code, normalizedZip);
    return city ? [{ cityName: city, zipCount: 1 }] : [];
  },

  async searchCities(
    stateCode: string,
    query: string,
    limit = 50,
  ): Promise<GeoCitySearchResult[]> {
    assertSupabaseConfigured();
    const client = getSupabaseClient();
    if (!client) return [];

    const code = stateCode.trim().toUpperCase().slice(0, 2);
    const { data, error } = await client.rpc("search_geo_cities", {
      p_state_code: code,
      p_query: query.trim(),
      p_limit: limit,
    });

    if (error) {
      console.warn("[GeoZipService.searchCities]", error.message);
      return [];
    }

    return (data ?? []).map((row) => ({
      cityName: row.city_name,
      zipCount: Number(row.zip_count),
    }));
  },

  async getZipsForCities(stateCode: string, cities: string[]): Promise<string[]> {
    assertSupabaseConfigured();
    const client = getSupabaseClient();
    if (!client || cities.length === 0) return [];

    const code = stateCode.trim().toUpperCase().slice(0, 2);
    const normalized = cities.map((c) => normalizeCityName(c));

    const { data, error } = await client.rpc("geo_zips_for_cities", {
      p_state_code: code,
      p_cities: normalized,
    });

    if (error) {
      console.warn("[GeoZipService.getZipsForCities]", error.message);
      return [];
    }

    return Array.isArray(data) ? (data as string[]) : [];
  },

  async getZipCountForCity(stateCode: string, city: string): Promise<number> {
    const results = await this.searchCities(stateCode, city, 5);
    const match = results.find(
      (r) => r.cityName.toLowerCase() === normalizeCityName(city).toLowerCase(),
    );
    return match?.zipCount ?? 0;
  },

  /** Merge ZIPs when adding a city (optimistic-friendly). */
  mergeCityZips(existingZips: string[], newZips: string[]): string[] {
    return mergeUniqueZips(existingZips, newZips);
  },

  /** Recompute ZIPs from remaining cities after removal. */
  async zipsForRemainingCities(
    stateCode: string,
    cities: string[],
  ): Promise<string[]> {
    return this.getZipsForCities(stateCode, cities);
  },

  parseCommaList,
  formatCommaList,
  normalizeCityName,
};
