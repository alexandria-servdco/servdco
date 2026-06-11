-- =============================================================================
-- ServdCo Phase 2 — Launch ops, waitlist, contact, platform settings
-- =============================================================================

-- -----------------------------------------------------------------------------
-- launch_regions
-- -----------------------------------------------------------------------------

CREATE TABLE public.launch_regions (
  id               text PRIMARY KEY,
  state            text NOT NULL,
  city             text,
  zip_codes        text,
  is_active        boolean NOT NULL DEFAULT false,
  is_waitlist      boolean NOT NULL DEFAULT true,
  min_chefs        integer NOT NULL DEFAULT 0 CHECK (min_chefs >= 0),
  min_families     integer NOT NULL DEFAULT 0 CHECK (min_families >= 0),
  auto_launch      boolean NOT NULL DEFAULT true,
  chef_count       integer NOT NULL DEFAULT 0 CHECK (chef_count >= 0),
  family_count     integer NOT NULL DEFAULT 0 CHECK (family_count >= 0),
  waitlist_count   integer NOT NULL DEFAULT 0 CHECK (waitlist_count >= 0),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  updated_by       uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE TRIGGER launch_regions_set_updated_at
  BEFORE UPDATE ON public.launch_regions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- waitlist_signups
-- -----------------------------------------------------------------------------

CREATE TABLE public.waitlist_signups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  full_name     text,
  role          public.waitlist_role NOT NULL,
  state         text NOT NULL,
  city          text,
  zip           text,
  region_id     text REFERENCES public.launch_regions (id) ON DELETE SET NULL,
  profile_id    uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT waitlist_signups_email_region_unique UNIQUE (email, region_id, role)
);

-- -----------------------------------------------------------------------------
-- interest_requests (Bring ServdCo to your city)
-- -----------------------------------------------------------------------------

CREATE TABLE public.interest_requests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  text NOT NULL,
  email      text NOT NULL,
  city       text NOT NULL,
  state      text NOT NULL,
  role       public.interest_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- contact_messages
-- -----------------------------------------------------------------------------

CREATE TABLE public.contact_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  text NOT NULL,
  email      text NOT NULL,
  message    text NOT NULL,
  status     public.contact_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  handled_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE TRIGGER contact_messages_set_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- platform_settings (key-value config)
-- -----------------------------------------------------------------------------

CREATE TABLE public.platform_settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL DEFAULT '{}',
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE TRIGGER platform_settings_set_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed defaults (idempotent)
INSERT INTO public.platform_settings (key, value, description)
VALUES
  (
    'platform_fee_percentage',
    '13',
    'Platform fee percentage applied to booking totals'
  ),
  (
    'chef_premium_price_monthly_cents',
    '4900',
    'Cook premium subscription monthly price in cents'
  ),
  (
    'booking_hold_hours',
    '24',
    'Hours to hold funds before cook payout transfer'
  )
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- blog_posts (public content — supports PUBLIC ACCESS requirement)
-- -----------------------------------------------------------------------------

CREATE TABLE public.blog_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  title         text NOT NULL,
  excerpt       text,
  body          text,
  category      text,
  cover_image_url text,
  author_name   text,
  read_time_minutes smallint,
  published     boolean NOT NULL DEFAULT false,
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE TRIGGER blog_posts_set_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.blog_posts IS
  'Public blog. Only published posts are readable anonymously.';
