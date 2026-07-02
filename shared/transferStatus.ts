import {
  buildTransferTimeline as buildPayoutTransferTimeline,
  resolveTransferPresentation,
  type StripeAccountLike,
} from "./payoutStatus.js";

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

export interface TransferTimelineStage {
  id: string;
  label: string;
  description: string;
  timestamp: string | null;
  state: "complete" | "current" | "upcoming" | "failed";
}

/** Prefer resolveTransferPresentation from @shared/payoutStatus with Stripe account context. */
export function getTransferStatusPresentation(
  transfer: TransferRowLike,
  account?: StripeAccountLike | null,
): TransferStatusPresentation {
  return resolveTransferPresentation(transfer, account);
}

export function buildTransferTimeline(
  transfer: TransferRowLike,
  account?: StripeAccountLike | null,
): TransferTimelineStage[] {
  return buildPayoutTransferTimeline(transfer, account);
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

export {
  resolveCookPayoutState,
  resolveTransferPresentation,
  resolveAdminConnectSyncView,
  isBankConnected,
  isVerificationComplete,
  isOnboardingIncomplete,
  isHistoricalOnboardingFailure,
  isStaleOnboardingNotification,
  IN_PIPELINE_TRANSFER_STATUSES,
  mapOnboardingStatus,
  type CookPayoutState,
} from "./payoutStatus.js";

export type { StripeAccountLike } from "./payoutStatus.js";
