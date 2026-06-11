-- =============================================================================
-- Phase 12D — Optional cook tipping (0% platform fee; 100% to cook)
-- =============================================================================

CREATE TYPE public.tip_status AS ENUM (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'refunded'
);

CREATE TABLE public.tips (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id                uuid NOT NULL REFERENCES public.bookings (id) ON DELETE RESTRICT,
  family_id                 uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  chef_profile_id           uuid NOT NULL REFERENCES public.chef_profiles (id) ON DELETE RESTRICT,
  amount_cents              integer NOT NULL CHECK (amount_cents > 0),
  currency                  char(3) NOT NULL DEFAULT 'USD',
  status                    public.tip_status NOT NULL DEFAULT 'pending',
  stripe_checkout_session_id text,
  stripe_payment_intent_id  text,
  stripe_charge_id          text,
  stripe_transfer_id        text,
  failure_reason            text,
  processed_at              timestamptz,
  metadata                  jsonb NOT NULL DEFAULT '{}',
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER tips_set_updated_at
  BEFORE UPDATE ON public.tips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- One successful tip per booking; multiple pending attempts allowed
CREATE UNIQUE INDEX idx_tips_one_success_per_booking
  ON public.tips (booking_id)
  WHERE status = 'succeeded';

CREATE INDEX idx_tips_chef ON public.tips (chef_profile_id, created_at DESC);
CREATE INDEX idx_tips_family ON public.tips (family_id, created_at DESC);
CREATE INDEX idx_tips_booking ON public.tips (booking_id);

CREATE TABLE public.tip_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id        uuid NOT NULL REFERENCES public.tips (id) ON DELETE CASCADE,
  event_type    text NOT NULL,
  actor_id      uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  payload       jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tip_events_tip ON public.tip_events (tip_id, created_at DESC);

ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tips_select_family"
  ON public.tips FOR SELECT TO authenticated
  USING (family_id = auth.uid());

CREATE POLICY "tips_insert_family"
  ON public.tips FOR INSERT TO authenticated
  WITH CHECK (family_id = auth.uid());

CREATE POLICY "tips_select_chef"
  ON public.tips FOR SELECT TO authenticated
  USING (public.owns_chef_profile(chef_profile_id));

CREATE POLICY "tips_select_admin"
  ON public.tips FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "tip_events_select_family"
  ON public.tip_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tips t
      WHERE t.id = tip_id AND t.family_id = auth.uid()
    )
  );

CREATE POLICY "tip_events_select_chef"
  ON public.tip_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tips t
      WHERE t.id = tip_id AND public.owns_chef_profile(t.chef_profile_id)
    )
  );

CREATE POLICY "tip_events_select_admin"
  ON public.tip_events FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE TRIGGER audit_tips
  AFTER INSERT OR UPDATE OR DELETE ON public.tips
  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

COMMENT ON TABLE public.tips IS
  'Optional post-booking tips. 100% to cook; 0% platform fee. Separate from payments.';
