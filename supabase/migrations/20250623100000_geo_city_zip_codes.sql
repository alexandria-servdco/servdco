-- =============================================================================
-- Production geo lookup: city → ZIP dataset in PostgreSQL
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.geo_city_zip_codes (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  state_code      char(2) NOT NULL CHECK (state_code ~ '^[A-Z]{2}$'),
  city_name       text NOT NULL,
  city_normalized text NOT NULL,
  zip_code        char(5) NOT NULL CHECK (zip_code ~ '^\d{5}$'),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT geo_city_zip_codes_unique UNIQUE (state_code, city_normalized, zip_code)
);

CREATE INDEX idx_geo_city_zip_state_city
  ON public.geo_city_zip_codes (state_code, city_normalized);

CREATE INDEX idx_geo_city_zip_state_zip
  ON public.geo_city_zip_codes (state_code, zip_code);

CREATE INDEX idx_geo_city_zip_city_trgm
  ON public.geo_city_zip_codes USING gin (city_normalized gin_trgm_ops);

COMMENT ON TABLE public.geo_city_zip_codes IS
  'US city → ZIP reference data for admin launch region management. Expand via CSV import script.';

-- -----------------------------------------------------------------------------
-- RPC: fuzzy city search within a state
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.search_geo_cities(
  p_state_code text,
  p_query text DEFAULT '',
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  city_name text,
  zip_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    g.city_name,
    COUNT(DISTINCT g.zip_code)::bigint AS zip_count
  FROM public.geo_city_zip_codes g
  WHERE g.state_code = upper(trim(p_state_code))
    AND (
      coalesce(trim(p_query), '') = ''
      OR g.city_normalized LIKE '%' || lower(trim(p_query)) || '%'
      OR similarity(g.city_normalized, lower(trim(p_query))) > 0.25
    )
  GROUP BY g.city_name, g.city_normalized
  ORDER BY
    CASE
      WHEN lower(g.city_name) = lower(trim(p_query)) THEN 0
      WHEN g.city_normalized LIKE lower(trim(p_query)) || '%' THEN 1
      ELSE 2
    END,
    similarity(g.city_normalized, lower(trim(coalesce(p_query, '')))) DESC,
    g.city_name
  LIMIT greatest(1, least(coalesce(p_limit, 50), 100));
$$;

-- -----------------------------------------------------------------------------
-- RPC: resolve ZIP codes for a list of cities in a state
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.geo_zips_for_cities(
  p_state_code text,
  p_cities text[]
)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT coalesce(
    array_agg(DISTINCT g.zip_code ORDER BY g.zip_code),
    ARRAY[]::text[]
  )
  FROM public.geo_city_zip_codes g
  WHERE g.state_code = upper(trim(p_state_code))
    AND EXISTS (
      SELECT 1
      FROM unnest(coalesce(p_cities, ARRAY[]::text[])) AS c(city)
      WHERE lower(trim(c.city)) = g.city_normalized
         OR lower(trim(c.city)) = lower(trim(g.city_name))
    );
$$;

-- -----------------------------------------------------------------------------
-- RLS — admin read for launch control; service role for bulk import
-- -----------------------------------------------------------------------------

ALTER TABLE public.geo_city_zip_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY geo_city_zip_codes_admin_select
  ON public.geo_city_zip_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.status = 'active'
        AND p.deleted_at IS NULL
    )
  );

GRANT SELECT ON public.geo_city_zip_codes TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_geo_cities(text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.geo_zips_for_cities(text, text[]) TO authenticated;
