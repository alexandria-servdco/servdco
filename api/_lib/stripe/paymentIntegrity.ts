import type Stripe from "stripe";
import { getStripe } from "./server.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { assertSupabaseWrite } from "./transferIntegrity.js";
import { createUserNotification, writePaymentAuditLog } from "./ledger.js";
import { apiLogger } from "../logger.js";
import { stripeIdempotencyKey } from "./helpers.js";
import type { ResolvedPayment } from "./payment-resolve.js";
import { sendResendEmail } from "../email/resend.js";
import { resolveSiteUrl } from "../email/brandedTemplate.js";

export interface PaymentRecord extends ResolvedPayment {
  stripe_payment_intent_id?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_charge_id?: string | null;
  metadata?: Record<string, unknown> | null;
  cook_profile_id?: string;
}

export interface ConfirmPaymentResult {
  paymentId: string;
  bookingId: string;
  bookingConfirmed: boolean;
  duplicate: boolean;
  alreadyConfirmed: boolean;
}

export interface ReconcileBookingResult {
  bookingId: string;
  repaired: boolean;
  bookingConfirmed: boolean;
  duplicateDetected: boolean;
  paymentsSynced: number;
  message: string;
}

export interface BatchReconcileResult {
  scanned: number;
  repaired: number;
  duplicates: number;
  errors: string[];
}

export interface PaymentLedgerStep {
  id: string;
  label: string;
  status: "complete" | "current" | "pending" | "failed" | "warning";
  timestamp: string | null;
  detail: string | null;
}

const PAYABLE_BOOKING_STATUSES = ["accepted", "awaiting_payment"] as const;
const CONFIRMED_BOOKING_STATUSES = [
  "confirmed",
  "en_route",
  "arrived",
  "cooking",
  "awaiting_family_confirmation",
  "completed",
] as const;

export function bookingPaymentIntentIdempotencyKey(bookingId: string): string {
  return stripeIdempotencyKey("booking_payment", bookingId);
}

async function listPaymentsForBooking(
  bookingId: string,
): Promise<PaymentRecord[]> {
  const client = getServiceRoleClient();
  const { data, error } = await client
    .from("payments")
    .select(
      "id, booking_id, family_id, chef_profile_id, status, amount_cents, currency, stripe_payment_intent_id, stripe_checkout_session_id, stripe_charge_id, metadata",
    )
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PaymentRecord[];
}

function isDuplicateMetadata(metadata: Record<string, unknown> | null | undefined): boolean {
  return metadata?.duplicate === true;
}

async function notifyBookingPaid(params: {
  payment: PaymentRecord;
  bookingId: string;
  duplicate: boolean;
}): Promise<void> {
  if (params.duplicate) {
    await createUserNotification({
      userId: params.payment.family_id,
      title: "Duplicate Payment Detected",
      message:
        "We received an extra payment for this booking. Our team will review and issue a refund or credit if needed.",
      type: "warning",
      metadata: {
        booking_id: params.bookingId,
        payment_id: params.payment.id,
        event: "duplicate_payment_detected",
      },
    });
    return;
  }

  await createUserNotification({
    userId: params.payment.family_id,
    title: "Payment Successful",
    message:
      "Your booking is confirmed. Your cook will arrive at the scheduled time.",
    type: "success",
    metadata: {
      booking_id: params.bookingId,
      payment_id: params.payment.id,
      event: "payment_successful",
    },
  });

  const client = getServiceRoleClient();
  const { data: chefProfile } = await client
    .from("chef_profiles")
    .select("user_id")
    .eq("id", params.payment.chef_profile_id)
    .maybeSingle();

  if (chefProfile?.user_id) {
    await createUserNotification({
      userId: chefProfile.user_id,
      title: "Booking Paid",
      message: "A family has paid for their booking. You can begin the service workflow.",
      type: "success",
      metadata: {
        booking_id: params.bookingId,
        payment_id: params.payment.id,
        event: "booking_paid_cook",
      },
    });
  }

  const { data: familyProfile } = await client
    .from("profiles")
    .select("email, full_name")
    .eq("id", params.payment.family_id)
    .maybeSingle();

  if (familyProfile?.email) {
    await sendResendEmail({
      to: familyProfile.email,
      subject: "Servd Co — Payment Confirmed",
      html: `
        <p>Hi ${familyProfile.full_name ?? "there"},</p>
        <p>Your payment is confirmed and your booking is now confirmed.</p>
        <p><a href="${resolveSiteUrl()}/family-dashboard/bookings">View your dashboard</a></p>
      `,
    });
  }
}

/** Mark payment succeeded and confirm booking — idempotent, duplicate-safe. */
export async function confirmBookingFromPayment(params: {
  payment: PaymentRecord;
  source:
    | "checkout.session.completed"
    | "payment_intent.succeeded"
    | "reconciliation";
  stripeEventId?: string;
  paymentIntentId?: string | null;
  chargeId?: string | null;
  amountCents?: number;
  currency?: string;
  notify?: boolean;
}): Promise<ConfirmPaymentResult> {
  const client = getServiceRoleClient();
  const bookingId = params.payment.booking_id;
  const notify = params.notify ?? true;

  const { data: booking } = await client
    .from("bookings")
    .select("id, status, payment_id, family_id, chef_profile_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found for payment ${params.payment.id}`);
  }

  const allPayments = await listPaymentsForBooking(bookingId);
  const primarySucceeded = allPayments.find(
    (p) => p.status === "succeeded" && !isDuplicateMetadata(p.metadata),
  );

  const bookingAlreadyPaid = CONFIRMED_BOOKING_STATUSES.includes(
    booking.status as (typeof CONFIRMED_BOOKING_STATUSES)[number],
  );

  const isDuplicateAttempt =
    Boolean(primarySucceeded && primarySucceeded.id !== params.payment.id) ||
    (bookingAlreadyPaid &&
      booking.payment_id != null &&
      booking.payment_id !== params.payment.id);

  if (isDuplicateAttempt) {
    const duplicateOf = primarySucceeded?.id ?? booking.payment_id ?? params.payment.id;
    await client
      .from("payments")
      .update({
        status: "succeeded",
        stripe_payment_intent_id:
          params.paymentIntentId ?? params.payment.stripe_payment_intent_id,
        stripe_charge_id: params.chargeId ?? params.payment.stripe_charge_id,
        amount_cents: params.amountCents ?? params.payment.amount_cents,
        currency: (params.currency ?? params.payment.currency ?? "USD").toUpperCase(),
        metadata: {
          ...(params.payment.metadata ?? {}),
          duplicate: true,
          duplicate_of: duplicateOf,
          reconciliation_status: "duplicate",
          duplicate_detected_at: new Date().toISOString(),
          duplicate_source: params.source,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.payment.id);

    await writePaymentAuditLog({
      action: "payment.duplicate_detected",
      paymentId: params.payment.id,
      actorId: params.payment.family_id,
      bookingId,
      metadata: {
        duplicate_of: duplicateOf,
        source: params.source,
        stripe_event_id: params.stripeEventId ?? null,
      },
    });

    if (notify) {
      await notifyBookingPaid({
        payment: params.payment,
        bookingId,
        duplicate: true,
      });
    }

    await createUserNotification({
      userId: params.payment.family_id,
      title: "Duplicate Payment — Review Required",
      message:
        "An extra payment was received for a booking that was already paid. Our team will review.",
      type: "warning",
      metadata: {
        booking_id: bookingId,
        payment_id: params.payment.id,
        event: "duplicate_payment_admin_review",
      },
    });

    return {
      paymentId: params.payment.id,
      bookingId,
      bookingConfirmed: false,
      duplicate: true,
      alreadyConfirmed: true,
    };
  }

  await client
    .from("payments")
    .update({
      stripe_payment_intent_id:
        params.paymentIntentId ?? params.payment.stripe_payment_intent_id,
      stripe_charge_id: params.chargeId ?? params.payment.stripe_charge_id,
      amount_cents: params.amountCents ?? params.payment.amount_cents,
      currency: (params.currency ?? params.payment.currency ?? "USD").toUpperCase(),
      status: "succeeded",
      metadata: {
        ...(params.payment.metadata ?? {}),
        reconciliation_status: "confirmed",
        confirmed_via: params.source,
        confirmed_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.payment.id)
    .in("status", ["pending", "processing", "succeeded"]);

  if (bookingAlreadyPaid && booking.payment_id === params.payment.id) {
    return {
      paymentId: params.payment.id,
      bookingId,
      bookingConfirmed: true,
      duplicate: false,
      alreadyConfirmed: true,
    };
  }

  if (!PAYABLE_BOOKING_STATUSES.includes(booking.status as (typeof PAYABLE_BOOKING_STATUSES)[number])) {
    if (bookingAlreadyPaid) {
      return {
        paymentId: params.payment.id,
        bookingId,
        bookingConfirmed: true,
        duplicate: false,
        alreadyConfirmed: true,
      };
    }
    apiLogger.warn("Payment succeeded but booking not in payable status", {
      bookingId,
      bookingStatus: booking.status,
      paymentId: params.payment.id,
      source: params.source,
    });
    return {
      paymentId: params.payment.id,
      bookingId,
      bookingConfirmed: false,
      duplicate: false,
      alreadyConfirmed: false,
    };
  }

  assertSupabaseWrite(
    await client
      .from("bookings")
      .update({
        payment_id: params.payment.id,
        status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .in("status", [...PAYABLE_BOOKING_STATUSES])
      .select("id"),
    `confirm booking ${bookingId} from payment ${params.payment.id}`,
  );

  await writePaymentAuditLog({
    action: "payment.booking_confirmed",
    paymentId: params.payment.id,
    actorId: params.payment.family_id,
    bookingId,
    newValues: { status: "confirmed", payment_id: params.payment.id },
    metadata: {
      source: params.source,
      stripe_event_id: params.stripeEventId ?? null,
      stripe_payment_intent_id: params.paymentIntentId ?? null,
    },
  });

  if (notify) {
    await notifyBookingPaid({
      payment: params.payment,
      bookingId,
      duplicate: false,
    });
  }

  return {
    paymentId: params.payment.id,
    bookingId,
    bookingConfirmed: true,
    duplicate: false,
    alreadyConfirmed: false,
  };
}

async function syncPaymentFromStripeIntent(
  payment: PaymentRecord,
  intent: Stripe.PaymentIntent,
): Promise<ConfirmPaymentResult | null> {
  if (intent.status !== "succeeded") return null;

  const chargeId =
    typeof intent.latest_charge === "string"
      ? intent.latest_charge
      : intent.latest_charge?.id;

  return confirmBookingFromPayment({
    payment,
    source: "reconciliation",
    paymentIntentId: intent.id,
    chargeId: chargeId ?? null,
    amountCents: intent.amount_received ?? payment.amount_cents,
    currency: intent.currency ?? payment.currency,
    notify: false,
  });
}

async function syncPaymentFromStripeSession(
  payment: PaymentRecord,
  session: Stripe.Checkout.Session,
): Promise<ConfirmPaymentResult | null> {
  if (session.payment_status !== "paid") return null;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  let chargeId: string | null = null;
  if (paymentIntentId) {
    try {
      const stripe = getStripe();
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      chargeId =
        typeof intent.latest_charge === "string"
          ? intent.latest_charge
          : intent.latest_charge?.id ?? null;
    } catch {
      chargeId = null;
    }
  }

  return confirmBookingFromPayment({
    payment,
    source: "reconciliation",
    paymentIntentId: paymentIntentId ?? null,
    chargeId,
    amountCents: session.amount_total ?? payment.amount_cents,
    currency: session.currency ?? payment.currency,
    notify: false,
  });
}

/** Repair a single booking by syncing Stripe truth into Supabase. */
export async function reconcileBookingPayment(
  bookingId: string,
  options?: { notify?: boolean },
): Promise<ReconcileBookingResult> {
  const client = getServiceRoleClient();
  const stripe = getStripe();
  const notify = options?.notify ?? false;

  const { data: booking } = await client
    .from("bookings")
    .select("id, status, payment_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    return {
      bookingId,
      repaired: false,
      bookingConfirmed: false,
      duplicateDetected: false,
      paymentsSynced: 0,
      message: "Booking not found.",
    };
  }

  const payments = await listPaymentsForBooking(bookingId);
  let paymentsSynced = 0;
  let duplicateDetected = false;
  let bookingConfirmed = CONFIRMED_BOOKING_STATUSES.includes(
    booking.status as (typeof CONFIRMED_BOOKING_STATUSES)[number],
  );

  for (const payment of payments) {
    if (payment.stripe_payment_intent_id) {
      try {
        const intent = await stripe.paymentIntents.retrieve(
          payment.stripe_payment_intent_id,
        );
        if (intent.status === "succeeded" && payment.status !== "succeeded") {
          const result = await syncPaymentFromStripeIntent(payment, intent);
          if (result) {
            paymentsSynced += 1;
            duplicateDetected = duplicateDetected || result.duplicate;
            bookingConfirmed = bookingConfirmed || result.bookingConfirmed;
          }
        } else if (
          intent.status === "succeeded" &&
          payment.status === "succeeded" &&
          !bookingConfirmed &&
          PAYABLE_BOOKING_STATUSES.includes(booking.status as (typeof PAYABLE_BOOKING_STATUSES)[number])
        ) {
          const result = await confirmBookingFromPayment({
            payment,
            source: "reconciliation",
            paymentIntentId: intent.id,
            notify,
          });
          paymentsSynced += 1;
          duplicateDetected = duplicateDetected || result.duplicate;
          bookingConfirmed = bookingConfirmed || result.bookingConfirmed;
        }
      } catch (err) {
        apiLogger.warn("Reconcile PI retrieve failed", {
          bookingId,
          paymentId: payment.id,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (payment.stripe_checkout_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(
          payment.stripe_checkout_session_id,
        );
        if (session.payment_status === "paid") {
          const result = await syncPaymentFromStripeSession(payment, session);
          if (result) {
            paymentsSynced += 1;
            duplicateDetected = duplicateDetected || result.duplicate;
            bookingConfirmed = bookingConfirmed || result.bookingConfirmed;
          }
        }
      } catch (err) {
        apiLogger.warn("Reconcile session retrieve failed", {
          bookingId,
          paymentId: payment.id,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  try {
    const search = await stripe.paymentIntents.search({
      query: `metadata['booking_id']:'${bookingId}' AND status:'succeeded'`,
      limit: 10,
    });
    for (const intent of search.data) {
      const paymentId = intent.metadata?.payment_id;
      let payment =
        payments.find((p) => p.id === paymentId) ??
        payments.find((p) => p.stripe_payment_intent_id === intent.id);

      if (!payment && paymentId) {
        const { data: byId } = await client
          .from("payments")
          .select(
            "id, booking_id, family_id, chef_profile_id, status, amount_cents, currency, stripe_payment_intent_id, stripe_checkout_session_id, stripe_charge_id, metadata",
          )
          .eq("id", paymentId)
          .maybeSingle();
        payment = (byId as PaymentRecord) ?? undefined;
      }

      if (payment) {
        const result = await syncPaymentFromStripeIntent(payment, intent);
        if (result) {
          paymentsSynced += 1;
          duplicateDetected = duplicateDetected || result.duplicate;
          bookingConfirmed = bookingConfirmed || result.bookingConfirmed;
        }
      }
    }
  } catch (err) {
    apiLogger.warn("Stripe payment intent search unavailable during reconcile", {
      bookingId,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  const repaired = paymentsSynced > 0 || bookingConfirmed;

  if (repaired) {
    await writePaymentAuditLog({
      action: "payment.reconciliation_executed",
      paymentId: payments[0]?.id ?? bookingId,
      bookingId,
      metadata: {
        payments_synced: paymentsSynced,
        booking_confirmed: bookingConfirmed,
        duplicate_detected: duplicateDetected,
      },
    });
  }

  return {
    bookingId,
    repaired,
    bookingConfirmed,
    duplicateDetected,
    paymentsSynced,
    message: repaired
      ? "Booking payment state reconciled with Stripe."
      : "No reconciliation changes required.",
  };
}

/** Scan bookings with succeeded payments but unpaid status. */
export async function reconcileAllPaymentMismatches(
  limit = 50,
): Promise<BatchReconcileResult> {
  const client = getServiceRoleClient();
  const errors: string[] = [];
  let repaired = 0;
  let duplicates = 0;

  const { data: mismatchedPayments, error } = await client
    .from("payments")
    .select("booking_id")
    .eq("status", "succeeded")
    .order("updated_at", { ascending: false })
    .limit(limit * 3);

  if (error) throw error;

  const bookingIds = [
    ...new Set((mismatchedPayments ?? []).map((p) => p.booking_id)),
  ].slice(0, limit);

  const { data: unpaidBookings } = await client
    .from("bookings")
    .select("id")
    .in("status", [...PAYABLE_BOOKING_STATUSES])
    .in("id", bookingIds.length > 0 ? bookingIds : ["00000000-0000-0000-0000-000000000000"]);

  const targets = new Set<string>([
    ...bookingIds,
    ...(unpaidBookings ?? []).map((b) => b.id),
  ]);

  for (const bookingId of [...targets].slice(0, limit)) {
    try {
      const result = await reconcileBookingPayment(bookingId);
      if (result.repaired) repaired += 1;
      if (result.duplicateDetected) duplicates += 1;
    } catch (err) {
      errors.push(
        `${bookingId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return {
    scanned: targets.size,
    repaired,
    duplicates,
    errors,
  };
}

export async function buildPaymentLedger(
  bookingId: string,
): Promise<PaymentLedgerStep[]> {
  const client = getServiceRoleClient();
  const steps: PaymentLedgerStep[] = [];

  const { data: booking } = await client
    .from("bookings")
    .select("id, status, payment_id, created_at, updated_at")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) return steps;

  steps.push({
    id: "booking_created",
    label: "Booking Created",
    status: "complete",
    timestamp: booking.created_at,
    detail: `Status: ${booking.status}`,
  });

  const payments = await listPaymentsForBooking(bookingId);
  const primaryPayment = payments.find(
    (p) => p.status === "succeeded" && !isDuplicateMetadata(p.metadata),
  ) ?? payments[0];

  if (primaryPayment?.stripe_checkout_session_id) {
    steps.push({
      id: "checkout_created",
      label: "Checkout Session Created",
      status: "complete",
      timestamp: null,
      detail: primaryPayment.stripe_checkout_session_id,
    });
  }

  if (primaryPayment?.stripe_payment_intent_id) {
    steps.push({
      id: "payment_intent_created",
      label: "PaymentIntent Created",
      status: "complete",
      timestamp: null,
      detail: primaryPayment.stripe_payment_intent_id,
    });
  }

  if (primaryPayment?.status === "succeeded") {
    steps.push({
      id: "stripe_payment_succeeded",
      label: "Stripe Payment Succeeded",
      status: "complete",
      timestamp: primaryPayment.metadata?.confirmed_at as string | null ?? null,
      detail: primaryPayment.stripe_payment_intent_id ?? null,
    });
  } else {
    steps.push({
      id: "stripe_payment_succeeded",
      label: "Stripe Payment Succeeded",
      status: "pending",
      timestamp: null,
      detail: null,
    });
  }

  const { data: auditLogs } = await client
    .from("audit_logs")
    .select("action, created_at")
    .eq("entity_type", "payments")
    .in("action", [
      "payment.checkout_completed",
      "payment.booking_confirmed",
      "payment.reconciliation_executed",
    ])
    .contains("metadata", { booking_id: bookingId })
    .order("created_at", { ascending: false })
    .limit(5);

  const webhookReceived = (auditLogs ?? []).some(
    (e) =>
      e.action === "payment.checkout_completed" ||
      e.action === "payment.booking_confirmed",
  );

  steps.push({
    id: "webhook_received",
    label: "Webhook Received",
    status: webhookReceived ? "complete" : "pending",
    timestamp: auditLogs?.[0]?.created_at ?? null,
    detail: auditLogs?.[0]?.action ?? null,
  });

  steps.push({
    id: "booking_marked_paid",
    label: "Booking Marked Paid",
    status: CONFIRMED_BOOKING_STATUSES.includes(
      booking.status as (typeof CONFIRMED_BOOKING_STATUSES)[number],
    )
      ? "complete"
      : primaryPayment?.status === "succeeded"
        ? "warning"
        : "pending",
    timestamp: booking.updated_at,
    detail: booking.status,
  });

  const duplicates = payments.filter(
    (p) => p.status === "succeeded" && isDuplicateMetadata(p.metadata),
  );
  if (duplicates.length > 0) {
    steps.push({
      id: "duplicate_payment",
      label: "Duplicate Payment Detected",
      status: "warning",
      timestamp: duplicates[0].metadata?.duplicate_detected_at as string | null ?? null,
      detail: `${duplicates.length} duplicate payment(s) flagged for review`,
    });
  }

  const { data: transfer } = await client
    .from("transfers")
    .select("id, status, scheduled_at, transferred_at, stripe_transfer_id")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (transfer) {
    steps.push({
      id: "transfer_scheduled",
      label: "Transfer Scheduled",
      status: transfer.scheduled_at ? "complete" : "pending",
      timestamp: transfer.scheduled_at,
      detail: transfer.status,
    });
    steps.push({
      id: "transfer_created",
      label: "Transfer Created",
      status: transfer.stripe_transfer_id ? "complete" : "pending",
      timestamp: transfer.transferred_at,
      detail: transfer.stripe_transfer_id,
    });
  }

  return steps;
}

export async function bookingHasSuccessfulPayment(
  bookingId: string,
): Promise<boolean> {
  const payments = await listPaymentsForBooking(bookingId);
  return payments.some(
    (p) => p.status === "succeeded" && !isDuplicateMetadata(p.metadata),
  );
}
