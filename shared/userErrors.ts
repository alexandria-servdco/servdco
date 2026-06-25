/** Production user-facing error codes — never expose raw provider messages. */
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

export function getUserError(code: UserErrorCode, overrides?: Partial<UserFacingError>): UserFacingError {
  const base = CATALOG[code] ?? CATALOG.UNKNOWN_ERROR;
  return { ...base, ...overrides, code: overrides?.code ?? base.code };
}

function isUserErrorCode(value: string | undefined): value is UserErrorCode {
  return Boolean(value && value in CATALOG);
}

/** Map HTTP status + optional API body to a user-facing error. */
export function mapToUserFacingError(
  status: number,
  body: ApiErrorBody = {},
): UserFacingError {
  if (isUserErrorCode(body.code)) {
    const base = getUserError(body.code);
    return {
      ...base,
      message: body.message || body.error || base.message,
      guidance: body.guidance || base.guidance,
      title: body.title || base.title,
      primaryAction: body.primaryAction || base.primaryAction,
      secondaryAction: body.secondaryAction || base.secondaryAction,
    };
  }

  if (status === 401) {
    if (body.code === "EMAIL_NOT_CONFIRMED") {
      return getUserError("AUTH_EMAIL_NOT_CONFIRMED");
    }
    return getUserError("AUTH_INVALID_CREDENTIALS", {
      message: body.error || body.message,
    });
  }

  switch (status) {
    case 400:
      return getUserError("VALIDATION_ERROR", {
        message: body.error || body.message || CATALOG.VALIDATION_ERROR.message,
      });
    case 403:
      return getUserError("AUTHORIZATION_DENIED");
    case 404:
      return getUserError("NOT_FOUND", {
        message: body.error || body.message || CATALOG.NOT_FOUND.message,
      });
    case 409:
      return getUserError("CONFLICT", {
        title: body.title || CATALOG.CONFLICT.title,
        message: body.error || body.message || CATALOG.CONFLICT.message,
        guidance: body.guidance || CATALOG.CONFLICT.guidance,
        primaryAction: body.primaryAction || CATALOG.CONFLICT.primaryAction,
        secondaryAction: body.secondaryAction || CATALOG.CONFLICT.secondaryAction,
      });
    case 429:
      return getUserError(body.code === "RATE_LIMIT_EXCEEDED" ? "AUTH_RATE_LIMITED" : "RATE_LIMITED");
    case 503:
      return getUserError("AUTH_SERVICE_UNAVAILABLE", {
        message: body.error || body.message || CATALOG.AUTH_SERVICE_UNAVAILABLE.message,
      });
    case 500:
    case 502:
    case 504:
      return getUserError(isUserErrorCode(body.code) ? body.code : "SERVER_ERROR", {
        title: body.title,
        message: body.message || body.error,
        guidance: body.guidance,
        primaryAction: body.primaryAction,
        secondaryAction: body.secondaryAction,
      });
    default:
      return getUserError("UNKNOWN_ERROR", {
        message: body.error || body.message,
      });
  }
}

/** Map thrown / network errors on the client. */
export function mapThrownError(err: unknown): UserFacingError {
  if (isUserFacingError(err)) return err;

  if (err instanceof TypeError && String(err.message).toLowerCase().includes("fetch")) {
    return getUserError("NETWORK_OFFLINE");
  }

  const message = err instanceof Error ? err.message.toLowerCase() : "";

  if (message.includes("email not confirmed") || message.includes("not confirmed")) {
    return getUserError("AUTH_EMAIL_NOT_CONFIRMED");
  }
  if (message.includes("invalid login credentials") || message.includes("invalid email or password")) {
    return getUserError("AUTH_INVALID_CREDENTIALS");
  }
  if (message.includes("jwt") || message.includes("session") || message.includes("expired")) {
    return getUserError("AUTH_SESSION_EXPIRED");
  }
  if (message.includes("profile not found") || message.includes("profile isn't ready")) {
    return getUserError("AUTH_PROFILE_INCOMPLETE");
  }
  if (message.includes("clock") || message.includes("issued in the future")) {
    return getUserError("SERVER_ERROR", {
      title: "Device time may be incorrect",
      message: "We couldn't establish a secure session.",
      guidance:
        "Check that your computer or phone date and time are set correctly, then try signing in again.",
      primaryAction: { label: "Try again", action: "retry" },
    });
  }

  return getUserError("UNKNOWN_ERROR");
}

export function isUserFacingError(err: unknown): err is UserFacingError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    "title" in err &&
    "message" in err
  );
}

export function formatUserErrorMessage(error: UserFacingError): string {
  return error.guidance ? `${error.message} ${error.guidance}` : error.message;
}
