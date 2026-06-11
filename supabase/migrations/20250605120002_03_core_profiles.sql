-- =============================================================================
-- ServdCo Phase 2 — Core Identity: profiles, chef_profiles, portfolio
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles — extends auth.users (1:1)
-- -----------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email         text NOT NULL,
  full_name     text,
  phone         text,
  avatar_url    text,
  role          public.user_role NOT NULL DEFAULT 'family',
  status        public.account_status NOT NULL DEFAULT 'pending',
  city          text,
  state         text,
  zip           text,
  dietary_preferences text[] NOT NULL DEFAULT '{}',
  email_alerts  boolean NOT NULL DEFAULT true,
  sms_alerts    boolean NOT NULL DEFAULT false,
  profile_completed smallint NOT NULL DEFAULT 0
    CHECK (profile_completed >= 0 AND profile_completed <= 100),
  -- Audit
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  updated_by    uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  -- Soft delete
  deleted_at    timestamptz,
  deleted_by    uuid REFERENCES public.profiles (id) ON DELETE SET NULL,

  CONSTRAINT profiles_email_format CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.profiles IS
  'Canonical user record. role drives RLS. Links 1:1 to auth.users.';

-- -----------------------------------------------------------------------------
-- chef_profiles — marketplace cook identity (1:1 with chef-role profiles)
-- -----------------------------------------------------------------------------

CREATE TABLE public.chef_profiles (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  display_name              text NOT NULL,
  headline                  text,
  bio                       text,
  cuisines                  text[] NOT NULL DEFAULT '{}',
  years_experience          smallint CHECK (years_experience >= 0),
  service_types             public.service_type[] NOT NULL DEFAULT '{}',
  location                  text,
  verification_status       public.verification_status NOT NULL DEFAULT 'pending',
  premium_status            boolean NOT NULL DEFAULT false,
  profile_visibility        public.profile_visibility NOT NULL DEFAULT 'hidden',
  admin_visibility_override public.admin_visibility_override NOT NULL DEFAULT 'none',
  bookings_count            integer NOT NULL DEFAULT 0 CHECK (bookings_count >= 0),
  rating                    numeric(3, 2) NOT NULL DEFAULT 0
    CHECK (rating >= 0 AND rating <= 5),
  reviews_count             integer NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
  -- Stripe Connect reference (denormalized; canonical in stripe_accounts)
  stripe_account_ref        uuid,
  -- Audit
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  created_by                uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  updated_by                uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  deleted_at                timestamptz,
  deleted_by                uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

-- Role=chef enforcement: application layer or trigger in Phase 3 auth migration.

CREATE TRIGGER chef_profiles_set_updated_at
  BEFORE UPDATE ON public.chef_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.chef_profiles IS
  'Cook marketplace profile. Public when approved + visibility=public.';

-- -----------------------------------------------------------------------------
-- chef_portfolio_images
-- -----------------------------------------------------------------------------

CREATE TABLE public.chef_portfolio_images (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id  uuid NOT NULL REFERENCES public.chef_profiles (id) ON DELETE CASCADE,
  storage_bucket   text NOT NULL DEFAULT 'cook-portfolio',
  storage_path     text NOT NULL,
  public_url       text,
  alt_text         text,
  sort_order       integer NOT NULL DEFAULT 0,
  is_public        boolean NOT NULL DEFAULT true,
  mime_type        text,
  file_size_bytes  bigint CHECK (file_size_bytes >= 0),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz,

  CONSTRAINT chef_portfolio_images_path_unique UNIQUE (storage_bucket, storage_path)
);

CREATE TRIGGER chef_portfolio_images_set_updated_at
  BEFORE UPDATE ON public.chef_portfolio_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Role & authorization helpers (require profiles + chef_profiles)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid()
    AND deleted_at IS NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND deleted_at IS NULL
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_family()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() = 'family';
$$;

CREATE OR REPLACE FUNCTION public.is_chef()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() = 'chef';
$$;

CREATE OR REPLACE FUNCTION public.owns_chef_profile(p_chef_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chef_profiles cp
    WHERE cp.id = p_chef_profile_id
      AND cp.user_id = auth.uid()
      AND cp.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_public_chef_profile(p_chef_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chef_profiles cp
    WHERE cp.id = p_chef_profile_id
      AND cp.deleted_at IS NULL
      AND cp.verification_status = 'approved'
      AND cp.profile_visibility = 'public'
      AND cp.admin_visibility_override <> 'hidden'
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::public.user_role,
      'family'
    ),
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS
  'Creates profiles row on signup. Attach to auth.users via trigger in Phase 4 auth migration.';
