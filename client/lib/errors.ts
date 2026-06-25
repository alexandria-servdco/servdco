import {
  mapThrownError,
  mapToUserFacingError,
  formatUserErrorMessage,
  isUserFacingError,
  type UserFacingError,
} from "@shared/userErrors";
import { SupabaseQueryError } from "@/services/supabase/fallback";
import { SecurityApiError } from "@/lib/securityApi";

export type { UserFacingError };
export { mapThrownError, mapToUserFacingError, formatUserErrorMessage, isUserFacingError };

/** Surfaces a production-quality message from any failure. */
export function toUserFacingError(err: unknown): UserFacingError {
  if (err instanceof SecurityApiError) return err.userFacing;
  if (isUserFacingError(err)) return err;
  if (err instanceof SupabaseQueryError) {
    return mapThrownError(new Error(err.message));
  }
  return mapThrownError(err);
}

/** @deprecated Prefer toUserFacingError + formatUserErrorMessage */
export function extractErrorMessage(err: unknown, fallback: string): string {
  const facing = toUserFacingError(err);
  const text = formatUserErrorMessage(facing);
  return text || fallback;
}
