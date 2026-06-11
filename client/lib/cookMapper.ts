import type { MarketplaceChef } from "./marketplaceTypes";

/** UI-facing cook card used by browse & profile pages */
export interface CookCardData {
  id: string;
  name: string;
  image: string;
  rating: string;
  reviews: string;
  location: string;
  specialty: string;
  specialties: string[];
  bio: string;
  premium_status: boolean;
  isVerified: boolean;
  portfolioImages?: string[];
}

const BIO_BY_CUISINE: Record<string, string> = {
  Italian: "Classic culinary veteran bringing fine handmade traditions directly to family kitchens.",
  Indian: "Dedicated cook focusing on fragrant traditional recipes adapted for modern wellness.",
  "Healthy Meals": "Custom performance diet meal-preps specializing in nutrient-dense planning.",
  "Mexican / Comfort Food": "Passionate expert bringing vibrant Latin fusion traditions to home tables.",
  "Southern BBQ": "Southern native preparing slow-cooked traditional BBQ and comforting soul-food spreads.",
  "French Cuisine": "Trained in classical French technique with a focus on elegant home dining.",
  "Asian Fusion": "Creative fusion cook blending Asian flavors with contemporary wellness menus.",
};

function displayName(name: string): string {
  if (name.startsWith("Cook ")) return name;
  return `Cook ${name}`;
}

function splitSpecialties(cuisine: string): string[] {
  return cuisine
    .split(/[\/,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function defaultBio(cuisine: string): string {
  return (
    BIO_BY_CUISINE[cuisine] ||
    `Trusted local cook specializing in ${cuisine.toLowerCase()} for private home dining.`
  );
}

export function mapMarketplaceChefToCard(chef: MarketplaceChef): CookCardData {
  const specialties = splitSpecialties(chef.cuisine);

  return {
    id: chef.id,
    name: displayName(chef.name),
    image: chef.avatar,
    rating: chef.rating > 0 ? chef.rating.toFixed(1) : "New",
    reviews:
      chef.reviews_count > 0
        ? `${chef.reviews_count} reviews`
        : `${chef.bookings_count} reviews`,
    location: chef.location,
    specialties: specialties.length ? specialties : [chef.cuisine],
    specialty: specialties[0] || chef.cuisine,
    bio: chef.bio?.trim() || defaultBio(chef.cuisine),
    premium_status: chef.premium_status,
    isVerified: chef.verification_status === "approved",
    portfolioImages: chef.portfolioImages,
  };
}

export function mapChefsToCards(chefs: MarketplaceChef[]): CookCardData[] {
  return chefs
    .filter(
      (chef) =>
        chef.verification_status === "approved" &&
        chef.profile_visibility === "public",
    )
    .map((chef) => mapMarketplaceChefToCard(chef));
}
