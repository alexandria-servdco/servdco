import type { Session, User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { Database, Enums, Tables } from "./database.types";

export type { Database, Json, Tables, Enums } from "./database.types";

/** ServdCo application roles (mirrors `profiles.role` enum). */
export type UserRole = Enums<"user_role">;

/** Auth user enriched with app profile fields (Phase 4 auth migration). */
export interface ServdCoProfile {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  status: Enums<"account_status">;
}

export type ProfileRow = Tables<"profiles">;
export type ChefProfileRow = Tables<"chef_profiles">;
export type BookingRow = Tables<"bookings">;

export type { Session, SupabaseAuthUser };

export interface SupabaseAuthState {
  session: Session | null;
  user: SupabaseAuthUser | null;
  profile: ServdCoProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
}
