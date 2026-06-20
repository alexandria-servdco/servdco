import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { applyPageMeta, getSeoForPath } from "@/lib/seo/pageMeta";
import { trackPageView } from "@/lib/analytics";

/** Updates document meta + GA page_view on route change. */
export function PageMetaManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const config = getSeoForPath(pathname);
    applyPageMeta(config);
    trackPageView(pathname, config.title);
  }, [pathname]);

  return null;
}
