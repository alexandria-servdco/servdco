import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { stripJunkQueryParams } from "@/lib/url/stripJunkQueryParams";

/** Strip legacy/junk query params on load and route change. */
export function UrlQueryHygiene() {
  const { search } = useLocation();

  useEffect(() => {
    stripJunkQueryParams();
  }, [search]);

  return null;
}
