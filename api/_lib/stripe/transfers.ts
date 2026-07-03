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
  getRetryDelayMs,
} from "../../../shared/transferStatus.js";
import {
  buildTransferExecutionResult,
  classifyStripeTransferFailure,
  parseStripeError,
  type TransferExecutionResult,
} from "./transferDiagnostics.js";
import {
  assertSupabaseWrite,
  claimTransferForProcessing,
  cookTransferIdempotencyKey,
  getTransferProcessingTimeoutMs,
  isProcessingStale,
  validateTransferSchemaOnStartup,
  type TransferClaimRow,
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
  failureCategory = "unknown",
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
    now.getTime() + getRetryDelayMs(nextRetryCount - 1, failureCategory),
  );

  await client
    .from("transfers")
    .update({
      status: "retry_scheduled",
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

function logTransferExecution(
  event: string,
  result: TransferExecutionResult,
  extra: Record<string, unknown> = {},
): void {
  const payload = {
    event,
    transferId: result.transferId,
    bookingId: result.bookingId,
    chefProfileId: result.chefProfileId,
    stripeAccountId: result.stripeAccountId,
    stripeTransferId: result.stripeTransferId,
    amountCents: result.amountCents,
    recoveryAction: result.recoveryAction,
    retryCount: result.retryCount,
    durationMs: result.durationMs,
    stripeRequestId: result.stripe?.requestId ?? null,
    stripeCode: result.stripe?.code ?? null,
    stripeType: result.stripe?.type ?? null,
    ...extra,
  };

  if (result.success) {
    apiLogger.info("Transfer execution succeeded", payload);
  } else {
    apiLogger.warn("Transfer execution completed with recovery", {
      ...payload,
      reason: result.reason,
      stripeMessage: result.stripe?.message ?? null,
    });
  }
}

export async function executeSingleTransfer(
  transfer: TransferRow,
): Promise<TransferExecutionResult> {
  const started = Date.now();
  const base = (partial: Partial<TransferExecutionResult>): TransferExecutionResult => ({
    success: false,
    transferId: transfer.id,
    bookingId: transfer.booking_id ?? null,
    chefProfileId: transfer.chef_profile_id ?? null,
    stripeAccountId: null,
    stripeTransferId: transfer.stripe_transfer_id ?? null,
    amountCents: transfer.net_amount_cents ?? null,
    recoveryAction: "failed",
    stripe: null,
    durationMs: Date.now() - started,
    ...partial,
  });

  try {
    await validateTransferSchemaOnStartup();
  } catch (err) {
    const reason =
      err instanceof Error ? err.message : "Transfer schema validation failed";
    const result = buildTransferExecutionResult({
      success: false,
      transferId: transfer.id,
      bookingId: transfer.booking_id,
      chefProfileId: transfer.chef_profile_id,
      amountCents: transfer.net_amount_cents,
      recoveryAction: "action_required",
      reason,
      err,
      durationMs: Date.now() - started,
    });
    logTransferExecution("transfer_schema_validation_failed", result);
    return result;
  }

  try {
    const client = getServiceRoleClient();
    const stripe = getStripe();
    const now = new Date().toISOString();
    const maxRetries = await getTransferMaxRetryCount();

    const { data: freshRow, error: freshError } = await client
      .from("transfers")
      .select("*")
      .eq("id", transfer.id)
      .maybeSingle();

    if (freshError) {
      const result = buildTransferExecutionResult({
        success: false,
        transferId: transfer.id,
        bookingId: transfer.booking_id,
        chefProfileId: transfer.chef_profile_id,
        amountCents: transfer.net_amount_cents,
        recoveryAction: "retry_scheduled",
        reason: `Failed to load transfer: ${freshError.message}`,
        err: freshError,
        durationMs: Date.now() - started,
      });
      logTransferExecution("transfer_load_failed", result);
      return result;
    }

    if (!freshRow) {
      const result = base({
        success: false,
        recoveryAction: "skipped",
        reason: "Transfer not found",
      });
      logTransferExecution("transfer_not_found", result);
      return result;
    }

    transfer = freshRow as TransferRow;

    if (transfer.status === "paid") {
      const result = buildTransferExecutionResult({
        success: true,
        transferId: transfer.id,
        bookingId: transfer.booking_id,
        chefProfileId: transfer.chef_profile_id,
        stripeTransferId: transfer.stripe_transfer_id,
        amountCents: transfer.net_amount_cents,
        recoveryAction: "idempotent_success",
        reason: "Transfer already paid",
        durationMs: Date.now() - started,
        idempotent: true,
      });
      logTransferExecution("transfer_already_paid", result);
      return result;
    }

    if (transfer.stripe_transfer_id) {
      try {
        await reconcileTransferPaid(
          transfer,
          transfer.stripe_transfer_id,
          transfer.net_amount_cents,
          now,
        );
        const result = buildTransferExecutionResult({
          success: true,
          transferId: transfer.id,
          bookingId: transfer.booking_id,
          chefProfileId: transfer.chef_profile_id,
          stripeTransferId: transfer.stripe_transfer_id,
          amountCents: transfer.net_amount_cents,
          recoveryAction: "idempotent_success",
          reason: "Reconciled existing Stripe transfer",
          durationMs: Date.now() - started,
          idempotent: true,
        });
        logTransferExecution("transfer_reconciled_existing_stripe_id", result);
        return result;
      } catch (err) {
        const result = buildTransferExecutionResult({
          success: false,
          transferId: transfer.id,
          bookingId: transfer.booking_id,
          chefProfileId: transfer.chef_profile_id,
          stripeTransferId: transfer.stripe_transfer_id,
          amountCents: transfer.net_amount_cents,
          recoveryAction: "retry_scheduled",
          reason:
            err instanceof Error
              ? `Reconcile existing Stripe transfer failed: ${err.message}`
              : "Reconcile existing Stripe transfer failed",
          err,
          durationMs: Date.now() - started,
        });
        logTransferExecution("transfer_reconcile_existing_failed", result);
        return result;
      }
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
      const result = base({
        success: false,
        recoveryAction: "cancelled",
        reason: "Payment refunded or unavailable",
      });
      logTransferExecution("transfer_cancelled_refunded_payment", result);
      return result;
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
      const result = base({
        success: false,
        recoveryAction: "cancelled",
        reason: "No remaining cook payout after refund",
      });
      logTransferExecution("transfer_cancelled_no_remaining_payout", result);
      return result;
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

    const stripeAccountId = stripeAccount?.stripe_account_id ?? null;

    if (!stripeAccount?.payouts_enabled || !stripeAccountId) {
      apiLogger.warn("Transfer skipped — cook Connect onboarding incomplete", {
        transferId: transfer.id,
        bookingId: transfer.booking_id,
        chefProfileId: transfer.chef_profile_id,
        stripeAccountId,
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

      const result = buildTransferExecutionResult({
        success: false,
        transferId: transfer.id,
        bookingId: transfer.booking_id,
        chefProfileId: transfer.chef_profile_id,
        stripeAccountId,
        amountCents: netCents,
        recoveryAction: "skipped",
        reason: "Cook Connect onboarding incomplete",
        durationMs: Date.now() - started,
      });
      logTransferExecution("transfer_skipped_connect_incomplete", result);
      return result;
    }

    let claimed: TransferClaimRow | null;
    try {
      claimed = await claimTransferForProcessing(transfer.id);
    } catch (err) {
      const result = buildTransferExecutionResult({
        success: false,
        transferId: transfer.id,
        bookingId: transfer.booking_id,
        chefProfileId: transfer.chef_profile_id,
        stripeAccountId,
        amountCents: netCents,
        recoveryAction: "retry_scheduled",
        reason:
          err instanceof Error
            ? `Transfer claim failed: ${err.message}`
            : "Transfer claim failed",
        err,
        retryCount: transfer.retry_count,
        durationMs: Date.now() - started,
      });
      logTransferExecution("transfer_claim_error", result);
      return result;
    }

    if (!claimed) {
      const result = buildTransferExecutionResult({
        success: false,
        transferId: transfer.id,
        bookingId: transfer.booking_id,
        chefProfileId: transfer.chef_profile_id,
        stripeAccountId,
        amountCents: netCents,
        recoveryAction: "skipped",
        reason: "Transfer already being processed by another worker",
        retryCount: transfer.retry_count,
        durationMs: Date.now() - started,
      });
      logTransferExecution("transfer_claim_skipped", result);
      return result;
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
          destination: stripeAccountId,
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

      try {
        await reconcileTransferPaid(
          transfer,
          stripeTransfer.id,
          netCents,
          now,
        );
      } catch (err) {
        const result = buildTransferExecutionResult({
          success: false,
          transferId: transfer.id,
          bookingId: transfer.booking_id,
          chefProfileId: transfer.chef_profile_id,
          stripeAccountId,
          stripeTransferId: stripeTransfer.id,
          amountCents: netCents,
          recoveryAction: "retry_scheduled",
          reason:
            err instanceof Error
              ? `Stripe transfer created but reconcile failed: ${err.message}`
              : "Stripe transfer created but reconcile failed",
          err,
          retryCount: transfer.retry_count,
          durationMs: Date.now() - started,
        });
        logTransferExecution("transfer_reconcile_after_create_failed", result);
        return result;
      }

      const result = buildTransferExecutionResult({
        success: true,
        transferId: transfer.id,
        bookingId: transfer.booking_id,
        chefProfileId: transfer.chef_profile_id,
        stripeAccountId,
        stripeTransferId: stripeTransfer.id,
        amountCents: netCents,
        recoveryAction: "success",
        durationMs: Date.now() - started,
      });
      logTransferExecution("transfer_paid", result);
      return result;
    } catch (err) {
      const stripeDiag = parseStripeError(err);
      const classification = classifyStripeTransferFailure(err);
      const message = stripeDiag.message;

      if (classification.recoveryAction === "idempotent_success") {
        if (transfer.stripe_transfer_id) {
          try {
            await reconcileTransferPaid(
              transfer,
              transfer.stripe_transfer_id,
              netCents,
              now,
            );
            const result = buildTransferExecutionResult({
              success: true,
              transferId: transfer.id,
              bookingId: transfer.booking_id,
              chefProfileId: transfer.chef_profile_id,
              stripeAccountId,
              stripeTransferId: transfer.stripe_transfer_id,
              amountCents: netCents,
              recoveryAction: "idempotent_success",
              reason: message,
              err,
              retryCount: transfer.retry_count,
              durationMs: Date.now() - started,
              idempotent: true,
            });
            logTransferExecution("transfer_duplicate_reconciled", result);
            return result;
          } catch (reconcileErr) {
            apiLogger.warn("Duplicate transfer reconcile failed", {
              transferId: transfer.id,
              stripeTransferId: transfer.stripe_transfer_id,
              message:
                reconcileErr instanceof Error
                  ? reconcileErr.message
                  : String(reconcileErr),
            });
          }
        }

        try {
          const listed = await stripe.transfers.list({
            destination: stripeAccountId,
            limit: 25,
          });
          const existing = listed.data.find(
            (row) => row.metadata?.transfer_id === transfer.id,
          );
          if (existing) {
            await reconcileTransferPaid(transfer, existing.id, netCents, now);
            const result = buildTransferExecutionResult({
              success: true,
              transferId: transfer.id,
              bookingId: transfer.booking_id,
              chefProfileId: transfer.chef_profile_id,
              stripeAccountId,
              stripeTransferId: existing.id,
              amountCents: netCents,
              recoveryAction: "idempotent_success",
              reason: "Reconciled existing Stripe transfer (duplicate)",
              err,
              retryCount: transfer.retry_count,
              durationMs: Date.now() - started,
              idempotent: true,
            });
            logTransferExecution("transfer_duplicate_found_in_stripe", result);
            return result;
          }
        } catch (lookupErr) {
          apiLogger.warn("Stripe transfer lookup for duplicate failed", {
            transferId: transfer.id,
            message:
              lookupErr instanceof Error ? lookupErr.message : String(lookupErr),
          });
        }

        await scheduleTransferRetry(
          transfer,
          message,
          maxRetries,
          classification.category,
        );
        const result = buildTransferExecutionResult({
          success: false,
          transferId: transfer.id,
          bookingId: transfer.booking_id,
          chefProfileId: transfer.chef_profile_id,
          stripeAccountId,
          amountCents: netCents,
          recoveryAction: "retry_scheduled",
          reason: `Duplicate transfer — scheduled reconcile retry: ${message}`,
          err,
          retryCount: (transfer.retry_count ?? 0) + 1,
          durationMs: Date.now() - started,
        });
        logTransferExecution("transfer_duplicate_retry_scheduled", result);
        return result;
      }

      if (classification.retryable) {
        await scheduleTransferRetry(
          transfer,
          message,
          maxRetries,
          classification.category,
        );
        const result = buildTransferExecutionResult({
          success: false,
          transferId: transfer.id,
          bookingId: transfer.booking_id,
          chefProfileId: transfer.chef_profile_id,
          stripeAccountId,
          amountCents: netCents,
          recoveryAction: "retry_scheduled",
          reason: message,
          err,
          retryCount: (transfer.retry_count ?? 0) + 1,
          durationMs: Date.now() - started,
        });
        logTransferExecution("transfer_retry_scheduled", result, {
          failureCategory: classification.category,
        });
        return result;
      }

      try {
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
      } catch (updateErr) {
        apiLogger.error("Failed to mark transfer action_required", {
          transferId: transfer.id,
          bookingId: transfer.booking_id,
          message: updateErr instanceof Error ? updateErr.message : String(updateErr),
        });
      }

      await notifyCookTransfer(transfer.chef_profile_id, {
        title: "Transfer Failed",
        message:
          "We could not transfer your earnings. Please verify your Stripe account or contact support.",
        type: "error",
        event: "transfer_failed",
        metadata: { transfer_id: transfer.id, failure_reason: message },
      });

      const result = buildTransferExecutionResult({
        success: false,
        transferId: transfer.id,
        bookingId: transfer.booking_id,
        chefProfileId: transfer.chef_profile_id,
        stripeAccountId,
        amountCents: netCents,
        recoveryAction: "action_required",
        reason: message,
        err,
        retryCount: transfer.retry_count,
        durationMs: Date.now() - started,
      });
      logTransferExecution("transfer_action_required", result, {
        failureCategory: classification.category,
      });
      return result;
    }
  } catch (err) {
    const result = buildTransferExecutionResult({
      success: false,
      transferId: transfer.id,
      bookingId: transfer.booking_id,
      chefProfileId: transfer.chef_profile_id,
      stripeTransferId: transfer.stripe_transfer_id,
      amountCents: transfer.net_amount_cents,
      recoveryAction: "retry_scheduled",
      reason: err instanceof Error ? err.message : "Unexpected transfer failure",
      err,
      retryCount: transfer.retry_count,
      durationMs: Date.now() - started,
    });
    logTransferExecution("transfer_unexpected_error", result);
    return result;
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
  const { data: transferRow, error } = await client
    .from("transfers")
    .select("*")
    .eq("id", transferId)
    .maybeSingle();

  if (error) throw error;
  if (!transferRow) {
    return { success: false, reason: "Transfer not found" };
  }

  let transfer = transferRow;

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
          status: "retry_scheduled",
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

  if (transfer.status === "action_required") {
    if (transfer.stripe_transfer_id) {
      try {
        await reconcileTransferPaid(
          transfer as TransferRow,
          transfer.stripe_transfer_id,
          transfer.net_amount_cents,
          new Date().toISOString(),
        );
        if (options?.adminUserId) {
          await writeAdminAuditLog({
            action: "admin.transfer.recover_action_required",
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
          reason: "Reconciled action_required transfer with existing Stripe transfer",
          diagnostics: syncDiagnostics,
          recovered: true,
        };
      } catch (reconcileErr) {
        return {
          success: false,
          reason:
            reconcileErr instanceof Error
              ? `Transfer is action_required with Stripe transfer ${transfer.stripe_transfer_id} but reconcile failed: ${reconcileErr.message}`
              : "Transfer is action_required — reconcile failed",
          diagnostics: syncDiagnostics,
        };
      }
    }

    const recoveredAt = new Date().toISOString();
    const previousFailureReason = transfer.failure_reason ?? null;

    assertSupabaseWrite(
      await client
        .from("transfers")
        .update({
          status: "retry_scheduled",
          next_retry_at: recoveredAt,
          failure_reason: previousFailureReason,
          last_retry_reason: "Admin recovery: re-queued from action_required",
          last_retry_at: recoveredAt,
          updated_at: recoveredAt,
          metadata: {
            ...((transfer.metadata as Record<string, unknown>) ?? {}),
            admin_recovery_from_action_required: {
              at: recoveredAt,
              admin_user_id: options?.adminUserId ?? null,
              previous_failure_reason: previousFailureReason,
            },
          },
        })
        .eq("id", transfer.id)
        .eq("status", "action_required")
        .select("id"),
      "recover action_required transfer for admin retry",
    );

    if (options?.adminUserId) {
      await writeAdminAuditLog({
        action: "admin.transfer.recover_action_required",
        adminUserId: options.adminUserId,
        entityType: "transfers",
        entityId: transferId,
        result: "queued_for_retry",
        metadata: {
          previous_failure_reason: previousFailureReason,
          retry_count: transfer.retry_count,
          diagnostics: syncDiagnostics,
        },
      });
    }

    const { data: refreshed, error: refreshError } = await client
      .from("transfers")
      .select("*")
      .eq("id", transferId)
      .maybeSingle();
    if (refreshError) throw refreshError;
    if (refreshed) {
      transfer = refreshed;
    }
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

  let finalResult = { ...result, diagnostics: syncDiagnostics };

  if (
    !result.success &&
    result.reason === "Transfer already being processed by another worker"
  ) {
    const { data: currentRow } = await client
      .from("transfers")
      .select("status")
      .eq("id", transferId)
      .maybeSingle();

    if (currentRow?.status === "action_required") {
      finalResult = {
        ...finalResult,
        reason:
          "Transfer status is action_required and was not queued for retry. Admin recovery must reset it to retry_scheduled before processing.",
      };
    } else if (currentRow?.status === "processing") {
      finalResult = {
        ...finalResult,
        reason:
          "Transfer is processing — another worker holds the claim. Wait for completion or the processing timeout.",
      };
    }
  }

  return finalResult;
}

export async function processEligibleTransfers(): Promise<{
  processed: number;
  failed: number;
  skipped: number;
  results: TransferExecutionResult[];
  batchError?: {
    reason: string;
    recoveryAction: "action_required";
    stack?: string;
  };
}> {
  const batchStarted = Date.now();
  const results: TransferExecutionResult[] = [];

  try {
    await validateTransferSchemaOnStartup();
  } catch (err) {
    const reason =
      err instanceof Error ? err.message : "Transfer schema validation failed";
    apiLogger.error("Transfer batch schema validation failed", {
      reason,
      durationMs: Date.now() - batchStarted,
    });
    return {
      processed: 0,
      failed: 0,
      skipped: 0,
      results: [],
      batchError: {
        reason,
        recoveryAction: "action_required",
        stack:
          err instanceof Error && process.env.NODE_ENV === "development"
            ? err.stack
            : undefined,
      },
    };
  }

  const client = getServiceRoleClient();
  const now = new Date().toISOString();

  let primaryRows: TransferRow[] | null = null;
  let retryRows: TransferRow[] | null = null;

  try {
    const primary = await client
      .from("transfers")
      .select("*")
      .in("status", ["scheduled", "pending"])
      .lte("scheduled_at", now)
      .limit(25);
    if (primary.error) throw primary.error;
    primaryRows = (primary.data ?? []) as TransferRow[];

    const retry = await client
      .from("transfers")
      .select("*")
      .in("status", ["failed", "retry_scheduled"])
      .not("next_retry_at", "is", null)
      .lte("next_retry_at", now)
      .limit(25);
    if (retry.error) throw retry.error;
    retryRows = (retry.data ?? []) as TransferRow[];
  } catch (err) {
    const reason =
      err instanceof Error ? err.message : "Failed to load eligible transfers";
    apiLogger.error("Transfer batch query failed", {
      reason,
      durationMs: Date.now() - batchStarted,
    });
    return {
      processed: 0,
      failed: 0,
      skipped: 0,
      results: [],
      batchError: {
        reason,
        recoveryAction: "action_required",
        stack:
          err instanceof Error && process.env.NODE_ENV === "development"
            ? err.stack
            : undefined,
      },
    };
  }

  const seen = new Set<string>();
  const rows = [...primaryRows, ...retryRows].filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  }).slice(0, 25);

  let processed = 0;
  let failed = 0;
  let skipped = 0;

  for (const transfer of rows) {
    let result: TransferExecutionResult;
    try {
      result = await executeSingleTransfer(transfer);
    } catch (err) {
      result = buildTransferExecutionResult({
        success: false,
        transferId: transfer.id,
        bookingId: transfer.booking_id,
        chefProfileId: transfer.chef_profile_id,
        stripeTransferId: transfer.stripe_transfer_id,
        amountCents: transfer.net_amount_cents,
        recoveryAction: "retry_scheduled",
        reason: err instanceof Error ? err.message : "Unexpected transfer error",
        err,
        retryCount: transfer.retry_count,
        durationMs: 0,
      });
      logTransferExecution("transfer_execute_threw", result);
    }

    results.push(result);

    if (result.success) {
      processed++;
    } else if (result.recoveryAction === "skipped") {
      skipped++;
    } else if (
      result.recoveryAction === "cancelled" ||
      result.recoveryAction === "action_required" ||
      result.recoveryAction === "retry_scheduled" ||
      result.recoveryAction === "failed"
    ) {
      failed++;
    }
  }

  apiLogger.info("Transfer batch completed", {
    processed,
    failed,
    skipped,
    candidateCount: rows.length,
    durationMs: Date.now() - batchStarted,
  });

  return { processed, failed, skipped, results };
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
