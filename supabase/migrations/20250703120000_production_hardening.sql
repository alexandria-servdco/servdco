-- Production hardening: legal acceptance, cook lifecycle, soft-delete profile access

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accepted_terms_version text,
  ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_privacy_version text,
  ADD COLUMN IF NOT EXISTS accepted_privacy_at timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cookie_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS account_restore_requested_at timestamptz;

ALTER TABLE public.chef_profiles
  ADD COLUMN IF NOT EXISTS verification_rejection_reason text,
  ADD COLUMN IF NOT EXISTS verification_rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason text;

-- Soft-deleted users can still read their own profile (for deleted-account UX)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Block updates on soft-deleted profiles except restore request timestamp
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "profiles_restore_request_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND deleted_at IS NOT NULL)
  WITH CHECK (
    id = auth.uid()
    AND deleted_at IS NOT NULL
    AND account_restore_requested_at IS NOT NULL
  );

-- When a rejected cook uploads a new pending document, return to pending review
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
    AND OLD.status IN ('rejected', 'resubmit')
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

DROP TRIGGER IF EXISTS chef_documents_pending_reset_verification ON public.chef_documents;
CREATE TRIGGER chef_documents_pending_reset_verification
  AFTER UPDATE OF status ON public.chef_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.on_chef_document_pending_reset_verification();

COMMENT ON COLUMN public.profiles.account_restore_requested_at IS
  'Set when a soft-deleted user requests account restoration.';
