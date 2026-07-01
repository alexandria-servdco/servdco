export type TransferPipelineStatus =
  | "pending"
  | "scheduled"
  | "processing"
  | "paid"
  | "failed"
  | "retry_scheduled"
  | "cancelled"
  | "action_required";

export interface TransferRowLike {
  id: string;
  status: TransferPipelineStatus;
  failure_reason?: string | null;
  scheduled_at?: string | null;
  transferred_at?: string | null;
  payout_date?: string | null;
  stripe_transfer_id?: string | null;
  retry_count?: number;
  next_retry_at?: string | null;
  last_retry_at?: string | null;
  last_retry_reason?: string | null;
  created_at?: string;
  metadata?: Record<string, unknown> | null;
}

export interface TransferStatusPresentation {
  label: string;
  description: string;
  tone: "neutral" | "warning" | "success" | "error" | "info";
}

export function getTransferStatusPresentation(
  transfer: TransferRowLike,
): TransferStatusPresentation {
  const reason = transfer.failure_reason?.toLowerCase() ?? "";
  const metadata = transfer.metadata ?? {};

  if (transfer.status === "cancelled") {
    return {
      label: "Cancelled",
      description: transfer.failure_reason ?? "This payout was cancelled.",
      tone: "neutral",
    };
  }

  if (transfer.status === "action_required") {
    return {
      label: "Action Required",
      description:
        transfer.failure_reason ??
        "We need additional review before this payout can continue.",
      tone: "error",
    };
  }

  if (transfer.status === "paid") {
    return {
      label: "Transferred to Stripe",
      description: transfer.stripe_transfer_id
        ? "Funds were sent to your Stripe account. Stripe will deposit to your bank."
        : "Your earnings were transferred to your Stripe account.",
      tone: "success",
    };
  }

  if (transfer.status === "processing") {
    return {
      label: "Transfer Processing",
      description: "ServdCo is sending your earnings to Stripe.",
      tone: "info",
    };
  }

  if (transfer.status === "failed") {
    return {
      label: "Transfer Failed",
      description:
        transfer.failure_reason ??
        "We could not complete this transfer. Our team has been notified.",
      tone: "error",
    };
  }

  if (transfer.status === "retry_scheduled") {
    return {
      label: "Retry Scheduled",
      description: transfer.next_retry_at
        ? `We will retry automatically on ${new Date(transfer.next_retry_at).toLocaleString()}. ${transfer.last_retry_reason ?? transfer.failure_reason ?? ""}`.trim()
        : (transfer.failure_reason ?? "Automatic retry is scheduled."),
      tone: "warning",
    };
  }

  if (transfer.status === "scheduled") {
    if (transfer.scheduled_at && new Date(transfer.scheduled_at) > new Date()) {
      return {
        label: "Waiting for 24 Hour Hold",
        description: `Your payout is scheduled after the booking hold period on ${new Date(transfer.scheduled_at).toLocaleString()}.`,
        tone: "warning",
      };
    }
    return {
      label: "Preparing Stripe Transfer",
      description: "Your payout is queued and will be sent to Stripe shortly.",
      tone: "info",
    };
  }

  if (transfer.status === "pending") {
    if (reason.includes("onboarding incomplete")) {
      return {
        label: "Waiting for Bank Setup",
        description:
          "Connect and verify your bank account through Stripe to receive this payout.",
        tone: "warning",
      };
    }
    if (metadata.waiting_for_family_approval) {
      return {
        label: "Waiting for Family Approval",
        description: "This payout starts after the family confirms booking completion.",
        tone: "warning",
      };
    }
    return {
      label: "Pending",
      description:
        transfer.failure_reason ??
        "This payout is waiting for the next processing step.",
      tone: "warning",
    };
  }

  return {
    label: transfer.status,
    description: transfer.failure_reason ?? "",
    tone: "neutral",
  };
}

export interface TransferTimelineStage {
  id: string;
  label: string;
  description: string;
  timestamp: string | null;
  state: "complete" | "current" | "upcoming" | "failed";
}

export function buildTransferTimeline(
  transfer: TransferRowLike,
): TransferTimelineStage[] {
  const presentation = getTransferStatusPresentation(transfer);
  const isPaid = transfer.status === "paid";
  const isFailed =
    transfer.status === "failed" ||
    transfer.status === "retry_scheduled" ||
    transfer.status === "action_required";
  const isProcessing = transfer.status === "processing";
  const isScheduled =
    transfer.status === "scheduled" ||
    (transfer.status === "pending" &&
      !transfer.failure_reason?.includes("onboarding"));

  const stages: TransferTimelineStage[] = [
    {
      id: "booking_completed",
      label: "Booking Completed",
      description: "The cooking session was marked complete.",
      timestamp: transfer.created_at ?? null,
      state: "complete",
    },
    {
      id: "family_approved",
      label: "Family Approved",
      description: "The family confirmed completion so earnings could be released.",
      timestamp: transfer.created_at ?? null,
      state: "complete",
    },
    {
      id: "transfer_scheduled",
      label: "Transfer Scheduled",
      description: "Your payout was scheduled after the hold period.",
      timestamp: transfer.scheduled_at ?? transfer.created_at ?? null,
      state: isScheduled || isProcessing || isPaid ? "complete" : "upcoming",
    },
    {
      id: "hold_period",
      label: "24 Hour Hold",
      description: "Funds remain on the ServdCo platform during the hold window.",
      timestamp: transfer.scheduled_at ?? null,
      state:
        transfer.status === "scheduled" &&
        transfer.scheduled_at &&
        new Date(transfer.scheduled_at) > new Date()
          ? "current"
          : isProcessing || isPaid || isFailed
            ? "complete"
            : "upcoming",
    },
    {
      id: "transfer_processing",
      label: "Transfer Processing",
      description: "ServdCo is sending funds to your Stripe account.",
      timestamp: transfer.last_retry_at ?? null,
      state: isProcessing
        ? "current"
        : isPaid
          ? "complete"
          : isFailed
            ? "failed"
            : "upcoming",
    },
    {
      id: "transferred_to_stripe",
      label: "Transferred to Stripe",
      description: "Funds arrived in your Stripe Connected account.",
      timestamp: transfer.transferred_at ?? null,
      state: isPaid ? "complete" : isFailed ? "failed" : "upcoming",
    },
    {
      id: "stripe_processing",
      label: "Stripe Processing",
      description: "Stripe prepares your bank deposit.",
      timestamp: transfer.transferred_at ?? null,
      state: isPaid ? "current" : "upcoming",
    },
    {
      id: "paid_to_bank",
      label: "Paid to Bank",
      description: presentation.description || "Stripe deposits to your linked bank account.",
      timestamp: transfer.payout_date ?? null,
      state: transfer.payout_date ? "complete" : "upcoming",
    },
  ];

  if (isFailed && transfer.status === "action_required") {
    stages.push({
      id: "action_required",
      label: "Action Required",
      description: presentation.description,
      timestamp: transfer.last_retry_at ?? null,
      state: "failed",
    });
  }

  return stages;
}

export function classifyTransferFailure(message: string): {
  retryable: boolean;
  category: string;
} {
  const lower = message.toLowerCase();

  if (
    lower.includes("insufficient") ||
    lower.includes("balance") ||
    lower.includes("rate limit") ||
    lower.includes("timeout") ||
    lower.includes("temporarily unavailable") ||
    lower.includes("connection") ||
    lower.includes("network")
  ) {
    return { retryable: true, category: "temporary" };
  }

  if (
    lower.includes("closed") ||
    lower.includes("deleted") ||
    lower.includes("fraud") ||
    lower.includes("invalid destination") ||
    lower.includes("no such destination") ||
    lower.includes("account invalid")
  ) {
    return { retryable: false, category: "permanent" };
  }

  return { retryable: true, category: "unknown" };
}

export function getRetryDelayMs(
  retryCount: number,
  category: string = "unknown",
): number {
  if (category === "temporary") {
    return 24 * 60 * 60 * 1000;
  }
  const delays = [
    24 * 60 * 60 * 1000,
    48 * 60 * 60 * 1000,
    72 * 60 * 60 * 1000,
  ];
  return delays[Math.min(retryCount, delays.length - 1)] ?? delays[delays.length - 1];
}
