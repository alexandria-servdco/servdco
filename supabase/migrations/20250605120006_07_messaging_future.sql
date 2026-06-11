-- =============================================================================
-- ServdCo Phase 2 — Messaging (future-ready, not wired to frontend)
-- =============================================================================

CREATE TABLE public.conversations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       uuid UNIQUE REFERENCES public.bookings (id) ON DELETE SET NULL,
  family_id        uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  chef_profile_id  uuid NOT NULL REFERENCES public.chef_profiles (id) ON DELETE CASCADE,
  last_message_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  archived_at      timestamptz,

  CONSTRAINT conversations_participants_unique UNIQUE (family_id, chef_profile_id, booking_id)
);

CREATE TABLE public.messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  sender_id        uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body             text NOT NULL,
  status           public.message_status NOT NULL DEFAULT 'sent',
  metadata         jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  read_at          timestamptz,
  deleted_at       timestamptz
);

COMMENT ON TABLE public.conversations IS
  'Future in-app messaging between family and cook. Phase 4+.';
