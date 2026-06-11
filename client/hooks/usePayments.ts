import { useQuery } from "@tanstack/react-query";
import { PaymentsSupabaseService, paymentQueryKeys } from "@/services/supabase/payments.service";
import { isStripeCheckoutEnabled } from "@/services/featureFlags.service";

/** Admin payment ledger — loads when Stripe checkout feature flag is on. */
export function useAdminPayments() {
  const { data: stripeEnabled = false } = useStripeCheckoutEnabled();

  return useQuery({
    queryKey: paymentQueryKeys.adminList(),
    queryFn: () => PaymentsSupabaseService.listAdminPayments(),
    enabled: stripeEnabled,
    refetchInterval: stripeEnabled ? 60_000 : false,
  });
}

export function useBookingPayment(bookingId: string | undefined) {
  return useQuery({
    queryKey: paymentQueryKeys.byBooking(bookingId ?? ""),
    queryFn: () => PaymentsSupabaseService.getByBookingId(bookingId!),
    enabled: Boolean(bookingId),
  });
}

export function useStripeCheckoutEnabled() {
  return useQuery({
    queryKey: ["feature_flags", "enable_stripe_checkout"],
    queryFn: () => isStripeCheckoutEnabled(),
    staleTime: 60_000,
  });
}
