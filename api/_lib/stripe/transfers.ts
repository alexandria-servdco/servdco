import { getStripe } from "./server.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { createUserNotification, writePaymentAuditLog } from "./ledger.js";
import { remainingCookPayoutCents } from "./helpers.js";

export async function getBookingHoldHours(): Promise<number> {
  const client = getServiceRoleClient();
  const { data } = await client
    .from("platform_settings")
    .select("value")
    .eq("key", "booking_hold_hours")
    .maybeSingle();

  const raw = data?.value;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    if (!Number.isNaN(n)) return n;
  }
  return 24;
}

async function scheduleTransferRow(params: {
  paymentId: string;
  bookingId: string;
  chefProfileId: string;
  grossCents: number;
  platformFeeCents: number;
  netCents: number;
  scheduledAt: Date;
}): Promise<string> {
  const client = getServiceRoleClient();

  const { data: existing } = await client
    .from("transfers")
    .select("id, status")
    .eq("payment_id", params.paymentId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: row, error } = await client
    .from("transfers")
    .insert({
      payment_id: params.paymentId,
      booking_id: params.bookingId,
      chef_profile_id: params.chefProfileId,
      gross_amount_cents: params.grossCents,
      platform_fee_cents: params.platformFeeCents,
      net_amount_cents: params.netCents,
      status: "scheduled",
      scheduled_at: params.scheduledAt.toISOString(),
      metadata: { source: "booking_completed" },
    })
    .select("id")
    .single();

  if (error) throw error;
  return row.id;
}

/** Call when booking moves to completed — schedules transfer after hold period. */
export async function scheduleTransferForCompletedBooking(
  bookingId: string,
): Promise<void> {
  const client = getServiceRoleClient();

  const { data: booking } = await client
    .from("bookings")
    .select("id, chef_profile_id, status, updated_at")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking || booking.status !== "completed") return;

  const { data: payment } = await client
    .from("payments")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("status", "succeeded")
    .maybeSingle();

  if (!payment || payment.cook_payout_cents <= 0) return;

  const holdHours = await getBookingHoldHours();
  const completedAt = new Date(booking.updated_at ?? Date.now());
  const scheduledAt = new Date(
    completedAt.getTime() + holdHours * 60 * 60 * 1000,
  );

  await scheduleTransferRow({
    paymentId: payment.id,
    bookingId: booking.id,
    chefProfileId: payment.chef_profile_id,
    grossCents: payment.amount_cents,
    platformFeeCents: payment.platform_fee_cents,
    netCents: payment.cook_payout_cents,
    scheduledAt,
  });
}

export async function processEligibleTransfers(): Promise<{
  processed: number;
  failed: number;
}> {
  const client = getServiceRoleClient();
  const stripe = getStripe();
  const now = new Date().toISOString();

  const { data: rows } = await client
    .from("transfers")
    .select("*")
    .in("status", ["scheduled", "pending"])
    .lte("scheduled_at", now)
    .limit(25);

  let processed = 0;
  let failed = 0;

  for (const transfer of rows ?? []) {
    const { data: payment } = await client
      .from("payments")
      .select(
        "status, refunded_cents, amount_cents, cook_payout_cents, platform_fee_cents",
      )
      .eq("id", transfer.payment_id)
      .maybeSingle();

    if (!payment || payment.status === "refunded") {
      await client
        .from("transfers")
        .update({
          status: "cancelled",
          failure_reason: "Payment refunded or unavailable",
          updated_at: now,
        })
        .eq("id", transfer.id);
      continue;
    }

    const remainingNet = remainingCookPayoutCents({
      amount_cents: payment.amount_cents,
      cook_payout_cents: payment.cook_payout_cents,
      refunded_cents: payment.refunded_cents ?? 0,
    });

    if (remainingNet <= 0) {
      await client
        .from("transfers")
        .update({
          status: "cancelled",
          failure_reason: "No remaining cook payout after refund",
          updated_at: now,
        })
        .eq("id", transfer.id);
      continue;
    }

    let netCents = transfer.net_amount_cents;
    if (remainingNet !== netCents) {
      await client
        .from("transfers")
        .update({
          net_amount_cents: remainingNet,
          gross_amount_cents: payment.amount_cents - (payment.refunded_cents ?? 0),
          platform_fee_cents: payment.platform_fee_cents,
          updated_at: now,
          metadata: {
            ...((transfer.metadata as Record<string, unknown>) ?? {}),
            adjusted_for_partial_refund: true,
            remaining_net_cents: remainingNet,
          },
        })
        .eq("id", transfer.id);
      netCents = remainingNet;
    }

    const { data: stripeAccount } = await client
      .from("stripe_accounts")
      .select("stripe_account_id, payouts_enabled")
      .eq("chef_profile_id", transfer.chef_profile_id)
      .maybeSingle();

    if (!stripeAccount?.payouts_enabled || !stripeAccount.stripe_account_id) {
      await client
        .from("transfers")
        .update({
          status: "pending",
          failure_reason: "Cook Connect onboarding incomplete",
          updated_at: now,
        })
        .eq("id", transfer.id);
      failed++;
      continue;
    }

    await client
      .from("transfers")
      .update({ status: "processing", updated_at: now })
      .eq("id", transfer.id);

    try {
      const stripeTransfer = await stripe.transfers.create({
        amount: netCents,
        currency: "usd",
        destination: stripeAccount.stripe_account_id,
        metadata: {
          transfer_id: transfer.id,
          payment_id: transfer.payment_id,
          booking_id: transfer.booking_id,
          chef_profile_id: transfer.chef_profile_id,
        },
      });

      await client
        .from("transfers")
        .update({
          status: "paid",
          stripe_transfer_id: stripeTransfer.id,
          transferred_at: now,
          payout_date: now,
          failure_reason: null,
          updated_at: now,
        })
        .eq("id", transfer.id);

      await client
        .from("payments")
        .update({
          transfer_id: stripeTransfer.id,
          updated_at: now,
        })
        .eq("id", transfer.payment_id);

      const { data: chef } = await client
        .from("chef_profiles")
        .select("user_id")
        .eq("id", transfer.chef_profile_id)
        .maybeSingle();

      if (chef?.user_id) {
        await createUserNotification({
          userId: chef.user_id,
          title: "Transfer Sent",
          message: `Your earnings of $${(netCents / 100).toFixed(2)} have been transferred to your Connect account.`,
          type: "success",
          metadata: {
            event: "transfer_sent",
            transfer_id: transfer.id,
            stripe_transfer_id: stripeTransfer.id,
            booking_id: transfer.booking_id,
          },
        });
      }

      await writePaymentAuditLog({
        action: "transfer.paid",
        paymentId: transfer.payment_id,
        bookingId: transfer.booking_id,
        newValues: {
          transfer_id: stripeTransfer.id,
          net_amount_cents: netCents,
        },
        metadata: { cook_transfer_id: transfer.id },
      });

      processed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transfer failed";
      await client
        .from("transfers")
        .update({
          status: "failed",
          failure_reason: message,
          updated_at: now,
        })
        .eq("id", transfer.id);

      const { data: chef } = await client
        .from("chef_profiles")
        .select("user_id")
        .eq("id", transfer.chef_profile_id)
        .maybeSingle();

      if (chef?.user_id) {
        await createUserNotification({
          userId: chef.user_id,
          title: "Transfer Failed",
          message:
            "We could not transfer your earnings. Our team has been notified — please check your Connect account.",
          type: "error",
          metadata: {
            event: "transfer_failed",
            transfer_id: transfer.id,
            failure_reason: message,
          },
        });
      }

      failed++;
    }
  }

  return { processed, failed };
}

/** Sync transfer rows after refund (full cancel or partial net reduction). */
export async function syncTransfersAfterRefund(paymentId: string): Promise<void> {
  const client = getServiceRoleClient();
  const now = new Date().toISOString();

  const { data: payment } = await client
    .from("payments")
    .select("amount_cents, cook_payout_cents, refunded_cents, status, platform_fee_cents")
    .eq("id", paymentId)
    .maybeSingle();

  if (!payment) return;

  if (payment.status === "refunded") {
    await cancelTransfersForPayment(paymentId);
    return;
  }

  const remainingNet = remainingCookPayoutCents({
    amount_cents: payment.amount_cents,
    cook_payout_cents: payment.cook_payout_cents,
    refunded_cents: payment.refunded_cents ?? 0,
  });

  const { data: transfers } = await client
    .from("transfers")
    .select("id, status, net_amount_cents")
    .eq("payment_id", paymentId)
    .in("status", ["pending", "scheduled", "processing"]);

  for (const t of transfers ?? []) {
    if (remainingNet <= 0) {
      await client
        .from("transfers")
        .update({
          status: "cancelled",
          failure_reason: "No remaining cook payout after partial refund",
          updated_at: now,
        })
        .eq("id", t.id);
    } else if (t.net_amount_cents !== remainingNet) {
      await client
        .from("transfers")
        .update({
          net_amount_cents: remainingNet,
          updated_at: now,
          metadata: {
            adjusted_for_partial_refund: true,
            remaining_net_cents: remainingNet,
          },
        })
        .eq("id", t.id);
    }
  }
}

export async function cancelTransfersForPayment(paymentId: string): Promise<void> {
  const client = getServiceRoleClient();
  await client
    .from("transfers")
    .update({
      status: "cancelled",
      failure_reason: "Payment refunded",
      updated_at: new Date().toISOString(),
    })
    .eq("payment_id", paymentId)
    .in("status", ["pending", "scheduled", "processing"]);
}
