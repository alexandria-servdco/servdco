-- Smart location: profile geo fields, reverse-geocode cache, ZIP-first lookup

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS location_source text
    CHECK (location_source IS NULL OR location_source IN ('gps', 'manual', 'admin', 'legacy')),
  ADD COLUMN IF NOT EXISTS last_location_update timestamptz;

ALTER TABLE public.chef_profiles
  ADD COLUMN IF NOT EXISTS service_radius_miles integer
    CHECK (service_radius_miles IS NULL OR service_radius_miles IN (5, 10, 20, 30, 50));

COMMENT ON COLUMN public.profiles.location_source IS
  'How location was set: gps, manual, admin, or legacy (pre-migration).';
COMMENT ON COLUMN public.chef_profiles.service_radius_miles IS
  'Optional cook service radius for future discovery; not used for booking yet.';

-- Reverse geocode cache (rounded coords ~111m precision)
CREATE TABLE IF NOT EXISTS public.geo_reverse_cache (
  lat_rounded numeric(8, 3) NOT NULL,
  lng_rounded numeric(9, 3) NOT NULL,
  zip_code char(5) NOT NULL,
  city_name text NOT NULL,
  state_code char(2) NOT NULL,
  country text NOT NULL DEFAULT 'US',
  provider text NOT NULL DEFAULT 'census',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lat_rounded, lng_rounded)
);

CREATE INDEX IF NOT EXISTS idx_geo_reverse_cache_zip
  ON public.geo_reverse_cache (zip_code);

ALTER TABLE public.geo_reverse_cache ENABLE ROW LEVEL SECURITY;

-- Service role only for cache writes (API uses service role)
CREATE POLICY "geo_reverse_cache_service"
  ON public.geo_reverse_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ZIP-first lookup: authoritative city/state from our geo dataset
CREATE OR REPLACE FUNCTION public.geo_primary_location_for_zip(p_zip text)
RETURNS TABLE (
  state_code char(2),
  city_name text,
  zip_code char(5)
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    g.state_code,
    g.city_name,
    g.zip_code
  FROM public.geo_city_zip_codes g
  WHERE g.zip_code = left(regexp_replace(trim(coalesce(p_zip, '')), '\D', '', 'g'), 5)
  ORDER BY g.city_name
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.geo_primary_location_for_zip IS
  'Returns primary city/state for a US ZIP from geo_city_zip_codes (ZIP is canonical).';
