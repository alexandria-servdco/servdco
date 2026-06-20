import { getSupabaseClient } from "@/lib/supabase/client";
import type { ChefProfileRow } from "@/lib/supabase/types";
import { normalizeAvatarUrl } from "@/lib/avatar";
import type { MarketplaceChef } from "@/lib/marketplaceTypes";
import { SupabaseQueryError } from "./fallback";

type PortfolioImage = {
  chef_profile_id: string;
  public_url: string | null;
  sort_order: number;
  is_public: boolean;
};

export const chefQueryKeys = {
  all: ["chef_profiles"] as const,
  list: () => [...chefQueryKeys.all, "list"] as const,
  detail: (id: string) => [...chefQueryKeys.all, "detail", id] as const,
  byUserId: (userId: string) => [...chefQueryKeys.all, "user", userId] as const,
};

function pickAvatar(
  chefProfileId: string,
  images: PortfolioImage[],
  profileAvatarUrl?: string | null,
): string {
  const fromProfile = normalizeAvatarUrl(profileAvatarUrl);
  if (fromProfile) return fromProfile;

  const match = images
    .filter(
      (img) =>
        img.chef_profile_id === chefProfileId &&
        img.is_public &&
        img.public_url,
    )
    .sort((a, b) => a.sort_order - b.sort_order);

  return match[0]?.public_url ?? "";
}

function pickPortfolioUrls(
  chefProfileId: string,
  images: PortfolioImage[],
): string[] {
  return images
    .filter(
      (img) =>
        img.chef_profile_id === chefProfileId &&
        img.is_public &&
        img.public_url,
    )
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => img.public_url as string);
}

export function mapChefRowToMarketplace(
  row: ChefProfileRow,
  images: PortfolioImage[] = [],
  profileAvatarUrl?: string | null,
): MarketplaceChef {
  const cuisines = row.cuisines ?? [];
  return {
    id: row.id,
    userId: row.user_id,
    name: row.display_name ?? "Cook",
    cuisine: cuisines.length ? cuisines.join(" / ") : "Home Cooking",
    location: row.location ?? "Local Area",
    bio: row.bio,
    verification_status: row.verification_status,
    premium_status: row.premium_status,
    profile_visibility: row.profile_visibility,
    admin_visibility_override: row.admin_visibility_override,
    bookings_count: row.bookings_count,
    rating: Number(row.rating ?? 0),
    reviews_count: row.reviews_count,
    avatar: pickAvatar(row.id, images, profileAvatarUrl),
    portfolioImages: pickPortfolioUrls(row.id, images),
    created_at: row.created_at,
  };
}

async function fetchProfileAvatars(
  userIds: string[],
): Promise<Map<string, string | null>> {
  const client = getSupabaseClient();
  const map = new Map<string, string | null>();
  if (!client || userIds.length === 0) return map;

  const { data, error } = await client
    .from("profiles_marketplace_public")
    .select("id, avatar_url")
    .in("id", userIds);

  if (error) throw new SupabaseQueryError(error.message, error);
  for (const row of data ?? []) {
    map.set(row.id, row.avatar_url);
  }
  return map;
}

async function fetchPortfolioImages(
  chefProfileIds: string[],
): Promise<PortfolioImage[]> {
  const client = getSupabaseClient();
  if (!client || chefProfileIds.length === 0) return [];

  const { data, error } = await client
    .from("chef_portfolio_images")
    .select("chef_profile_id, public_url, sort_order, is_public")
    .in("chef_profile_id", chefProfileIds)
    .is("deleted_at", null)
    .eq("is_public", true)
    .order("sort_order", { ascending: true });

  if (error) throw new SupabaseQueryError(error.message, error);
  return (data ?? []) as PortfolioImage[];
}

export const ChefsSupabaseService = {
  /** All chef profiles for admin dashboards (includes pending / non-public). */
  async listAllChefs(): Promise<MarketplaceChef[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("chef_profiles")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);
    const rows = data ?? [];
    const images = await fetchPortfolioImages(rows.map((row) => row.id));
    const avatarMap = await fetchProfileAvatars(rows.map((row) => row.user_id));
    return rows.map((row) =>
      mapChefRowToMarketplace(row, images, avatarMap.get(row.user_id)),
    );
  },

  async listPublicChefs(): Promise<MarketplaceChef[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("chef_profiles")
      .select("*")
      .is("deleted_at", null)
      .eq("verification_status", "approved")
      .eq("profile_visibility", "public")
      .order("premium_status", { ascending: false })
      .order("rating", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);
    const rows = data ?? [];
    const images = await fetchPortfolioImages(rows.map((row) => row.id));
    const avatarMap = await fetchProfileAvatars(rows.map((row) => row.user_id));
    return rows.map((row) =>
      mapChefRowToMarketplace(row, images, avatarMap.get(row.user_id)),
    );
  },

  async getChefById(chefProfileId: string): Promise<MarketplaceChef | null> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("chef_profiles")
      .select("*")
      .eq("id", chefProfileId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw new SupabaseQueryError(error.message, error);
    if (!data) return null;

    const images = await fetchPortfolioImages([data.id]);
    const avatarMap = await fetchProfileAvatars([data.user_id]);
    return mapChefRowToMarketplace(data, images, avatarMap.get(data.user_id));
  },

  async updateOwnChefProfile(
    updates: Partial<
      Pick<
        ChefProfileRow,
        "display_name" | "headline" | "bio" | "cuisines" | "years_experience"
      >
    >,
  ): Promise<ChefProfileRow | null> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw new SupabaseQueryError(authError.message, authError);
    const userId = authData.user?.id;
    if (!userId) return null;

    const { data, error } = await client
      .from("chef_profiles")
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);
    return data;
  },

  async getChefByUserId(userId: string): Promise<MarketplaceChef | null> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("chef_profiles")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw new SupabaseQueryError(error.message, error);
    if (!data) return null;

    const images = await fetchPortfolioImages([data.id]);
    const avatarMap = await fetchProfileAvatars([data.user_id]);
    return mapChefRowToMarketplace(data, images, avatarMap.get(data.user_id));
  },
};
