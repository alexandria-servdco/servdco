-- =============================================================================
-- ServdCo Phase 2 — Row Level Security Policies
-- Strategy: family/chef own data; admin full access; public read where noted
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    AND deleted_at IS NULL
  );

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "profiles_insert_service"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_soft_delete_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- chef_profiles
-- -----------------------------------------------------------------------------

CREATE POLICY "chef_profiles_select_public"
  ON public.chef_profiles FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND verification_status = 'approved'
    AND profile_visibility = 'public'
    AND admin_visibility_override <> 'hidden'
  );

CREATE POLICY "chef_profiles_select_own"
  ON public.chef_profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
  );

CREATE POLICY "chef_profiles_select_admin"
  ON public.chef_profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "chef_profiles_insert_own"
  ON public.chef_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_chef()
  );

CREATE POLICY "chef_profiles_update_own"
  ON public.chef_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "chef_profiles_update_admin"
  ON public.chef_profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- chef_portfolio_images
-- -----------------------------------------------------------------------------

CREATE POLICY "portfolio_select_public"
  ON public.chef_portfolio_images FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND is_public = true
    AND public.is_public_chef_profile(chef_profile_id)
  );

CREATE POLICY "portfolio_select_own"
  ON public.chef_portfolio_images FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.owns_chef_profile(chef_profile_id)
  );

CREATE POLICY "portfolio_select_admin"
  ON public.chef_portfolio_images FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "portfolio_insert_own"
  ON public.chef_portfolio_images FOR INSERT
  TO authenticated
  WITH CHECK (public.owns_chef_profile(chef_profile_id));

CREATE POLICY "portfolio_update_own"
  ON public.chef_portfolio_images FOR UPDATE
  TO authenticated
  USING (public.owns_chef_profile(chef_profile_id))
  WITH CHECK (public.owns_chef_profile(chef_profile_id));

CREATE POLICY "portfolio_all_admin"
  ON public.chef_portfolio_images FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- bookings
-- -----------------------------------------------------------------------------

CREATE POLICY "bookings_select_family"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND family_id = auth.uid()
  );

CREATE POLICY "bookings_select_chef"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.owns_chef_profile(chef_profile_id)
  );

CREATE POLICY "bookings_select_admin"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "bookings_insert_family"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id = auth.uid()
    AND public.is_family()
  );

CREATE POLICY "bookings_update_family"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (family_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (family_id = auth.uid());

CREATE POLICY "bookings_update_chef"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (public.owns_chef_profile(chef_profile_id) AND deleted_at IS NULL)
  WITH CHECK (public.owns_chef_profile(chef_profile_id));

CREATE POLICY "bookings_update_admin"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- booking_status_history
-- -----------------------------------------------------------------------------

CREATE POLICY "booking_history_select_participants"
  ON public.booking_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.deleted_at IS NULL
        AND (
          b.family_id = auth.uid()
          OR public.owns_chef_profile(b.chef_profile_id)
          OR public.is_admin()
        )
    )
  );

CREATE POLICY "booking_history_insert_participants"
  ON public.booking_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND (
          b.family_id = auth.uid()
          OR public.owns_chef_profile(b.chef_profile_id)
          OR public.is_admin()
        )
    )
  );

CREATE POLICY "booking_history_admin_all"
  ON public.booking_status_history FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- reviews
-- -----------------------------------------------------------------------------

CREATE POLICY "reviews_select_public"
  ON public.reviews FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND public.is_public_chef_profile(chef_profile_id)
  );

CREATE POLICY "reviews_select_own"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (family_id = auth.uid() OR public.owns_chef_profile(chef_profile_id))
  );

CREATE POLICY "reviews_insert_family"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id = auth.uid()
    AND public.is_family()
  );

CREATE POLICY "reviews_update_own"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (family_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (family_id = auth.uid());

CREATE POLICY "reviews_admin_all"
  ON public.reviews FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- favorites
-- -----------------------------------------------------------------------------

CREATE POLICY "favorites_select_own"
  ON public.favorites FOR SELECT
  TO authenticated
  USING (family_id = auth.uid());

CREATE POLICY "favorites_insert_own"
  ON public.favorites FOR INSERT
  TO authenticated
  WITH CHECK (family_id = auth.uid() AND public.is_family());

CREATE POLICY "favorites_delete_own"
  ON public.favorites FOR DELETE
  TO authenticated
  USING (family_id = auth.uid());

CREATE POLICY "favorites_admin_all"
  ON public.favorites FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_insert_admin"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- System inserts via service role edge functions (bypass RLS)

-- -----------------------------------------------------------------------------
-- chef_documents
-- -----------------------------------------------------------------------------

CREATE POLICY "chef_documents_select_own"
  ON public.chef_documents FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.owns_chef_profile(chef_profile_id)
  );

CREATE POLICY "chef_documents_select_admin"
  ON public.chef_documents FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "chef_documents_insert_own"
  ON public.chef_documents FOR INSERT
  TO authenticated
  WITH CHECK (public.owns_chef_profile(chef_profile_id));

CREATE POLICY "chef_documents_update_admin"
  ON public.chef_documents FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- chef_availability
-- -----------------------------------------------------------------------------

CREATE POLICY "availability_select_public"
  ON public.chef_availability FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND public.is_public_chef_profile(chef_profile_id)
  );

CREATE POLICY "availability_select_own"
  ON public.chef_availability FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.owns_chef_profile(chef_profile_id)
  );

CREATE POLICY "availability_manage_own"
  ON public.chef_availability FOR ALL
  TO authenticated
  USING (public.owns_chef_profile(chef_profile_id))
  WITH CHECK (public.owns_chef_profile(chef_profile_id));

CREATE POLICY "availability_admin_all"
  ON public.chef_availability FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- launch_regions — public read for waitlist UI; admin write
-- -----------------------------------------------------------------------------

CREATE POLICY "launch_regions_select_public"
  ON public.launch_regions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "launch_regions_admin_write"
  ON public.launch_regions FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- waitlist_signups — anon insert; admin read
-- -----------------------------------------------------------------------------

CREATE POLICY "waitlist_insert_anon"
  ON public.waitlist_signups FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "waitlist_select_admin"
  ON public.waitlist_signups FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "waitlist_select_own_email"
  ON public.waitlist_signups FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid()
    OR lower(email) = lower((SELECT email FROM public.profiles WHERE id = auth.uid()))
  );

-- -----------------------------------------------------------------------------
-- interest_requests — anon insert; admin read
-- -----------------------------------------------------------------------------

CREATE POLICY "interest_insert_anon"
  ON public.interest_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "interest_select_admin"
  ON public.interest_requests FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- contact_messages — anon insert; admin read/update
-- -----------------------------------------------------------------------------

CREATE POLICY "contact_insert_anon"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "contact_admin_all"
  ON public.contact_messages FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- platform_settings — public read fee display; admin write
-- -----------------------------------------------------------------------------

CREATE POLICY "platform_settings_select_public_keys"
  ON public.platform_settings FOR SELECT
  TO anon, authenticated
  USING (
    key IN (
      'platform_fee_percentage',
      'chef_premium_price_monthly_cents'
    )
  );

CREATE POLICY "platform_settings_admin_all"
  ON public.platform_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- blog_posts — public read published only
-- -----------------------------------------------------------------------------

CREATE POLICY "blog_select_published"
  ON public.blog_posts FOR SELECT
  TO anon, authenticated
  USING (
    published = true
    AND deleted_at IS NULL
    AND (published_at IS NULL OR published_at <= now())
  );

CREATE POLICY "blog_admin_all"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- stripe_customers
-- -----------------------------------------------------------------------------

CREATE POLICY "stripe_customers_select_own"
  ON public.stripe_customers FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "stripe_customers_admin_all"
  ON public.stripe_customers FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Writes via service role (Vercel API) only

-- -----------------------------------------------------------------------------
-- stripe_accounts
-- -----------------------------------------------------------------------------

CREATE POLICY "stripe_accounts_select_own"
  ON public.stripe_accounts FOR SELECT
  TO authenticated
  USING (public.owns_chef_profile(chef_profile_id));

CREATE POLICY "stripe_accounts_admin_all"
  ON public.stripe_accounts FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- payments
-- -----------------------------------------------------------------------------

CREATE POLICY "payments_select_family"
  ON public.payments FOR SELECT
  TO authenticated
  USING (family_id = auth.uid());

CREATE POLICY "payments_select_chef"
  ON public.payments FOR SELECT
  TO authenticated
  USING (public.owns_chef_profile(chef_profile_id));

CREATE POLICY "payments_admin_all"
  ON public.payments FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- stripe_events — admin read only; writes service role only
-- -----------------------------------------------------------------------------

CREATE POLICY "stripe_events_admin_select"
  ON public.stripe_events FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- No INSERT/UPDATE policies for authenticated — service role bypasses RLS

-- -----------------------------------------------------------------------------
-- subscriptions
-- -----------------------------------------------------------------------------

CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (public.owns_chef_profile(chef_profile_id));

CREATE POLICY "subscriptions_admin_all"
  ON public.subscriptions FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- conversations & messages (future)
-- -----------------------------------------------------------------------------

CREATE POLICY "conversations_select_participants"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    family_id = auth.uid()
    OR public.owns_chef_profile(chef_profile_id)
    OR public.is_admin()
  );

CREATE POLICY "conversations_insert_participants"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id = auth.uid()
    OR public.owns_chef_profile(chef_profile_id)
  );

CREATE POLICY "messages_select_participants"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (
          c.family_id = auth.uid()
          OR public.owns_chef_profile(c.chef_profile_id)
          OR public.is_admin()
        )
    )
  );

CREATE POLICY "messages_insert_participants"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (
          c.family_id = auth.uid()
          OR public.owns_chef_profile(c.chef_profile_id)
        )
    )
  );

CREATE POLICY "messaging_admin_all"
  ON public.conversations FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "messages_admin_all"
  ON public.messages FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
