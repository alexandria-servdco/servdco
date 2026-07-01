import type { PostgrestError } from "@supabase/supabase-js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { stripeIdempotencyKey } from "./helpers.js";
import { apiLogger } from "../logger.js";

export const TRANSFER_CLAIMABLE_STATUSES = [
  "scheduled",
  "pending",
  "failed",
] as const;

export type ClaimableTransferStatus = (typeof TRANSFER_CLAIMABLE_STATUSES)[number];

export function cookTransferIdempotencyKey(transferId: string): string {
  return stripeIdempotencyKey("cook_transfer", transferId);
}

export function isProcessingStale(
  updatedAt: string | null | undefined,
  timeoutMs: number,
  nowMs: number = Date.now(),
): boolean {
  if (!updatedAt) return true;
  const updatedMs = new Date(updatedAt).getTime();
  if (Number.isNaN(updatedMs)) return true;
  return nowMs - updatedMs >= timeoutMs;
}

export async function getTransferProcessingTimeoutMs(): Promise<number> {
  const client = getServiceRoleClient();
  const { data } = await client
    .from("platform_settings")
    .select("value")
    .eq("key", "transfer_processing_timeout_minutes")
    .maybeSingle();

  const raw = data?.value;
  let minutes = 30;
  if (typeof raw === "number") minutes = raw;
  else if (typeof raw === "string") {
    const n = Number(raw);
    if (!Number.isNaN(n) && n > 0) minutes = n;
  }

  return minutes * 60 * 1000;
}

type SupabaseWriteResult<T> = {
  data: T | null;
  error: PostgrestError | null;
  status?: number;
  statusText?: string;
};

/** Throws when a critical Supabase mutation fails or affects fewer rows than required. */
export function assertSupabaseWrite<T>(
  result: SupabaseWriteResult<T>,
  context: string,
  minRows = 1,
): T {
  const { data, error, status, statusText } = result;

  if (error) {
    throw new Error(
      `${context}: Supabase error (${status ?? "unknown"} ${statusText ?? ""}): ${error.message}`.trim(),
    );
  }

  const rowCount = Array.isArray(data) ? data.length : data ? 1 : 0;
  if (rowCount < minRows) {
    throw new Error(
      `${context}: expected at least ${minRows} row(s) updated, got ${rowCount}`,
    );
  }

  return data as T;
}

export type TransferClaimRow = {
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

/**
 * Atomically claim a transfer for processing.
 * Returns null when another worker already owns the row.
 */
export async function claimTransferForProcessing(
  transferId: string,
): Promise<TransferClaimRow | null> {
  const client = getServiceRoleClient();
  const now = new Date().toISOString();

  const { data, error, status, statusText } = await client
    .from("transfers")
    .update({ status: "processing", updated_at: now })
    .eq("id", transferId)
    .in("status", [...TRANSFER_CLAIMABLE_STATUSES])
    .select("*");

  if (error) {
    throw new Error(
      `claimTransferForProcessing: ${error.message} (${status ?? ""} ${statusText ?? ""})`.trim(),
    );
  }

  if (!data?.length) {
    return null;
  }

  return data[0] as TransferClaimRow;
}

let transferSchemaValidated = false;

/** Validates retry migration columns exist before transfer processing runs. */
export async function validateTransferSchemaOnStartup(): Promise<void> {
  if (transferSchemaValidated) return;
  transferSchemaValidated = true;

  try {
    const client = getServiceRoleClient();
    const { error } = await client
      .from("transfers")
      .select(
        "id, retry_count, next_retry_at, last_retry_at, last_retry_reason, status",
      )
      .limit(1);

    if (error) {
      apiLogger.error("CRITICAL: transfers retry migration missing or invalid", {
        migration: "20250702150000_transfer_retry_and_action_required.sql",
        error: error.message,
        hint: "Apply Supabase migration before running transfer cron or admin retry.",
      });
      throw new Error(
        `Transfer schema validation failed: ${error.message}. Apply migration 20250702150000_transfer_retry_and_action_required.sql`,
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("Transfer schema validation")) {
      throw err;
    }
    apiLogger.error("CRITICAL: unable to validate transfers schema", {
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
