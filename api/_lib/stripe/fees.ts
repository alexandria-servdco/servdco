import { getServiceRoleClient } from "../supabase/serviceRole.js";

const DEFAULT_FEE_PCT = 13;

export async function getPlatformFeePercentage(): Promise<number> {
  const client = getServiceRoleClient();
  const { data } = await client
    .from("platform_settings")
    .select("value")
    .eq("key", "platform_fee_percentage")
    .maybeSingle();

  const raw = data?.value;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return DEFAULT_FEE_PCT;
}

export function splitPaymentAmounts(
  amountCents: number,
  feePct: number,
): { platformFeeCents: number; cookPayoutCents: number } {
  const platformFeeCents = Math.round((amountCents * feePct) / 100);
  const cookPayoutCents = amountCents - platformFeeCents;
  return { platformFeeCents, cookPayoutCents };
}
