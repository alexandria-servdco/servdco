import type Stripe from "stripe";
import { classifyTransferFailure } from "../../../shared/transferStatus.js";

export type TransferRecoveryAction =
  | "success"
  | "idempotent_success"
  | "skipped"
  | "retry_scheduled"
  | "action_required"
  | "cancelled"
  | "failed";

export interface StripeErrorDiagnostics {
  code: string | null;
  type: string | null;
  message: string;
  requestId: string | null;
  declineCode?: string | null;
}

export interface TransferExecutionResult {
  success: boolean;
  transferId: string;
  bookingId: string | null;
  chefProfileId: string | null;
  stripeAccountId: string | null;
  stripeTransferId: string | null;
  amountCents: number | null;
  recoveryAction: TransferRecoveryAction;
  reason?: string;
  stripe: StripeErrorDiagnostics | null;
  retryCount?: number;
  durationMs: number;
  stack?: string;
}

export interface TransferFailureDiagnostics {
  transferId: string;
  bookingId: string | null;
  chefProfileId: string | null;
  stripeAccountId: string | null;
  stripeTransferId: string | null;
  amountCents: number | null;
  recoveryAction: TransferRecoveryAction;
  reason: string;
  stripe: StripeErrorDiagnostics | null;
  stack?: string;
  retryCount?: number;
  durationMs: number;
}

export function isDevelopmentRuntime(): boolean {
  return (
    process.env.VERCEL_ENV === "development" ||
    process.env.NODE_ENV === "development"
  );
}

export function parseStripeError(err: unknown): StripeErrorDiagnostics {
  if (err && typeof err === "object" && "type" in err) {
    const stripeErr = err as Stripe.StripeRawError;
    return {
      code: stripeErr.code ?? null,
      type: stripeErr.type ?? null,
      message: stripeErr.message ?? "Stripe error",
      requestId:
        stripeErr.requestId ??
        (stripeErr as { raw?: { headers?: Record<string, string> } }).raw?.headers?.[
          "request-id"
        ] ??
        null,
      declineCode: stripeErr.decline_code ?? null,
    };
  }

  const message = err instanceof Error ? err.message : String(err);
  return {
    code: null,
    type: null,
    message,
    requestId: null,
  };
}

export function resolveRecoveryAction(params: {
  success: boolean;
  reason?: string;
  stripe?: StripeErrorDiagnostics | null;
  scheduledRetry?: boolean;
  markedActionRequired?: boolean;
  cancelled?: boolean;
  idempotent?: boolean;
}): TransferRecoveryAction {
  if (params.success) {
    return params.idempotent ? "idempotent_success" : "success";
  }
  if (params.cancelled) return "cancelled";
  if (params.markedActionRequired) return "action_required";
  if (params.scheduledRetry) return "retry_scheduled";
  if (params.reason === "Transfer already being processed by another worker") {
    return "skipped";
  }
  if (
    params.reason === "Cook Connect onboarding incomplete" ||
    params.reason === "Transfer not found"
  ) {
    return "skipped";
  }
  return "failed";
}

export function classifyStripeTransferFailure(
  err: unknown,
): { retryable: boolean; category: string; recoveryAction: TransferRecoveryAction } {
  const stripe = parseStripeError(err);
  const message = stripe.message;
  const lower = message.toLowerCase();
  const code = (stripe.code ?? "").toLowerCase();

  if (
    code === "idempotency_key_in_use" ||
    lower.includes("idempotency")
  ) {
    return {
      retryable: true,
      category: "idempotency_conflict",
      recoveryAction: "retry_scheduled",
    };
  }

  if (
    code === "balance_insufficient" ||
    lower.includes("insufficient") ||
    lower.includes("balance")
  ) {
    return {
      retryable: true,
      category: "insufficient_platform_balance",
      recoveryAction: "retry_scheduled",
    };
  }

  if (
    code === "account_invalid" ||
    code === "invalid_destination" ||
    lower.includes("no such destination") ||
    lower.includes("invalid destination")
  ) {
    return {
      retryable: false,
      category: "invalid_destination_account",
      recoveryAction: "action_required",
    };
  }

  if (
    lower.includes("payouts") &&
    (lower.includes("disabled") || lower.includes("not enabled"))
  ) {
    return {
      retryable: false,
      category: "payouts_disabled",
      recoveryAction: "action_required",
    };
  }

  if (
    lower.includes("charges_enabled") ||
    lower.includes("account is not enabled") ||
    lower.includes("account disabled")
  ) {
    return {
      retryable: false,
      category: "connected_account_disabled",
      recoveryAction: "action_required",
    };
  }

  if (
    lower.includes("already been transferred") ||
    lower.includes("already paid") ||
    lower.includes("duplicate")
  ) {
    return {
      retryable: false,
      category: "duplicate_transfer",
      recoveryAction: "idempotent_success",
    };
  }

  const fallback = classifyTransferFailure(message);
  return {
    ...fallback,
    recoveryAction: fallback.retryable ? "retry_scheduled" : "action_required",
  };
}

export function buildTransferExecutionResult(params: {
  success: boolean;
  transferId: string;
  bookingId?: string | null;
  chefProfileId?: string | null;
  stripeAccountId?: string | null;
  stripeTransferId?: string | null;
  amountCents?: number | null;
  recoveryAction: TransferRecoveryAction;
  reason?: string;
  err?: unknown;
  retryCount?: number;
  durationMs: number;
  idempotent?: boolean;
}): TransferExecutionResult {
  const stripe = params.err ? parseStripeError(params.err) : null;
  const result: TransferExecutionResult = {
    success: params.success,
    transferId: params.transferId,
    bookingId: params.bookingId ?? null,
    chefProfileId: params.chefProfileId ?? null,
    stripeAccountId: params.stripeAccountId ?? null,
    stripeTransferId: params.stripeTransferId ?? null,
    amountCents: params.amountCents ?? null,
    recoveryAction: resolveRecoveryAction({
      success: params.success,
      reason: params.reason,
      idempotent: params.idempotent,
      scheduledRetry: params.recoveryAction === "retry_scheduled",
      markedActionRequired: params.recoveryAction === "action_required",
      cancelled: params.recoveryAction === "cancelled",
    }),
    reason: params.reason,
    stripe,
    retryCount: params.retryCount,
    durationMs: params.durationMs,
  };

  if (params.recoveryAction !== result.recoveryAction) {
    result.recoveryAction = params.recoveryAction;
  }

  if (isDevelopmentRuntime() && params.err instanceof Error && params.err.stack) {
    result.stack = params.err.stack;
  }

  return result;
}

export function buildTransferFailureDiagnostics(params: {
  transferId: string;
  bookingId?: string | null;
  chefProfileId?: string | null;
  stripeAccountId?: string | null;
  stripeTransferId?: string | null;
  amountCents?: number | null;
  recoveryAction: TransferRecoveryAction;
  reason: string;
  err?: unknown;
  retryCount?: number;
  durationMs: number;
}): TransferFailureDiagnostics {
  const stripe = params.err ? parseStripeError(params.err) : null;
  const diagnostics: TransferFailureDiagnostics = {
    transferId: params.transferId,
    bookingId: params.bookingId ?? null,
    chefProfileId: params.chefProfileId ?? null,
    stripeAccountId: params.stripeAccountId ?? null,
    stripeTransferId: params.stripeTransferId ?? null,
    amountCents: params.amountCents ?? null,
    recoveryAction: params.recoveryAction,
    reason: params.reason,
    stripe,
    retryCount: params.retryCount,
    durationMs: params.durationMs,
  };

  if (isDevelopmentRuntime() && params.err instanceof Error && params.err.stack) {
    diagnostics.stack = params.err.stack;
  }

  return diagnostics;
}
