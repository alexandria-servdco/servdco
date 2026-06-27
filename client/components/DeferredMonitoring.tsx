import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";
import { initSentry } from "@/lib/monitoring/sentry";

/** Defer non-critical monitoring until the browser is idle. */
export function DeferredMonitoring() {
  useEffect(() => {
    initAnalytics();

    const bootSentry = () => {
      void initSentry();
    };

    if ("requestIdleCallback" in globalThis) {
      const id = globalThis.requestIdleCallback(bootSentry, { timeout: 5000 });
      return () => globalThis.cancelIdleCallback(id);
    }

    const timer = globalThis.setTimeout(bootSentry, 2500);
    return () => globalThis.clearTimeout(timer);
  }, []);

  return null;
}
