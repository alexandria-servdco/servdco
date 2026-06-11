-- =============================================================================
-- ServdCo Phase 3 — audit_logs & feature_flags
-- =============================================================================

-- -----------------------------------------------------------------------------
-- audit_logs — admin-sensitive change trail
-- -----------------------------------------------------------------------------

CREATE TABLE public.audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  action        text NOT NULL,
  entity_type   text NOT NULL,
  entity_id     text,
  old_values    jsonb,
  new_values    jsonb,
  ip_address    inet,
  user_agent    text,
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audit_logs IS
  'Append-only audit trail. Writes via service role or SECURITY DEFINER triggers.';

CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs (actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs (action, created_at DESC);

-- -----------------------------------------------------------------------------
-- feature_flags — runtime toggles (e.g. supabase auth cutover)
-- -----------------------------------------------------------------------------

CREATE TABLE public.feature_flags (
  key           text PRIMARY KEY,
  enabled       boolean NOT NULL DEFAULT false,
  description   text,
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE TRIGGER feature_flags_set_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.feature_flags IS
  'Runtime feature flags. Public read for client flags; admin write only.';

-- -----------------------------------------------------------------------------
-- Generic audit trigger helper
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.write_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_old jsonb;
  v_new jsonb;
  v_entity_id text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'insert';
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_entity_id := COALESCE(v_new ->> 'id', v_new ->> 'key', NULL);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_entity_id := COALESCE(v_new ->> 'id', v_new ->> 'key', v_old ->> 'id', v_old ->> 'key', NULL);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_entity_id := COALESCE(v_old ->> 'id', v_old ->> 'key', NULL);
  END IF;

  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    v_action,
    TG_TABLE_NAME,
    v_entity_id,
    v_old,
    v_new
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Audit triggers on admin-sensitive tables
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER audit_chef_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.chef_profiles
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER audit_bookings
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER audit_chef_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.chef_documents
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER audit_platform_settings
  AFTER INSERT OR UPDATE OR DELETE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER audit_feature_flags
  AFTER INSERT OR UPDATE OR DELETE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
