import type { BookingStatus } from "./booking";

export type BookingPaymentDisplayStatus =
  | "awaiting_payment"
  | "payment_processing"
  | "paid"
  | "refunded"
  | "duplicate_payment"
  | "manual_review"
  | "payment_failed";

export interface PaymentRowLike {
  id: string;
  status: string;
  stripe_payment_intent_id?: string | null;
  stripe_checkout_session_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface BookingPaymentStatusPresentation {
  status: BookingPaymentDisplayStatus;
  label: string;
  description: string;
  tone: "neutral" | "warning" | "success" | "error" | "info";
  showPayNow: boolean;
  showPaidBadge: boolean;
  canCreateCheckout: boolean;
}

const PAID_BOOKING_STATUSES: BookingStatus[] = [
  "confirmed",
  "en_route",
  "arrived",
  "cooking",
  "awaiting_family_confirmation",
  "completed",
];

const PAYABLE_BOOKING_STATUSES: BookingStatus[] = ["accepted", "awaiting_payment"];

function isDuplicatePayment(payment: PaymentRowLike): boolean {
  const meta = payment.metadata ?? {};
  return meta.duplicate === true || meta.reconciliation_status === "duplicate";
}

function isManualReview(payment: PaymentRowLike): boolean {
  const meta = payment.metadata ?? {};
  return meta.reconciliation_status === "manual_review";
}

export function resolveBookingPaymentStatus(input: {
  bookingStatus: BookingStatus | string;
  payments?: PaymentRowLike[];
}): BookingPaymentStatusPresentation {
  const payments = input.payments ?? [];
  const bookingStatus = input.bookingStatus as BookingStatus;
  const succeeded = payments.filter((p) => p.status === "succeeded");
  const duplicates = succeeded.filter(isDuplicatePayment);
  const primarySucceeded = succeeded.filter((p) => !isDuplicatePayment(p));
  const processing = payments.some((p) => p.status === "processing");
  const failed = payments.some((p) => p.status === "failed");
  const manualReview = payments.some(isManualReview);
  const refunded = payments.some(
    (p) => p.status === "refunded" || p.status === "partially_refunded",
  );

  const bookingPaid = PAID_BOOKING_STATUSES.includes(bookingStatus);

  if (manualReview || duplicates.length > 0) {
    return {
      status: duplicates.length > 0 ? "duplicate_payment" : "manual_review",
      label: duplicates.length > 0 ? "Duplicate Payment" : "Manual Review",
      description:
        duplicates.length > 0
          ? "An extra payment was detected for this booking. Our team has been notified and will resolve it."
          : "This payment needs manual review before the booking can continue.",
      tone: "warning",
      showPayNow: false,
      showPaidBadge: bookingPaid,
      canCreateCheckout: false,
    };
  }

  if (refunded) {
    return {
      status: "refunded",
      label: "Refunded",
      description: "This booking payment was refunded.",
      tone: "neutral",
      showPayNow: false,
      showPaidBadge: false,
      canCreateCheckout: false,
    };
  }

  if (bookingPaid || primarySucceeded.length > 0) {
    return {
      status: "paid",
      label: "Paid",
      description: "Payment received. Your booking is confirmed.",
      tone: "success",
      showPayNow: false,
      showPaidBadge: true,
      canCreateCheckout: false,
    };
  }

  if (processing) {
    return {
      status: "payment_processing",
      label: "Payment Processing",
      description: "Your payment is processing. This page will update automatically.",
      tone: "info",
      showPayNow: false,
      showPaidBadge: false,
      canCreateCheckout: false,
    };
  }

  if (failed) {
    return {
      status: "payment_failed",
      label: "Payment Failed",
      description: "Your last payment attempt failed. You can try again.",
      tone: "error",
      showPayNow: PAYABLE_BOOKING_STATUSES.includes(bookingStatus),
      showPaidBadge: false,
      canCreateCheckout: PAYABLE_BOOKING_STATUSES.includes(bookingStatus),
    };
  }

  return {
    status: "awaiting_payment",
    label: "Awaiting Payment",
    description: "Complete payment to confirm your booking.",
    tone: "warning",
    showPayNow: PAYABLE_BOOKING_STATUSES.includes(bookingStatus),
    showPaidBadge: false,
    canCreateCheckout: PAYABLE_BOOKING_STATUSES.includes(bookingStatus),
  };
}
