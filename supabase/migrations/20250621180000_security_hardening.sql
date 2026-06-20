-- =============================================================================
-- Security hardening — profile escalation, booking fraud, messaging integrity
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Valid booking status transitions (mirrors shared/booking.ts)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_valid_booking_transition(
  p_from public.booking_status,
  p_to public.booking_status
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_from = p_to THEN
    RETURN true;
  END IF;

  CASE p_from
    WHEN 'pending' THEN
      RETURN p_to IN ('accepted', 'awaiting_payment', 'cancelled');
    WHEN 'accepted' THEN
      RETURN p_to IN ('awaiting_payment', 'cancelled');
    WHEN 'awaiting_payment' THEN
      RETURN p_to IN ('confirmed', 'cancelled');
    WHEN 'confirmed' THEN
      RETURN p_to IN ('en_route', 'cancelled');
    WHEN 'en_route' THEN
      RETURN p_to IN ('arrived', 'cancelled');
    WHEN 'arrived' THEN
      RETURN p_to IN ('cooking', 'cancelled');
    WHEN 'cooking' THEN
      RETURN p_to IN ('awaiting_family_confirmation', 'cancelled');
    WHEN 'awaiting_family_confirmation' THEN
      RETURN p_to IN ('completed', 'cancelled');
    WHEN 'completed', 'cancelled' THEN
      RETURN false;
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- -----------------------------------------------------------------------------
-- Prevent self role/status escalation on profiles
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'profile role cannot be changed by non-admin users';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'profile status cannot be changed by non-admin users';
  END IF;

  IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
    RAISE EXCEPTION 'profile deletion requires admin privileges';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_sensitive_columns ON public.profiles;
CREATE TRIGGER profiles_guard_sensitive_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_sensitive_columns();

-- -----------------------------------------------------------------------------
-- Immutable booking pricing after insert (admin may adjust for support)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_booking_pricing_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.price_cents IS DISTINCT FROM OLD.price_cents
     OR NEW.platform_fee_cents IS DISTINCT FROM OLD.platform_fee_cents
     OR NEW.cook_payout_cents IS DISTINCT FROM OLD.cook_payout_cents
     OR NEW.family_platform_fee_cents IS DISTINCT FROM OLD.family_platform_fee_cents
     OR NEW.currency IS DISTINCT FROM OLD.currency THEN
    RAISE EXCEPTION 'booking pricing fields are immutable';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_guard_pricing ON public.bookings;
CREATE TRIGGER bookings_guard_pricing
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_booking_pricing_columns();

-- -----------------------------------------------------------------------------
-- Enforce booking status state machine for authenticated users
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_booking_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Service role / system writes (webhooks, triggers)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NOT public.is_valid_booking_transition(OLD.status, NEW.status) THEN
    RAISE EXCEPTION 'invalid booking status transition: % -> %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_guard_status ON public.bookings;
CREATE TRIGGER bookings_guard_status
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_booking_status_transition();

-- -----------------------------------------------------------------------------
-- Message recipients may only mark read — not alter body or delete
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_message_recipient_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.sender_id = auth.uid() THEN
    RETURN NEW;
  END IF;

  IF NEW.body IS DISTINCT FROM OLD.body
     OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
     OR NEW.metadata IS DISTINCT FROM OLD.metadata THEN
    RAISE EXCEPTION 'message recipients may only update read status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_guard_recipient_update ON public.messages;
CREATE TRIGGER messages_guard_recipient_update
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_message_recipient_update();

-- -----------------------------------------------------------------------------
-- Public marketplace profile view — limited columns (no email/phone PII)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_public_chef" ON public.profiles;

CREATE OR REPLACE VIEW public.profiles_marketplace_public AS
SELECT
  p.id,
  p.full_name,
  p.avatar_url
FROM public.profiles p
INNER JOIN public.chef_profiles cp ON cp.user_id = p.id
WHERE p.deleted_at IS NULL
  AND cp.deleted_at IS NULL
  AND cp.verification_status = 'approved'
  AND cp.profile_visibility = 'public';

GRANT SELECT ON public.profiles_marketplace_public TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- Bookings: only allow insert for public approved chefs
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "bookings_insert_family" ON public.bookings;

CREATE POLICY "bookings_insert_family"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id = auth.uid()
    AND public.is_family()
    AND public.is_public_chef_profile(chef_profile_id)
  );

-- -----------------------------------------------------------------------------
-- Profile views: require viewer_profile_id matches auth user when set
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "chef_profile_views_insert_authenticated" ON public.chef_profile_views;

CREATE POLICY "chef_profile_views_insert_authenticated"
  ON public.chef_profile_views FOR INSERT
  TO authenticated
  WITH CHECK (
    viewer_profile_id IS NULL
    OR viewer_profile_id = auth.uid()
  );

-- -----------------------------------------------------------------------------
-- Audit log insert aligned with is_admin()
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "audit_logs_admin_insert" ON public.audit_logs;

CREATE POLICY "audit_logs_admin_insert"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    AND actor_id = auth.uid()
  );

-- -----------------------------------------------------------------------------
-- FORCE RLS on additional sensitive tables
-- -----------------------------------------------------------------------------
ALTER TABLE public.messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chef_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.transfers FORCE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Messaging send rate limit (30 messages / minute / sender)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_message_send_rate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*)::integer INTO v_count
  FROM public.messages
  WHERE sender_id = NEW.sender_id
    AND created_at > (now() - interval '1 minute');

  IF v_count >= 30 THEN
    RAISE EXCEPTION 'message rate limit exceeded — please wait before sending more';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_guard_send_rate ON public.messages;
CREATE TRIGGER messages_guard_send_rate
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_message_send_rate();
