const SENSITIVE_KEYS = new Set([
  "password",
  "confirmPassword",
  "confirm_password",
  "newPassword",
  "new_password",
  "currentPassword",
  "current_password",
  "access_token",
  "refresh_token",
  "turnstileToken",
  "authorization",
  "apikey",
]);

/** Strip secrets before writing request payloads or metadata to logs. */
export function redactForLog(value: unknown): unknown {
  if (value == null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactForLog(item));
  }

  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key)) {
      out[key] = "[REDACTED]";
      continue;
    }
    out[key] = redactForLog(nested);
  }
  return out;
}
