import type { MarketplaceChef } from "@/lib/marketplaceTypes";

/** Premium entitlement — driven only by active Stripe subscription (synced to premium_status). */
export function isPremiumChef(
  chef: Pick<MarketplaceChef, "premium_status"> | null | undefined,
): boolean {
  return chef?.premium_status === true;
}

export function formatPremiumPrice(monthlyDollars: number): string {
  return `$${monthlyDollars}`;
}
