-- =============================================================================
-- ServdCo Phase 3 — RLS for audit_logs & feature_flags
-- =============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

-- audit_logs: admin read only; writes via triggers (SECURITY DEFINER) or service role
CREATE POLICY "audit_logs_admin_select"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- No INSERT/UPDATE/DELETE for authenticated — service role + triggers only

-- feature_flags: public read for client-visible flags; admin full access
CREATE POLICY "feature_flags_select_public"
  ON public.feature_flags FOR SELECT
  TO anon, authenticated
  USING (
    key IN (
      'use_supabase_auth',
      'enable_stripe_checkout',
      'enable_messaging',
      'maintenance_mode'
    )
  );

CREATE POLICY "feature_flags_select_admin"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "feature_flags_admin_write"
  ON public.feature_flags FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
