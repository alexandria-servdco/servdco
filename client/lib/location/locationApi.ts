import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { LocationFormValue } from "@shared/location";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { ServiceRadiusMiles } from "@shared/location";

export type ReverseGeocodeResponse = {
  success: boolean;
  location: {
    zip: string;
    city: string;
    state: string;
    stateCode: string;
    country: string;
    latitude: number;
    longitude: number;
    locationSource: "gps";
  };
};

export const LocationApi = {
  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<ReverseGeocodeResponse["location"]> {
    const res = await fetchWithTimeout("/api/location/reverse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude }),
      timeoutMs: 18_000,
    });

    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      location?: ReverseGeocodeResponse["location"];
    };

    if (!res.ok || !body.location) {
      throw new Error(
        body.error ?? "Could not resolve your location. Enter your address manually.",
      );
    }

    return body.location;
  },

  async saveLocation(params: {
    state: string;
    city: string;
    zip: string;
    country?: string;
    latitude?: number | null;
    longitude?: number | null;
    locationSource: "gps" | "manual";
    serviceRadiusMiles?: ServiceRadiusMiles | null;
  }): Promise<void> {
    const client = getSupabaseClient();
    const { data } = await client?.auth.getSession() ?? { data: { session: null } };
    const token = data.session?.access_token;
    if (!token) throw new Error("Sign in required to save location.");

    const res = await fetchWithTimeout("/api/location/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
      timeoutMs: 18_000,
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? "Could not save location.");
    }
  },
};

export function toLocationFormValue(
  partial: Partial<LocationFormValue> & Pick<LocationFormValue, "state" | "city" | "zip">,
): LocationFormValue {
  return {
    state: partial.state,
    city: partial.city,
    zip: partial.zip,
    country: partial.country ?? "US",
    latitude: partial.latitude ?? null,
    longitude: partial.longitude ?? null,
    locationSource: partial.locationSource ?? "manual",
  };
}
