-- =============================================================================
-- Public read for geo reference data — signup city/ZIP lookup (anon-safe)
-- =============================================================================

DROP POLICY IF EXISTS geo_city_zip_codes_public_read ON public.geo_city_zip_codes;

CREATE POLICY geo_city_zip_codes_public_read
  ON public.geo_city_zip_codes
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.geo_city_zip_codes TO anon;
GRANT EXECUTE ON FUNCTION public.search_geo_cities(text, text, integer) TO anon;
