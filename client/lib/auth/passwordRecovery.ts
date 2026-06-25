/**
 * Password recovery session helpers — shared across AuthProvider, Guards, ResetPassword.
 */

export const RECOVERY_PENDING_KEY = "servdco:password-recovery-pending";

export type RecoveryHashResult =
  | { type: "none" }
  | { type: "recovery" }
  | {
      type: "error";
      errorCode: string;
      errorDescription: string;
    };

export function parseRecoveryHashFromString(hash: string): RecoveryHashResult {
  if (!hash) return { type: "none" };

  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const error = params.get("error");
  if (error) {
    const description =
      params.get("error_description")?.replace(/\+/g, " ") ??
      "This password reset link is invalid or has expired.";
    return {
      type: "error",
      errorCode: params.get("error_code") ?? error,
      errorDescription: description,
    };
  }

  if (
    params.get("type") === "recovery" ||
    params.has("access_token") ||
    params.has("refresh_token")
  ) {
    return { type: "recovery" };
  }

  return { type: "none" };
}

export function parseRecoveryHash(): RecoveryHashResult {
  if (typeof window === "undefined") return { type: "none" };
  return parseRecoveryHashFromString(window.location.hash);
}

export function clearRecoveryHashFromUrl(): void {
  if (typeof window === "undefined") return;
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
}

export function markRecoveryPending(): void {
  try {
    sessionStorage.setItem(RECOVERY_PENDING_KEY, "1");
  } catch {
    /* private browsing */
  }
}

export function clearRecoveryPending(): void {
  try {
    sessionStorage.removeItem(RECOVERY_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function isRecoveryPending(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function recoveryErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "otp_expired":
      return "This reset link has expired. Request a new one from the login page.";
    case "access_denied":
      return "This reset link is no longer valid. Request a new one from the login page.";
    default:
      return "This reset link is invalid or has expired. Request a new one from the login page.";
  }
}

export function isRecoverySession(
  passwordRecoveryFlag: boolean,
  hashResult: RecoveryHashResult,
  searchType: string | null,
): boolean {
  if (passwordRecoveryFlag) return true;
  if (hashResult.type === "recovery") return true;
  if (searchType === "recovery") return true;
  return isRecoveryPending();
}
