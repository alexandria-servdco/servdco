-- =============================================================================
-- Phase 6 — Production booking operations workflow (body)
-- Run after 20250612120026 enum extensions. No ALTER TYPE statements here.
-- =============================================================================

-- Expanded booking fields
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_end_time time,
  ADD COLUMN IF NOT EXISTS special_instructions text,
  ADD COLUMN IF NOT EXISTS dietary_restrictions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS parking_instructions text,
  ADD COLUMN IF NOT EXISTS gate_code text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS family_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.bookings.family_confirmed_at IS
  'Set when family confirms completion; required before payout scheduling.';

-- -----------------------------------------------------------------------------
-- booking_addresses (one-to-one with booking)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.booking_addresses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid NOT NULL UNIQUE REFERENCES public.bookings (id) ON DELETE CASCADE,
  street_address  text NOT NULL,
  apartment       text,
  city            text NOT NULL,
  state           text NOT NULL,
  zip             text NOT NULL,
  country         text NOT NULL DEFAULT 'US',
  latitude        double precision,
  longitude       double precision,
  location_notes  text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_addresses_booking
  ON public.booking_addresses (booking_id);

ALTER TABLE public.booking_addresses ENABLE ROW LEVEL SECURITY;

-- Family: full access on own bookings
CREATE POLICY "booking_addresses_select_family"
  ON public.booking_addresses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.family_id = auth.uid()
        AND b.deleted_at IS NULL
    )
  );

CREATE POLICY "booking_addresses_insert_family"
  ON public.booking_addresses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.family_id = auth.uid()
        AND b.deleted_at IS NULL
    )
  );

CREATE POLICY "booking_addresses_update_family"
  ON public.booking_addresses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.family_id = auth.uid()
        AND b.deleted_at IS NULL
    )
  );

-- Chef: SELECT when booking status grants contact access
CREATE OR REPLACE FUNCTION public.booking_chef_has_contact_access(p_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = p_booking_id
      AND b.deleted_at IS NULL
      AND b.status IN (
        'accepted', 'awaiting_payment', 'confirmed', 'en_route', 'arrived',
        'cooking', 'awaiting_family_confirmation', 'completed'
      )
      AND public.owns_chef_profile(b.chef_profile_id)
  );
$$;

CREATE POLICY "booking_addresses_select_chef"
  ON public.booking_addresses FOR SELECT
  TO authenticated
  USING (public.booking_chef_has_contact_access(booking_id));

CREATE POLICY "booking_addresses_select_admin"
  ON public.booking_addresses FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "booking_addresses_admin_all"
  ON public.booking_addresses FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- message_attachments
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.message_attachments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id       uuid NOT NULL REFERENCES public.messages (id) ON DELETE CASCADE,
  storage_bucket   text NOT NULL DEFAULT 'message-attachments',
  storage_path     text NOT NULL,
  file_name        text NOT NULL,
  mime_type        text NOT NULL,
  file_size_bytes  bigint NOT NULL CHECK (file_size_bytes > 0),
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT message_attachments_path_unique UNIQUE (storage_bucket, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message
  ON public.message_attachments (message_id);

ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_attachments_select_participants"
  ON public.message_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id
        AND m.deleted_at IS NULL
        AND (
          c.family_id = auth.uid()
          OR public.owns_chef_profile(c.chef_profile_id)
          OR public.is_admin()
        )
    )
  );

CREATE POLICY "message_attachments_insert_participants"
  ON public.message_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id
        AND m.sender_id = auth.uid()
        AND (
          c.family_id = auth.uid()
          OR public.owns_chef_profile(c.chef_profile_id)
        )
    )
  );

CREATE POLICY "message_attachments_admin_all"
  ON public.message_attachments FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "message_attachments_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "message_attachments_storage_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.message_attachments ma
        JOIN public.messages m ON m.id = ma.message_id
        JOIN public.conversations c ON c.id = m.conversation_id
        WHERE ma.storage_path = name
          AND (
            c.family_id = auth.uid()
            OR public.owns_chef_profile(c.chef_profile_id)
          )
      )
    )
  );

-- Enable messaging globally
UPDATE public.feature_flags
SET enabled = true, updated_at = now()
WHERE key = 'enable_messaging';

-- -----------------------------------------------------------------------------
-- Booking status change notifications (full operational workflow)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chef_user_id uuid;
  v_chef_name text;
  v_family_name text;
BEGIN
  SELECT cp.user_id, cp.display_name
  INTO v_chef_user_id, v_chef_name
  FROM public.chef_profiles cp
  WHERE cp.id = NEW.chef_profile_id;

  SELECT COALESCE(p.full_name, p.email) INTO v_family_name
  FROM public.profiles p
  WHERE p.id = NEW.family_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.booking_status_history (
      booking_id, from_status, to_status, changed_by, metadata
    )
    VALUES (
      NEW.id, NULL, NEW.status, NEW.created_by,
      jsonb_build_object('event', 'booking_created')
    );

    PERFORM public.insert_booking_notification(
      v_chef_user_id,
      'New Booking Request',
      COALESCE(v_family_name, 'A family') || ' requested a ' || NEW.service_type::text || ' booking.',
      'info',
      jsonb_build_object('booking_id', NEW.id, 'event', 'booking_created')
    );

    PERFORM public.insert_booking_notification(
      NEW.family_id,
      'Booking Request Sent',
      'Your request was sent to ' || COALESCE(v_chef_name, 'your cook') || '.',
      'success',
      jsonb_build_object('booking_id', NEW.id, 'event', 'booking_created')
    );

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.booking_status_history (
      booking_id, from_status, to_status, changed_by, reason, metadata
    )
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(NEW.updated_by, auth.uid()),
      NEW.cancellation_reason,
      jsonb_build_object('event', 'status_change', 'to', NEW.status::text)
    );

    IF NEW.status IN ('accepted', 'awaiting_payment') THEN
      PERFORM public.insert_booking_notification(
        NEW.family_id,
        'Cook Accepted Request',
        COALESCE(v_chef_name, 'Your cook') || ' accepted your booking. Complete payment to confirm.',
        'success',
        jsonb_build_object('booking_id', NEW.id, 'event', 'booking_accepted')
      );
      PERFORM public.insert_booking_notification(
        NEW.family_id,
        'Payment Required',
        'Your cook accepted. Complete payment to confirm your session.',
        'warning',
        jsonb_build_object('booking_id', NEW.id, 'event', 'payment_required')
      );
    ELSIF NEW.status = 'confirmed' THEN
      PERFORM public.insert_booking_notification(
        NEW.family_id,
        'Payment Successful',
        'Payment received. Your booking with ' || COALESCE(v_chef_name, 'your cook') || ' is confirmed.',
        'success',
        jsonb_build_object('booking_id', NEW.id, 'event', 'payment_successful')
      );
      PERFORM public.insert_booking_notification(
        v_chef_user_id,
        'Booking Confirmed',
        'Payment received for booking with ' || COALESCE(v_family_name, 'a family') || '.',
        'info',
        jsonb_build_object('booking_id', NEW.id, 'event', 'booking_confirmed')
      );
    ELSIF NEW.status = 'en_route' THEN
      PERFORM public.insert_booking_notification(
        NEW.family_id,
        'Cook En Route',
        COALESCE(v_chef_name, 'Your cook') || ' is on the way.',
        'info',
        jsonb_build_object('booking_id', NEW.id, 'event', 'en_route')
      );
    ELSIF NEW.status = 'arrived' THEN
      PERFORM public.insert_booking_notification(
        NEW.family_id,
        'Cook Arrived',
        COALESCE(v_chef_name, 'Your cook') || ' has arrived.',
        'info',
        jsonb_build_object('booking_id', NEW.id, 'event', 'arrived')
      );
    ELSIF NEW.status = 'cooking' THEN
      PERFORM public.insert_booking_notification(
        NEW.family_id,
        'Cooking Started',
        COALESCE(v_chef_name, 'Your cook') || ' has started cooking.',
        'info',
        jsonb_build_object('booking_id', NEW.id, 'event', 'cooking_started')
      );
    ELSIF NEW.status = 'awaiting_family_confirmation' THEN
      PERFORM public.insert_booking_notification(
        NEW.family_id,
        'Cook Marked Job Complete',
        'Please confirm completion of your session with ' || COALESCE(v_chef_name, 'your cook') || '.',
        'warning',
        jsonb_build_object('booking_id', NEW.id, 'event', 'awaiting_family_confirmation')
      );
      PERFORM public.insert_booking_notification(
        v_chef_user_id,
        'Awaiting Family Confirmation',
        'Waiting for ' || COALESCE(v_family_name, 'the family') || ' to confirm completion.',
        'info',
        jsonb_build_object('booking_id', NEW.id, 'event', 'awaiting_family_confirmation')
      );
    ELSIF NEW.status = 'completed' THEN
      PERFORM public.insert_booking_notification(
        NEW.family_id,
        'Booking Completed',
        'Your session is complete. Leave a review!',
        'success',
        jsonb_build_object('booking_id', NEW.id, 'event', 'booking_completed')
      );
      PERFORM public.insert_booking_notification(
        v_chef_user_id,
        'Booking Completed',
        'Session with ' || COALESCE(v_family_name, 'a family') || ' is complete.',
        'success',
        jsonb_build_object('booking_id', NEW.id, 'event', 'booking_completed')
      );
    ELSIF NEW.status = 'cancelled' THEN
      IF OLD.status = 'pending' OR OLD.status = 'accepted' OR OLD.status = 'awaiting_payment' THEN
        IF NEW.cancelled_by = v_chef_user_id OR NEW.updated_by = v_chef_user_id THEN
          PERFORM public.insert_booking_notification(
            NEW.family_id,
            'Booking Rejected',
            COALESCE(v_chef_name, 'The cook') || ' declined your booking request.',
            'warning',
            jsonb_build_object('booking_id', NEW.id, 'event', 'booking_rejected')
          );
        ELSE
          PERFORM public.insert_booking_notification(
            NEW.family_id,
            'Booking Cancelled',
            'Your booking was cancelled.',
            'warning',
            jsonb_build_object('booking_id', NEW.id, 'event', 'booking_cancelled')
          );
        END IF;
      ELSE
        PERFORM public.insert_booking_notification(
          NEW.family_id,
          'Booking Cancelled',
          'Your booking was cancelled.',
          'warning',
          jsonb_build_object('booking_id', NEW.id, 'event', 'booking_cancelled')
        );
      END IF;
      PERFORM public.insert_booking_notification(
        v_chef_user_id,
        'Booking Cancelled',
        'Booking with ' || COALESCE(v_family_name, 'a family') || ' was cancelled.',
        'warning',
        jsonb_build_object('booking_id', NEW.id, 'event', 'booking_cancelled')
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Payout: only when completed + payment succeeded + family confirmed + no active refund
CREATE OR REPLACE FUNCTION public.on_booking_completed_schedule_transfer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_hold_hours integer := 24;
  v_hold_raw jsonb;
  v_transfer_id uuid;
BEGIN
  IF TG_OP = 'UPDATE'
    AND OLD.status IS DISTINCT FROM NEW.status
    AND NEW.status = 'completed'
    AND NEW.family_confirmed_at IS NOT NULL
  THEN
    SELECT value INTO v_hold_raw
    FROM public.platform_settings
    WHERE key = 'booking_hold_hours';

    IF v_hold_raw IS NOT NULL THEN
      v_hold_hours := COALESCE((v_hold_raw #>> '{}')::integer, 24);
    END IF;

    SELECT * INTO v_payment
    FROM public.payments
    WHERE booking_id = NEW.id
      AND status = 'succeeded'
      AND refunded_cents = 0
    LIMIT 1;

    IF v_payment.id IS NOT NULL
      AND v_payment.cook_payout_cents > 0
      AND NOT EXISTS (
        SELECT 1 FROM public.transfers t WHERE t.payment_id = v_payment.id
      )
    THEN
      INSERT INTO public.transfers (
        payment_id,
        booking_id,
        chef_profile_id,
        gross_amount_cents,
        platform_fee_cents,
        net_amount_cents,
        status,
        scheduled_at,
        metadata
      )
      VALUES (
        v_payment.id,
        NEW.id,
        v_payment.chef_profile_id,
        v_payment.amount_cents,
        v_payment.platform_fee_cents,
        v_payment.cook_payout_cents,
        'scheduled',
        now() + (v_hold_hours || ' hours')::interval,
        jsonb_build_object('source', 'booking_completed_trigger', 'family_confirmed', true)
      )
      RETURNING id INTO v_transfer_id;

      PERFORM public.insert_booking_notification(
        (SELECT user_id FROM public.chef_profiles WHERE id = NEW.chef_profile_id),
        'Transfer Scheduled',
        'Your payout for a completed booking has been scheduled.',
        'info',
        jsonb_build_object('booking_id', NEW.id, 'transfer_id', v_transfer_id, 'event', 'transfer_scheduled')
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Notify on transfer paid (when status updates to paid)
CREATE OR REPLACE FUNCTION public.on_transfer_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chef_user_id uuid;
BEGIN
  IF TG_OP = 'UPDATE'
    AND OLD.status IS DISTINCT FROM NEW.status
    AND NEW.status = 'paid'
  THEN
    SELECT user_id INTO v_chef_user_id
    FROM public.chef_profiles
    WHERE id = NEW.chef_profile_id;

    PERFORM public.insert_booking_notification(
      v_chef_user_id,
      'Transfer Paid',
      'Your payout has been deposited.',
      'success',
      jsonb_build_object(
        'booking_id', NEW.booking_id,
        'transfer_id', NEW.id,
        'event', 'transfer_paid'
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS transfers_notify_paid ON public.transfers;
CREATE TRIGGER transfers_notify_paid
  AFTER UPDATE OF status ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.on_transfer_status_change();

-- Audit message_attachments and booking_addresses
DROP TRIGGER IF EXISTS audit_message_attachments ON public.message_attachments;
CREATE TRIGGER audit_message_attachments
  AFTER INSERT OR UPDATE OR DELETE ON public.message_attachments
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

DROP TRIGGER IF EXISTS audit_booking_addresses ON public.booking_addresses;
CREATE TRIGGER audit_booking_addresses
  AFTER INSERT OR UPDATE OR DELETE ON public.booking_addresses
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
