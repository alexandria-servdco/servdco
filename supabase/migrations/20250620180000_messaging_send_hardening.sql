-- Do not roll back message inserts when notification delivery fails.
CREATE OR REPLACE FUNCTION public.on_message_insert_notify_recipient()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv public.conversations%ROWTYPE;
  recipient_id uuid;
BEGIN
  SELECT * INTO conv FROM public.conversations WHERE id = NEW.conversation_id;

  IF conv.family_id = NEW.sender_id THEN
    SELECT cp.user_id INTO recipient_id
    FROM public.chef_profiles cp
    WHERE cp.id = conv.chef_profile_id;
  ELSE
    recipient_id := conv.family_id;
  END IF;

  IF recipient_id IS NOT NULL AND recipient_id <> NEW.sender_id THEN
    BEGIN
      INSERT INTO public.notifications (user_id, title, message, type, metadata)
      VALUES (
        recipient_id,
        'New message',
        LEFT(NEW.body, 120),
        'info',
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'message_id', NEW.id,
          'booking_id', conv.booking_id
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'on_message_insert_notify_recipient failed: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;
