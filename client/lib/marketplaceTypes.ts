/** Unified marketplace cook shape for browse + profile (mock or Supabase). */
export interface MarketplaceChef {
  id: string;
  userId: string;
  name: string;
  cuisine: string;
  location: string;
  bio: string | null;
  verification_status: "approved" | "pending" | "rejected" | "suspended";
  premium_status: boolean;
  profile_visibility: "public" | "hidden";
  admin_visibility_override: "none" | "hidden" | "public";
  bookings_count: number;
  rating: number;
  reviews_count: number;
  avatar: string;
  portfolioImages: string[];
  created_at: string;
}

export const DEFAULT_CHEF_AVATAR =
  "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop";

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
