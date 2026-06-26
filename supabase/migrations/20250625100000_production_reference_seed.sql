-- =============================================================================
-- Production reference seed — required for fresh Supabase projects via db push
-- Idempotent. No users. No bookings. Safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- launch_regions (platform geography / waitlist markets)
-- -----------------------------------------------------------------------------
INSERT INTO public.launch_regions (
  id, state, city, zip_codes,
  is_active, is_waitlist,
  min_chefs, min_families, auto_launch,
  chef_count, family_count, waitlist_count,
  created_at, updated_at
) VALUES
  (
    'OH', 'Ohio', 'Columbus, Cleveland, Cincinnati', '43016, 43210, 44101, 45201',
    true, false, 55, 230, true, 0, 0, 0,
    '2026-05-01T00:00:00Z', now()
  ),
  (
    'TX', 'Texas', 'Austin, Dallas, Houston', '73301, 75001, 77001',
    false, true, 30, 150, true, 0, 0, 0,
    '2026-05-05T00:00:00Z', now()
  ),
  (
    'CA', 'California', 'Los Angeles, San Francisco, San Diego', '90210, 94102, 92101',
    false, false, 45, 200, true, 0, 0, 0,
    '2026-05-10T00:00:00Z', now()
  ),
  (
    'FL', 'Florida', 'Miami, Orlando, Tampa', '33101, 32801, 33601',
    false, true, 25, 100, false, 0, 0, 0,
    '2026-05-12T00:00:00Z', now()
  ),
  (
    'NY', 'New York', 'New York City, Buffalo, Rochester, Albany', '10001, 14201, 14601, 12207',
    false, false, 60, 300, true, 0, 0, 0,
    '2026-05-15T00:00:00Z', now()
  ),
  (
    'GA', 'Georgia', 'Atlanta', '30301, 30303, 30308',
    false, true, 25, 120, true, 0, 0, 0,
    '2026-05-15T00:00:00Z', now()
  ),
  (
    'WA', 'Washington', 'Seattle', '98101, 98109, 98122',
    false, true, 25, 120, true, 0, 0, 0,
    '2026-05-15T00:00:00Z', now()
  )
ON CONFLICT (id) DO UPDATE SET
  state = EXCLUDED.state,
  city = EXCLUDED.city,
  zip_codes = EXCLUDED.zip_codes,
  is_active = EXCLUDED.is_active,
  is_waitlist = EXCLUDED.is_waitlist,
  min_chefs = EXCLUDED.min_chefs,
  min_families = EXCLUDED.min_families,
  auto_launch = EXCLUDED.auto_launch,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- feature_flags (runtime toggles — rows required before earlier UPDATE migrations)
-- Fresh projects: insert defaults, then apply production-enabled state.
-- -----------------------------------------------------------------------------
INSERT INTO public.feature_flags (key, enabled, description, metadata)
VALUES
  (
    'use_supabase_auth',
    false,
    'When true, Guards and Login use Supabase session instead of localStorage',
    '{"phase": 4, "owner": "platform"}'::jsonb
  ),
  (
    'enable_stripe_checkout',
    false,
    'When true, booking flow redirects to Stripe Checkout',
    '{"phase": 5, "owner": "payments"}'::jsonb
  ),
  (
    'enable_messaging',
    false,
    'When true, in-app messaging between family and cook is enabled',
    '{"phase": 6, "owner": "platform"}'::jsonb
  ),
  (
    'maintenance_mode',
    false,
    'When true, show maintenance banner and block new bookings',
    '{"owner": "platform"}'::jsonb
  )
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- Production cutover state (idempotent)
UPDATE public.feature_flags
SET enabled = true, updated_at = now()
WHERE key IN ('use_supabase_auth', 'enable_stripe_checkout', 'enable_messaging');

-- -----------------------------------------------------------------------------
-- platform_settings — ensure family platform fee exists (phase 2)
-- -----------------------------------------------------------------------------
INSERT INTO public.platform_settings (key, value, description)
VALUES (
  'family_platform_fee_dollars',
  '5',
  'Fixed fee charged to families per booking (USD dollars)'
)
ON CONFLICT (key) DO NOTHING;
