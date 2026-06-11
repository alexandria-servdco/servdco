-- =============================================================================
-- ServdCo Phase 2 — Storage Buckets & Object Policies
-- Apply after buckets exist. Paths use {user_id}/ or {chef_profile_id}/ prefixes.
-- =============================================================================

-- Create buckets (idempotent via ON CONFLICT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'avatars',
    'avatars',
    true,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'cook-portfolio',
    'cook-portfolio',
    true,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'cook-documents',
    'cook-documents',
    false,
    20971520, -- 20 MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- avatars — users upload to own folder; public read
-- Path convention: avatars/{user_id}/{filename}
-- -----------------------------------------------------------------------------

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_upload_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_admin_all"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'avatars' AND public.is_admin())
  WITH CHECK (bucket_id = 'avatars' AND public.is_admin());

-- -----------------------------------------------------------------------------
-- cook-portfolio — chef uploads; public read when parent profile is public
-- Path: cook-portfolio/{chef_profile_id}/{filename}
-- -----------------------------------------------------------------------------

CREATE POLICY "portfolio_storage_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'cook-portfolio'
    AND public.is_public_chef_profile(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "portfolio_storage_own_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'cook-portfolio'
    AND public.owns_chef_profile(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "portfolio_storage_upload_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'cook-portfolio'
    AND public.owns_chef_profile(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "portfolio_storage_manage_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'cook-portfolio'
    AND public.owns_chef_profile(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "portfolio_storage_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'cook-portfolio'
    AND public.owns_chef_profile(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "portfolio_storage_admin_all"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'cook-portfolio' AND public.is_admin())
  WITH CHECK (bucket_id = 'cook-portfolio' AND public.is_admin());

-- -----------------------------------------------------------------------------
-- cook-documents — private; chef upload; admin read
-- Path: cook-documents/{chef_profile_id}/{document_type}/{filename}
-- -----------------------------------------------------------------------------

CREATE POLICY "documents_storage_chef_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'cook-documents'
    AND public.owns_chef_profile(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "documents_storage_admin_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'cook-documents' AND public.is_admin());

CREATE POLICY "documents_storage_chef_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'cook-documents'
    AND public.owns_chef_profile(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "documents_storage_admin_all"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'cook-documents' AND public.is_admin())
  WITH CHECK (bucket_id = 'cook-documents' AND public.is_admin());
