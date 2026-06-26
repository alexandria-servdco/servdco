-- =============================================================================
-- ServdCo — Optional local dev seed (NOT applied by `supabase db push`)
-- =============================================================================
-- Production reference data (launch_regions, feature_flags) lives in:
--   supabase/migrations/20250625100000_production_reference_seed.sql
--
-- Run via: supabase db reset  (local only)
-- For linked cloud dev DB: node supabase/scripts/run-cloud-seed.mjs (optional)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- platform_settings — local dev metadata only
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

-- feature_flags and launch_regions: see migration 20250625100000_production_reference_seed.sql
