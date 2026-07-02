import { useState } from "react";
import type { UiBooking } from "@/lib/bookingTypes";
import { BOOKING_STATUS_LABELS } from "@/lib/bookingTypes";
import type { BookingStatus } from "@shared/booking";
import { resolveBookingPaymentStatus } from "@shared/bookingPaymentStatus";
import { BookingProgressTimeline } from "@/components/booking/BookingProgressTimeline";
import { BookingMessaging } from "@/components/messaging/BookingMessaging";
import {
  useCookAcceptBooking,
  useCookRejectBooking,
  useCookProgressBooking,
  useFamilyCancelBooking,
  useFamilyConfirmCompletion,
} from "@/hooks/useBookings";
import { useStripeCheckoutEnabled, useBookingPayment } from "@/hooks/usePayments";
import { StripeService } from "@/services/stripe.service";
import { bookingQueryKeys } from "@/services/supabase/bookings.service";
import { paymentQueryKeys } from "@/services/supabase/payments.service";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Phone, Mail, Users, Clock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BookingOperationalPanelProps {
  booking: UiBooking;
  role: "family" | "chef";
}

const COOK_NEXT: Partial<Record<BookingStatus, { label: string; status: BookingStatus }>> = {
  confirmed: { label: "Mark En Route", status: "en_route" },
  en_route: { label: "Mark Arrived", status: "arrived" },
  arrived: { label: "Start Cooking", status: "cooking" },
  cooking: { label: "Mark Completed", status: "awaiting_family_confirmation" },
};

export function BookingOperationalPanel({
  booking,
  role,
}: BookingOperationalPanelProps) {
  const queryClient = useQueryClient();
  const acceptBooking = useCookAcceptBooking();
  const rejectBooking = useCookRejectBooking();
  const progressBooking = useCookProgressBooking();
  const cancelBooking = useFamilyCancelBooking();
  const confirmCompletion = useFamilyConfirmCompletion();
  const { data: stripeEnabled = false } = useStripeCheckoutEnabled();
  const { data: payments = [] } = useBookingPayment(booking.id);
  const [paying, setPaying] = useState(false);

  const paymentStatus = resolveBookingPaymentStatus({
    bookingStatus: booking.status,
    payments: payments.map((p) => ({
      id: p.id,
      status: p.status,
      stripe_payment_intent_id: p.stripe_payment_intent_id,
      stripe_checkout_session_id: p.stripe_checkout_session_id,
      metadata: p.metadata,
    })),
  });

  const handlePay = async () => {
    if (paying || !paymentStatus.canCreateCheckout) return;
    setPaying(true);
    try {
      const origin = window.location.origin;
      const checkout = await StripeService.createCheckoutSession({
        bookingId: booking.id,
        successUrl: `${origin}/family-dashboard/bookings?booking=success&bookingId=${booking.id}`,
        cancelUrl: `${origin}/family-dashboard/bookings?booking=payment_cancelled`,
      });
      window.location.href = checkout.url;
    } catch (err) {
      const error = err as Error & { code?: string; status?: number };
      if (error.code === "ALREADY_PAID" || error.status === 409) {
        try {
          const result = await StripeService.reconcileBookingPayment(booking.id);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all }),
            queryClient.invalidateQueries({
              queryKey: paymentQueryKeys.byBooking(booking.id),
            }),
          ]);
          if (result.bookingConfirmed) {
            toast.success("Payment already received — booking confirmed.");
          } else {
            toast.info("This booking is already paid.");
          }
        } catch (reconcileErr) {
          toast.error(
            reconcileErr instanceof Error
              ? reconcileErr.message
              : "Could not verify payment status.",
          );
        }
      } else {
        toast.error(error.message ?? "Could not start checkout.");
      }
    } finally {
      setPaying(false);
    }
  };

  const nextCookAction = COOK_NEXT[booking.status];

  return (
    <div className="space-y-4 border-t border-white/5 pt-4">
      <BookingProgressTimeline status={booking.status} />

      {paymentStatus.showPaidBadge && role === "family" && (
        <div className="flex items-center gap-2 rounded-xl border border-[#2E7D66]/30 bg-[#2E7D66]/10 px-3 py-2">
          <CheckCircle2 size={16} className="text-[#2E7D66]" />
          <span className="text-xs font-bold text-[#2E7D66]">{paymentStatus.label}</span>
          <span className="text-[10px] text-[#A8A8A8]">{paymentStatus.description}</span>
        </div>
      )}

      {paymentStatus.status === "duplicate_payment" && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">{paymentStatus.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#A8A8A8]">
          <Users size={12} className="text-[#FF7A59]" />
          <span>{booking.guests_count ?? "—"} guests</span>
        </div>
        {booking.booking_time && (
          <div className="flex items-center gap-2 text-[#A8A8A8]">
            <Clock size={12} className="text-[#FF7A59]" />
            <span>
              {booking.booking_time}
              {booking.booking_end_time ? ` – ${booking.booking_end_time}` : ""}
            </span>
          </div>
        )}
        {booking.address_preview && (
          <div className="flex items-center gap-2 text-[#A8A8A8] sm:col-span-2">
            <MapPin size={12} className="text-[#FF7A59]" />
            <span>
              {booking.contact?.masked
                ? `${booking.address_preview.city}, ${booking.address_preview.state}`
                : [
                    booking.address?.street_address,
                    booking.address?.apartment,
                    `${booking.address_preview.city}, ${booking.address_preview.state}`,
                    booking.address?.zip,
                  ]
                    .filter(Boolean)
                    .join(", ")}
            </span>
          </div>
        )}
        {role === "chef" && booking.contact && (
          <>
            <div className="flex items-center gap-2 text-[#A8A8A8]">
              <Phone size={12} className="text-[#FF7A59]" />
              <span>{booking.contact.phone ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-[#A8A8A8]">
              <Mail size={12} className="text-[#FF7A59]" />
              <span>{booking.contact.email ?? "—"}</span>
            </div>
          </>
        )}
      </div>

      {booking.meal_request && (
        <div className="rounded-xl bg-[#161616] border border-white/5 p-3 space-y-1">
          <p className="text-[10px] uppercase font-bold text-[#FF7A59] tracking-wider">
            Meal request
          </p>
          <p className="text-xs text-white">{booking.meal_request}</p>
          {booking.ingredients_available && (
            <p className="text-xs text-[#A8A8A8]">
              <span className="font-semibold text-white">On hand: </span>
              {booking.ingredients_available}
            </p>
          )}
          {booking.recipe_notes && (
            <p className="text-xs text-[#A8A8A8]">
              <span className="font-semibold text-white">Notes: </span>
              {booking.recipe_notes}
            </p>
          )}
        </div>
      )}

      {booking.special_instructions && (
        <p className="text-xs text-[#A8A8A8]">
          <span className="font-bold text-white">Instructions: </span>
          {booking.special_instructions}
        </p>
      )}

      {(booking.family_platform_fee_cents ?? 0) > 0 && role === "family" && (
        <p className="text-xs text-[#A8A8A8]">
          Session ${booking.price.toFixed(2)} + family platform fee $
          {((booking.family_platform_fee_cents ?? 0) / 100).toFixed(2)} ={" "}
          <span className="font-bold text-white">
            $
            {(
              booking.price +
              (booking.family_platform_fee_cents ?? 0) / 100
            ).toFixed(2)}
          </span>
        </p>
      )}

      {booking.contact?.masked && role === "chef" && (
        <p className="text-[10px] text-[#A8A8A8] flex items-center gap-1">
          <AlertCircle size={10} />
          Contact details and full address unlock after you accept.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {role === "chef" && booking.status === "pending" && (
          <>
            <button
              type="button"
              disabled={acceptBooking.isPending}
              onClick={() => acceptBooking.mutate(booking.id)}
              className="px-4 py-2 bg-[#FF7A59] hover:bg-[#e96a49] text-white text-[11px] font-bold rounded-xl"
            >
              Accept Request
            </button>
            <button
              type="button"
              disabled={rejectBooking.isPending}
              onClick={() => rejectBooking.mutate({ bookingId: booking.id })}
              className="px-4 py-2 bg-white/5 border border-white/10 text-white text-[11px] font-bold rounded-xl"
            >
              Reject Request
            </button>
          </>
        )}

        {role === "chef" && nextCookAction && (
          <button
            type="button"
            disabled={progressBooking.isPending}
            onClick={() =>
              progressBooking.mutate({
                bookingId: booking.id,
                currentStatus: booking.status,
                nextStatus: nextCookAction.status,
              })
            }
            className="px-4 py-2 bg-[#2E7D66] hover:bg-[#256b58] text-white text-[11px] font-bold rounded-xl"
          >
            {nextCookAction.label}
          </button>
        )}

        {role === "family" &&
          stripeEnabled &&
          paymentStatus.showPayNow && (
            <button
              type="button"
              disabled={paying}
              onClick={() => void handlePay()}
              className="px-4 py-2 bg-[#FF7A59] hover:bg-[#e96a49] text-white text-[11px] font-bold rounded-xl disabled:opacity-60 inline-flex items-center gap-2"
            >
              {paying ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Processing…
                </>
              ) : (
                "Pay Now"
              )}
            </button>
          )}

        {role === "family" &&
          paymentStatus.status === "payment_processing" && (
            <span className="text-xs text-[#FF7A59] inline-flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" />
              Payment processing…
            </span>
          )}

        {role === "family" &&
          booking.status === "awaiting_family_confirmation" && (
            <button
              type="button"
              disabled={confirmCompletion.isPending}
              onClick={() => confirmCompletion.mutate(booking.id)}
              className="px-4 py-2 bg-[#2E7D66] hover:bg-[#256b58] text-white text-[11px] font-bold rounded-xl"
            >
              Confirm Completion
            </button>
          )}

        {role === "family" &&
          booking.status !== "cancelled" &&
          booking.status !== "completed" &&
          booking.status !== "awaiting_family_confirmation" && (
            <button
              type="button"
              disabled={cancelBooking.isPending}
              onClick={() =>
                cancelBooking.mutate({
                  bookingId: booking.id,
                  currentStatus: booking.status,
                })
              }
              className="text-red-400 hover:text-red-300 text-[11px] font-bold hover:underline"
            >
              Cancel
            </button>
          )}
      </div>

      {booking.status !== "cancelled" && (
        <BookingMessaging bookingId={booking.id} />
      )}

      <p className="text-[9px] text-[#A8A8A8] uppercase tracking-wider font-bold">
        Status: {BOOKING_STATUS_LABELS[booking.status]}
      </p>
    </div>
  );
}
