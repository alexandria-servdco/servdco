import type Stripe from "stripe";
import { getServiceRoleClient } from "../supabase/serviceRole.js";

export interface ResolvedTip {
  id: string;
  booking_id: string;
  family_id: string;
  chef_profile_id: string;
  status: string;
  amount_cents: number;
  currency: string;
}

export async function resolveTipFromCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<ResolvedTip | null> {
  if (session.metadata?.tip !== "true") return null;

  const client = getServiceRoleClient();
  const tipId = session.metadata?.tip_id;
  if (tipId) {
    const { data } = await client
      .from("tips")
      .select("id, booking_id, family_id, chef_profile_id, status, amount_cents, currency")
      .eq("id", tipId)
      .maybeSingle();
    if (data) return data as ResolvedTip;
  }

  const { data: bySession } = await client
    .from("tips")
    .select("id, booking_id, family_id, chef_profile_id, status, amount_cents, currency")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  return (bySession as ResolvedTip) ?? null;
}

export async function resolveTipFromIntent(
  intent: Stripe.PaymentIntent,
): Promise<ResolvedTip | null> {
  if (intent.metadata?.tip !== "true") return null;

  const client = getServiceRoleClient();
  const tipId = intent.metadata?.tip_id;

  if (tipId) {
    const { data } = await client
      .from("tips")
      .select("id, booking_id, family_id, chef_profile_id, status, amount_cents, currency")
      .eq("id", tipId)
      .maybeSingle();
    if (data) return data as ResolvedTip;
  }

  const { data: byIntent } = await client
    .from("tips")
    .select("id, booking_id, family_id, chef_profile_id, status, amount_cents, currency")
    .eq("stripe_payment_intent_id", intent.id)
    .maybeSingle();

  return (byIntent as ResolvedTip) ?? null;
}
