-- =============================================================================
-- Phase 8 — Messaging triggers, read policy, Realtime publication
-- =============================================================================

-- Participants may mark inbound messages as read
CREATE POLICY "messages_update_read_participants"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND sender_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (
          c.family_id = auth.uid()
          OR public.owns_chef_profile(c.chef_profile_id)
        )
    )
  )
  WITH CHECK (sender_id <> auth.uid());

-- Bump conversation.last_message_at on new message
CREATE OR REPLACE FUNCTION public.on_message_insert_update_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_update_conversation_last_message ON public.messages;
CREATE TRIGGER messages_update_conversation_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.on_message_insert_update_conversation();

-- Notify recipient on new message
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
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_notify_recipient ON public.messages;
CREATE TRIGGER messages_notify_recipient
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.on_message_insert_notify_recipient();

-- Realtime (Supabase hosted)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
