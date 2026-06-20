-- Phase 2 — Alexandria feedback: meal request fields, family platform fee, contact subject.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS meal_request text,
  ADD COLUMN IF NOT EXISTS ingredients_available text,
  ADD COLUMN IF NOT EXISTS recipe_notes text,
  ADD COLUMN IF NOT EXISTS family_platform_fee_cents integer NOT NULL DEFAULT 0;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_family_platform_fee_nonneg
  CHECK (family_platform_fee_cents >= 0);

COMMENT ON COLUMN public.bookings.meal_request IS 'Required: what meal the family wants prepared.';
COMMENT ON COLUMN public.bookings.ingredients_available IS 'Optional: ingredients family already has on hand.';
COMMENT ON COLUMN public.bookings.recipe_notes IS 'Optional: recipe or preparation notes.';
COMMENT ON COLUMN public.bookings.family_platform_fee_cents IS 'Fixed family-side platform fee charged at checkout (cents).';

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS subject text;

INSERT INTO public.platform_settings (key, value, description)
VALUES (
  'family_platform_fee_dollars',
  '5',
  'Fixed fee charged to families per booking (USD dollars)'
)
ON CONFLICT (key) DO NOTHING;
