import type {
  TransferPipelineStatus,
  TransferRowLike,
  TransferStatusPresentation,
  TransferTimelineStage,
} from "./transferStatus.js";

export type StripeOnboardingStatus =
  | "not_started"
  | "pending"
  | "complete"
  | "restricted";

export interface StripeAccountLike {
  onboarding_status?: StripeOnboardingStatus | string | null;
  charges_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
  stripe_account_id?: string | null;
  requirements_due?: string[] | null;
  capabilities?: Record<string, unknown> | null;
  details_submitted?: boolean | null;
  updated_at?: string | null;
  last_synced_at?: string | null;
}

export interface TransferWithAmount extends TransferRowLike {
  net_amount_cents?: number;
}

export type PayoutHealthLevel =
  | "healthy"
  | "onboarding_required"
  | "attention"
  | "processing";

export type PayoutSeverity = "none" | "info" | "warning" | "error";

export interface CookPayoutActionButton {
  id: "connect" | "resume_onboarding" | "refresh" | "stripe_dashboard" | "payout_history";
  label: string;
  variant: "primary" | "secondary";
}

export interface CookPayoutState {
  bankConnected: boolean;
  verificationComplete: boolean;
  transfersEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingIncomplete: boolean;
  overallHealth: PayoutHealthLevel;
  severity: PayoutSeverity;
  badge: string;
  description: string;
  healthLines: Array<{
    key: string;
    label: string;
    ok: boolean;
    value: string;
    tone: "success" | "warning" | "neutral";
  }>;
  currentTransferStatus: string | null;
  currentTransferDescription: string | null;
  paymentHistoryLabel: string | null;
  timelineLabel: string | null;
  pendingEarningsCents: number;
  nextTransferAmountCents: number | null;
  nextTransferDate: string | null;
  lastPaidAmountCents: number | null;
  lastPaidDate: string | null;
  estimatedDepositDate: string | null;
  showGlobalWarning: boolean;
  globalWarningMessage: string | null;
  actionButtons: CookPayoutActionButton[];
  showConnectButton: boolean;
  showResumeOnboarding: boolean;
}

/** Transfers still moving through the payout pipeline (excludes paid/cancelled). */
export const IN_PIPELINE_TRANSFER_STATUSES: TransferPipelineStatus[] = [
  "pending",
  "scheduled",
  "processing",
  "failed",
  "retry_scheduled",
  "action_required",
];

export function mapOnboardingStatus(account: {
  details_submitted?: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
}): StripeOnboardingStatus {
  if (account.payouts_enabled && account.charges_enabled) return "complete";
  if (account.details_submitted) return "pending";
  return "not_started";
}

/** Level 1 — live Stripe account flags are authoritative. */
export function isBankConnected(
  account: StripeAccountLike | null | undefined,
): boolean {
  return Boolean(account?.payouts_enabled && account?.charges_enabled);
}

export function isVerificationComplete(
  account: StripeAccountLike | null | undefined,
): boolean {
  if (!account) return false;
  return (
    account.onboarding_status === "complete" ||
    Boolean(account.charges_enabled && account.payouts_enabled)
  );
}

/** True only when Stripe itself still requires onboarding — never from transfer history. */
export function isOnboardingIncomplete(
  account: StripeAccountLike | null | undefined,
): boolean {
  if (!account) return true;
  if (account.payouts_enabled && account.charges_enabled) return false;
  return (
    !account.payouts_enabled ||
    !account.charges_enabled ||
    account.onboarding_status !== "complete"
  );
}

export function isHistoricalOnboardingFailure(
  reason: string | null | undefined,
): boolean {
  const lower = reason?.toLowerCase() ?? "";
  return (
    lower.includes("onboarding incomplete") ||
    lower.includes("connect onboarding")
  );
}

export function isPlatformBalanceDelay(
  reason: string | null | undefined,
): boolean {
  const lower = reason?.toLowerCase() ?? "";
  return (
    lower.includes("insufficient") ||
    lower.includes("balance") ||
    lower.includes("platform processing")
  );
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString();
}

function formatDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString();
}

function estimateDepositDate(transfer: TransferRowLike): string | null {
  if (transfer.payout_date) return formatDate(transfer.payout_date);
  if (transfer.transferred_at) {
    return formatDate(
      new Date(
        new Date(transfer.transferred_at).getTime() + 2 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    );
  }
  if (transfer.scheduled_at) {
    return formatDate(
      new Date(
        new Date(transfer.scheduled_at).getTime() + 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    );
  }
  return null;
}

function pickPrimaryTransfer(
  transfers: TransferWithAmount[],
): TransferWithAmount | null {
  const priority: TransferPipelineStatus[] = [
    "action_required",
    "failed",
    "retry_scheduled",
    "processing",
    "scheduled",
    "pending",
    "paid",
  ];
  for (const status of priority) {
    const match = transfers.find((t) => t.status === status);
    if (match) return match;
  }
  return transfers[0] ?? null;
}

/** Level 2 + 3 — transfer presentation; Stripe account overrides historical onboarding failures. */
export function resolveTransferPresentation(
  transfer: TransferRowLike,
  account?: StripeAccountLike | null,
): TransferStatusPresentation {
  const bankConnected = isBankConnected(account);
  const historicalOnboarding = isHistoricalOnboardingFailure(
    transfer.failure_reason,
  );
  const metadata = transfer.metadata ?? {};

  if (transfer.status === "cancelled") {
    return {
      label: "Cancelled",
      description: transfer.failure_reason ?? "This payout was cancelled.",
      tone: "neutral",
    };
  }

  if (transfer.status === "action_required") {
    if (bankConnected && historicalOnboarding) {
      return {
        label: "Pending Transfer",
        description:
          "Your payout is queued. Historical onboarding notes no longer apply — your bank is connected.",
        tone: "warning",
      };
    }
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
      label: "Paid",
      description: transfer.stripe_transfer_id
        ? `Transfer completed. Stripe transfer ${transfer.stripe_transfer_id.slice(0, 14)}…`
        : "Transfer completed. Deposit sent to your Stripe account.",
      tone: "success",
    };
  }

  if (transfer.status === "processing") {
    return {
      label: "Processing Transfer",
      description: "Money is being transferred to your Stripe account.",
      tone: "info",
    };
  }

  if (transfer.status === "failed") {
    if (bankConnected && historicalOnboarding) {
      return {
        label: "Pending Transfer",
        description:
          "Your payout will be retried automatically now that your bank is connected.",
        tone: "warning",
      };
    }
    return {
      label: "Failed",
      description:
        transfer.failure_reason ??
        "We could not complete this transfer. Our team has been notified.",
      tone: "error",
    };
  }

  if (transfer.status === "retry_scheduled") {
    const platformDelay = isPlatformBalanceDelay(transfer.failure_reason);
    const retryNote = transfer.next_retry_at
      ? `Next retry: ${formatDateTime(transfer.next_retry_at)}.`
      : "";
    return {
      label: "Retry Scheduled",
      description: platformDelay
        ? `Platform processing delay — automatic retry scheduled. ${retryNote}`.trim()
        : `Platform is retrying automatically. ${retryNote} ${transfer.last_retry_reason ?? transfer.failure_reason ?? ""}`.trim(),
      tone: "warning",
    };
  }

  if (transfer.status === "scheduled") {
    if (transfer.scheduled_at && new Date(transfer.scheduled_at) > new Date()) {
      return {
        label: "Scheduled",
        description: `Waiting for payout date after the hold period (${formatDateTime(transfer.scheduled_at)}).`,
        tone: "warning",
      };
    }
    return {
      label: "Scheduled for Payout",
      description: "Your payout is queued and will be sent to Stripe shortly.",
      tone: "info",
    };
  }

  if (transfer.status === "pending") {
    if (!bankConnected && historicalOnboarding) {
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
        description:
          "This payout starts after the family confirms booking completion.",
        tone: "warning",
      };
    }
    if (bankConnected && historicalOnboarding) {
      return {
        label: "Pending Transfer",
        description:
          "Waiting for the next scheduled payout run. No bank action required.",
        tone: "warning",
      };
    }
    return {
      label: "Pending Transfer",
      description:
        (bankConnected ? null : transfer.failure_reason) ??
        "Waiting for the next processing step.",
      tone: "warning",
    };
  }

  return {
    label: transfer.status,
    description: transfer.failure_reason ?? "",
    tone: "neutral",
  };
}

export function buildTransferTimeline(
  transfer: TransferRowLike,
  account?: StripeAccountLike | null,
): TransferTimelineStage[] {
  const bankConnected = isBankConnected(account);
  const presentation = resolveTransferPresentation(transfer, account);
  const isPaid = transfer.status === "paid";
  const isFailed =
    transfer.status === "failed" ||
    transfer.status === "retry_scheduled" ||
    transfer.status === "action_required";
  const isProcessing = transfer.status === "processing";
  const onboardingBlocks =
    !bankConnected &&
    isHistoricalOnboardingFailure(transfer.failure_reason) &&
    transfer.status === "pending";
  const isScheduled =
    transfer.status === "scheduled" ||
    (transfer.status === "pending" && !onboardingBlocks);

  const stages: TransferTimelineStage[] = [
    {
      id: "family_paid",
      label: "Family Paid",
      description: "The family completed payment for this booking.",
      timestamp: transfer.created_at ?? null,
      state: "complete",
    },
    {
      id: "booking_confirmed",
      label: "Booking Confirmed",
      description: "The cooking session was marked complete.",
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
      label: "Waiting for Hold Period",
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
      id: "transfer_initiated",
      label: "Transfer Initiated",
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
      id: "money_sent_stripe",
      label: "Money Sent to Stripe Account",
      description: "Funds arrived in your Stripe Connected account.",
      timestamp: transfer.transferred_at ?? null,
      state: isPaid ? "complete" : isFailed ? "failed" : "upcoming",
    },
    {
      id: "bank_deposit",
      label: "Bank Deposit",
      description:
        presentation.description ||
        "Stripe deposits to your linked bank account.",
      timestamp: transfer.payout_date ?? null,
      state: transfer.payout_date ? "complete" : isPaid ? "current" : "upcoming",
    },
  ];

  if (isFailed && transfer.status === "action_required" && !bankConnected) {
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

/** Single resolver for dashboard cards, health, badges, and actions. */
export function resolveCookPayoutState(
  account: StripeAccountLike | null | undefined,
  transfers: TransferWithAmount[] = [],
): CookPayoutState {
  const bankConnected = isBankConnected(account);
  const verificationComplete = isVerificationComplete(account);
  const onboardingIncomplete = isOnboardingIncomplete(account);
  const transfersEnabled = bankConnected;
  const payoutsEnabled = Boolean(account?.payouts_enabled);

  const pipeline = transfers.filter((t) =>
    IN_PIPELINE_TRANSFER_STATUSES.includes(t.status),
  );
  const pendingEarningsCents = pipeline.reduce(
    (sum, t) => sum + (t.net_amount_cents ?? 0),
    0,
  );

  const nextTransfer = [...pipeline]
    .filter((t) => ["scheduled", "pending", "retry_scheduled"].includes(t.status))
    .sort((a, b) =>
      (a.scheduled_at ?? a.created_at ?? "").localeCompare(
        b.scheduled_at ?? b.created_at ?? "",
      ),
    )[0];

  const lastPaid = transfers
    .filter((t) => t.status === "paid")
    .sort((a, b) =>
      (b.transferred_at ?? "").localeCompare(a.transferred_at ?? ""),
    )[0];

  const primary = pickPrimaryTransfer(transfers);
  const primaryPresentation = primary
    ? resolveTransferPresentation(primary, account)
    : null;

  const realActionRequired =
    onboardingIncomplete ||
    transfers.some(
      (t) =>
        t.status === "action_required" &&
        !(isBankConnected(account) && isHistoricalOnboardingFailure(t.failure_reason)),
    );

  let overallHealth: PayoutHealthLevel = "healthy";
  let severity: PayoutSeverity = "none";
  let badge = "All Set";
  let description = "Your payout account is ready. Earnings will deposit automatically.";
  let showGlobalWarning = false;
  let globalWarningMessage: string | null = null;

  if (onboardingIncomplete) {
    overallHealth = "onboarding_required";
    severity = "warning";
    badge = "Connect Bank Account";
    description =
      account?.onboarding_status === "pending"
        ? "Stripe verification in progress. Complete any remaining steps in Stripe."
        : "Connect and verify your bank account through Stripe to receive payouts.";
    showGlobalWarning = true;
    globalWarningMessage = description;
  } else if (primary?.status === "processing") {
    overallHealth = "processing";
    severity = "info";
    badge = "Processing Transfer";
    description = "Money is being transferred to your Stripe account.";
  } else if (primary?.status === "retry_scheduled") {
    overallHealth = "processing";
    severity = "info";
    badge = "Retry Scheduled";
    description = isPlatformBalanceDelay(primary.failure_reason)
      ? "Platform processing delay — automatic retry scheduled. No action required."
      : "Platform is retrying automatically. No action required.";
  } else if (realActionRequired && !onboardingIncomplete) {
    overallHealth = "attention";
    severity = "error";
    badge = "Action Required";
    description =
      primaryPresentation?.description ??
      "A payout needs attention. View transfer details or contact support.";
    showGlobalWarning = true;
    globalWarningMessage = description;
  } else if (primary && ["scheduled", "pending"].includes(primary.status)) {
    overallHealth = "healthy";
    severity = "info";
    badge = primaryPresentation?.label ?? "Scheduled for Payout";
    description =
      primaryPresentation?.description ??
      "Your earnings are scheduled for the next payout run.";
  }

  const actionButtons: CookPayoutActionButton[] = [];
  if (onboardingIncomplete) {
    actionButtons.push({
      id: account?.onboarding_status === "pending" ? "resume_onboarding" : "connect",
      label:
        account?.onboarding_status === "pending"
          ? "Resume Onboarding"
          : "Connect Bank Account",
      variant: "primary",
    });
  } else {
    actionButtons.push(
      { id: "refresh", label: "Refresh Status", variant: "secondary" },
      { id: "stripe_dashboard", label: "View Stripe Dashboard", variant: "secondary" },
      { id: "payout_history", label: "View Payout History", variant: "secondary" },
    );
  }

  const healthLines = [
    {
      key: "bank",
      label: "Bank Account",
      ok: bankConnected,
      value: bankConnected ? "Connected" : "Not Connected",
      tone: bankConnected ? ("success" as const) : ("warning" as const),
    },
    {
      key: "verification",
      label: "Stripe Verification",
      ok: verificationComplete,
      value: verificationComplete ? "Complete" : "Needs Action",
      tone: verificationComplete ? ("success" as const) : ("warning" as const),
    },
    {
      key: "transfers",
      label: "Transfers Enabled",
      ok: transfersEnabled,
      value: transfersEnabled ? "Enabled" : "Disabled",
      tone: transfersEnabled ? ("success" as const) : ("warning" as const),
    },
    {
      key: "payouts",
      label: "Payouts Enabled",
      ok: payoutsEnabled,
      value: payoutsEnabled ? "Enabled" : "Disabled",
      tone: payoutsEnabled ? ("success" as const) : ("warning" as const),
    },
  ];

  return {
    bankConnected,
    verificationComplete,
    transfersEnabled,
    payoutsEnabled,
    onboardingIncomplete,
    overallHealth,
    severity,
    badge,
    description,
    healthLines,
    currentTransferStatus: primaryPresentation?.label ?? null,
    currentTransferDescription: primaryPresentation?.description ?? null,
    paymentHistoryLabel: primaryPresentation?.label ?? null,
    timelineLabel: primaryPresentation?.label ?? null,
    pendingEarningsCents,
    nextTransferAmountCents: nextTransfer?.net_amount_cents ?? null,
    nextTransferDate: nextTransfer?.scheduled_at ?? null,
    lastPaidAmountCents: lastPaid?.net_amount_cents ?? null,
    lastPaidDate: lastPaid?.transferred_at ?? null,
    estimatedDepositDate: nextTransfer
      ? estimateDepositDate(nextTransfer)
      : lastPaid
        ? estimateDepositDate(lastPaid)
        : null,
    showGlobalWarning,
    globalWarningMessage,
    actionButtons,
    showConnectButton: onboardingIncomplete,
    showResumeOnboarding:
      onboardingIncomplete && account?.onboarding_status === "pending",
  };
}

/** Hide stale onboarding prompts once Stripe account is connected. */
export function isStaleOnboardingNotification(
  title: string,
  message: string,
  account?: StripeAccountLike | null,
): boolean {
  if (!isBankConnected(account)) return false;
  const text = `${title} ${message}`.toLowerCase();
  return (
    text.includes("connect your bank") ||
    text.includes("complete onboarding") ||
    text.includes("finish connecting your bank") ||
    text.includes("stripe setup incomplete") ||
    (text.includes("onboarding") && text.includes("stripe"))
  );
}

export interface AdminConnectSyncView {
  bankConnected: boolean;
  verificationComplete: boolean;
  dbOnboardingStatus: string | null;
  dbPayoutsEnabled: boolean;
  dbChargesEnabled: boolean;
  stripePayoutsEnabled: boolean | null;
  stripeChargesEnabled: boolean | null;
  mismatches: string[];
  syncHealthy: boolean;
}

export function resolveAdminConnectSyncView(params: {
  database: {
    onboarding_status?: string | null;
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
  } | null;
  stripe: {
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
  } | null;
  mismatches?: string[];
}): AdminConnectSyncView {
  const db = params.database;
  const stripe = params.stripe;
  const mismatches = params.mismatches ?? [];
  const accountLike: StripeAccountLike = {
    onboarding_status: db?.onboarding_status,
    charges_enabled: db?.charges_enabled,
    payouts_enabled: db?.payouts_enabled,
  };

  return {
    bankConnected: isBankConnected(accountLike),
    verificationComplete: isVerificationComplete(accountLike),
    dbOnboardingStatus: db?.onboarding_status ?? null,
    dbPayoutsEnabled: db?.payouts_enabled ?? false,
    dbChargesEnabled: db?.charges_enabled ?? false,
    stripePayoutsEnabled: stripe?.payouts_enabled ?? null,
    stripeChargesEnabled: stripe?.charges_enabled ?? null,
    mismatches,
    syncHealthy: mismatches.length === 0,
  };
}
