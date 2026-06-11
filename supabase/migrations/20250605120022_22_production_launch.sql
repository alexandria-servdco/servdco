-- =============================================================================
-- Phase 12G — Production launch cutover (feature flags)
-- Run once when deploying payments + Supabase auth to production.
-- =============================================================================

UPDATE public.feature_flags
SET enabled = true, updated_at = now()
WHERE key IN ('use_supabase_auth', 'enable_stripe_checkout');
