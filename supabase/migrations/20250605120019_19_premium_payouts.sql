-- =============================================================================
-- Phase 12C — Premium membership, cook transfers, profile analytics
-- =============================================================================

CREATE TYPE public.transfer_status AS ENUM (
  'pending',
  'scheduled',
  'processing',
  'paid',
  'failed',
  'cancelled'
);

-- Cook transfer ledger (platform → Connect account)
CREATE TABLE public.transfers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id          uuid NOT NULL REFERENCES public.payments (id) ON DELETE RESTRICT,
  booking_id          uuid NOT NULL REFERENCES public.bookings (id) ON DELETE RESTRICT,
  chef_profile_id     uuid NOT NULL REFERENCES public.chef_profiles (id) ON DELETE RESTRICT,
  gross_amount_cents  integer NOT NULL CHECK (gross_amount_cents >= 0),
  platform_fee_cents  integer NOT NULL CHECK (platform_fee_cents >= 0),
  net_amount_cents    integer NOT NULL CHECK (net_amount_cents >= 0),
  stripe_transfer_id  text UNIQUE,
  status              public.transfer_status NOT NULL DEFAULT 'pending',
  scheduled_at        timestamptz,
  transferred_at      timestamptz,
  payout_date         timestamptz,
  failure_reason      text,
  metadata            jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER transfers_set_updated_at
  BEFORE UPDATE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_transfers_chef ON public.transfers (chef_profile_id, created_at DESC);
CREATE UNIQUE INDEX idx_transfers_payment_unique ON public.transfers (payment_id);
CREATE INDEX idx_transfers_status_scheduled ON public.transfers (status, scheduled_at)
  WHERE status IN ('pending', 'scheduled');

-- Stripe payout to cook bank (Connect payout.paid)
CREATE TABLE public.cook_payouts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id         uuid REFERENCES public.transfers (id) ON DELETE SET NULL,
  chef_profile_id     uuid NOT NULL REFERENCES public.chef_profiles (id) ON DELETE CASCADE,
  stripe_payout_id    text NOT NULL UNIQUE,
  amount_cents        integer NOT NULL CHECK (amount_cents >= 0),
  currency            char(3) NOT NULL DEFAULT 'USD',
  status              text NOT NULL DEFAULT 'paid',
  arrival_date        timestamptz,
  metadata            jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cook_payouts_chef ON public.cook_payouts (chef_profile_id, created_at DESC);

-- Premium analytics: profile views
CREATE TABLE public.chef_profile_views (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id     uuid NOT NULL REFERENCES public.chef_profiles (id) ON DELETE CASCADE,
  viewer_profile_id   uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  source              text NOT NULL DEFAULT 'profile_page',
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chef_profile_views_chef_date
  ON public.chef_profile_views (chef_profile_id, created_at DESC);

-- Subscription product references (admin-configured Stripe IDs)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_product_id text;

-- Premium price → $15/mo default
UPDATE public.platform_settings
SET value = '1500', updated_at = now()
WHERE key = 'chef_premium_price_monthly_cents';

INSERT INTO public.platform_settings (key, value, description)
VALUES
  (
    'stripe_premium_product_id',
    '""'::jsonb,
    'Stripe Product ID for Premium Chef Membership (set after Dashboard setup)'
  ),
  (
    'stripe_premium_price_id',
    '""'::jsonb,
    'Stripe Price ID for $15/mo Premium Chef Membership (set after Dashboard setup)'
  )
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cook_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chef_profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transfers_select_own_chef"
  ON public.transfers FOR SELECT
  TO authenticated
  USING (public.owns_chef_profile(chef_profile_id));

CREATE POLICY "transfers_select_admin"
  ON public.transfers FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "transfers_admin_all"
  ON public.transfers FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "cook_payouts_select_own_chef"
  ON public.cook_payouts FOR SELECT
  TO authenticated
  USING (public.owns_chef_profile(chef_profile_id));

CREATE POLICY "cook_payouts_select_admin"
  ON public.cook_payouts FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "chef_profile_views_insert_authenticated"
  ON public.chef_profile_views FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "chef_profile_views_select_own_chef"
  ON public.chef_profile_views FOR SELECT
  TO authenticated
  USING (public.owns_chef_profile(chef_profile_id));

CREATE POLICY "chef_profile_views_select_admin"
  ON public.chef_profile_views FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Audit
CREATE TRIGGER audit_transfers
  AFTER INSERT OR UPDATE OR DELETE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

-- Link payments.transfer_id to transfers row (text stores stripe transfer id; FK optional)
COMMENT ON TABLE public.transfers IS
  'Platform → cook Connect transfers after booking hold period (Phase 7e).';

-- Schedule transfer when booking completes (hold period from platform_settings)
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
BEGIN
  IF TG_OP = 'UPDATE'
    AND OLD.status IS DISTINCT FROM NEW.status
    AND NEW.status = 'completed'
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
        jsonb_build_object('source', 'booking_completed_trigger')
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_schedule_transfer ON public.bookings;
CREATE TRIGGER bookings_schedule_transfer
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.on_booking_completed_schedule_transfer();
