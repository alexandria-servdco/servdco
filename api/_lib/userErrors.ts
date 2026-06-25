import type { VercelResponse } from "@vercel/node";
import {
  getUserError,
  type ApiErrorBody,
  type UserErrorCode,
  type UserFacingError,
} from "../../shared/userErrors.js";

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

export function mapSupabaseAuthError(message: string): UserErrorCode {
  const lower = message.toLowerCase();
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
