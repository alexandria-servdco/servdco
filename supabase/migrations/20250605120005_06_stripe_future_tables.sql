-- =============================================================================
-- ServdCo Phase 2 — Stripe & subscriptions (future-ready, not wired)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- stripe_customers — families (and optionally cooks for premium billing)
-- -----------------------------------------------------------------------------

CREATE TABLE public.stripe_customers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          uuid NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  stripe_customer_id  text NOT NULL UNIQUE,
  default_payment_method_id text,
  currency            char(3) NOT NULL DEFAULT 'USD',
  metadata            jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz
);

CREATE TRIGGER stripe_customers_set_updated_at
  BEFORE UPDATE ON public.stripe_customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- stripe_accounts — Stripe Connect Express for cooks
-- -----------------------------------------------------------------------------

CREATE TABLE public.stripe_accounts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id       uuid NOT NULL UNIQUE REFERENCES public.chef_profiles (id) ON DELETE CASCADE,
  stripe_account_id     text NOT NULL UNIQUE,
  onboarding_status     public.stripe_onboarding_status NOT NULL DEFAULT 'not_started',
  charges_enabled       boolean NOT NULL DEFAULT false,
  payouts_enabled       boolean NOT NULL DEFAULT false,
  capabilities          jsonb NOT NULL DEFAULT '{}',
  requirements_due      jsonb NOT NULL DEFAULT '[]',
  country               char(2) NOT NULL DEFAULT 'US',
  metadata              jsonb NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER stripe_accounts_set_updated_at
  BEFORE UPDATE ON public.stripe_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Link chef_profiles.stripe_account_ref
ALTER TABLE public.chef_profiles
  ADD CONSTRAINT chef_profiles_stripe_account_ref_fkey
  FOREIGN KEY (stripe_account_ref) REFERENCES public.stripe_accounts (id)
  ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- payments — ledger for booking charges
-- -----------------------------------------------------------------------------

CREATE TABLE public.payments (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id                uuid NOT NULL REFERENCES public.bookings (id) ON DELETE RESTRICT,
  family_id                 uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  chef_profile_id           uuid NOT NULL REFERENCES public.chef_profiles (id) ON DELETE RESTRICT,
  stripe_payment_intent_id  text UNIQUE,
  stripe_charge_id          text UNIQUE,
  stripe_checkout_session_id text,
  amount_cents              integer NOT NULL CHECK (amount_cents >= 0),
  platform_fee_cents        integer NOT NULL DEFAULT 0,
  cook_payout_cents         integer NOT NULL DEFAULT 0,
  stripe_fee_cents            integer NOT NULL DEFAULT 0,
  currency                  char(3) NOT NULL DEFAULT 'USD',
  status                    public.payment_status NOT NULL DEFAULT 'pending',
  transfer_id               text,
  refunded_cents            integer NOT NULL DEFAULT 0,
  metadata                  jsonb NOT NULL DEFAULT '{}',
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_id_fkey
  FOREIGN KEY (payment_id) REFERENCES public.payments (id)
  ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- stripe_events — webhook idempotency & audit (append-only)
-- -----------------------------------------------------------------------------

CREATE TABLE public.stripe_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id   text NOT NULL UNIQUE,
  event_type        text NOT NULL,
  api_version       text,
  payload           jsonb NOT NULL,
  processed         boolean NOT NULL DEFAULT false,
  processed_at      timestamptz,
  processing_error  text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.stripe_events IS
  'Append-only webhook log. Written by Vercel serverless only (service role).';

-- -----------------------------------------------------------------------------
-- subscriptions — cook premium (Stripe Billing)
-- -----------------------------------------------------------------------------

CREATE TABLE public.subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id         uuid NOT NULL REFERENCES public.chef_profiles (id) ON DELETE CASCADE,
  stripe_subscription_id  text NOT NULL UNIQUE,
  stripe_customer_id      text NOT NULL,
  stripe_price_id         text NOT NULL,
  status                  public.subscription_status NOT NULL DEFAULT 'incomplete',
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean NOT NULL DEFAULT false,
  canceled_at             timestamptz,
  metadata                jsonb NOT NULL DEFAULT '{}',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
