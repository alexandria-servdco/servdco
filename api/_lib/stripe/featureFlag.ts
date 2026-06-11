import { isStripeCheckoutEnvEnabled } from "./env.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";

/** Server-side gate: env override OR `feature_flags.enable_stripe_checkout`. */
export async function isStripeCheckoutEnabled(): Promise<boolean> {
  if (isStripeCheckoutEnvEnabled()) return true;

  try {
    const client = getServiceRoleClient();
    const { data } = await client
      .from("feature_flags")
      .select("enabled")
      .eq("key", "enable_stripe_checkout")
      .maybeSingle();
    return data?.enabled === true;
  } catch {
    return false;
  }
}
