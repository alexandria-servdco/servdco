-- Notify admins when cooks submit or resubmit verification documents.

CREATE OR REPLACE FUNCTION public.notify_admins(
  p_title text,
  p_message text,
  p_type public.notification_type DEFAULT 'info',
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_category text DEFAULT 'verification'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin record;
BEGIN
  FOR v_admin IN
    SELECT id
    FROM public.profiles
    WHERE role = 'admin'
      AND deleted_at IS NULL
  LOOP
    PERFORM public.insert_booking_notification(
      v_admin.id,
      p_title,
      p_message,
      p_type,
      p_metadata,
      p_category
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_chef_document_admin_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chef_name text;
  v_doc_label text;
BEGIN
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT cp.display_name INTO v_chef_name
  FROM public.chef_profiles cp
  WHERE cp.id = NEW.chef_profile_id;

  v_doc_label := REPLACE(NEW.document_type::text, '_', ' ');
  v_chef_name := COALESCE(NULLIF(trim(v_chef_name), ''), 'A cook');

  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    PERFORM public.notify_admins(
      'New Verification Document',
      v_chef_name || ' submitted ' || v_doc_label || ' for review.',
      'info',
      jsonb_build_object(
        'document_id', NEW.id,
        'chef_profile_id', NEW.chef_profile_id,
        'document_type', NEW.document_type,
        'event', 'document_submitted'
      ),
      'verification'
    );
  ELSIF TG_OP = 'UPDATE'
    AND NEW.status = 'pending'
    AND OLD.status IS DISTINCT FROM NEW.status
    AND OLD.status IN ('rejected', 'approved')
  THEN
    PERFORM public.notify_admins(
      'Verification Document Resubmitted',
      v_chef_name || ' resubmitted ' || v_doc_label || ' for review.',
      'info',
      jsonb_build_object(
        'document_id', NEW.id,
        'chef_profile_id', NEW.chef_profile_id,
        'document_type', NEW.document_type,
        'event', 'document_resubmitted'
      ),
      'verification'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chef_documents_admin_notify ON public.chef_documents;
CREATE TRIGGER chef_documents_admin_notify
  AFTER INSERT OR UPDATE OF status ON public.chef_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.on_chef_document_admin_notify();

-- Align status-change trigger with valid enum values (pending|approved|rejected).
CREATE OR REPLACE FUNCTION public.on_chef_document_status_change()
RETURNS trigger
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
        jsonb_build_object('document_id', NEW.id, 'event', 'document_approved'),
        'verification'
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
        jsonb_build_object('document_id', NEW.id, 'event', 'document_rejected'),
        'verification'
      );
    ELSIF NEW.status = 'pending' AND OLD.status IN ('rejected', 'approved') THEN
      PERFORM public.insert_booking_notification(
        v_chef_user_id,
        'Document Resubmission Requested',
        COALESCE(
          'Please resubmit your ' || v_doc_label || '. ' || NEW.review_notes,
          'Please resubmit your ' || v_doc_label || '.'
        ),
        'warning',
        jsonb_build_object('document_id', NEW.id, 'event', 'document_resubmit_requested'),
        'verification'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Pending reset trigger: enum has no "resubmit" value.
CREATE OR REPLACE FUNCTION public.on_chef_document_pending_reset_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF TG_OP = 'UPDATE'
    AND NEW.status = 'pending'
    AND OLD.status IN ('rejected', 'approved')
  THEN
    SELECT cp.user_id INTO v_user_id
    FROM public.chef_profiles cp
    WHERE cp.id = NEW.chef_profile_id;

    IF v_user_id IS NOT NULL THEN
      UPDATE public.chef_profiles
      SET
        verification_status = 'pending',
        verification_rejection_reason = NULL,
        verification_rejected_at = NULL,
        profile_visibility = 'hidden',
        updated_at = now()
      WHERE user_id = v_user_id
        AND verification_status = 'rejected';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
