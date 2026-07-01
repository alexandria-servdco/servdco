-- Transfer retry scheduling and action-required status for payout pipeline resilience
-- NOTE: enum values (action_required, retry_scheduled) must be committed in a separate
-- transaction before this file runs — see scripts/apply-production-migration.mjs

ALTER TABLE public.transfers
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_retry_reason text;

DROP INDEX IF EXISTS idx_transfers_retry;

CREATE INDEX IF NOT EXISTS idx_transfers_retry
  ON public.transfers (status, next_retry_at)
  WHERE status IN ('failed', 'retry_scheduled', 'action_required') AND next_retry_at IS NOT NULL;

INSERT INTO public.platform_settings (key, value, description)
VALUES (
  'transfer_max_retry_count',
  '3'::jsonb,
  'Maximum automatic Stripe transfer retries before marking action required'
),
(
  'transfer_processing_timeout_minutes',
  '30'::jsonb,
  'Minutes before a stuck processing transfer can be admin-recovered'
)
ON CONFLICT (key) DO NOTHING;

COMMENT ON COLUMN public.transfers.retry_count IS
  'Number of automatic transfer retry attempts after a retryable failure.';
COMMENT ON COLUMN public.transfers.next_retry_at IS
  'When the cron should attempt the next automatic retry.';
