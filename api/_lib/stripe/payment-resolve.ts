import type Stripe from "stripe";
import { getServiceRoleClient } from "../supabase/serviceRole.js";

export interface ResolvedPayment {
  id: string;
  booking_id: string;
  family_id: string;
  chef_profile_id: string;
  status: string;
  amount_cents: number;
  currency: string;
}

export async function resolvePaymentFromCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<ResolvedPayment | null> {
  const client = getServiceRoleClient();
  const paymentId = session.metadata?.payment_id;
  if (paymentId) {
    const { data } = await client
      .from("payments")
      .select("id, booking_id, family_id, chef_profile_id, status, amount_cents, currency")
      .eq("id", paymentId)
      .maybeSingle();
    if (data) return data as ResolvedPayment;
  }

  const { data: bySession } = await client
    .from("payments")
    .select("id, booking_id, family_id, chef_profile_id, status, amount_cents, currency")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  return (bySession as ResolvedPayment) ?? null;
}

export async function resolvePaymentFromIntent(
  intent: Stripe.PaymentIntent,
): Promise<ResolvedPayment | null> {
  const client = getServiceRoleClient();
  const paymentId = intent.metadata?.payment_id;

  if (paymentId) {
    const { data } = await client
      .from("payments")
      .select("id, booking_id, family_id, chef_profile_id, status, amount_cents, currency")
      .eq("id", paymentId)
      .maybeSingle();
    if (data) return data as ResolvedPayment;
  }

  const { data: byIntent } = await client
    .from("payments")
    .select("id, booking_id, family_id, chef_profile_id, status, amount_cents, currency")
    .eq("stripe_payment_intent_id", intent.id)
    .maybeSingle();

  return (byIntent as ResolvedPayment) ?? null;
}
