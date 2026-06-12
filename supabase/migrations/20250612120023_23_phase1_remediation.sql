-- =============================================================================
-- Phase 1 Remediation — profile_completed, signup/profile/premium notifications
-- =============================================================================

-- -----------------------------------------------------------------------------
-- handle_new_user: new users start incomplete (profile_completed = 0)
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
-- Signup welcome notifications (family + chef)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.on_profile_created_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'family' THEN
    PERFORM public.insert_booking_notification(
      NEW.id,
      'Welcome to Servd Co',
      'Your family account is ready. Complete your profile to start booking cooks.',
      'success',
      jsonb_build_object('event', 'signup', 'role', 'family')
    );
  ELSIF NEW.role = 'chef' THEN
    PERFORM public.insert_booking_notification(
      NEW.id,
      'Welcome to Servd Co',
      'Your chef account is created. Upload documents and complete your profile while we review your application.',
      'success',
      jsonb_build_object('event', 'signup', 'role', 'chef')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_signup_notify ON public.profiles;
CREATE TRIGGER profiles_signup_notify
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.on_profile_created_notify();

-- -----------------------------------------------------------------------------
-- Profile update / completion notifications
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.on_profile_updated_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF OLD.profile_completed IS DISTINCT FROM NEW.profile_completed
     AND NEW.profile_completed = 100 THEN
    PERFORM public.insert_booking_notification(
      NEW.id,
      'Profile Complete',
      'Your profile is fully complete. You are ready to use all dashboard features.',
      'success',
      jsonb_build_object('event', 'profile_completed', 'profile_completed', NEW.profile_completed)
    );
  ELSIF (
    OLD.full_name IS DISTINCT FROM NEW.full_name
    OR OLD.city IS DISTINCT FROM NEW.city
    OR OLD.state IS DISTINCT FROM NEW.state
    OR OLD.phone IS DISTINCT FROM NEW.phone
    OR OLD.profile_completed IS DISTINCT FROM NEW.profile_completed
  ) AND NEW.profile_completed < 100 THEN
    PERFORM public.insert_booking_notification(
      NEW.id,
      'Profile Updated',
      'Your profile changes have been saved.',
      'info',
      jsonb_build_object('event', 'profile_updated', 'profile_completed', NEW.profile_completed)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_update_notify ON public.profiles;
CREATE TRIGGER profiles_update_notify
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.on_profile_updated_notify();

-- -----------------------------------------------------------------------------
-- Premium activated / cancelled (chef_profiles.premium_status)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.on_chef_premium_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.premium_status IS DISTINCT FROM NEW.premium_status THEN
    IF NEW.premium_status = true THEN
      PERFORM public.insert_booking_notification(
        NEW.user_id,
        'Premium Activated',
        'Your Premium Chef Membership is active. You now have priority placement and analytics access.',
        'success',
        jsonb_build_object('event', 'premium_activated', 'chef_profile_id', NEW.id)
      );
    ELSE
      PERFORM public.insert_booking_notification(
        NEW.user_id,
        'Premium Cancelled',
        'Your Premium Chef Membership has ended. You still have full free-tier access.',
        'warning',
        jsonb_build_object('event', 'premium_cancelled', 'chef_profile_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chef_profiles_premium_notify ON public.chef_profiles;
CREATE TRIGGER chef_profiles_premium_notify
  AFTER UPDATE OF premium_status ON public.chef_profiles
  FOR EACH ROW EXECUTE FUNCTION public.on_chef_premium_status_change();
