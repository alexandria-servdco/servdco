-- Drop legacy 5-arg overload; triggers calling with 5 args were ambiguous
-- against the 6-arg version (p_category default). Keeps single canonical signature.

DROP FUNCTION IF EXISTS public.insert_booking_notification(
  uuid,
  text,
  text,
  public.notification_type,
  jsonb
);

CREATE OR REPLACE FUNCTION public.insert_booking_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type public.notification_type,
  p_metadata jsonb DEFAULT '{}'::jsonb,
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
