-- Cloudflare / Upstash security hardening
-- security_events table for admin dashboard + API logging

CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (
    event_type IN ('rate_limit', 'captcha_failure', 'blocked_request', 'suspicious_ip')
  ),
  route TEXT,
  ip_address TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS security_events_created_at_idx
  ON public.security_events (created_at DESC);

CREATE INDEX IF NOT EXISTS security_events_event_type_idx
  ON public.security_events (event_type);

CREATE INDEX IF NOT EXISTS security_events_ip_idx
  ON public.security_events (ip_address)
  WHERE ip_address IS NOT NULL;

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS security_events_admin_select ON public.security_events;
CREATE POLICY security_events_admin_select ON public.security_events
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- No INSERT/UPDATE/DELETE for authenticated users — API uses service role

COMMENT ON TABLE public.security_events IS
  'Security telemetry: rate limits, CAPTCHA failures, blocked requests (API service-role writes only).';
