import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { fetchWithTimeout } from "../fetchWithTimeout.js";
import { stateCodeToName, resolveStateCode, US_STATE_CODE_TO_NAME } from "../../../shared/location.js";

export type ReverseGeocodeResult = {
  zip: string;
  city: string;
  state: string;
  stateCode: string;
  country: string;
  latitude: number;
  longitude: number;
  provider: string;
};

function roundCoord(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function normalizeZip(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "").slice(0, 5);
  return digits.length === 5 ? digits : null;
}

async function readCache(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  try {
    const client = getServiceRoleClient();
    const { data } = await client
      .from("geo_reverse_cache")
      .select("zip_code, city_name, state_code, country, provider")
      .eq("lat_rounded", roundCoord(lat))
      .eq("lng_rounded", roundCoord(lng))
      .maybeSingle();

    if (!data?.zip_code) return null;

    const stateCode = String(data.state_code).toUpperCase();
    const stateName = stateCodeToName(stateCode) ?? stateCode;

    return {
      zip: String(data.zip_code),
      city: String(data.city_name),
      state: stateName,
      stateCode,
      country: String(data.country ?? "US"),
      latitude: lat,
      longitude: lng,
      provider: `cache:${data.provider ?? "unknown"}`,
    };
  } catch {
    return null;
  }
}

async function writeCache(
  lat: number,
  lng: number,
  result: Omit<ReverseGeocodeResult, "latitude" | "longitude" | "provider"> & {
    provider: string;
  },
): Promise<void> {
  try {
    const client = getServiceRoleClient();
    await client.from("geo_reverse_cache").upsert(
      {
        lat_rounded: roundCoord(lat),
        lng_rounded: roundCoord(lng),
        zip_code: result.zip,
        city_name: result.city,
        state_code: result.stateCode,
        country: result.country,
        provider: result.provider.replace(/^cache:/, ""),
      },
      { onConflict: "lat_rounded,lng_rounded" },
    );
  } catch (err) {
    console.warn("[reverseGeocode.cache]", err instanceof Error ? err.message : err);
  }
}

async function censusReverseGeocode(
  lat: number,
  lng: number,
): Promise<{ zip: string | null; stateCode: string | null }> {
  const url = new URL(
    "https://geocoding.geo.census.gov/geocoder/geographies/coordinates",
  );
  url.searchParams.set("x", String(lng));
  url.searchParams.set("y", String(lat));
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("vintage", "Current_Current");
  url.searchParams.set("format", "json");

  const res = await fetchWithTimeout(url.toString(), { timeoutMs: 12_000 });
  if (!res.ok) return { zip: null, stateCode: null };

  const body = (await res.json()) as {
    result?: {
      geographies?: {
        "ZIP Code Tabulation Areas"?: Array<{ ZCTA5?: string }>;
        States?: Array<{ STUSAB?: string; STATE?: string }>;
      };
    };
  };

  const geos = body.result?.geographies;
  const zip = normalizeZip(geos?.["ZIP Code Tabulation Areas"]?.[0]?.ZCTA5);
  const stateCode =
    geos?.States?.[0]?.STUSAB?.toUpperCase() ??
    geos?.States?.[0]?.STATE?.slice(0, 2).toUpperCase() ??
    null;

  return { zip, stateCode };
}

async function nominatimReverseGeocode(
  lat: number,
  lng: number,
): Promise<{ zip: string | null; stateCode: string | null; city: string | null }> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const res = await fetchWithTimeout(url.toString(), {
    timeoutMs: 12_000,
    headers: {
      "User-Agent": "ServdCo/1.0 (location-service; contact@servd.co)",
      Accept: "application/json",
    },
  });
  if (!res.ok) return { zip: null, stateCode: null, city: null };

  const body = (await res.json()) as {
    address?: {
      postcode?: string;
      state?: string;
      city?: string;
      town?: string;
      village?: string;
      country_code?: string;
    };
  };

  const addr = body.address;
  if (!addr || addr.country_code?.toLowerCase() !== "us") {
    return { zip: null, stateCode: null, city: null };
  }

  const zip = normalizeZip(addr.postcode);
  const city = addr.city ?? addr.town ?? addr.village ?? null;
  const stateName = addr.state ?? null;
  let stateCode: string | null = null;
  if (stateName) {
    const match = Object.entries(US_STATE_CODE_TO_NAME).find(
      ([, name]) => name.toLowerCase() === String(stateName).toLowerCase(),
    );
    stateCode = match?.[0] ?? null;
  }

  return { zip, stateCode, city };
}

async function resolveFromZip(
  zip: string,
  stateCodeHint: string | null,
  lat: number,
  lng: number,
  provider: string,
): Promise<ReverseGeocodeResult | null> {
  const client = getServiceRoleClient();
  const { data, error } = await client.rpc("geo_primary_location_for_zip", {
    p_zip: zip,
  });

  if (error || !data || !Array.isArray(data) || data.length === 0) {
    if (!stateCodeHint) return null;
    const stateName = stateCodeToName(stateCodeHint);
    if (!stateName) return null;
    return {
      zip,
      city: "",
      state: stateName,
      stateCode: stateCodeHint,
      country: "US",
      latitude: lat,
      longitude: lng,
      provider,
    };
  }

  const row = data[0] as {
    state_code: string;
    city_name: string;
    zip_code: string;
  };

  const stateCode = String(row.state_code).toUpperCase();
  const stateName = stateCodeToName(stateCode) ?? stateCode;

  return {
    zip: String(row.zip_code),
    city: String(row.city_name),
    state: stateName,
    stateCode,
    country: "US",
    latitude: lat,
    longitude: lng,
    provider,
  };
}

export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult | null> {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  const cached = await readCache(latitude, longitude);
  if (cached) return cached;

  let zip: string | null = null;
  let stateCode: string | null = null;
  let provider = "census";

  try {
    const census = await censusReverseGeocode(latitude, longitude);
    zip = census.zip;
    stateCode = census.stateCode;
  } catch (err) {
    console.warn("[reverseGeocode.census]", err instanceof Error ? err.message : err);
  }

  if (!zip) {
    try {
      const nom = await nominatimReverseGeocode(latitude, longitude);
      zip = nom.zip;
      stateCode = stateCode ?? nom.stateCode;
      provider = "nominatim";
    } catch (err) {
      console.warn("[reverseGeocode.nominatim]", err instanceof Error ? err.message : err);
    }
  }

  if (!zip) return null;

  const resolved = await resolveFromZip(zip, stateCode, latitude, longitude, provider);
  if (!resolved) return null;

  await writeCache(latitude, longitude, resolved);
  return resolved;
}

export async function validateLocationFields(params: {
  state: string;
  city: string;
  zip: string;
}): Promise<{ valid: boolean; message?: string; stateCode?: string }> {
  const zip = normalizeZip(params.zip);
  if (!zip) {
    return { valid: false, message: "A valid 5-digit US ZIP code is required." };
  }

  const resolvedCode = resolveStateCode(params.state);
  if (!resolvedCode) {
    return { valid: false, message: "Enter a valid US state." };
  }

  const client = getServiceRoleClient();
  const { data } = await client.rpc("geo_primary_location_for_zip", { p_zip: zip });

  if (data && Array.isArray(data) && data.length > 0) {
    const row = data[0] as { state_code: string };
    const zipState = String(row.state_code).toUpperCase();
    if (zipState !== resolvedCode) {
      return {
        valid: false,
        message: `ZIP ${zip} does not match state ${params.state}.`,
      };
    }
    return { valid: true, stateCode: zipState };
  }

  const cityTrimmed = params.city.trim();
  if (cityTrimmed.length < 2) {
    return { valid: false, message: "City is required." };
  }

  return { valid: true, stateCode: resolvedCode };
}
