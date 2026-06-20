import { z } from "zod";
import { getStripe } from "./server";
import { getServiceRoleClient } from "../supabase/serviceRole";
import { getPlatformFeePercentage, splitPaymentAmounts } from "./fees";
import { stripeIdempotencyKey } from "./helpers";

export const checkoutSessionRequestSchema = z.object({
  bookingId: z.string().uuid(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const checkoutSessionSchema = checkoutSessionRequestSchema.extend({
  familyId: z.string().uuid(),
});

export async function createBookingCheckoutSession(
  input: z.infer<typeof checkoutSessionSchema>,
): Promise<{ sessionId: string; url: string; paymentId: string }> {
  const client = getServiceRoleClient();
  const stripe = getStripe();

  const { data: booking, error } = await client
    .from("bookings")
    .select("*")
    .eq("id", input.bookingId)
    .maybeSingle();

  if (error || !booking) {
    throw new Error("Booking not found.");
  }

  if (booking.family_id !== input.familyId) {
    throw new Error("Booking does not belong to the authenticated family.");
  }

  if (booking.status === "confirmed" || booking.status === "completed") {
    throw new Error("Booking is already confirmed.");
  }

  if (booking.status !== "awaiting_payment" && booking.status !== "accepted") {
    throw new Error("Payment is only available after the cook accepts your request.");
  }

  const { data: succeededPayment } = await client
    .from("payments")
    .select("id")
    .eq("booking_id", booking.id)
    .eq("status", "succeeded")
    .maybeSingle();

  if (succeededPayment) {
    throw new Error("Booking already has a successful payment.");
  }

  const { data: chef, error: chefError } = await client
    .from("chef_profiles")
    .select("id, verification_status, deleted_at")
    .eq("id", booking.chef_profile_id)
    .maybeSingle();

  if (
    chefError ||
    !chef ||
    chef.deleted_at ||
    chef.verification_status !== "approved"
  ) {
    throw new Error("Chef is not available for bookings.");
  }

  const sessionCents = booking.price_cents;
  const familyFeeCents =
    (booking as { family_platform_fee_cents?: number }).family_platform_fee_cents ??
    0;
  const chargeCents = sessionCents + familyFeeCents;
  const feePct = await getPlatformFeePercentage();
  const { platformFeeCents, cookPayoutCents } = splitPaymentAmounts(
    sessionCents,
    feePct,
  );

  let paymentId: string;

  const { data: pendingPayment } = await client
    .from("payments")
    .select("id, stripe_checkout_session_id")
    .eq("booking_id", booking.id)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingPayment) {
    paymentId = pendingPayment.id;
    if (pendingPayment.stripe_checkout_session_id) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(
          pendingPayment.stripe_checkout_session_id,
        );
        if (existing.url && existing.status === "open") {
          return {
            sessionId: existing.id,
            url: existing.url,
            paymentId,
          };
        }
      } catch {
        // Create a fresh session below
      }
    }
  } else {
    const { data: paymentRow, error: payError } = await client
      .from("payments")
      .insert({
        booking_id: booking.id,
        family_id: booking.family_id,
        chef_profile_id: booking.chef_profile_id,
        amount_cents: chargeCents,
        platform_fee_cents: platformFeeCents,
        cook_payout_cents: cookPayoutCents,
        currency: booking.currency ?? "USD",
        status: "pending",
        metadata: {
          booking_id: booking.id,
          family_id: booking.family_id,
          chef_profile_id: booking.chef_profile_id,
        },
      })
      .select("id")
      .single();

    if (payError) throw payError;
    paymentId = paymentRow.id;
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      client_reference_id: booking.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (booking.currency ?? "USD").toLowerCase(),
            unit_amount: chargeCents,
            product_data: {
              name: "Servd Co Booking",
              description: `Booking ${booking.id}`,
            },
          },
        },
      ],
      payment_intent_data: {
        metadata: {
          payment_type: "booking",
          booking_id: booking.id,
          family_id: booking.family_id,
          chef_profile_id: booking.chef_profile_id,
          payment_id: paymentId,
        },
      },
      metadata: {
        payment_type: "booking",
        booking_id: booking.id,
        family_id: booking.family_id,
        chef_profile_id: booking.chef_profile_id,
        payment_id: paymentId,
      },
    },
    {
      idempotencyKey: stripeIdempotencyKey("booking_checkout", paymentId),
    },
  );

  await client
    .from("payments")
    .update({
      stripe_checkout_session_id: session.id,
      status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  if (!session.url) {
    throw new Error("Stripe Checkout session URL missing.");
  }

  return { sessionId: session.id, url: session.url, paymentId };
}
