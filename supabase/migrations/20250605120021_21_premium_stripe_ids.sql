-- =============================================================================
-- Phase 12F — Premium Stripe product/price IDs + analytics RBAC
-- =============================================================================

UPDATE public.platform_settings
SET value = to_jsonb('prod_UgZe8PbNHRxQm4'::text),
    updated_at = now()
WHERE key = 'stripe_premium_product_id';

UPDATE public.platform_settings
SET value = to_jsonb('price_1ThCVTA4ZMjGNuZkpNssZ6Eq'::text),
    updated_at = now()
WHERE key = 'stripe_premium_price_id';

-- Premium analytics: only premium cooks may read profile view aggregates
DROP POLICY IF EXISTS "chef_profile_views_select_own_chef" ON public.chef_profile_views;

CREATE POLICY "chef_profile_views_select_premium_chef"
  ON public.chef_profile_views FOR SELECT
  TO authenticated
  USING (
    public.owns_chef_profile(chef_profile_id)
    AND EXISTS (
      SELECT 1
      FROM public.chef_profiles cp
      WHERE cp.id = chef_profile_id
        AND cp.premium_status = true
    )
  );
