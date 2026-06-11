import { z } from "zod";
import { getStripe } from "./server.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";

export const tipCheckoutSchema = z.object({
  bookingId: z.string().uuid(),
  amountCents: z.number().int().min(100).max(50000),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const tipCheckoutWithFamilySchema = tipCheckoutSchema.extend({
  familyId: z.string().uuid(),
});

async function logTipEvent(
  tipId: string,
  eventType: string,
  actorId: string | null,
  payload: Record<string, unknown> = {},
) {
  const client = getServiceRoleClient();
  await client.from("tip_events").insert({
    tip_id: tipId,
    event_type: eventType,
    actor_id: actorId,
    payload,
  });
}

export async function createTipCheckoutSession(
  input: z.infer<typeof tipCheckoutWithFamilySchema>,
): Promise<{ sessionId: string; url: string; tipId: string }> {
  const client = getServiceRoleClient();
  const stripe = getStripe();

  const { data: booking, error } = await client
    .from("bookings")
    .select("id, family_id, chef_profile_id, status")
    .eq("id", input.bookingId)
    .maybeSingle();

  if (error || !booking) throw new Error("Booking not found.");
  if (booking.family_id !== input.familyId) {
    throw new Error("Booking does not belong to the authenticated family.");
  }
  if (booking.status !== "completed") {
    throw new Error("Tips are only available after the booking is completed.");
  }

  const { data: existingTip } = await client
    .from("tips")
    .select("id")
    .eq("booking_id", booking.id)
    .eq("status", "succeeded")
    .maybeSingle();

  if (existingTip) {
    throw new Error("A tip has already been left for this booking.");
  }

  const { data: tipRow, error: tipError } = await client
    .from("tips")
    .insert({
      booking_id: booking.id,
      family_id: booking.family_id,
      chef_profile_id: booking.chef_profile_id,
      amount_cents: input.amountCents,
      currency: "USD",
      status: "pending",
      metadata: { source: "family_tip_checkout" },
    })
    .select("id")
    .single();

  if (tipError) throw tipError;

  await logTipEvent(tipRow.id, "tip_created", input.familyId, {
    amount_cents: input.amountCents,
    booking_id: booking.id,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: booking.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: input.amountCents,
          product_data: {
            name: "Tip for Your Cook",
            description: `Optional tip — booking ${booking.id.slice(0, 8)}`,
          },
        },
      },
    ],
    payment_intent_data: {
      metadata: {
        payment_type: "tip",
        tip: "true",
        tip_id: tipRow.id,
        booking_id: booking.id,
        family_id: booking.family_id,
        chef_profile_id: booking.chef_profile_id,
      },
    },
    metadata: {
      payment_type: "tip",
      tip: "true",
      tip_id: tipRow.id,
      booking_id: booking.id,
      family_id: booking.family_id,
      chef_profile_id: booking.chef_profile_id,
    },
  });

  await client
    .from("tips")
    .update({
      stripe_checkout_session_id: session.id,
      status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", tipRow.id);

  await logTipEvent(tipRow.id, "checkout_started", input.familyId, {
    session_id: session.id,
  });

  if (!session.url) throw new Error("Stripe Checkout session URL missing.");

  return { sessionId: session.id, url: session.url, tipId: tipRow.id };
}

/** Transfer 100% of tip to cook Connect account (0% platform fee). */
export async function transferTipToCook(tipId: string): Promise<void> {
  const client = getServiceRoleClient();
  const stripe = getStripe();

  const { data: tip } = await client
    .from("tips")
    .select("*")
    .eq("id", tipId)
    .eq("status", "succeeded")
    .maybeSingle();

  if (!tip || tip.stripe_transfer_id) return;

  const { data: stripeAccount } = await client
    .from("stripe_accounts")
    .select("stripe_account_id, payouts_enabled")
    .eq("chef_profile_id", tip.chef_profile_id)
    .maybeSingle();

  if (!stripeAccount?.payouts_enabled || !stripeAccount.stripe_account_id) {
    await client
      .from("tips")
      .update({
        metadata: {
          ...((tip.metadata as Record<string, unknown>) ?? {}),
          transfer_pending: true,
          transfer_reason: "Cook Connect onboarding incomplete",
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", tipId);
    return;
  }

  try {
    const transfer = await stripe.transfers.create({
      amount: tip.amount_cents,
      currency: (tip.currency ?? "usd").toLowerCase(),
      destination: stripeAccount.stripe_account_id,
      metadata: {
        tip_id: tip.id,
        booking_id: tip.booking_id,
        chef_profile_id: tip.chef_profile_id,
        tip: "true",
      },
    });

    await client
      .from("tips")
      .update({
        stripe_transfer_id: transfer.id,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", tipId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tip transfer failed";
    await client
      .from("tips")
      .update({
        metadata: {
          ...((tip.metadata as Record<string, unknown>) ?? {}),
          transfer_pending: true,
          transfer_error: message,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", tipId);
  }
}

/** Retry tips that succeeded but could not transfer (cook onboarding incomplete). */
export async function processPendingTipTransfers(): Promise<{
  retried: number;
  succeeded: number;
}> {
  const client = getServiceRoleClient();

  const { data: tips } = await client
    .from("tips")
    .select("id, metadata")
    .eq("status", "succeeded")
    .is("stripe_transfer_id", null)
    .limit(25);

  let retried = 0;
  let succeeded = 0;

  for (const tip of tips ?? []) {
    const meta = (tip.metadata as Record<string, unknown>) ?? {};
    if (!meta.transfer_pending && !meta.transfer_reason && !meta.transfer_error) {
      continue;
    }
    retried++;
    await transferTipToCook(tip.id);
    const { data: updated } = await client
      .from("tips")
      .select("stripe_transfer_id")
      .eq("id", tip.id)
      .maybeSingle();
    if (updated?.stripe_transfer_id) succeeded++;
  }

  return { retried, succeeded };
}
