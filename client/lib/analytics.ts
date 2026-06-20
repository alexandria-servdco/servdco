/**
 * Google Analytics 4 — production event tracking.
 * Set VITE_GA_MEASUREMENT_ID in Vercel (e.g. G-XXXXXXXXXX).
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as
  | string
  | undefined;

let initialized = false;

export type AnalyticsEvent =
  | "page_view"
  | "signup_started"
  | "signup_completed"
  | "booking_started"
  | "booking_submitted"
  | "booking_accepted"
  | "payment_completed"
  | "document_upload"
  | "contact_form_submission";

export function isAnalyticsEnabled(): boolean {
  return Boolean(MEASUREMENT_ID && MEASUREMENT_ID.startsWith("G-"));
}

export function initAnalytics(): void {
  if (!isAnalyticsEnabled() || initialized || typeof window === "undefined") {
    return;
  }
  initialized = true;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

export function trackPageView(path: string, title?: string): void {
  if (!isAnalyticsEnabled() || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_title: title ?? document.title,
  });
}

export function trackEvent(
  name: AnalyticsEvent,
  params?: Record<string, string | number | boolean | undefined>,
): void {
  if (!isAnalyticsEnabled() || !window.gtag) return;
  window.gtag("event", name, params ?? {});
}
