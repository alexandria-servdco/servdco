import { getStripe } from "./server.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import {
  createUserNotification,
  writePaymentAuditLog,
  writeAdminAuditLog,
} from "./ledger.js";
import { remainingCookPayoutCents } from "./helpers.js";
import { syncConnectAccountByChefProfileId } from "./connect.js";
import { apiLogger } from "../logger.js";
import {
  classifyTransferFailure,
  getRetryDelayMs,
} from "../../../shared/transferStatus.js";
import {
  assertSupabaseWrite,
  claimTransferForProcessing,
  cookTransferIdempotencyKey,
  getTransferProcessingTimeoutMs,
  isProcessingStale,
  validateTransferSchemaOnStartup,
} from "./transferIntegrity.js";

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

export async function getTransferMaxRetryCount(): Promise<number> {
  const client = getServiceRoleClient();
  const { data } = await client
    .from("platform_settings")
    .select("value")
    .eq("key", "transfer_max_retry_count")
    .maybeSingle();

  const raw = data?.value;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return 3;
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
    .select("id, chef_profile_id, status, updated_at, price_cents, family_platform_fee_cents")
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

  const sessionGrossCents = booking.price_cents ?? payment.amount_cents;

  const holdHours = await getBookingHoldHours();
  const completedAt = new Date(booking.updated_at ?? Date.now());
  const scheduledAt = new Date(
    completedAt.getTime() + holdHours * 60 * 60 * 1000,
  );

  await scheduleTransferRow({
    paymentId: payment.id,
    bookingId: booking.id,
    chefProfileId: payment.chef_profile_id,
    grossCents: sessionGrossCents,
    platformFeeCents: payment.platform_fee_cents,
    netCents: payment.cook_payout_cents,
    scheduledAt,
  });
}

type TransferRow = {
  id: string;
  payment_id: string;
  booking_id: string;
  chef_profile_id: string;
  net_amount_cents: number;
  gross_amount_cents: number;
  platform_fee_cents: number;
  status: string;
  metadata: Record<string, unknown> | null;
  retry_count?: number;
  stripe_transfer_id?: string | null;
  updated_at?: string;
};

async function reconcileTransferPaid(
  transfer: TransferRow,
  stripeTransferId: string,
  netCents: number,
  now: string,
): Promise<void> {
  const client = getServiceRoleClient();

  assertSupabaseWrite(
    await client
      .from("transfers")
      .update({
        status: "paid",
        stripe_transfer_id: stripeTransferId,
        transferred_at: now,
        payout_date: now,
        failure_reason: null,
        next_retry_at: null,
        last_retry_reason: null,
        updated_at: now,
      })
      .eq("id", transfer.id)
      .select("id"),
    "reconcile transfer paid",
  );

  assertSupabaseWrite(
    await client
      .from("payments")
      .update({
        transfer_id: stripeTransferId,
        updated_at: now,
      })
      .eq("id", transfer.payment_id)
      .select("id"),
    "reconcile payment transfer_id",
  );

  await notifyCookTransfer(transfer.chef_profile_id, {
    title: "Transfer Sent",
    message: `Your earnings of $${(netCents / 100).toFixed(2)} have been transferred to your Connect account.`,
    type: "success",
    event: "transfer_sent",
    metadata: {
      transfer_id: transfer.id,
      stripe_transfer_id: stripeTransferId,
      booking_id: transfer.booking_id,
    },
  });

  await writePaymentAuditLog({
    action: "transfer.paid",
    paymentId: transfer.payment_id,
    bookingId: transfer.booking_id,
    newValues: {
      transfer_id: stripeTransferId,
      net_amount_cents: netCents,
    },
    metadata: { cook_transfer_id: transfer.id, reconciled: true },
  });
}

async function notifyCookTransfer(
  chefProfileId: string,
  params: {
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
    event: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const client = getServiceRoleClient();
  const { data: chef } = await client
    .from("chef_profiles")
    .select("user_id")
    .eq("id", chefProfileId)
    .maybeSingle();

  if (!chef?.user_id) return;

  await createUserNotification({
    userId: chef.user_id,
    title: params.title,
    message: params.message,
    type: params.type,
    metadata: {
      event: params.event,
      chef_profile_id: chefProfileId,
      ...params.metadata,
    },
  });
}

async function scheduleTransferRetry(
  transfer: TransferRow,
  message: string,
  maxRetries: number,
): Promise<void> {
  const client = getServiceRoleClient();
  const now = new Date();
  const nextRetryCount = (transfer.retry_count ?? 0) + 1;

  if (nextRetryCount >= maxRetries) {
    await client
      .from("transfers")
      .update({
        status: "action_required",
        failure_reason: message,
        retry_count: nextRetryCount,
        last_retry_at: now.toISOString(),
        last_retry_reason: message,
        next_retry_at: null,
        updated_at: now.toISOString(),
      })
      .eq("id", transfer.id);

    await notifyCookTransfer(transfer.chef_profile_id, {
      title: "Payout Needs Attention",
      message:
        "We could not complete your payout after several attempts. Our team has been notified.",
      type: "error",
      event: "transfer_action_required",
      metadata: { transfer_id: transfer.id, failure_reason: message },
    });
    return;
  }

  const nextRetryAt = new Date(
    now.getTime() + getRetryDelayMs(nextRetryCount - 1),
  );

  await client
    .from("transfers")
    .update({
      status: "failed",
      failure_reason: message,
      retry_count: nextRetryCount,
      last_retry_at: now.toISOString(),
      last_retry_reason: message,
      next_retry_at: nextRetryAt.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", transfer.id);

  await notifyCookTransfer(transfer.chef_profile_id, {
    title: "Payout Retry Scheduled",
    message: `We will retry your payout automatically on ${nextRetryAt.toLocaleString()}.`,
    type: "warning",
    event: "transfer_retry_scheduled",
    metadata: {
      transfer_id: transfer.id,
      next_retry_at: nextRetryAt.toISOString(),
      retry_count: nextRetryCount,
    },
  });
}

export async function executeSingleTransfer(
  transfer: TransferRow,
): Promise<{ success: boolean; reason?: string }> {
  await validateTransferSchemaOnStartup();

  const client = getServiceRoleClient();
  const stripe = getStripe();
  const now = new Date().toISOString();
  const maxRetries = await getTransferMaxRetryCount();

  const { data: freshRow, error: freshError } = await client
    .from("transfers")
    .select("*")
    .eq("id", transfer.id)
    .maybeSingle();

  if (freshError) throw freshError;
  if (!freshRow) {
    return { success: false, reason: "Transfer not found" };
  }

  transfer = freshRow as TransferRow;

  if (transfer.status === "paid") {
    return { success: true };
  }

  if (transfer.stripe_transfer_id) {
    await reconcileTransferPaid(
      transfer,
      transfer.stripe_transfer_id,
      transfer.net_amount_cents,
      now,
    );
    return { success: true, reason: "Reconciled existing Stripe transfer" };
  }

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
    return { success: false, reason: "Payment refunded or unavailable" };
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
    return { success: false, reason: "No remaining cook payout after refund" };
  }

  let netCents = transfer.net_amount_cents;
  if (remainingNet !== netCents) {
    await client
      .from("transfers")
      .update({
        net_amount_cents: remainingNet,
        gross_amount_cents:
          payment.amount_cents - (payment.refunded_cents ?? 0),
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
    .select(
      "stripe_account_id, payouts_enabled, onboarding_status, charges_enabled, metadata",
    )
    .eq("chef_profile_id", transfer.chef_profile_id)
    .maybeSingle();

  if (!stripeAccount?.payouts_enabled || !stripeAccount.stripe_account_id) {
    apiLogger.warn("Transfer skipped — cook Connect onboarding incomplete", {
      transferId: transfer.id,
      chefProfileId: transfer.chef_profile_id,
      stripeAccountId: stripeAccount?.stripe_account_id ?? null,
      databaseOnboardingStatus: stripeAccount?.onboarding_status ?? "missing",
      databasePayoutsEnabled: stripeAccount?.payouts_enabled ?? false,
      databaseChargesEnabled: stripeAccount?.charges_enabled ?? false,
      databaseDetailsSubmitted:
        (stripeAccount?.metadata as { details_submitted?: boolean } | null)
          ?.details_submitted ?? false,
    });

    await client
      .from("transfers")
      .update({
        status: "pending",
        failure_reason: "Cook Connect onboarding incomplete",
        updated_at: now,
      })
      .eq("id", transfer.id);
    return { success: false, reason: "Cook Connect onboarding incomplete" };
  }

  const claimed = await claimTransferForProcessing(transfer.id);
  if (!claimed) {
    apiLogger.info("Transfer claim skipped — already processing or completed", {
      transferId: transfer.id,
    });
    return {
      success: false,
      reason: "Transfer already being processed by another worker",
    };
  }

  transfer = claimed;

  await notifyCookTransfer(transfer.chef_profile_id, {
    title: "Payout Processing",
    message: `Your earnings of $${(netCents / 100).toFixed(2)} are being sent to Stripe.`,
    type: "info",
    event: "transfer_processing",
    metadata: { transfer_id: transfer.id, net_amount_cents: netCents },
  });

  try {
    const stripeTransfer = await stripe.transfers.create(
      {
        amount: netCents,
        currency: "usd",
        destination: stripeAccount.stripe_account_id,
        metadata: {
          transfer_id: transfer.id,
          payment_id: transfer.payment_id,
          booking_id: transfer.booking_id,
          chef_profile_id: transfer.chef_profile_id,
        },
      },
      {
        idempotencyKey: cookTransferIdempotencyKey(transfer.id),
      },
    );

    await reconcileTransferPaid(
      transfer,
      stripeTransfer.id,
      netCents,
      now,
    );

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transfer failed";
    const classification = classifyTransferFailure(message);

    if (classification.retryable) {
      await scheduleTransferRetry(transfer, message, maxRetries);
    } else {
      assertSupabaseWrite(
        await client
          .from("transfers")
          .update({
            status: "action_required",
            failure_reason: message,
            last_retry_at: now,
            last_retry_reason: message,
            next_retry_at: null,
            updated_at: now,
          })
          .eq("id", transfer.id)
          .select("id"),
        "mark transfer action_required",
      );

      await notifyCookTransfer(transfer.chef_profile_id, {
        title: "Transfer Failed",
        message:
          "We could not transfer your earnings. Please verify your Stripe account or contact support.",
        type: "error",
        event: "transfer_failed",
        metadata: { transfer_id: transfer.id, failure_reason: message },
      });
    }

    return { success: false, reason: message };
  }
}

export async function retryTransferById(
  transferId: string,
  options?: { adminUserId?: string },
): Promise<{
  success: boolean;
  reason?: string;
  diagnostics?: Record<string, unknown>;
  recovered?: boolean;
}> {
  await validateTransferSchemaOnStartup();

  const client = getServiceRoleClient();
  const { data: transfer, error } = await client
    .from("transfers")
    .select("*")
    .eq("id", transferId)
    .maybeSingle();

  if (error) throw error;
  if (!transfer) {
    return { success: false, reason: "Transfer not found" };
  }

  let syncDiagnostics: Record<string, unknown> | undefined;
  try {
    const syncResult = await syncConnectAccountByChefProfileId(
      transfer.chef_profile_id,
    );
    syncDiagnostics = {
      onboarding_status: syncResult.onboarding_status,
      payouts_enabled: syncResult.payouts_enabled,
      charges_enabled: syncResult.charges_enabled,
      details_submitted: syncResult.details_submitted,
    };
  } catch (syncErr) {
    syncDiagnostics = {
      syncError:
        syncErr instanceof Error ? syncErr.message : String(syncErr),
    };
  }

  if (transfer.status === "paid" || transfer.status === "cancelled") {
    return {
      success: false,
      reason: `Transfer is already ${transfer.status}`,
      diagnostics: syncDiagnostics,
    };
  }

  if (transfer.status === "processing") {
    const timeoutMs = await getTransferProcessingTimeoutMs();
    if (!isProcessingStale(transfer.updated_at, timeoutMs)) {
      const remainingMin = Math.ceil(
        (timeoutMs - (Date.now() - new Date(transfer.updated_at).getTime())) /
          60000,
      );
      return {
        success: false,
        reason: `Transfer is processing — admin recovery allowed in ~${remainingMin} minute(s)`,
        diagnostics: syncDiagnostics,
      };
    }

    if (transfer.stripe_transfer_id) {
      await reconcileTransferPaid(
        transfer as TransferRow,
        transfer.stripe_transfer_id,
        transfer.net_amount_cents,
        new Date().toISOString(),
      );
      if (options?.adminUserId) {
        await writeAdminAuditLog({
          action: "admin.transfer.recover_processing",
          adminUserId: options.adminUserId,
          entityType: "transfers",
          entityId: transferId,
          result: "reconciled",
          metadata: {
            stripe_transfer_id: transfer.stripe_transfer_id,
            diagnostics: syncDiagnostics,
          },
        });
      }
      return {
        success: true,
        reason: "Reconciled stuck processing transfer",
        diagnostics: syncDiagnostics,
        recovered: true,
      };
    }

    assertSupabaseWrite(
      await client
        .from("transfers")
        .update({
          status: "failed",
          failure_reason: "Recovered from stuck processing state",
          next_retry_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", transfer.id)
        .eq("status", "processing")
        .select("id"),
      "recover stuck processing transfer",
    );
  }

  const result = await executeSingleTransfer(transfer as TransferRow);

  if (options?.adminUserId) {
    await writeAdminAuditLog({
      action: "admin.transfer.retry",
      adminUserId: options.adminUserId,
      entityType: "transfers",
      entityId: transferId,
      result: result.success ? "success" : "failed",
      metadata: {
        reason: result.reason,
        diagnostics: syncDiagnostics,
      },
    });
  }

  return { ...result, diagnostics: syncDiagnostics };
}

export async function processEligibleTransfers(): Promise<{
  processed: number;
  failed: number;
  skipped: number;
}> {
  await validateTransferSchemaOnStartup();
  const client = getServiceRoleClient();
  const now = new Date().toISOString();

  const { data: primaryRows } = await client
    .from("transfers")
    .select("*")
    .in("status", ["scheduled", "pending"])
    .lte("scheduled_at", now)
    .limit(25);

  const { data: retryRows } = await client
    .from("transfers")
    .select("*")
    .eq("status", "failed")
    .not("next_retry_at", "is", null)
    .lte("next_retry_at", now)
    .limit(25);

  const seen = new Set<string>();
  const rows = [...(primaryRows ?? []), ...(retryRows ?? [])].filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  }).slice(0, 25);

  let processed = 0;
  let failed = 0;
  let skipped = 0;

  for (const transfer of rows) {
    const result = await executeSingleTransfer(transfer as TransferRow);
    if (result.success) {
      processed++;
    } else if (
      result.reason === "Transfer already being processed by another worker"
    ) {
      skipped++;
    } else {
      failed++;
    }
  }

  return { processed, failed, skipped };
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
