/**
 * Launch Control — shared region resolution & permission matrix.
 * Used by client UX and server enforcement (via API imports).
 */

import { normalizeCityName, parseCommaList, isValidZipCode } from "./geoZip";

export const LAUNCH_REGION_STATUSES = [
  "active",
  "waitlist",
  "paused",
  "maintenance",
  "internal_beta",
  "coming_soon",
] as const;

export type LaunchRegionStatus = (typeof LAUNCH_REGION_STATUSES)[number];

export const LAUNCH_PERMISSIONS = [
  "dashboard",
  "browse",
  "booking_create",
  "booking_view_existing",
  "payment_create",
  "payment_view",
  "message_initiate",
  "message_reply",
  "review_submit",
  "payout_receive",
  "family_signup",
  "cook_signup",
  "waitlist_join",
  "interest_request",
] as const;

export type LaunchPermission = (typeof LAUNCH_PERMISSIONS)[number];

export type LaunchPermissionMap = Record<LaunchPermission, boolean>;

export interface LaunchRegionConfig {
  id: string;
  state: string;
  status: LaunchRegionStatus;
  cities: string[];
  zipCodes: string[];
  allow_new_family_signup: boolean;
  allow_new_cook_signup: boolean;
  allow_bookings: boolean;
  allow_payments: boolean;
  allow_messages: boolean;
  allow_reviews: boolean;
  allow_waitlist: boolean;
  allow_interest_requests: boolean;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  launch_date: string | null;
  beta_limit_chefs: number | null;
  beta_limit_families: number | null;
  max_active_bookings: number | null;
  allow_recurring_bookings: boolean;
  feature_flags: Record<string, boolean>;
  chef_count: number;
  family_count: number;
  pause_reason: string | null;
  pause_until: string | null;
}

export interface RegionResolveInput {
  state: string;
  city?: string;
  zip?: string;
  /** City resolved from ZIP via geo dataset */
  geoCity?: string | null;
  role?: "family" | "chef";
}

export interface RegionResolveResult {
  regionId: string | null;
  regionState: string;
  city: string;
  zip: string;
  cityAllowed: boolean;
  zipAllowed: boolean;
  geographyAllowed: boolean;
  launchStatus: LaunchRegionStatus;
  effectiveStatus: LaunchRegionStatus;
  permissions: LaunchPermissionMap;
  reason: string;
  message: string;
  canAccessDashboard: boolean;
  canAccessMarketplace: boolean;
}

export function normalizeZip(zip: string | undefined | null): string {
  const digits = (zip ?? "").replace(/\D/g, "");
  return digits.length >= 5 ? digits.slice(0, 5) : "";
}

export function cityMatchesList(city: string, allowed: string[]): boolean {
  if (allowed.length === 0) return true;
  const normalized = normalizeCityName(city).toLowerCase();
  if (!normalized) return false;
  return allowed.some((c) => normalizeCityName(c).toLowerCase() === normalized);
}

export function zipMatchesList(zip: string, allowed: string[]): boolean {
  if (allowed.length === 0) return true;
  const normalized = normalizeZip(zip);
  if (!isValidZipCode(normalized)) return false;
  return allowed.includes(normalized);
}

export function evaluateGeography(
  input: Pick<RegionResolveInput, "city" | "zip" | "geoCity">,
  cities: string[],
  zipCodes: string[],
): { cityAllowed: boolean; zipAllowed: boolean; geographyAllowed: boolean } {
  const city = normalizeCityName(input.city ?? input.geoCity ?? "");
  const zip = normalizeZip(input.zip);

  const cityAllowed =
    cities.length === 0
      ? true
      : cityMatchesList(city, cities) ||
        (input.geoCity ? cityMatchesList(input.geoCity, cities) : false);

  const zipAllowed =
    zipCodes.length === 0 ? true : zip ? zipMatchesList(zip, zipCodes) : false;

  let geographyAllowed = true;
  if (cities.length > 0 && zipCodes.length > 0) {
    geographyAllowed = cityAllowed && zipAllowed;
  } else if (cities.length > 0) {
    geographyAllowed = cityAllowed;
  } else if (zipCodes.length > 0) {
    geographyAllowed = zipAllowed;
  }

  return { cityAllowed, zipAllowed, geographyAllowed };
}

export function legacyStatusToEnum(
  is_active: boolean,
  is_waitlist: boolean,
  status?: string | null,
): LaunchRegionStatus {
  if (status && LAUNCH_REGION_STATUSES.includes(status as LaunchRegionStatus)) {
    return status as LaunchRegionStatus;
  }
  if (is_active) return "active";
  if (is_waitlist) return "waitlist";
  return "coming_soon";
}

export function enumToLegacyFlags(status: LaunchRegionStatus): {
  is_active: boolean;
  is_waitlist: boolean;
} {
  switch (status) {
    case "active":
    case "internal_beta":
      return { is_active: true, is_waitlist: false };
    case "waitlist":
      return { is_active: false, is_waitlist: true };
    case "paused":
    case "maintenance":
      return { is_active: false, is_waitlist: false };
    case "coming_soon":
    default:
      return { is_active: false, is_waitlist: false };
  }
}

function emptyPermissions(): LaunchPermissionMap {
  return LAUNCH_PERMISSIONS.reduce(
    (acc, key) => {
      acc[key] = false;
      return acc;
    },
    {} as LaunchPermissionMap,
  );
}

function betaCapacityReached(
  config: LaunchRegionConfig,
  role?: "family" | "chef",
): boolean {
  if (config.status !== "internal_beta") return false;
  if (role === "chef" && config.beta_limit_chefs != null) {
    return config.chef_count >= config.beta_limit_chefs;
  }
  if (role === "family" && config.beta_limit_families != null) {
    return config.family_count >= config.beta_limit_families;
  }
  return false;
}

export function computePermissions(
  config: LaunchRegionConfig,
  effectiveStatus: LaunchRegionStatus,
  geographyAllowed: boolean,
  role?: "family" | "chef",
): LaunchPermissionMap {
  const perms = emptyPermissions();

  if (config.maintenance_mode || effectiveStatus === "maintenance") {
    perms.interest_request = config.allow_interest_requests;
    return perms;
  }

  if (effectiveStatus === "waitlist" || effectiveStatus === "coming_soon") {
    perms.waitlist_join = config.allow_waitlist;
    perms.interest_request = config.allow_interest_requests;
    perms.family_signup = config.allow_new_family_signup;
    perms.cook_signup = config.allow_new_cook_signup;
    return perms;
  }

  if (effectiveStatus === "paused") {
    perms.dashboard = geographyAllowed;
    perms.booking_view_existing = geographyAllowed;
    perms.payment_view = geographyAllowed;
    perms.message_reply = geographyAllowed && config.allow_messages;
    perms.payout_receive = role === "chef" && geographyAllowed;
    perms.interest_request = config.allow_interest_requests;
    return perms;
  }

  if (
    effectiveStatus === "active" ||
    effectiveStatus === "internal_beta"
  ) {
    if (!geographyAllowed) {
      perms.waitlist_join = config.allow_waitlist;
      perms.interest_request = config.allow_interest_requests;
      return perms;
    }

    if (betaCapacityReached(config, role)) {
      perms.waitlist_join = config.allow_waitlist;
      perms.interest_request = config.allow_interest_requests;
      perms.dashboard = true;
      return perms;
    }

    perms.dashboard = true;
    perms.browse = true;
    perms.booking_create = config.allow_bookings;
    perms.booking_view_existing = true;
    perms.payment_create = config.allow_payments;
    perms.payment_view = true;
    perms.message_initiate = config.allow_messages;
    perms.message_reply = config.allow_messages;
    perms.review_submit = config.allow_reviews;
    perms.payout_receive = role === "chef";
    perms.family_signup = config.allow_new_family_signup;
    perms.cook_signup = config.allow_new_cook_signup;
    perms.waitlist_join = config.allow_waitlist;
    perms.interest_request = config.allow_interest_requests;
    return perms;
  }

  return perms;
}

export function resolveRegionAccess(
  regionId: string | null,
  config: LaunchRegionConfig | null,
  input: RegionResolveInput,
): RegionResolveResult {
  const city = normalizeCityName(input.city ?? input.geoCity ?? "");
  const zip = normalizeZip(input.zip);
  const regionState = config?.state ?? input.state;

  if (!config || !regionId) {
    const effectiveStatus: LaunchRegionStatus = "waitlist";
    const permissions = computePermissions(
      {
        id: regionId ?? "UNKNOWN",
        state: input.state,
        status: effectiveStatus,
        cities: [],
        zipCodes: [],
        allow_new_family_signup: true,
        allow_new_cook_signup: true,
        allow_bookings: false,
        allow_payments: false,
        allow_messages: false,
        allow_reviews: false,
        allow_waitlist: true,
        allow_interest_requests: true,
        maintenance_mode: false,
        maintenance_message: null,
        launch_date: null,
        beta_limit_chefs: null,
        beta_limit_families: null,
        max_active_bookings: null,
        allow_recurring_bookings: false,
        feature_flags: {},
        chef_count: 0,
        family_count: 0,
        pause_reason: null,
        pause_until: null,
      },
      effectiveStatus,
      false,
      input.role,
    );
    return {
      regionId,
      regionState,
      city,
      zip,
      cityAllowed: false,
      zipAllowed: false,
      geographyAllowed: false,
      launchStatus: effectiveStatus,
      effectiveStatus,
      permissions,
      reason: "region_not_configured",
      message:
        "Servd Co is not available in your area yet. Join the waitlist to be notified at launch.",
      canAccessDashboard: false,
      canAccessMarketplace: false,
    };
  }

  const geo = evaluateGeography(input, config.cities, config.zipCodes);
  let effectiveStatus = config.status;

  // Once a region is live, access is statewide. City/ZIP lists track primary
  // service areas for admin ops — they do not gate users after launch.
  const stateIsLive =
    config.status === "active" || config.status === "internal_beta";
  const geographyForAccess = stateIsLive ? true : geo.geographyAllowed;

  if (config.maintenance_mode) {
    effectiveStatus = "maintenance";
  }

  const permissions = computePermissions(
    config,
    effectiveStatus,
    geographyForAccess,
    input.role,
  );

  const canAccessDashboard = permissions.dashboard;
  const canAccessMarketplace =
    permissions.browse ||
    permissions.booking_create ||
    permissions.booking_view_existing;

  let reason = "ok";
  let message = "Your region is active on Servd Co.";

  if (effectiveStatus === "maintenance") {
    reason = "maintenance";
    message =
      config.maintenance_message ??
      "Servd Co is temporarily unavailable in your region for scheduled maintenance.";
  } else if (effectiveStatus === "paused") {
    reason = "region_paused";
    message =
      config.pause_reason ??
      "New bookings and payments are paused in your region. Existing bookings remain active.";
  } else if (
    effectiveStatus === "waitlist" &&
    !geographyForAccess &&
    !stateIsLive
  ) {
    reason = "city_not_launched";
    message = `Servd Co has not launched in ${city || "your city"} yet. Join the waitlist and we'll notify you when we arrive.`;
  } else if (effectiveStatus === "waitlist") {
    reason = "region_waitlist";
    message =
      "Your region is on the waitlist. We'll notify you when Servd Co launches.";
  } else if (effectiveStatus === "coming_soon") {
    reason = "coming_soon";
    message = "Servd Co is coming soon to your area.";
  } else if (betaCapacityReached(config, input.role)) {
    reason = "beta_full";
    message =
      "This market is in limited beta and has reached capacity. Join the waitlist for the next wave.";
  }

  return {
    regionId,
    regionState,
    city,
    zip,
    ...geo,
    launchStatus: config.status,
    effectiveStatus,
    permissions,
    reason,
    message,
    canAccessDashboard,
    canAccessMarketplace,
  };
}

export function permissionForScope(
  scope: "messaging" | "booking_create" | "review_submit",
): LaunchPermission {
  switch (scope) {
    case "messaging":
      return "message_initiate";
    case "booking_create":
      return "booking_create";
    case "review_submit":
      return "review_submit";
    default:
      return "dashboard";
  }
}

export function mapRowToLaunchRegionConfig(
  row: Record<string, unknown>,
): LaunchRegionConfig {
  const is_active = Boolean(row.is_active);
  const is_waitlist = Boolean(row.is_waitlist);
  const status = legacyStatusToEnum(
    is_active,
    is_waitlist,
    typeof row.status === "string" ? row.status : null,
  );

  return {
    id: String(row.id),
    state: String(row.state ?? ""),
    status,
    cities: parseCommaList(String(row.city ?? "")),
    zipCodes: parseCommaList(String(row.zip_codes ?? "")),
    allow_new_family_signup: row.allow_new_family_signup !== false,
    allow_new_cook_signup: row.allow_new_cook_signup !== false,
    allow_bookings: row.allow_bookings !== false,
    allow_payments: row.allow_payments !== false,
    allow_messages: row.allow_messages !== false,
    allow_reviews: row.allow_reviews !== false,
    allow_waitlist: row.allow_waitlist !== false,
    allow_interest_requests: row.allow_interest_requests !== false,
    maintenance_mode: Boolean(row.maintenance_mode),
    maintenance_message:
      typeof row.maintenance_message === "string"
        ? row.maintenance_message
        : null,
    launch_date:
      typeof row.launch_date === "string" ? row.launch_date : null,
    beta_limit_chefs:
      typeof row.beta_limit_chefs === "number" ? row.beta_limit_chefs : null,
    beta_limit_families:
      typeof row.beta_limit_families === "number"
        ? row.beta_limit_families
        : null,
    max_active_bookings:
      typeof row.max_active_bookings === "number"
        ? row.max_active_bookings
        : null,
    allow_recurring_bookings: row.allow_recurring_bookings === true,
    feature_flags:
      row.feature_flags && typeof row.feature_flags === "object"
        ? (row.feature_flags as Record<string, boolean>)
        : {},
    chef_count: Number(row.chef_count ?? 0),
    family_count: Number(row.family_count ?? 0),
    pause_reason:
      typeof row.pause_reason === "string" ? row.pause_reason : null,
    pause_until:
      typeof row.pause_until === "string" ? row.pause_until : null,
  };
}
