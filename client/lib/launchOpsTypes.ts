/** Launch-ops types (Supabase-backed; replaces mockLaunchControl for Phase 6B). */

export interface LaunchRegion {
  id: string;
  state: string;
  city: string;
  zip_codes: string;
  is_active: boolean;
  is_waitlist: boolean;
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
  message: string;
  status: "new" | "read" | "archived";
  created_at: string;
}

export interface ChefDocument {
  id: string;
  chef_profile_id: string;
  chef_name: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  url: string;
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
}
