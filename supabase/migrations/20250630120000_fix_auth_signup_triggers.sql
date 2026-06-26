-- =============================================================================
-- Fix auth signup: trigger chain must never roll back auth.users creation
-- =============================================================================

-- Safe numeric parse for chef years_experience metadata
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
  v_years_raw text;
BEGIN
  v_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::public.user_role,
    'family'
  );

  IF v_role = 'admin' THEN
    v_role := 'family';
  END IF;

  v_full_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(NEW.email, ''), '@', 1),
    'Servd Co member'
  );
  v_city := NULLIF(NEW.raw_user_meta_data ->> 'city', '');
  v_state := NULLIF(NEW.raw_user_meta_data ->> 'state', '');
  v_zip := NULLIF(NEW.raw_user_meta_data ->> 'zip', '');
  v_phone := NULLIF(NEW.raw_user_meta_data ->> 'phone', '');
  v_cuisine := NULLIF(NEW.raw_user_meta_data ->> 'primary_cuisine', '');
  v_bio := NULLIF(NEW.raw_user_meta_data ->> 'bio', '');
  v_years_raw := NULLIF(NEW.raw_user_meta_data ->> 'years_experience', '');
  v_years := NULL;
  IF v_years_raw IS NOT NULL AND v_years_raw ~ '^\d+$' THEN
    v_years := v_years_raw::smallint;
  END IF;
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

-- Audit writes must never block signup or profile bootstrap
CREATE OR REPLACE FUNCTION public.write_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_old jsonb;
  v_new jsonb;
  v_entity_id text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'insert';
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_entity_id := COALESCE(v_new ->> 'id', v_new ->> 'key', NULL);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_entity_id := COALESCE(v_new ->> 'id', v_new ->> 'key', v_old ->> 'id', v_old ->> 'key', NULL);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_entity_id := COALESCE(v_old ->> 'id', v_old ->> 'key', NULL);
  END IF;

  BEGIN
    INSERT INTO public.audit_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      v_action,
      TG_TABLE_NAME,
      v_entity_id,
      v_old,
      v_new
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'write_audit_log skipped for %.%: %', TG_TABLE_NAME, v_entity_id, SQLERRM;
  END;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Welcome notifications are best-effort only
CREATE OR REPLACE FUNCTION public.insert_booking_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type public.notification_type,
  p_metadata jsonb DEFAULT '{}',
  p_category text DEFAULT 'booking'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT public.user_allows_notification(p_user_id, p_category) THEN
    RETURN;
  END IF;

  BEGIN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (p_user_id, p_title, p_message, p_type, p_metadata);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'insert_booking_notification skipped for %: %', p_user_id, SQLERRM;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_profile_created_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    IF NEW.role = 'family' THEN
      PERFORM public.insert_booking_notification(
        NEW.id,
        'Welcome to Servd Co',
        'Your family account is ready. Complete your profile to start booking cooks.',
        'success',
        jsonb_build_object('event', 'signup', 'role', 'family'),
        'announcement'
      );
    ELSIF NEW.role = 'chef' THEN
      PERFORM public.insert_booking_notification(
        NEW.id,
        'Welcome to Servd Co',
        'Your chef account is created. Upload documents and complete your profile while we review your application.',
        'success',
        jsonb_build_object('event', 'signup', 'role', 'chef'),
        'announcement'
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'on_profile_created_notify skipped for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;
