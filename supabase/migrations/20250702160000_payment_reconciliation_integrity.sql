-- One succeeded payment per booking; duplicates flagged in metadata instead.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_one_succeeded_per_booking
  ON public.payments (booking_id)
  WHERE status = 'succeeded'
    AND COALESCE((metadata->>'duplicate')::boolean, false) = false;

CREATE INDEX IF NOT EXISTS idx_payments_stripe_checkout_session
  ON public.payments (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

COMMENT ON INDEX idx_payments_one_succeeded_per_booking IS
  'Prevents two primary succeeded payments for the same booking; duplicates use metadata.duplicate=true.';
