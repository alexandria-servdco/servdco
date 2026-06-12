import { useBooking, useBookingHistory } from "@/hooks/useBookings";
import { BOOKING_STATUS_LABELS } from "@/lib/bookingTypes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

type BookingDetailModalProps = {
  bookingId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BookingDetailModal({
  bookingId,
  open,
  onOpenChange,
}: BookingDetailModalProps) {
  const { data: booking, isLoading } = useBooking(bookingId ?? undefined);
  const { data: history = [] } = useBookingHistory(bookingId ?? undefined);

  if (!bookingId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-[#161616] border border-white/10 text-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Booking {bookingId.slice(0, 8)}…
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-[#FF7A59]" />
          </div>
        )}

        {booking && (
          <div className="space-y-6 text-sm">
            <section>
              <h4 className="text-[10px] uppercase font-bold text-[#A8A8A8] mb-2">
                Participants
              </h4>
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-[#A8A8A8] text-xs">Family</dt>
                  <dd>{booking.family_name}</dd>
                </div>
                <div>
                  <dt className="text-[#A8A8A8] text-xs">Cook</dt>
                  <dd>{booking.chef_name}</dd>
                </div>
                <div>
                  <dt className="text-[#A8A8A8] text-xs">Phone</dt>
                  <dd>{booking.contact?.phone ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#A8A8A8] text-xs">Email</dt>
                  <dd>{booking.contact?.email ?? "—"}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h4 className="text-[10px] uppercase font-bold text-[#A8A8A8] mb-2">
                Service
              </h4>
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-[#A8A8A8] text-xs">Type</dt>
                  <dd>{booking.service_type}</dd>
                </div>
                <div>
                  <dt className="text-[#A8A8A8] text-xs">Date</dt>
                  <dd>{booking.date}</dd>
                </div>
                <div>
                  <dt className="text-[#A8A8A8] text-xs">Time</dt>
                  <dd>
                    {booking.booking_time ?? "—"}
                    {booking.booking_end_time
                      ? ` – ${booking.booking_end_time}`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#A8A8A8] text-xs">Guests</dt>
                  <dd>{booking.guests_count ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#A8A8A8] text-xs">Amount</dt>
                  <dd className="text-[#FF7A59] font-bold">
                    ${booking.price.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#A8A8A8] text-xs">Status</dt>
                  <dd>{BOOKING_STATUS_LABELS[booking.status]}</dd>
                </div>
              </dl>
            </section>

            {booking.address && (
              <section>
                <h4 className="text-[10px] uppercase font-bold text-[#A8A8A8] mb-2">
                  Address
                </h4>
                <p>
                  {booking.address.street_address}
                  {booking.address.apartment
                    ? `, ${booking.address.apartment}`
                    : ""}
                  <br />
                  {booking.address.city}, {booking.address.state}{" "}
                  {booking.address.zip}
                </p>
                {booking.address.location_notes && (
                  <p className="text-xs text-[#A8A8A8] mt-1">
                    {booking.address.location_notes}
                  </p>
                )}
              </section>
            )}

            {(booking.special_instructions ||
              booking.allergies ||
              booking.parking_instructions ||
              booking.gate_code ||
              booking.emergency_contact_name) && (
              <section>
                <h4 className="text-[10px] uppercase font-bold text-[#A8A8A8] mb-2">
                  Instructions & Safety
                </h4>
                <ul className="text-xs space-y-1 text-[#CFCFCF]">
                  {booking.special_instructions && (
                    <li>Instructions: {booking.special_instructions}</li>
                  )}
                  {booking.allergies && (
                    <li>Allergies: {booking.allergies}</li>
                  )}
                  {booking.parking_instructions && (
                    <li>Parking: {booking.parking_instructions}</li>
                  )}
                  {booking.gate_code && (
                    <li>Gate code: {booking.gate_code}</li>
                  )}
                  {booking.emergency_contact_name && (
                    <li>
                      Emergency: {booking.emergency_contact_name}
                      {booking.emergency_contact_phone
                        ? ` (${booking.emergency_contact_phone})`
                        : ""}
                    </li>
                  )}
                </ul>
              </section>
            )}

            <section>
              <h4 className="text-[10px] uppercase font-bold text-[#A8A8A8] mb-2">
                Payment
              </h4>
              <p className="text-xs text-[#A8A8A8]">
                Payment ID: {booking.payment_id ?? "—"}
              </p>
            </section>

            <section>
              <h4 className="text-[10px] uppercase font-bold text-[#A8A8A8] mb-2">
                Timeline
              </h4>
              <ol className="space-y-2 text-xs">
                {history.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex justify-between gap-4 border-b border-white/5 pb-2"
                  >
                    <span>
                      {entry.from_status
                        ? `${entry.from_status} → ${entry.to_status}`
                        : entry.to_status}
                    </span>
                    <span className="text-[#A8A8A8] shrink-0">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
                {history.length === 0 && (
                  <li className="text-[#A8A8A8]">No history recorded.</li>
                )}
              </ol>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
