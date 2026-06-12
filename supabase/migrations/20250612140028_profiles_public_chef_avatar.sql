-- Allow marketplace visitors to read avatar_url (and display name) for public approved chefs.

CREATE POLICY "profiles_select_public_chef"
  ON public.profiles FOR SELECT
  TO authenticated, anon
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.chef_profiles cp
      WHERE cp.user_id = profiles.id
        AND cp.deleted_at IS NULL
        AND cp.verification_status = 'approved'
        AND cp.profile_visibility = 'public'
    )
  );
