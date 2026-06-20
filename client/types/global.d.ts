export {};

/** Global window helpers for production verification. */
 declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    testSentry?: () => string;
    __SERVDCO_ANALYTICS__?: {
      enabled: boolean;
      measurementId?: string;
    };
  }
}
