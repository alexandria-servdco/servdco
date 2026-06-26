-- =============================================================================
-- ServdCo — Beta test-user cleanup (PRODUCTION-SAFE, NOT A MIGRATION)
-- =============================================================================
--
-- Purpose:
--   Remove development Family and Cook accounts and all user-owned data so
--   those email addresses can register again via the normal signup flow.
--
-- Preserves:
--   • Emails in v_preserve_emails (Alexandria admin + any co-admin)
--   • Any profile with role = 'admin'
--   • Platform configuration, launch_regions, feature_flags, geo data
--   • stripe_events webhook log
--
-- Does NOT: TRUNCATE, disable FKs, or delete platform/reference data.
--
-- WORKFLOW:
--   1. Edit v_preserve_emails (verify Alexandria's admin email).
--   2. Run STEP 0 — review NOTICE output and preview query.
--   3. Backup database (Supabase dashboard → Backups).
--   4. Set v_execute := true in STEP 1 and run.
--   5. Run POST-SQL verification queries.
--   6. Remove orphaned Stripe Customers / Connect accounts (external).
-- =============================================================================


-- =============================================================================
-- STEP 0 — PREVIEW (read-only)
-- =============================================================================
DO $$
DECLARE
  v_preserve_emails text[] := ARRAY[
    'alexandria@servdco.com'  -- ◀ Verify matches Admin auth.users email
  ];

  -- When true, only deletes emails listed below + patterns (safer first pass).
  -- When false, deletes ALL family/chef except v_preserve_emails.
  v_explicit_only boolean := false;

  v_extra_delete_emails text[] := ARRAY[
    'kartik.2327csit1113@kiet.edu',
    'tolakas482@divahd.com',
    'siwige8057@divahok.com'
  ];

  v_delete_email_patterns text[] := ARRAY[
    '%@mailinator.com',
    '%@divahd.com',
    '%@divahok.com',
    'dev-chef-%@servdco.local',
    'p3retest.%',
    'testh.%',
    'v5.%vercel%',
    'e2e-%@example.com'
  ];

  v_target_count integer;
  v_booking_count integer;
BEGIN
  DROP TABLE IF EXISTS _beta_cleanup_preview;
  CREATE TEMP TABLE _beta_cleanup_preview AS
  SELECT
    p.id AS profile_id,
    p.email,
    p.role,
    p.full_name,
    cp.id AS chef_profile_id
  FROM public.profiles p
  LEFT JOIN public.chef_profiles cp ON cp.user_id = p.id
  WHERE p.role IN ('family', 'chef')
    AND lower(trim(p.email)) <> ALL (
      SELECT lower(trim(e)) FROM unnest(v_preserve_emails) AS e
    )
    AND (
      NOT v_explicit_only
      OR lower(trim(p.email)) = ANY (
        SELECT lower(trim(e)) FROM unnest(v_extra_delete_emails) AS e
      )
      OR EXISTS (
        SELECT 1 FROM unnest(v_delete_email_patterns) pat
        WHERE p.email ILIKE pat
      )
    );

  IF EXISTS (
    SELECT 1 FROM _beta_cleanup_preview t
    JOIN public.profiles ap ON ap.id = t.profile_id AND ap.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'ABORT: an admin profile is in the delete preview';
  END IF;

  SELECT COUNT(*) INTO v_target_count FROM _beta_cleanup_preview;

  SELECT COUNT(DISTINCT b.id) INTO v_booking_count
  FROM public.bookings b
  JOIN _beta_cleanup_preview t
    ON b.family_id = t.profile_id
    OR b.chef_profile_id = t.chef_profile_id;

  RAISE NOTICE '=== BETA CLEANUP PREVIEW ===';
  RAISE NOTICE 'Mode: %', CASE WHEN v_explicit_only THEN 'explicit emails/patterns only' ELSE 'ALL family/chef except preserve list' END;
  RAISE NOTICE 'Profiles targeted: %', v_target_count;
  RAISE NOTICE 'Bookings affected: %', v_booking_count;
  RAISE NOTICE 'Preview: SELECT * FROM _beta_cleanup_preview ORDER BY role, email;';
END $$;

-- Run after STEP 0:
-- SELECT * FROM _beta_cleanup_preview ORDER BY role, email;


-- =============================================================================
-- STEP 1 — EXECUTE (transactional delete)
-- =============================================================================
BEGIN;

DO $$
DECLARE
  v_execute boolean := false;  -- ◀◀◀ SET true AFTER PREVIEW + BACKUP

  v_preserve_emails text[] := ARRAY[
    'alexandria@servdco.com'
  ];

  v_explicit_only boolean := false;

  v_extra_delete_emails text[] := ARRAY[
    'kartik.2327csit1113@kiet.edu',
    'tolakas482@divahd.com',
    'siwige8057@divahok.com'
  ];

  v_delete_email_patterns text[] := ARRAY[
    '%@mailinator.com',
    '%@divahd.com',
    '%@divahok.com',
    'dev-chef-%@servdco.local',
    'p3retest.%',
    'testh.%',
    'v5.%vercel%',
    'e2e-%@example.com'
  ];
BEGIN
  IF NOT v_execute THEN
    RAISE EXCEPTION 'Set v_execute := true after reviewing STEP 0 preview';
  END IF;

  CREATE TEMP TABLE _beta_targets AS
  SELECT
    p.id AS profile_id,
    lower(trim(p.email)) AS email_norm,
    p.email,
    p.role,
    cp.id AS chef_profile_id
  FROM public.profiles p
  LEFT JOIN public.chef_profiles cp ON cp.user_id = p.id
  WHERE p.role IN ('family', 'chef')
    AND lower(trim(p.email)) <> ALL (
      SELECT lower(trim(e)) FROM unnest(v_preserve_emails) AS e
    )
    AND (
      NOT v_explicit_only
      OR lower(trim(p.email)) = ANY (
        SELECT lower(trim(e)) FROM unnest(v_extra_delete_emails) AS e
      )
      OR EXISTS (
        SELECT 1 FROM unnest(v_delete_email_patterns) pat
        WHERE p.email ILIKE pat
      )
    );

  IF NOT EXISTS (SELECT 1 FROM _beta_targets) THEN
    RAISE NOTICE 'No matching profiles — nothing to delete.';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM _beta_targets t
    JOIN public.profiles ap ON ap.id = t.profile_id AND ap.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'ABORT: admin profile in delete set';
  END IF;

  CREATE TEMP TABLE _beta_bookings AS
  SELECT DISTINCT b.id AS booking_id
  FROM public.bookings b
  JOIN _beta_targets t
    ON b.family_id = t.profile_id
    OR b.chef_profile_id = t.chef_profile_id;

  CREATE TEMP TABLE _beta_conversations AS
  SELECT DISTINCT c.id AS conversation_id
  FROM public.conversations c
  JOIN _beta_targets t
    ON c.family_id = t.profile_id
    OR c.chef_profile_id = t.chef_profile_id;

  CREATE TEMP TABLE _beta_messages AS
  SELECT DISTINCT m.id AS message_id
  FROM public.messages m
  WHERE m.sender_id IN (SELECT profile_id FROM _beta_targets)
     OR m.conversation_id IN (SELECT conversation_id FROM _beta_conversations);

  -- Dependency order: leaves → RESTRICT parents → profiles → auth

  DELETE FROM public.message_attachments
  WHERE message_id IN (SELECT message_id FROM _beta_messages);

  DELETE FROM public.messages
  WHERE id IN (SELECT message_id FROM _beta_messages);

  DELETE FROM public.conversations
  WHERE id IN (SELECT conversation_id FROM _beta_conversations);

  DELETE FROM public.tip_events
  WHERE tip_id IN (
    SELECT tip.id FROM public.tips tip
    WHERE tip.booking_id IN (SELECT booking_id FROM _beta_bookings)
       OR tip.family_id IN (SELECT profile_id FROM _beta_targets)
       OR tip.chef_profile_id IN (
         SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL
       )
  );

  DELETE FROM public.tips
  WHERE booking_id IN (SELECT booking_id FROM _beta_bookings)
     OR family_id IN (SELECT profile_id FROM _beta_targets)
     OR chef_profile_id IN (
       SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL
     );

  DELETE FROM public.cook_payouts
  WHERE chef_profile_id IN (
      SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL
    )
    OR transfer_id IN (
      SELECT tr.id FROM public.transfers tr
      WHERE tr.booking_id IN (SELECT booking_id FROM _beta_bookings)
    );

  DELETE FROM public.transfers
  WHERE booking_id IN (SELECT booking_id FROM _beta_bookings)
     OR chef_profile_id IN (
       SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL
     )
     OR payment_id IN (
       SELECT pay.id FROM public.payments pay
       WHERE pay.booking_id IN (SELECT booking_id FROM _beta_bookings)
     );

  DELETE FROM public.payments
  WHERE booking_id IN (SELECT booking_id FROM _beta_bookings)
     OR family_id IN (SELECT profile_id FROM _beta_targets)
     OR chef_profile_id IN (
       SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL
     );

  DELETE FROM public.reviews
  WHERE booking_id IN (SELECT booking_id FROM _beta_bookings)
     OR family_id IN (SELECT profile_id FROM _beta_targets)
     OR chef_profile_id IN (
       SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL
     );

  DELETE FROM public.booking_status_history
  WHERE booking_id IN (SELECT booking_id FROM _beta_bookings);

  DELETE FROM public.booking_addresses
  WHERE booking_id IN (SELECT booking_id FROM _beta_bookings);

  DELETE FROM public.bookings
  WHERE id IN (SELECT booking_id FROM _beta_bookings);

  DELETE FROM public.chef_profile_views
  WHERE chef_profile_id IN (
      SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL
    )
    OR viewer_profile_id IN (SELECT profile_id FROM _beta_targets);

  DELETE FROM public.favorites
  WHERE family_id IN (SELECT profile_id FROM _beta_targets)
     OR chef_profile_id IN (
       SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL
     );

  DELETE FROM public.notifications
  WHERE user_id IN (SELECT profile_id FROM _beta_targets);

  DELETE FROM public.chef_portfolio_images
  WHERE chef_profile_id IN (
    SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL
  );

  DELETE FROM public.chef_documents
  WHERE chef_profile_id IN (
    SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL
  );

  DELETE FROM public.chef_availability
  WHERE chef_profile_id IN (
    SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL
  );

  DELETE FROM public.subscriptions
  WHERE chef_profile_id IN (
    SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL
  );

  DELETE FROM public.stripe_accounts
  WHERE chef_profile_id IN (
    SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL
  );

  DELETE FROM public.stripe_customers
  WHERE profile_id IN (SELECT profile_id FROM _beta_targets);

  DELETE FROM public.waitlist_signups
  WHERE profile_id IN (SELECT profile_id FROM _beta_targets)
     OR lower(trim(email)) IN (SELECT email_norm FROM _beta_targets);

  DELETE FROM storage.objects so
  WHERE (
      so.bucket_id = 'avatars'
      AND (storage.foldername(so.name))[1] IN (
        SELECT profile_id::text FROM _beta_targets
      )
    )
    OR (
      so.bucket_id IN ('cook-portfolio', 'cook-documents')
      AND (storage.foldername(so.name))[1] IN (
        SELECT chef_profile_id::text FROM _beta_targets WHERE chef_profile_id IS NOT NULL
      )
    )
    OR (
      so.bucket_id = 'message-attachments'
      AND (storage.foldername(so.name))[1] IN (
        SELECT profile_id::text FROM _beta_targets
      )
    );

  DELETE FROM public.audit_logs
  WHERE actor_id IN (SELECT profile_id FROM _beta_targets);

  DELETE FROM public.security_events
  WHERE user_id IN (SELECT profile_id FROM _beta_targets);

  DELETE FROM public.chef_profiles
  WHERE user_id IN (SELECT profile_id FROM _beta_targets);

  DELETE FROM public.profiles
  WHERE id IN (SELECT profile_id FROM _beta_targets);

  DELETE FROM auth.users
  WHERE id IN (SELECT profile_id FROM _beta_targets);

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

  RAISE NOTICE 'Deleted % auth user(s). POST-SQL: clean up Stripe + verify orphans.',
    (SELECT COUNT(*) FROM _beta_targets);
END $$;

-- Review results, then:
COMMIT;
-- Or ROLLBACK; if anything looks wrong


-- =============================================================================
-- POST-SQL VERIFICATION
-- =============================================================================
/*
-- Remaining users
SELECT u.id, u.email, p.role, p.full_name, p.status
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
ORDER BY p.role, u.email;

-- Orphan checks (all should be 0)
SELECT 'bookings' AS entity, COUNT(*) AS orphans
FROM public.bookings b
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = b.family_id)
UNION ALL
SELECT 'messages', COUNT(*)
FROM public.messages m
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = m.sender_id)
UNION ALL
SELECT 'payments', COUNT(*)
FROM public.payments pay
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = pay.family_id);

-- Stripe mappings that should be gone
SELECT * FROM public.stripe_customers sc
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = sc.profile_id);

SELECT * FROM public.stripe_accounts sa
WHERE NOT EXISTS (SELECT 1 FROM public.chef_profiles cp WHERE cp.id = sa.chef_profile_id);
*/
