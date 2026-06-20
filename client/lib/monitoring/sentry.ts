/**
 * Sentry — production error tracking.
 * Set VITE_SENTRY_DSN in Vercel.
 */
import { setErrorTracker } from "@/lib/logger";

let sentryReady = false;

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
    });

    setErrorTracker((error, context) => {
      Sentry.captureException(error, { extra: context });
    });

    sentryReady = true;
  } catch {
    // Package optional until installed in CI/build
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
