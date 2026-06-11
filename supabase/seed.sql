-- =============================================================================
-- ServdCo Phase 3 — Seed data (idempotent)
-- No fake users. No fake bookings.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- launch_regions (from approved mock seed data)
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
    true, false, 55, 230, true, 55, 230, 42,
    '2026-05-01T00:00:00Z', '2026-05-23T00:00:00Z'
  ),
  (
    'TX', 'Texas', 'Austin, Dallas, Houston', '73301, 75001, 77001',
    false, true, 30, 150, true, 25, 145, 82,
    '2026-05-05T00:00:00Z', '2026-05-23T00:00:00Z'
  ),
  (
    'CA', 'California', 'Los Angeles, San Francisco, San Diego', '90210, 94102, 92101',
    false, false, 45, 200, true, 4, 12, 15,
    '2026-05-10T00:00:00Z', '2026-05-23T00:00:00Z'
  ),
  (
    'FL', 'Florida', 'Miami, Orlando, Tampa', '33101, 32801, 33601',
    false, true, 25, 100, false, 18, 92, 44,
    '2026-05-12T00:00:00Z', '2026-05-23T00:00:00Z'
  ),
  (
    'NY', 'New York', 'New York City, Buffalo, Rochester', '10001, 14201, 14601',
    false, false, 60, 300, true, 12, 35, 48,
    '2026-05-15T00:00:00Z', '2026-05-23T00:00:00Z'
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
-- platform_settings (ensure defaults exist)
-- -----------------------------------------------------------------------------

INSERT INTO public.platform_settings (key, value, description)
VALUES
  ('platform_fee_percentage', '13', 'Platform fee percentage applied to booking totals'),
  ('chef_premium_price_monthly_cents', '1500', 'Cook premium subscription monthly price in cents ($15/mo)'),
  ('booking_hold_hours', '24', 'Hours to hold funds before cook payout transfer'),
  (
    'development_admin_metadata',
    '{
      "note": "Assign admin after first auth signup via SQL: UPDATE profiles SET role = ''admin'', status = ''active'' WHERE email = ''<your-email>'';",
      "recommended_dev_email": "admin@servd.co",
      "environment": "development"
    }'::jsonb,
    'Development admin setup instructions — metadata only, no user row created'
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- feature_flags (all disabled for safe cutover)
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
