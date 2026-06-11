-- =============================================================================
-- Phase 12B — Notifications, realtime, storage policies, chef document resubmit
-- =============================================================================

-- Booking declined (pending → cancelled)
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
      IF OLD.status = 'pending' THEN
        PERFORM public.insert_booking_notification(
          NEW.family_id,
          'Booking Declined',
          COALESCE(v_chef_name, 'The cook') || ' declined your booking request.',
          'warning',
          jsonb_build_object('booking_id', NEW.id, 'event', 'booking_rejected')
        );
        PERFORM public.insert_booking_notification(
          v_chef_user_id,
          'Booking Declined',
          'You declined the booking with ' || COALESCE(v_family_name, 'a family') || '.',
          'info',
          jsonb_build_object('booking_id', NEW.id, 'event', 'booking_rejected')
        );
      ELSE
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
      END IF;
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

-- Chef verification status notifications
CREATE OR REPLACE FUNCTION public.on_chef_verification_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    IF NEW.verification_status = 'approved' THEN
      PERFORM public.insert_booking_notification(
        NEW.user_id,
        'Chef Profile Approved',
        'Your chef profile has been approved. You are now visible in the marketplace.',
        'success',
        jsonb_build_object('chef_profile_id', NEW.id, 'event', 'chef_approved')
      );
    ELSIF NEW.verification_status = 'rejected' THEN
      PERFORM public.insert_booking_notification(
        NEW.user_id,
        'Chef Profile Not Approved',
        'Your chef application was not approved. Contact support for details.',
        'error',
        jsonb_build_object('chef_profile_id', NEW.id, 'event', 'chef_rejected')
      );
    ELSIF NEW.verification_status = 'suspended' THEN
      PERFORM public.insert_booking_notification(
        NEW.user_id,
        'Chef Profile Suspended',
        'Your chef profile has been suspended.',
        'warning',
        jsonb_build_object('chef_profile_id', NEW.id, 'event', 'chef_suspended')
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chef_profiles_verification_notify ON public.chef_profiles;
CREATE TRIGGER chef_profiles_verification_notify
  AFTER UPDATE OF verification_status ON public.chef_profiles
  FOR EACH ROW EXECUTE FUNCTION public.on_chef_verification_status_change();

-- Document review notifications
CREATE OR REPLACE FUNCTION public.on_chef_document_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chef_user_id uuid;
  v_doc_label text;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT cp.user_id INTO v_chef_user_id
    FROM public.chef_profiles cp
    WHERE cp.id = NEW.chef_profile_id;

    v_doc_label := REPLACE(NEW.document_type::text, '_', ' ');

    IF NEW.status = 'approved' THEN
      PERFORM public.insert_booking_notification(
        v_chef_user_id,
        'Document Approved',
        'Your ' || v_doc_label || ' was approved.',
        'success',
        jsonb_build_object('document_id', NEW.id, 'event', 'document_approved')
      );
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.insert_booking_notification(
        v_chef_user_id,
        'Document Rejected',
        COALESCE(
          'Your ' || v_doc_label || ' was rejected. ' || NEW.review_notes,
          'Your ' || v_doc_label || ' was rejected. Please resubmit.'
        ),
        'error',
        jsonb_build_object('document_id', NEW.id, 'event', 'document_rejected')
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chef_documents_status_notify ON public.chef_documents;
CREATE TRIGGER chef_documents_status_notify
  AFTER UPDATE OF status ON public.chef_documents
  FOR EACH ROW EXECUTE FUNCTION public.on_chef_document_status_change();

-- Chef may resubmit rejected documents (storage path + status)
CREATE POLICY "chef_documents_update_own_resubmit"
  ON public.chef_documents FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.owns_chef_profile(chef_profile_id)
    AND status IN ('pending', 'rejected')
  )
  WITH CHECK (public.owns_chef_profile(chef_profile_id));

-- Admin read all notifications
CREATE POLICY "notifications_select_admin"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Realtime: notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Storage: chef delete/update own documents
CREATE POLICY "documents_storage_chef_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'cook-documents'
    AND public.owns_chef_profile(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "documents_storage_chef_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'cook-documents'
    AND public.owns_chef_profile(((storage.foldername(name))[1])::uuid)
  );

-- Global announcements setting
INSERT INTO public.platform_settings (key, value, description)
VALUES (
  'global_announcements',
  '[]'::jsonb,
  'Active global banner announcements for the platform'
)
ON CONFLICT (key) DO NOTHING;

-- Audit: messaging + notifications (admin moderation trail)
DROP TRIGGER IF EXISTS audit_messages ON public.messages;
CREATE TRIGGER audit_messages
  AFTER INSERT OR UPDATE OR DELETE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

DROP TRIGGER IF EXISTS audit_notifications ON public.notifications;
CREATE TRIGGER audit_notifications
  AFTER INSERT OR UPDATE OR DELETE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
