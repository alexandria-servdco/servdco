import type { UiBooking } from "@/lib/bookingTypes";
import { BOOKING_STATUS_LABELS } from "@/lib/bookingTypes";
import type { BookingStatus } from "@shared/booking";
import { BookingProgressTimeline } from "@/components/booking/BookingProgressTimeline";
import { BookingMessaging } from "@/components/messaging/BookingMessaging";
import {
  useCookAcceptBooking,
  useCookRejectBooking,
  useCookProgressBooking,
  useFamilyCancelBooking,
  useFamilyConfirmCompletion,
} from "@/hooks/useBookings";
import { useStripeCheckoutEnabled } from "@/hooks/usePayments";
import { StripeService } from "@/services/stripe.service";
import { MapPin, Phone, Mail, Users, Clock, AlertCircle } from "lucide-react";

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
  const acceptBooking = useCookAcceptBooking();
  const rejectBooking = useCookRejectBooking();
  const progressBooking = useCookProgressBooking();
  const cancelBooking = useFamilyCancelBooking();
  const confirmCompletion = useFamilyConfirmCompletion();
  const { data: stripeEnabled = false } = useStripeCheckoutEnabled();

  const handlePay = async () => {
    const origin = window.location.origin;
    const checkout = await StripeService.createCheckoutSession({
      bookingId: booking.id,
      successUrl: `${origin}/family-dashboard/bookings?booking=success`,
      cancelUrl: `${origin}/family-dashboard/bookings?booking=payment_cancelled`,
    });
    window.location.href = checkout.url;
  };

  const nextCookAction = COOK_NEXT[booking.status];

  return (
    <div className="space-y-4 border-t border-white/5 pt-4">
      <BookingProgressTimeline status={booking.status} />

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

      {booking.special_instructions && (
        <p className="text-xs text-[#A8A8A8]">
          <span className="font-bold text-white">Instructions: </span>
          {booking.special_instructions}
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
          (booking.status === "accepted" ||
            booking.status === "awaiting_payment") && (
            <button
              type="button"
              onClick={handlePay}
              className="px-4 py-2 bg-[#FF7A59] hover:bg-[#e96a49] text-white text-[11px] font-bold rounded-xl"
            >
              Pay Now
            </button>
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
