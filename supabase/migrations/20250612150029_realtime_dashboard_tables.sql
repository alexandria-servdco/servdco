-- Phase 1: enable Supabase Realtime for dashboard-critical tables.
-- RLS still applies — clients only receive events for rows they can read.

ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chef_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chef_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transfers;
