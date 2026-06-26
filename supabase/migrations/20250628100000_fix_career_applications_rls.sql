-- =============================================================================
-- Fix public careers application RLS + grants
-- Public users may INSERT only (no SELECT/UPDATE). Client submits in one row.
-- =============================================================================

GRANT SELECT ON public.career_jobs TO anon, authenticated;
GRANT INSERT ON public.career_applications TO anon, authenticated;

ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "career_applications_insert_public" ON public.career_applications;
CREATE POLICY "career_applications_insert_public"
  ON public.career_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "career_applications_admin_all" ON public.career_applications;
CREATE POLICY "career_applications_admin_all"
  ON public.career_applications
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON POLICY "career_applications_insert_public" ON public.career_applications IS
  'Anonymous and signed-in users may submit job applications; no public SELECT/UPDATE.';
