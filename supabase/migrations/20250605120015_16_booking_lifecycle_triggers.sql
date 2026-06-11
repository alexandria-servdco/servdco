-- =============================================================================
-- Phase 6 — Booking status history + notifications (SECURITY DEFINER triggers)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.insert_booking_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type public.notification_type,
  p_metadata jsonb DEFAULT '{}'
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

  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  VALUES (p_user_id, p_title, p_message, p_type, p_metadata);
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chef_user_id uuid;
  v_chef_name text;
  v_family_name text;
BEGIN
  SELECT cp.user_id, cp.display_name
  INTO v_chef_user_id, v_chef_name
  FROM public.chef_profiles cp
  WHERE cp.id = NEW.chef_profile_id;

  SELECT p.full_name INTO v_family_name
  FROM public.profiles p
  WHERE p.id = NEW.family_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.booking_status_history (
      booking_id, from_status, to_status, changed_by, metadata
    )
    VALUES (
      NEW.id, NULL, NEW.status, NEW.created_by,
      jsonb_build_object('event', 'created')
    );

    PERFORM public.insert_booking_notification(
      v_chef_user_id,
      'New Booking Request',
      COALESCE(v_family_name, 'A family') || ' requested a ' || NEW.service_type::text || ' booking.',
      'info',
      jsonb_build_object('booking_id', NEW.id, 'event', 'booking_created')
    );

    PERFORM public.insert_booking_notification(
      NEW.family_id,
      'Booking Submitted',
      'Your booking request with ' || COALESCE(v_chef_name, 'your cook') || ' was sent.',
      'success',
      jsonb_build_object('booking_id', NEW.id, 'event', 'booking_created')
    );

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.booking_status_history (
      booking_id, from_status, to_status, changed_by, reason, metadata
    )
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(NEW.updated_by, auth.uid()),
      NEW.cancellation_reason,
      jsonb_build_object('event', 'status_change')
    );

    IF NEW.status = 'confirmed' THEN
      PERFORM public.insert_booking_notification(
        NEW.family_id,
        'Booking Accepted',
        COALESCE(v_chef_name, 'Your cook') || ' confirmed your booking.',
        'success',
        jsonb_build_object('booking_id', NEW.id, 'event', 'booking_accepted')
      );
    ELSIF NEW.status = 'cancelled' THEN
      PERFORM public.insert_booking_notification(
        NEW.family_id,
        'Booking Cancelled',
        'Your booking was cancelled.',
        'warning',
        jsonb_build_object('booking_id', NEW.id, 'event', 'booking_cancelled')
      );
      PERFORM public.insert_booking_notification(
        v_chef_user_id,
        'Booking Cancelled',
        'A booking with ' || COALESCE(v_family_name, 'a family') || ' was cancelled.',
        'warning',
        jsonb_build_object('booking_id', NEW.id, 'event', 'booking_cancelled')
      );
    ELSIF NEW.status = 'completed' THEN
      PERFORM public.insert_booking_notification(
        NEW.family_id,
        'Booking Completed',
        'Your session with ' || COALESCE(v_chef_name, 'your cook') || ' is complete. Leave a review!',
        'success',
        jsonb_build_object('booking_id', NEW.id, 'event', 'booking_completed')
      );
      PERFORM public.insert_booking_notification(
        v_chef_user_id,
        'Booking Completed',
        'Session with ' || COALESCE(v_family_name, 'a family') || ' marked complete.',
        'info',
        jsonb_build_object('booking_id', NEW.id, 'event', 'booking_completed')
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_lifecycle ON public.bookings;

CREATE TRIGGER bookings_lifecycle
  AFTER INSERT OR UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_booking_status_change();

CREATE OR REPLACE FUNCTION public.validate_review_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = NEW.booking_id
      AND b.family_id = NEW.family_id
      AND b.chef_profile_id = NEW.chef_profile_id
      AND b.status = 'completed'
      AND b.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Reviews require a completed booking owned by the family';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.reviews r
    WHERE r.booking_id = NEW.booking_id AND r.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'A review already exists for this booking';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_validate_booking ON public.reviews;

CREATE TRIGGER reviews_validate_booking
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_review_insert();

CREATE OR REPLACE FUNCTION public.handle_review_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chef_user_id uuid;
BEGIN
  SELECT user_id INTO v_chef_user_id
  FROM public.chef_profiles
  WHERE id = NEW.chef_profile_id;

  UPDATE public.chef_profiles
  SET
    reviews_count = reviews_count + 1,
    rating = (
      SELECT ROUND(AVG(r.rating)::numeric, 2)
      FROM public.reviews r
      WHERE r.chef_profile_id = NEW.chef_profile_id
        AND r.deleted_at IS NULL
    )
  WHERE id = NEW.chef_profile_id;

  PERFORM public.insert_booking_notification(
    v_chef_user_id,
    'New Review',
    'A family left a ' || NEW.rating::text || '-star review on a completed booking.',
    'info',
    jsonb_build_object('booking_id', NEW.booking_id, 'review_id', NEW.id, 'event', 'review_submitted')
  );

  PERFORM public.insert_booking_notification(
    NEW.family_id,
    'Review Submitted',
    'Thank you for sharing your experience!',
    'success',
    jsonb_build_object('booking_id', NEW.booking_id, 'review_id', NEW.id, 'event', 'review_submitted')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_notify ON public.reviews;

CREATE TRIGGER reviews_notify
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_review_submitted();
