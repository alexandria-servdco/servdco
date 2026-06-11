-- =============================================================================
-- ServdCo Phase 2 — Indexes & Performance
-- =============================================================================

-- profiles
CREATE INDEX idx_profiles_role ON public.profiles (role) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_status ON public.profiles (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_state_city ON public.profiles (state, city) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_email ON public.profiles (lower(email)) WHERE deleted_at IS NULL;

-- chef_profiles
CREATE INDEX idx_chef_profiles_user_id ON public.chef_profiles (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_chef_profiles_public_listing ON public.chef_profiles (
  verification_status,
  profile_visibility,
  rating DESC
) WHERE deleted_at IS NULL
  AND verification_status = 'approved'
  AND profile_visibility = 'public'
  AND admin_visibility_override <> 'hidden';
CREATE INDEX idx_chef_profiles_location ON public.chef_profiles (location) WHERE deleted_at IS NULL;

-- chef_portfolio_images
CREATE INDEX idx_portfolio_chef_sort ON public.chef_portfolio_images (chef_profile_id, sort_order)
  WHERE deleted_at IS NULL;

-- bookings
CREATE INDEX idx_bookings_family ON public.bookings (family_id, status, booking_date DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_chef ON public.bookings (chef_profile_id, status, booking_date DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_date ON public.bookings (booking_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_status ON public.bookings (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_payment_intent ON public.bookings (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- booking_status_history
CREATE INDEX idx_booking_history_booking ON public.booking_status_history (booking_id, created_at DESC);

-- reviews
CREATE INDEX idx_reviews_chef ON public.reviews (chef_profile_id, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_family ON public.reviews (family_id) WHERE deleted_at IS NULL;

-- favorites
CREATE INDEX idx_favorites_family ON public.favorites (family_id);
CREATE INDEX idx_favorites_chef ON public.favorites (chef_profile_id);

-- notifications
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, created_at DESC)
  WHERE read = false;

-- chef_documents
CREATE INDEX idx_chef_documents_chef_status ON public.chef_documents (chef_profile_id, status)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_chef_documents_pending ON public.chef_documents (status, submitted_at)
  WHERE deleted_at IS NULL AND status = 'pending';

-- chef_availability
CREATE INDEX idx_availability_chef_day ON public.chef_availability (chef_profile_id, day_of_week)
  WHERE deleted_at IS NULL;

-- launch_regions
CREATE INDEX idx_launch_regions_active ON public.launch_regions (is_active, state);

-- waitlist_signups
CREATE INDEX idx_waitlist_region ON public.waitlist_signups (region_id, role);
CREATE INDEX idx_waitlist_email ON public.waitlist_signups (lower(email));

-- interest_requests
CREATE INDEX idx_interest_state ON public.interest_requests (state, created_at DESC);

-- contact_messages
CREATE INDEX idx_contact_status ON public.contact_messages (status, created_at DESC);

-- blog_posts (public)
CREATE INDEX idx_blog_published ON public.blog_posts (published_at DESC)
  WHERE published = true AND deleted_at IS NULL;

-- stripe
CREATE INDEX idx_payments_booking ON public.payments (booking_id);
CREATE INDEX idx_payments_family ON public.payments (family_id);
CREATE INDEX idx_payments_status ON public.payments (status);
CREATE INDEX idx_stripe_events_unprocessed ON public.stripe_events (created_at)
  WHERE processed = false;
CREATE INDEX idx_subscriptions_chef ON public.subscriptions (chef_profile_id, status);

-- messaging
CREATE INDEX idx_conversations_family ON public.conversations (family_id, last_message_at DESC);
CREATE INDEX idx_conversations_chef ON public.conversations (chef_profile_id, last_message_at DESC);
CREATE INDEX idx_messages_conversation ON public.messages (conversation_id, created_at DESC)
  WHERE deleted_at IS NULL;
