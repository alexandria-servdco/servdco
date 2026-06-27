/**
 * Google Analytics 4 — production event tracking.
 * Set VITE_GA_MEASUREMENT_ID in Vercel (e.g. G-XXXXXXXXXX).
 */

import { isProductionBuild } from "@/lib/env/runtimeFlags";

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

export function getMeasurementId(): string | undefined {
  return isAnalyticsEnabled() ? MEASUREMENT_ID : undefined;
}

export function initAnalytics(): void {
  if (!isAnalyticsEnabled() || initialized || typeof window === "undefined") {
    return;
  }

  void import("@/lib/cookieConsent/storage").then(({ analyticsAllowed }) => {
    if (!analyticsAllowed()) return;
    if (initialized) return;
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

    if (isProductionBuild()) {
      window.__SERVDCO_ANALYTICS__ = {
        enabled: true,
        measurementId: MEASUREMENT_ID,
      };
    }
  });
}

export function trackPageView(path: string, title?: string): void {
  if (!isAnalyticsEnabled() || !window.gtag) return;
  void import("@/lib/cookieConsent/storage").then(({ analyticsAllowed }) => {
    if (!analyticsAllowed()) return;
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
  if (!isAnalyticsEnabled() || !window.gtag) return;
  void import("@/lib/cookieConsent/storage").then(({ analyticsAllowed }) => {
    if (!analyticsAllowed()) return;
    window.gtag?.("event", name, params ?? {});
  });
}
