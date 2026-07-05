/**
 * Sentry — production error tracking.
 * Set VITE_SENTRY_DSN in Vercel.
 */
import { setErrorTracker } from "@/lib/logger";

let sentryReady = false;

const SENSITIVE_KEYS = new Set([
  "password",
  "confirmPassword",
  "confirm_password",
  "access_token",
  "refresh_token",
  "authorization",
  "apikey",
]);

function scrubSensitiveRecord(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      out[key] = "[REDACTED]";
      continue;
    }
    out[key] =
      value && typeof value === "object" && !Array.isArray(value)
        ? scrubSensitiveRecord(value as Record<string, unknown>)
        : value;
  }
  return out;
}

export function isSentryReady(): boolean {
  return sentryReady;
}

export async function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || sentryReady || import.meta.env.DEV) return;

  try {
    const Sentry = await import("@sentry/react");
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      beforeSend(event) {
        const exceptionType = event.exception?.values?.[0]?.type;
        const exceptionMessage = event.exception?.values?.[0]?.value ?? "";
        if (
          exceptionType === "AvailabilityValidationError" ||
          exceptionMessage.includes("already exists on") ||
          exceptionMessage.includes("overlaps with") ||
          exceptionMessage.includes("Cannot exceed")
        ) {
          return null;
        }

        const request = event.request;
        if (request?.data && typeof request.data === "object") {
          request.data = scrubSensitiveRecord(
            request.data as Record<string, unknown>,
          );
        }
        if (request?.headers) {
          request.headers = scrubSensitiveRecord(
            request.headers as Record<string, unknown>,
          ) as Record<string, string>;
        }
        return event;
      },
    });

    setErrorTracker((error, context) => {
      Sentry.captureException(error, { extra: context });
    });

    sentryReady = true;

    if (typeof window !== "undefined") {
      window.testSentry = () => {
        Sentry.captureException(new Error("SERVDCO SENTRY TEST"));
        return "Sentry test exception sent";
      };
    }
  } catch (err) {
    console.warn("[Sentry] init failed:", err);
  }
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!sentryReady) return;
  void import("@sentry/react").then((Sentry) => {
    Sentry.captureException(error, { extra: context });
  });
}
