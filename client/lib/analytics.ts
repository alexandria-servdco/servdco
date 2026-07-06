/**
 * Google Analytics 4 — production event tracking.
 * Set VITE_GA_MEASUREMENT_ID in Vercel (e.g. G-XXXXXXXXXX).
 */

import { isProductionBuild } from "@/lib/env/runtimeFlags";

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as
  | string
  | undefined;

let initialized = false;
let initPromise: Promise<void> | null = null;

/** Wait until gtag is loaded (cookie consent + script onload). */
export function whenAnalyticsReady(): Promise<void> {
  if (!isAnalyticsEnabled() || typeof window === "undefined") {
    return Promise.resolve();
  }
  initAnalytics();
  return initPromise ?? Promise.resolve();
}

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

export function getMeasurementId(): string | undefined {
  return isAnalyticsEnabled() ? MEASUREMENT_ID : undefined;
}

export function initAnalytics(): void {
  if (!isAnalyticsEnabled() || typeof window === "undefined" || initialized) return;
  if (initPromise) return;

  initPromise = import("@/lib/cookieConsent/storage")
    .then(({ analyticsAllowed }) => {
      if (!analyticsAllowed() || initialized) {
        initPromise = null;
        return;
      }

      window.dataLayer = window.dataLayer ?? [];
      // Must match Google's snippet: push `arguments`, not a rest-args array.
      function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments);
      }
      window.gtag = gtag as Window["gtag"];

      window.gtag!("js", new Date());
      window.gtag!("config", MEASUREMENT_ID, { send_page_view: false });

      return new Promise<void>((resolve) => {
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
        script.onload = () => {
          initialized = true;
          window.gtag?.("event", "page_view", {
            page_path: window.location.pathname,
            page_title: document.title,
          });
          if (isProductionBuild()) {
            window.__SERVDCO_ANALYTICS__ = {
              enabled: true,
              measurementId: MEASUREMENT_ID,
            };
          }
          resolve();
        };
        script.onerror = () => resolve();
        document.head.appendChild(script);
      });
    })
    .catch(() => {
      initPromise = null;
    });
}

export function trackPageView(path: string, title?: string): void {
  if (!isAnalyticsEnabled()) return;
  void import("@/lib/cookieConsent/storage").then(async ({ analyticsAllowed }) => {
    if (!analyticsAllowed()) return;
    await whenAnalyticsReady();
    window.gtag?.("event", "page_view", {
      page_path: path,
      page_title: title ?? document.title,
    });
  });
}

export function trackEvent(
  name: AnalyticsEvent,
  params?: Record<string, string | number | boolean | undefined>,
): void {
  if (!isAnalyticsEnabled()) return;
  void import("@/lib/cookieConsent/storage").then(async ({ analyticsAllowed }) => {
    if (!analyticsAllowed()) return;
    await whenAnalyticsReady();
    window.gtag?.("event", name, params ?? {});
  });
}
