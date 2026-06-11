-- =============================================================================
-- ServdCo Phase 2 — Extensions & Enums
-- Architecture only. Apply via: supabase db push / supabase migration up
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- ENUM types
-- -----------------------------------------------------------------------------

CREATE TYPE public.user_role AS ENUM ('family', 'chef', 'admin');

CREATE TYPE public.account_status AS ENUM ('active', 'suspended', 'pending');

CREATE TYPE public.verification_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'suspended'
);

CREATE TYPE public.profile_visibility AS ENUM ('public', 'hidden');

CREATE TYPE public.admin_visibility_override AS ENUM ('none', 'hidden', 'public');

CREATE TYPE public.service_type AS ENUM ('breakfast', 'dinner', 'mealprep');

CREATE TYPE public.booking_status AS ENUM (
  'pending',
  'confirmed',
  'completed',
  'cancelled'
);

CREATE TYPE public.document_type AS ENUM (
  'servsafe_certificate',
  'insurance',
  'background_check',
  'id_verification'
);

CREATE TYPE public.document_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE public.notification_type AS ENUM ('info', 'success', 'warning', 'error');

CREATE TYPE public.interest_role AS ENUM ('family', 'chef', 'both');

CREATE TYPE public.waitlist_role AS ENUM ('family', 'chef');

CREATE TYPE public.contact_status AS ENUM ('new', 'read', 'archived');

-- Stripe / payments (future-ready)
CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'refunded',
  'partially_refunded'
);

CREATE TYPE public.stripe_onboarding_status AS ENUM (
  'not_started',
  'pending',
  'complete',
  'restricted'
);

CREATE TYPE public.subscription_status AS ENUM (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete'
);

-- Future messaging
CREATE TYPE public.message_status AS ENUM ('sent', 'delivered', 'read');
