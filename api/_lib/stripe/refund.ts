import { z } from "zod";
import { getStripe } from "./server.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { syncTransfersAfterRefund } from "./transfers.js";
import { createUserNotification } from "./ledger.js";

export const refundSchema = z.object({
  paymentId: z.string().uuid(),
  amountCents: z.number().int().positive().optional(),
  reason: z.string().max(500).optional(),
  adminId: z.string().uuid().optional(),
});

export async function processRefund(
  input: z.infer<typeof refundSchema>,
): Promise<{ refundId: string; status: string }> {
  const client = getServiceRoleClient();
  const stripe = getStripe();

  const { data: payment, error } = await client
    .from("payments")
    .select("*")
    .eq("id", input.paymentId)
    .maybeSingle();

  if (error || !payment) {
    throw new Error("Payment not found.");
  }

  if (!payment.stripe_charge_id && !payment.stripe_payment_intent_id) {
    throw new Error("Payment has no Stripe charge to refund.");
  }

  const refund = await stripe.refunds.create({
    charge: payment.stripe_charge_id ?? undefined,
    payment_intent: payment.stripe_charge_id
      ? undefined
      : payment.stripe_payment_intent_id ?? undefined,
    amount: input.amountCents,
    reason: "requested_by_customer",
    metadata: {
      payment_id: payment.id,
      admin_id: input.adminId ?? "",
      reason: input.reason ?? "",
    },
  });

  const refundedCents =
    (payment.refunded_cents ?? 0) + (refund.amount ?? payment.amount_cents);
  const status =
    refundedCents >= payment.amount_cents ? "refunded" : "partially_refunded";

  await client
    .from("payments")
    .update({
      refunded_cents: refundedCents,
      status,
      metadata: {
        ...((payment.metadata as Record<string, unknown>) ?? {}),
        last_refund_id: refund.id,
        last_refund_reason: input.reason ?? null,
        last_refund_admin_id: input.adminId ?? null,
        last_refund_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  if (payment.booking_id && status === "refunded") {
    await client
      .from("bookings")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.booking_id);
  }

  await syncTransfersAfterRefund(payment.id);

  await client.from("audit_logs").insert({
    actor_id: input.adminId ?? null,
    action: input.amountCents ? "payment.partial_refund" : "payment.full_refund",
    entity_type: "payments",
    entity_id: payment.id,
    metadata: {
      refund_id: refund.id,
      amount_cents: refund.amount,
      reason: input.reason ?? null,
    },
  });

  await createUserNotification({
    userId: payment.family_id,
    title: status === "refunded" ? "Refund Completed" : "Partial Refund Issued",
    message:
      status === "refunded"
        ? "Your booking payment has been fully refunded."
        : `A partial refund of $${((refund.amount ?? 0) / 100).toFixed(2)} was issued.`,
    type: "info",
    metadata: {
      event: "refund_completed",
      payment_id: payment.id,
      booking_id: payment.booking_id,
      refund_id: refund.id,
    },
  });

  return { refundId: refund.id, status };
}
