-- Prevent duplicate open checkout sessions per booking (race on double Pay click).

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_one_pending_per_booking
  ON public.payments (booking_id)
  WHERE status IN ('pending', 'processing') AND booking_id IS NOT NULL;
