-- Realtime row filters on UPDATE/DELETE require REPLICA IDENTITY FULL.
-- Required for family/chef filtered postgres_changes subscriptions.

ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.chef_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.chef_documents REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER TABLE public.transfers REPLICA IDENTITY FULL;
