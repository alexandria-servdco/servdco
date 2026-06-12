-- Phase 6 — booking_status enum extensions (must run in isolation before use)
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'awaiting_payment';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'en_route';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'arrived';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'cooking';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'awaiting_family_confirmation';
