-- Fix audit trigger for tables with non-uuid PK (key, text id)
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
