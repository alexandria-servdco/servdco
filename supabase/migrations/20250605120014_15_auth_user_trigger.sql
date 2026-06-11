-- =============================================================================
-- ServdCo Phase 4 — Attach handle_new_user to auth.users + chef bootstrap
-- =============================================================================

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
    CASE WHEN v_role = 'chef' THEN 50 ELSE 50 END
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS
  'Phase 4: Bootstrap profiles + chef_profiles on auth.users insert.';
