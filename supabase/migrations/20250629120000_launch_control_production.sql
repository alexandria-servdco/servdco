-- =============================================================================
-- Launch Control Production — operational region authority
-- Extends launch_regions, persists user_region_access, DB enforcement helpers
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'launch_region_status') THEN
    CREATE TYPE public.launch_region_status AS ENUM (
      'active',
      'waitlist',
      'paused',
      'maintenance',
      'internal_beta',
      'coming_soon'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- launch_regions — operational configuration (preserve legacy columns)
-- -----------------------------------------------------------------------------

ALTER TABLE public.launch_regions
  ADD COLUMN IF NOT EXISTS status public.launch_region_status,
  ADD COLUMN IF NOT EXISTS allow_new_family_signup boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_new_cook_signup boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_bookings boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_payments boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_messages boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_reviews boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_waitlist boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_interest_requests boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS maintenance_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS maintenance_message text,
  ADD COLUMN IF NOT EXISTS launch_date timestamptz,
  ADD COLUMN IF NOT EXISTS beta_limit_chefs integer CHECK (beta_limit_chefs IS NULL OR beta_limit_chefs >= 0),
  ADD COLUMN IF NOT EXISTS beta_limit_families integer CHECK (beta_limit_families IS NULL OR beta_limit_families >= 0),
  ADD COLUMN IF NOT EXISTS max_active_bookings integer CHECK (max_active_bookings IS NULL OR max_active_bookings >= 0),
  ADD COLUMN IF NOT EXISTS allow_recurring_bookings boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pause_reason text,
  ADD COLUMN IF NOT EXISTS pause_until timestamptz,
  ADD COLUMN IF NOT EXISTS pause_banner_message text;

UPDATE public.launch_regions
SET status = CASE
  WHEN is_active THEN 'active'::public.launch_region_status
  WHEN is_waitlist THEN 'waitlist'::public.launch_region_status
  ELSE 'coming_soon'::public.launch_region_status
END
WHERE status IS NULL;

ALTER TABLE public.launch_regions
  ALTER COLUMN status SET DEFAULT 'waitlist'::public.launch_region_status;

UPDATE public.launch_regions SET status = 'waitlist'::public.launch_region_status WHERE status IS NULL;

-- -----------------------------------------------------------------------------
-- user_region_access — persisted per-user launch state
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_region_access (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  state           text NOT NULL,
  city            text,
  zip             text,
  region_id       text REFERENCES public.launch_regions (id) ON DELETE SET NULL,
  launch_status   public.launch_region_status NOT NULL DEFAULT 'waitlist',
  permissions     jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason          text,
  waitlisted_at   timestamptz,
  activated_at    timestamptz,
  source          text NOT NULL DEFAULT 'signup',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER user_region_access_set_updated_at
  BEFORE UPDATE ON public.user_region_access
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_user_region_access_region
  ON public.user_region_access (region_id);

CREATE INDEX IF NOT EXISTS idx_user_region_access_status
  ON public.user_region_access (launch_status);

-- -----------------------------------------------------------------------------
-- region_announcements — per-region messaging
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.region_announcements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id     text NOT NULL REFERENCES public.launch_regions (id) ON DELETE CASCADE,
  title         text NOT NULL,
  body          text NOT NULL,
  priority      integer NOT NULL DEFAULT 0,
  scheduled_at  timestamptz,
  expires_at    timestamptz,
  created_by    uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER region_announcements_set_updated_at
  BEFORE UPDATE ON public.region_announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.region_announcement_dismissals (
  announcement_id uuid NOT NULL REFERENCES public.region_announcements (id) ON DELETE CASCADE,
  profile_id      uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  dismissed_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, profile_id)
);

-- -----------------------------------------------------------------------------
-- Geo: ZIP → city lookup for resolution
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.geo_city_for_zip(
  p_state_code text,
  p_zip text
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT g.city_name
  FROM public.geo_city_zip_codes g
  WHERE g.state_code = upper(trim(p_state_code))
    AND g.zip_code = left(regexp_replace(coalesce(p_zip, ''), '\D', '', 'g'), 5)
  ORDER BY g.city_name
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.geo_city_for_zip(text, text) TO authenticated, anon, service_role;

-- -----------------------------------------------------------------------------
-- Launch geography helpers (authoritative for RLS)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.launch_zip_allowed(
  p_region_id text,
  p_zip text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_zip_codes text;
  v_zip char(5);
BEGIN
  SELECT zip_codes INTO v_zip_codes FROM public.launch_regions WHERE id = p_region_id;
  IF v_zip_codes IS NULL OR trim(v_zip_codes) = '' THEN
    RETURN true;
  END IF;
  v_zip := left(regexp_replace(coalesce(p_zip, ''), '\D', '', 'g'), 5);
  IF length(v_zip) < 5 THEN
    RETURN false;
  END IF;
  RETURN position(v_zip in replace(v_zip_codes, ' ', '')) > 0
    OR v_zip = ANY (
      SELECT trim(both from unnest(string_to_array(v_zip_codes, ',')))
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.launch_city_allowed(
  p_region_id text,
  p_city text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cities text;
  v_norm text;
BEGIN
  SELECT city INTO v_cities FROM public.launch_regions WHERE id = p_region_id;
  IF v_cities IS NULL OR trim(v_cities) = '' THEN
    RETURN true;
  END IF;
  v_norm := lower(trim(coalesce(p_city, '')));
  IF v_norm = '' THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM unnest(string_to_array(v_cities, ',')) AS c(raw)
    WHERE lower(trim(raw)) = v_norm
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.profile_launch_permission(
  p_profile_id uuid,
  p_permission text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT (ura.permissions ->> p_permission)::boolean
      FROM public.user_region_access ura
      WHERE ura.profile_id = p_profile_id
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.sync_launch_region_legacy_flags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS NOT NULL THEN
    NEW.is_active := NEW.status IN ('active', 'internal_beta');
    NEW.is_waitlist := NEW.status = 'waitlist';
    NEW.maintenance_mode := NEW.status = 'maintenance' OR coalesce(NEW.maintenance_mode, false);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS launch_regions_sync_legacy_flags ON public.launch_regions;
CREATE TRIGGER launch_regions_sync_legacy_flags
  BEFORE INSERT OR UPDATE OF status, maintenance_mode ON public.launch_regions
  FOR EACH ROW EXECUTE FUNCTION public.sync_launch_region_legacy_flags();

-- -----------------------------------------------------------------------------
-- RLS — user_region_access
-- -----------------------------------------------------------------------------

ALTER TABLE public.user_region_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_region_access_select_own
  ON public.user_region_access FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY user_region_access_admin_all
  ON public.user_region_access FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.user_region_access TO authenticated;

ALTER TABLE public.region_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_announcement_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY region_announcements_read
  ON public.region_announcements FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (
      (scheduled_at IS NULL OR scheduled_at <= now())
      AND (expires_at IS NULL OR expires_at > now())
      AND region_id IN (
        SELECT ura.region_id FROM public.user_region_access ura
        WHERE ura.profile_id = auth.uid()
      )
    )
  );

CREATE POLICY region_announcements_admin
  ON public.region_announcements FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY region_announcement_dismissals_own
  ON public.region_announcement_dismissals FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Booking insert — require launch permission
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "bookings_insert_family" ON public.bookings;

CREATE POLICY "bookings_insert_family"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id = auth.uid()
    AND public.is_family()
    AND public.is_public_chef_profile(chef_profile_id)
    AND public.profile_launch_permission(auth.uid(), 'booking_create')
  );

-- -----------------------------------------------------------------------------
-- Backfill user_region_access from existing profiles
-- -----------------------------------------------------------------------------

INSERT INTO public.user_region_access (
  profile_id, state, city, zip, region_id, launch_status, source, waitlisted_at, activated_at
)
SELECT
  p.id,
  coalesce(p.state, 'Unknown'),
  p.city,
  p.zip,
  lr.id,
  CASE
    WHEN lr.status IN ('active', 'internal_beta') THEN lr.status
    WHEN lr.status IS NOT NULL THEN lr.status
    WHEN lr.is_active THEN 'active'::public.launch_region_status
    WHEN lr.is_waitlist THEN 'waitlist'::public.launch_region_status
    ELSE 'coming_soon'::public.launch_region_status
  END,
  'migration',
  CASE WHEN coalesce(lr.is_active, false) THEN NULL ELSE p.created_at END,
  CASE WHEN coalesce(lr.is_active, false) THEN p.created_at ELSE NULL END
FROM public.profiles p
LEFT JOIN public.launch_regions lr ON lr.id = upper(left(coalesce(p.state, ''), 2))
  OR lower(lr.state) = lower(coalesce(p.state, ''))
WHERE p.deleted_at IS NULL
  AND p.role IN ('family', 'chef')
ON CONFLICT (profile_id) DO NOTHING;

COMMENT ON TABLE public.user_region_access IS
  'Authoritative per-user launch status. Updated on signup, region activation, and admin changes.';
