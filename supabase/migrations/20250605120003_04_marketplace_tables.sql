-- =============================================================================
-- ServdCo Phase 2 — Marketplace: bookings, reviews, favorites, availability
-- =============================================================================

-- -----------------------------------------------------------------------------
-- bookings
-- -----------------------------------------------------------------------------

CREATE TABLE public.bookings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id             uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  chef_profile_id       uuid NOT NULL REFERENCES public.chef_profiles (id) ON DELETE RESTRICT,
  service_type          public.service_type NOT NULL,
  booking_date          date NOT NULL,
  booking_time          time,
  guests_count          smallint NOT NULL DEFAULT 4 CHECK (guests_count >= 1),
  price_cents           integer NOT NULL CHECK (price_cents >= 0),
  platform_fee_cents    integer NOT NULL DEFAULT 0 CHECK (platform_fee_cents >= 0),
  cook_payout_cents     integer NOT NULL DEFAULT 0 CHECK (cook_payout_cents >= 0),
  currency              char(3) NOT NULL DEFAULT 'USD',
  status                public.booking_status NOT NULL DEFAULT 'pending',
  notes                 text,
  stripe_payment_intent_id text,
  payment_id            uuid, -- FK added after payments table
  cancelled_by          uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  cancellation_reason   text,
  completed_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by            uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  updated_by            uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  deleted_at            timestamptz,
  deleted_by            uuid REFERENCES public.profiles (id) ON DELETE SET NULL,

  CONSTRAINT bookings_date_future_check CHECK (
    booking_date >= (CURRENT_DATE - interval '1 year')
  )
);

CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- booking_status_history (append-only audit trail)
-- -----------------------------------------------------------------------------

CREATE TABLE public.booking_status_history (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid NOT NULL REFERENCES public.bookings (id) ON DELETE CASCADE,
  from_status   public.booking_status,
  to_status     public.booking_status NOT NULL,
  changed_by    uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  reason        text,
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.booking_status_history IS
  'Append-only. No soft delete. Populated by trigger or edge function.';

-- -----------------------------------------------------------------------------
-- reviews (one per completed booking)
-- -----------------------------------------------------------------------------

CREATE TABLE public.reviews (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       uuid NOT NULL UNIQUE REFERENCES public.bookings (id) ON DELETE RESTRICT,
  chef_profile_id  uuid NOT NULL REFERENCES public.chef_profiles (id) ON DELETE RESTRICT,
  family_id        uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  rating           smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text      text,
  verified         boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz,
  deleted_by       uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- favorites
-- -----------------------------------------------------------------------------

CREATE TABLE public.favorites (
  family_id        uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  chef_profile_id  uuid NOT NULL REFERENCES public.chef_profiles (id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (family_id, chef_profile_id)
);

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------

CREATE TABLE public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title       text NOT NULL,
  message     text NOT NULL,
  type        public.notification_type NOT NULL DEFAULT 'info',
  read        boolean NOT NULL DEFAULT false,
  metadata    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  read_at     timestamptz
);

-- -----------------------------------------------------------------------------
-- chef_documents (verification)
-- -----------------------------------------------------------------------------

CREATE TABLE public.chef_documents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id  uuid NOT NULL REFERENCES public.chef_profiles (id) ON DELETE CASCADE,
  document_type    public.document_type NOT NULL,
  storage_bucket   text NOT NULL DEFAULT 'cook-documents',
  storage_path     text NOT NULL,
  status           public.document_status NOT NULL DEFAULT 'pending',
  reviewed_by      uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  review_notes     text,
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz,

  CONSTRAINT chef_documents_path_unique UNIQUE (storage_bucket, storage_path)
);

CREATE TRIGGER chef_documents_set_updated_at
  BEFORE UPDATE ON public.chef_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- chef_availability
-- -----------------------------------------------------------------------------

CREATE TABLE public.chef_availability (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id  uuid NOT NULL REFERENCES public.chef_profiles (id) ON DELETE CASCADE,
  day_of_week      smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time_slots       jsonb NOT NULL DEFAULT '[]',
  recurring        boolean NOT NULL DEFAULT true,
  effective_from   date,
  effective_until  date,
  timezone         text NOT NULL DEFAULT 'America/New_York',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz,

  CONSTRAINT chef_availability_dates_check CHECK (
    effective_until IS NULL
    OR effective_from IS NULL
    OR effective_until >= effective_from
  )
);

CREATE TRIGGER chef_availability_set_updated_at
  BEFORE UPDATE ON public.chef_availability
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON COLUMN public.chef_availability.day_of_week IS
  '0=Sunday … 6=Saturday (PostgreSQL EXTRACT(DOW) convention).';
