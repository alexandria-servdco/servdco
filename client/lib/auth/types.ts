import type { UserRole } from "@/lib/supabase/types";

/** Application user snapshot (legacy dev path or mapped from profiles row). */
export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  state?: string;
  city?: string;
  zip?: string;
  phone?: string;
  status: "active" | "suspended" | "pending";
  profile_completed?: number;
}
