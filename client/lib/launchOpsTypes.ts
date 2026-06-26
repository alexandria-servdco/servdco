/** Launch-ops types (Supabase-backed; replaces mockLaunchControl for Phase 6B). */

export interface LaunchRegion {
  id: string;
  state: string;
  city: string;
  zip_codes: string;
  status?: string;
  is_active: boolean;
  is_waitlist: boolean;
  allow_new_family_signup?: boolean;
  allow_new_cook_signup?: boolean;
  allow_bookings?: boolean;
  allow_payments?: boolean;
  allow_messages?: boolean;
  allow_reviews?: boolean;
  allow_waitlist?: boolean;
  allow_interest_requests?: boolean;
  maintenance_mode?: boolean;
  maintenance_message?: string | null;
  launch_date?: string | null;
  beta_limit_chefs?: number | null;
  beta_limit_families?: number | null;
  max_active_bookings?: number | null;
  allow_recurring_bookings?: boolean;
  feature_flags?: Record<string, boolean>;
  pause_reason?: string | null;
  pause_until?: string | null;
  pause_banner_message?: string | null;
  min_chefs: number;
  min_families: number;
  auto_launch: boolean;
  chef_count: number;
  family_count: number;
  waitlist_count: number;
  created_at: string;
  updated_at: string;
  targetChefs?: number;
  targetFamilies?: number;
  families?: number;
  chefs?: number;
}

export interface WaitlistStats {
  families: number;
  chefs: number;
  total: number;
}

export interface InterestRequest {
  id: string;
  name: string;
  email: string;
  city: string;
  state: string;
  role: "family" | "chef" | "both";
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  status: "new" | "read" | "archived" | "resolved";
  created_at: string;
}

export interface ChefDocument {
  id: string;
  chef_profile_id: string;
  chef_name: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  url: string;
  storage_path?: string;
  mime_hint?: string;
  submitted_at: string;
  review_notes?: string;
}

export interface GlobalAnnouncement {
  id: string;
  title: string;
  body: string;
  active: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "family" | "chef" | "admin";
  state: string;
  city: string;
  status: "active" | "suspended" | "pending";
  avatar: string;
  created_at: string;
}

export interface PlatformSettingsValues {
  platformFeePercentage: number;
  chefPremiumPriceMonthly: number;
  bookingHoldHours: number;
  familyPlatformFeeDollars: number;
}
