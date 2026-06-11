-- =============================================================================
-- ServdCo Phase 2 — Base helper functions (no table dependencies)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_auth_uid()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
