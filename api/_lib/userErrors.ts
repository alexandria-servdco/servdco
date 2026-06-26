import type { VercelResponse } from "@vercel/node";

/** Server-side user error catalog — kept inside api/ for Vercel serverless bundles. */

export type UserErrorCode =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_EMAIL_NOT_CONFIRMED"
  | "AUTH_SESSION_EXPIRED"
  | "AUTH_PROFILE_INCOMPLETE"
  | "AUTH_RATE_LIMITED"
  | "AUTH_SERVICE_UNAVAILABLE"
  | "VALIDATION_ERROR"
  | "AUTHORIZATION_DENIED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "NETWORK_OFFLINE"
  | "CAPTCHA_FAILED"
  | "SERVER_ERROR"
  | "UNKNOWN_ERROR";

export type UserErrorAction = {
  label: string;
  action:
    | "retry"
    | "sign_in"
    | "reset_password"
    | "resend_confirmation"
    | "contact_support"
    | "go_home"
    | "refresh";
};

export interface UserFacingError {
  code: UserErrorCode;
  title: string;
  message: string;
  guidance?: string;
  primaryAction?: UserErrorAction;
  secondaryAction?: UserErrorAction;
}

export interface ApiErrorBody {
  error?: string;
  code?: string;
  title?: string;
  message?: string;
  guidance?: string;
  primaryAction?: UserErrorAction;
  secondaryAction?: UserErrorAction;
}

const CATALOG: Record<UserErrorCode, UserFacingError> = {
  AUTH_INVALID_CREDENTIALS: {
    code: "AUTH_INVALID_CREDENTIALS",
    title: "Incorrect email or password",
    message: "We couldn't sign you in with those details.",
    guidance:
      "Double-check your email and password, then try again. If you've forgotten your password, you can reset it.",
    primaryAction: { label: "Try again", action: "retry" },
    secondaryAction: { label: "Reset password", action: "reset_password" },
  },
  AUTH_EMAIL_NOT_CONFIRMED: {
    code: "AUTH_EMAIL_NOT_CONFIRMED",
    title: "Confirm your email to continue",
    message: "Your account exists, but your email address hasn't been verified yet.",
    guidance:
      "Check your inbox for a confirmation link from Servd Co. If you don't see it, request a new confirmation email below.",
    primaryAction: { label: "Resend confirmation email", action: "resend_confirmation" },
    secondaryAction: { label: "Back to sign in", action: "retry" },
  },
  AUTH_SESSION_EXPIRED: {
    code: "AUTH_SESSION_EXPIRED",
    title: "Your session has expired",
    message: "For your security, please sign in again.",
    guidance: "Your previous session is no longer active.",
    primaryAction: { label: "Sign in", action: "sign_in" },
  },
  AUTH_PROFILE_INCOMPLETE: {
    code: "AUTH_PROFILE_INCOMPLETE",
    title: "We're finishing your account setup",
    message: "Your sign-in worked, but your profile isn't ready yet.",
    guidance:
      "Please try again in a moment. If this keeps happening, contact support and we'll help you complete setup.",
    primaryAction: { label: "Try again", action: "retry" },
    secondaryAction: { label: "Contact support", action: "contact_support" },
  },
  AUTH_RATE_LIMITED: {
    code: "AUTH_RATE_LIMITED",
    title: "Too many sign-in attempts",
    message: "Please wait a few minutes before trying again.",
    guidance: "This helps keep your account secure.",
    primaryAction: { label: "Try again later", action: "retry" },
  },
  AUTH_SERVICE_UNAVAILABLE: {
    code: "AUTH_SERVICE_UNAVAILABLE",
    title: "Sign-in is temporarily unavailable",
    message: "Our authentication service isn't reachable right now.",
    guidance: "Please try again in a few minutes.",
    primaryAction: { label: "Try again", action: "retry" },
  },
  VALIDATION_ERROR: {
    code: "VALIDATION_ERROR",
    title: "Please check your information",
    message: "Some details need to be corrected before we can continue.",
    guidance: "Review the highlighted fields and try again.",
    primaryAction: { label: "Review form", action: "retry" },
  },
  AUTHORIZATION_DENIED: {
    code: "AUTHORIZATION_DENIED",
    title: "You don't have permission",
    message: "You can't perform this action with your current account.",
    guidance:
      "If you believe this is a mistake, contact support and we'll take a look.",
    primaryAction: { label: "Go home", action: "go_home" },
    secondaryAction: { label: "Contact support", action: "contact_support" },
  },
  NOT_FOUND: {
    code: "NOT_FOUND",
    title: "We couldn't find that",
    message: "The item you're looking for may have been removed or is no longer available.",
    guidance: "Try refreshing the page to see the latest information.",
    primaryAction: { label: "Refresh", action: "refresh" },
  },
  CONFLICT: {
    code: "CONFLICT",
    title: "This action can't be completed",
    message: "Something changed while you were working.",
    guidance: "Refresh the page and try again with the latest information.",
    primaryAction: { label: "Refresh", action: "refresh" },
  },
  RATE_LIMITED: {
    code: "RATE_LIMITED",
    title: "Too many requests",
    message: "Please wait a few minutes before trying again.",
    primaryAction: { label: "Try again later", action: "retry" },
  },
  NETWORK_OFFLINE: {
    code: "NETWORK_OFFLINE",
    title: "You're offline",
    message: "We can't reach our servers right now.",
    guidance: "Check your internet connection and try again.",
    primaryAction: { label: "Retry", action: "retry" },
  },
  CAPTCHA_FAILED: {
    code: "CAPTCHA_FAILED",
    title: "Security check didn't pass",
    message: "We couldn't verify that you're a real person.",
    guidance: "Please complete the security check and try again.",
    primaryAction: { label: "Try again", action: "retry" },
  },
  SERVER_ERROR: {
    code: "SERVER_ERROR",
    title: "Something unexpected happened",
    message: "We've logged this issue automatically.",
    guidance: "Please try again in a moment. If the problem continues, contact support.",
    primaryAction: { label: "Try again", action: "retry" },
    secondaryAction: { label: "Contact support", action: "contact_support" },
  },
  UNKNOWN_ERROR: {
    code: "UNKNOWN_ERROR",
    title: "Something unexpected happened",
    message: "We couldn't complete your request.",
    guidance: "Please try again. If the issue continues, contact support.",
    primaryAction: { label: "Try again", action: "retry" },
  },
};

export function getUserError(
  code: UserErrorCode,
  overrides?: Partial<UserFacingError>,
): UserFacingError {
  const base = CATALOG[code] ?? CATALOG.UNKNOWN_ERROR;
  if (!overrides) return { ...base };
  return {
    ...base,
    ...(overrides.title !== undefined ? { title: overrides.title } : {}),
    ...(overrides.message !== undefined ? { message: overrides.message } : {}),
    ...(overrides.guidance !== undefined ? { guidance: overrides.guidance } : {}),
    ...(overrides.primaryAction !== undefined
      ? { primaryAction: overrides.primaryAction }
      : {}),
    ...(overrides.secondaryAction !== undefined
      ? { secondaryAction: overrides.secondaryAction }
      : {}),
    code: overrides.code ?? base.code,
  };
}

export function sendUserError(
  res: VercelResponse,
  status: number,
  code: UserErrorCode,
  overrides?: Partial<UserFacingError>,
): void {
  const error = getUserError(code, overrides);
  const body: ApiErrorBody = {
    error: error.message,
    code: error.code,
    title: error.title,
    message: error.message,
    guidance: error.guidance,
    primaryAction: error.primaryAction,
    secondaryAction: error.secondaryAction,
  };
  res.status(status).json(body);
}

export function mapSupabaseAuthError(message?: string | null): UserErrorCode {
  const lower = (message ?? "").toLowerCase();
  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return "AUTH_EMAIL_NOT_CONFIRMED";
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid email or password")) {
    return "AUTH_INVALID_CREDENTIALS";
  }
  if (lower.includes("too many requests") || lower.includes("rate limit")) {
    return "AUTH_RATE_LIMITED";
  }
  return "AUTH_INVALID_CREDENTIALS";
}
