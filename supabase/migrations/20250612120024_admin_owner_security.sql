-- =============================================================================
-- Admin owner security — block self-registration as admin, audit log inserts
-- =============================================================================

-- -----------------------------------------------------------------------------
-- handle_new_user: never allow signup with role = admin (owner assigned via SQL)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_full_name text;
  v_city text;
  v_state text;
  v_zip text;
  v_phone text;
  v_cuisine text;
  v_years smallint;
  v_bio text;
  v_location text;
BEGIN
  v_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::public.user_role,
    'family'
  );

  IF v_role = 'admin' THEN
    v_role := 'family';
  END IF;

  v_full_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    ''
  );
  v_city := NULLIF(NEW.raw_user_meta_data ->> 'city', '');
  v_state := NULLIF(NEW.raw_user_meta_data ->> 'state', '');
  v_zip := NULLIF(NEW.raw_user_meta_data ->> 'zip', '');
  v_phone := NULLIF(NEW.raw_user_meta_data ->> 'phone', '');
  v_cuisine := NULLIF(NEW.raw_user_meta_data ->> 'primary_cuisine', '');
  v_bio := NULLIF(NEW.raw_user_meta_data ->> 'bio', '');
  v_years := NULLIF(NEW.raw_user_meta_data ->> 'years_experience', '')::smallint;
  v_location := NULLIF(trim(both ', ' from concat_ws(', ', v_city, v_state)), '');

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    status,
    city,
    state,
    zip,
    phone,
    profile_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_role,
    'active',
    v_city,
    v_state,
    v_zip,
    v_phone,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    city = COALESCE(EXCLUDED.city, public.profiles.city),
    state = COALESCE(EXCLUDED.state, public.profiles.state),
    zip = COALESCE(EXCLUDED.zip, public.profiles.zip),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = now();

  IF v_role = 'chef' THEN
    INSERT INTO public.chef_profiles (
      user_id,
      display_name,
      headline,
      bio,
      cuisines,
      years_experience,
      location,
      verification_status,
      profile_visibility
    )
    VALUES (
      NEW.id,
      v_full_name,
      NULLIF(NEW.raw_user_meta_data ->> 'headline', ''),
      v_bio,
      CASE WHEN v_cuisine IS NOT NULL THEN ARRAY[v_cuisine] ELSE '{}'::text[] END,
      v_years,
      v_location,
      'pending',
      'hidden'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      bio = COALESCE(EXCLUDED.bio, public.chef_profiles.bio),
      cuisines = CASE
        WHEN array_length(EXCLUDED.cuisines, 1) > 0 THEN EXCLUDED.cuisines
        ELSE public.chef_profiles.cuisines
      END,
      years_experience = COALESCE(EXCLUDED.years_experience, public.chef_profiles.years_experience),
      location = COALESCE(EXCLUDED.location, public.chef_profiles.location),
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- audit_logs: admins may insert audit records for their actions
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'audit_logs'
      AND policyname = 'audit_logs_admin_insert'
  ) THEN
    CREATE POLICY audit_logs_admin_insert ON public.audit_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
        AND actor_id = auth.uid()
      );
  END IF;
END $$;
