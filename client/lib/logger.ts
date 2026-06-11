/**
 * Frontend logging abstraction — structured console output in dev;
 * hook point for Sentry/Datadog before launch.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  domain?: string;
  userId?: string;
  route?: string;
  [key: string]: unknown;
}

type ErrorTracker = (error: Error, context?: LogContext) => void;

let errorTracker: ErrorTracker | null = null;

export function setErrorTracker(tracker: ErrorTracker): void {
  errorTracker = tracker;
}

function emit(level: LogLevel, message: string, context?: LogContext): void {
  const payload = context ? { message, ...context } : message;
  if (level === "debug" && import.meta.env.PROD) return;

  const fn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : level === "info"
          ? console.info
          : console.debug;

  fn(`[ServdCo:${level}]`, payload);
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    emit("debug", message, context),
  info: (message: string, context?: LogContext) =>
    emit("info", message, context),
  warn: (message: string, context?: LogContext) =>
    emit("warn", message, context),
  error: (message: string, context?: LogContext) =>
    emit("error", message, context),
  trackError: (error: Error, context?: LogContext) => {
    emit("error", error.message, { ...context, stack: error.stack });
    errorTracker?.(error, context);
  },
};
