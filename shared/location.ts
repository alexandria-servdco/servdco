/** Location source — how profile coordinates were set. */
export type LocationSource = "gps" | "manual" | "admin" | "legacy";

export const LOCATION_SOURCES = [
  "gps",
  "manual",
  "admin",
  "legacy",
] as const satisfies readonly LocationSource[];

export const SERVICE_RADIUS_OPTIONS = [5, 10, 20, 30, 50] as const;
export type ServiceRadiusMiles = (typeof SERVICE_RADIUS_OPTIONS)[number];

export type ResolvedLocation = {
  zip: string;
  city: string;
  state: string;
  stateCode: string;
  country: string;
  latitude: number;
  longitude: number;
  locationSource: LocationSource;
};

export type LocationFormValue = {
  state: string;
  city: string;
  zip: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  locationSource: LocationSource;
};

export const EMPTY_LOCATION_FORM = (): LocationFormValue => ({
  state: "",
  city: "",
  zip: "",
  country: "US",
  latitude: null,
  longitude: null,
  locationSource: "manual",
});

export const US_STATE_CODE_TO_NAME: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

export function stateCodeToName(code: string): string | null {
  const upper = code.trim().toUpperCase();
  return US_STATE_CODE_TO_NAME[upper] ?? null;
}

export function resolveStateCode(stateInput: string): string | null {
  const trimmed = stateInput.trim();
  if (!trimmed) return null;
  if (trimmed.length === 2) {
    const code = trimmed.toUpperCase();
    return US_STATE_CODE_TO_NAME[code] ? code : null;
  }
  const match = Object.entries(US_STATE_CODE_TO_NAME).find(
    ([, name]) => name.toLowerCase() === trimmed.toLowerCase(),
  );
  return match?.[0] ?? null;
}

export function isValidUsStateInput(state: string): boolean {
  return resolveStateCode(state) !== null;
}
