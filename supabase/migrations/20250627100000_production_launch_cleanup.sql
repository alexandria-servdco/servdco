-- =============================================================================
-- Production launch cleanup: drop blog, careers system, notification preferences
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Remove blog_posts
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "blog_select_published" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_admin_all" ON public.blog_posts;
DROP TRIGGER IF EXISTS blog_posts_set_updated_at ON public.blog_posts;
DROP INDEX IF EXISTS public.idx_blog_published;
DROP TABLE IF EXISTS public.blog_posts CASCADE;

-- -----------------------------------------------------------------------------
-- 2. Notification preferences on profiles
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT jsonb_build_object(
    'booking_notifications', true,
    'message_notifications', true,
    'review_notifications', true,
    'verification_notifications', true,
    'marketing_emails', false,
    'announcement_emails', true
  );

COMMENT ON COLUMN public.profiles.notification_preferences IS
  'User notification channel preferences; in-app inserts respect these categories.';

-- -----------------------------------------------------------------------------
-- 3. Preference-aware notification helper
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_allows_notification(
  p_user_id uuid,
  p_category text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefs jsonb;
  key text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  key := CASE p_category
    WHEN 'booking' THEN 'booking_notifications'
    WHEN 'message' THEN 'message_notifications'
    WHEN 'review' THEN 'review_notifications'
    WHEN 'verification' THEN 'verification_notifications'
    WHEN 'marketing' THEN 'marketing_emails'
    WHEN 'announcement' THEN 'announcement_emails'
    ELSE NULL
  END;

  IF key IS NULL THEN
    RETURN true;
  END IF;

  SELECT notification_preferences INTO prefs
  FROM public.profiles
  WHERE id = p_user_id AND deleted_at IS NULL;

  IF prefs IS NULL THEN
    RETURN true;
  END IF;

  IF NOT (prefs ? key) THEN
    RETURN true;
  END IF;

  RETURN COALESCE((prefs ->> key)::boolean, true);
END;
$$;

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

  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  VALUES (p_user_id, p_title, p_message, p_type, p_metadata);
END;
$$;

-- Message notifications respect message_notifications preference
CREATE OR REPLACE FUNCTION public.on_message_insert_notify_recipient()
RETURNS trigger
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

  IF recipient_id IS NOT NULL
    AND recipient_id <> NEW.sender_id
    AND public.user_allows_notification(recipient_id, 'message') THEN
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

-- -----------------------------------------------------------------------------
-- 4. Careers enums + tables
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.career_job_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.career_application_status AS ENUM (
    'applied', 'under_review', 'interview', 'offer', 'rejected', 'hired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.career_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text NOT NULL DEFAULT 'General',
  location text NOT NULL DEFAULT 'Remote',
  employment_type text NOT NULL DEFAULT 'Full-time',
  salary_range text,
  description text NOT NULL,
  requirements text,
  benefits text,
  status public.career_job_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  updated_by uuid REFERENCES public.profiles(id),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.career_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.career_jobs(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  linkedin text,
  portfolio text,
  resume_storage_path text,
  resume_bucket text NOT NULL DEFAULT 'career-resumes',
  cover_letter text,
  status public.career_application_status NOT NULL DEFAULT 'applied',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_career_jobs_status_published
  ON public.career_jobs (status, published_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_career_applications_job_status
  ON public.career_applications (job_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_career_applications_email
  ON public.career_applications (email);

DROP TRIGGER IF EXISTS career_jobs_set_updated_at ON public.career_jobs;
CREATE TRIGGER career_jobs_set_updated_at
  BEFORE UPDATE ON public.career_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS career_applications_set_updated_at ON public.career_applications;
CREATE TRIGGER career_applications_set_updated_at
  BEFORE UPDATE ON public.career_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.career_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;

-- Jobs: public read published; admin full access
DROP POLICY IF EXISTS "career_jobs_select_published" ON public.career_jobs;
CREATE POLICY "career_jobs_select_published"
  ON public.career_jobs FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "career_jobs_admin_all" ON public.career_jobs;
CREATE POLICY "career_jobs_admin_all"
  ON public.career_jobs FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Applications: public insert; admin read/update
DROP POLICY IF EXISTS "career_applications_insert_public" ON public.career_applications;
CREATE POLICY "career_applications_insert_public"
  ON public.career_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "career_applications_admin_all" ON public.career_applications;
CREATE POLICY "career_applications_admin_all"
  ON public.career_applications FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. Career resume storage bucket
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'career-resumes',
  'career-resumes',
  false,
  10485760,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "career_resumes_admin_read" ON storage.objects;
CREATE POLICY "career_resumes_admin_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'career-resumes' AND public.is_admin());

DROP POLICY IF EXISTS "career_resumes_public_insert" ON storage.objects;
CREATE POLICY "career_resumes_public_insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'career-resumes'
    AND (storage.foldername(name))[1] = 'applications'
  );

DROP POLICY IF EXISTS "career_resumes_admin_delete" ON storage.objects;
CREATE POLICY "career_resumes_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'career-resumes' AND public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. Document + verification notifications use verification preference category
-- -----------------------------------------------------------------------------

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
    ELSIF NEW.status = 'resubmit' THEN
      PERFORM public.insert_booking_notification(
        v_chef_user_id,
        'Document Resubmission Requested',
        COALESCE(
          'Please resubmit your ' || v_doc_label || '. ' || NEW.review_notes,
          'Please resubmit your ' || v_doc_label || '.'
        ),
        'warning',
        jsonb_build_object('document_id', NEW.id, 'event', 'document_resubmit'),
        'verification'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
