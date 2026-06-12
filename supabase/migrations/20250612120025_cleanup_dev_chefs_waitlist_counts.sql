-- =============================================================================
-- Remove dev/test chef profiles and sync waitlist region counts from real data
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Soft-delete dev seed chefs (seed-dev-chefs.sql) and audit test accounts
-- -----------------------------------------------------------------------------
UPDATE public.chef_profiles cp
SET
  deleted_at = COALESCE(cp.deleted_at, now()),
  profile_visibility = 'hidden',
  verification_status = 'rejected',
  updated_at = now()
FROM public.profiles p
WHERE p.id = cp.user_id
  AND cp.deleted_at IS NULL
  AND (
    p.email LIKE 'dev-chef-%@servdco.local'
    OR p.email LIKE '%@mailinator.com'
    OR p.email ILIKE 'p3retest.%'
    OR p.email ILIKE 'testh.%'
    OR p.email ILIKE 'v5.%vercel%'
    OR cp.id::text LIKE 'c100000%'
    OR p.id::text LIKE 'd100000%'
  );

UPDATE public.profiles p
SET
  deleted_at = COALESCE(p.deleted_at, now()),
  status = 'suspended',
  updated_at = now()
WHERE p.deleted_at IS NULL
  AND p.role = 'chef'
  AND (
    p.email LIKE 'dev-chef-%@servdco.local'
    OR p.email LIKE '%@mailinator.com'
    OR p.email ILIKE 'p3retest.%'
    OR p.email ILIKE 'testh.%'
    OR p.email ILIKE 'v5.%vercel%'
    OR p.id::text LIKE 'd100000%'
  );

-- -----------------------------------------------------------------------------
-- Sync launch_regions counters from waitlist_signups (source of truth)
-- -----------------------------------------------------------------------------
UPDATE public.launch_regions lr
SET
  family_count = (
    SELECT COUNT(*)::integer FROM public.waitlist_signups
    WHERE region_id = lr.id AND role = 'family'
  ),
  chef_count = (
    SELECT COUNT(*)::integer FROM public.waitlist_signups
    WHERE region_id = lr.id AND role = 'chef'
  ),
  waitlist_count = (
    SELECT COUNT(*)::integer FROM public.waitlist_signups
    WHERE region_id = lr.id
  ),
  updated_at = now();

-- -----------------------------------------------------------------------------
-- Keep launch_regions counters in sync when waitlist_signups changes
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_launch_region_waitlist_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_region_id text;
BEGIN
  v_region_id := COALESCE(NEW.region_id, OLD.region_id);
  IF v_region_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  UPDATE public.launch_regions lr
  SET
    family_count = (
      SELECT COUNT(*)::integer FROM public.waitlist_signups
      WHERE region_id = v_region_id AND role = 'family'
    ),
    chef_count = (
      SELECT COUNT(*)::integer FROM public.waitlist_signups
      WHERE region_id = v_region_id AND role = 'chef'
    ),
    waitlist_count = (
      SELECT COUNT(*)::integer FROM public.waitlist_signups
      WHERE region_id = v_region_id
    ),
    updated_at = now()
  WHERE lr.id = v_region_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS waitlist_signups_sync_region_counts ON public.waitlist_signups;
CREATE TRIGGER waitlist_signups_sync_region_counts
  AFTER INSERT OR DELETE ON public.waitlist_signups
  FOR EACH ROW EXECUTE FUNCTION public.sync_launch_region_waitlist_counts();
