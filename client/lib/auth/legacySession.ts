import type { ProfileRow } from "@/lib/supabase/types";
import type { AppUser } from "@/lib/auth/types";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@shared/notificationPreferences";

type Listener = () => void;

let legacyUser: AppUser | null = null;
const listeners = new Set<Listener>();

/** In-memory legacy auth (replaces localStorage session bridge). */
export function setLegacyUser(user: AppUser | null): void {
  legacyUser = user;
  listeners.forEach((listener) => listener());
}

export function getLegacyUser(): AppUser | null {
  return legacyUser;
}

export function subscribeLegacyAuth(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function legacyUserToProfileRow(user: AppUser): ProfileRow {
  return {
    id: user.id,
    email: user.email,
    full_name: user.name,
    avatar_url: null,
    role: user.role,
    status: user.status,
    city: user.city ?? null,
    state: user.state ?? null,
    zip: user.zip ?? null,
    phone: user.phone ?? null,
    dietary_preferences: [],
    email_alerts: true,
    sms_alerts: true,
    notification_preferences: DEFAULT_NOTIFICATION_PREFERENCES,
    profile_completed:
      user.profile_completed ?? (user.role === "admin" ? 100 : 0),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
    accepted_terms_version: null,
    accepted_terms_at: null,
    accepted_privacy_version: null,
    accepted_privacy_at: null,
    marketing_opt_in: false,
    cookie_preferences: {},
    account_restore_requested_at: null,
    country: "US",
    latitude: null,
    longitude: null,
    location_source: "legacy",
    last_location_update: null,
  };
}
