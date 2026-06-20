import type { BookingStatus } from "@shared/booking";
import type { BookingEmailEvent } from "@/services/email.service";
import { EmailService } from "@/services/email.service";

const STATUS_TO_EVENTS: Partial<Record<BookingStatus, BookingEmailEvent[]>> = {
  accepted: ["booking_accepted", "payment_required"],
  en_route: ["cook_en_route"],
  arrived: ["cook_arrived"],
  cooking: ["cooking_started"],
  awaiting_family_confirmation: ["cooking_completed", "family_confirmation_required"],
  completed: ["booking_completed"],
};

export function dispatchBookingStatusEmails(
  bookingId: string,
  nextStatus: BookingStatus,
): void {
  const events = STATUS_TO_EVENTS[nextStatus];
  if (!events?.length) return;
  for (const event of events) {
    void EmailService.sendBookingEvent(bookingId, event);
  }
}
