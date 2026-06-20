import { useBooking, useBookingHistory } from "@/hooks/useBookings";
import { BOOKING_STATUS_LABELS } from "@/lib/bookingTypes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type BookingDetailModalProps = {
  bookingId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h4 className="text-[10px] uppercase font-bold text-[#A8A8A8] tracking-wider">
        {title}
      </h4>
      {children}
    </section>
  );
}

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
      <DialogContent
        className={cn(
          "flex flex-col p-0 gap-0 overflow-hidden",
          "sm:max-w-2xl w-[calc(100vw-2rem)] max-h-[90vh]",
          "bg-[#161616] border border-white/10 text-white rounded-3xl",
        )}
      >
        {/* Sticky header */}
        <DialogHeader className="shrink-0 px-6 py-5 border-b border-white/8 bg-[#161616] space-y-1">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <DialogTitle className="font-serif text-xl text-left">
                Booking details
              </DialogTitle>
              <p className="text-xs text-[#A8A8A8] mt-1 font-mono">
                {bookingId}
              </p>
            </div>
            {booking && (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FF7A59]/15 text-[#FF7A59] border border-[#FF7A59]/25">
                {BOOKING_STATUS_LABELS[booking.status]}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Scrollable body only */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 servd-scrollbar">
          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-[#FF7A59]" size={28} />
            </div>
          )}

          {booking && (
            <div className="space-y-8 text-sm pb-2">
              <Section title="Participants">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-[#A8A8A8] text-xs mb-0.5">Family</dt>
                    <dd className="font-medium">{booking.family_name}</dd>
                  </div>
                  <div>
                    <dt className="text-[#A8A8A8] text-xs mb-0.5">Cook</dt>
                    <dd className="font-medium">{booking.chef_name}</dd>
                  </div>
                  <div>
                    <dt className="text-[#A8A8A8] text-xs mb-0.5">Phone</dt>
                    <dd>{booking.contact?.phone ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[#A8A8A8] text-xs mb-0.5">Email</dt>
                    <dd className="break-all">{booking.contact?.email ?? "—"}</dd>
                  </div>
                </dl>
              </Section>

              <Section title="Service">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-[#A8A8A8] text-xs mb-0.5">Type</dt>
                    <dd>{booking.service_type}</dd>
                  </div>
                  <div>
                    <dt className="text-[#A8A8A8] text-xs mb-0.5">Date</dt>
                    <dd>{booking.date}</dd>
                  </div>
                  <div>
                    <dt className="text-[#A8A8A8] text-xs mb-0.5">Time</dt>
                    <dd>
                      {booking.booking_time ?? "—"}
                      {booking.booking_end_time
                        ? ` – ${booking.booking_end_time}`
                        : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#A8A8A8] text-xs mb-0.5">Guests</dt>
                    <dd>{booking.guests_count ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[#A8A8A8] text-xs mb-0.5">Session rate</dt>
                    <dd className="text-[#FF7A59] font-bold">
                      ${booking.price.toFixed(2)}
                    </dd>
                  </div>
                  {(booking.family_platform_fee_cents ?? 0) > 0 && (
                    <>
                      <div>
                        <dt className="text-[#A8A8A8] text-xs mb-0.5">
                          Family platform fee
                        </dt>
                        <dd>
                          $
                          {(
                            (booking.family_platform_fee_cents ?? 0) / 100
                          ).toFixed(2)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[#A8A8A8] text-xs mb-0.5">
                          Total charged
                        </dt>
                        <dd className="font-bold">
                          $
                          {(
                            booking.price +
                            (booking.family_platform_fee_cents ?? 0) / 100
                          ).toFixed(2)}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </Section>

              {booking.address && (
                <Section title="Address">
                  <p className="leading-relaxed">
                    {booking.address.street_address}
                    {booking.address.apartment
                      ? `, ${booking.address.apartment}`
                      : ""}
                    <br />
                    {booking.address.city}, {booking.address.state}{" "}
                    {booking.address.zip}
                  </p>
                  {booking.address.location_notes && (
                    <p className="text-xs text-[#A8A8A8] mt-2">
                      {booking.address.location_notes}
                    </p>
                  )}
                </Section>
              )}

              {(booking.meal_request ||
                booking.ingredients_available ||
                booking.recipe_notes) && (
                <Section title="Meal request">
                  {booking.meal_request && <p>{booking.meal_request}</p>}
                  {booking.ingredients_available && (
                    <p className="text-xs text-[#A8A8A8] mt-2">
                      <span className="font-semibold text-white">
                        Ingredients on hand:
                      </span>{" "}
                      {booking.ingredients_available}
                    </p>
                  )}
                  {booking.recipe_notes && (
                    <p className="text-xs text-[#A8A8A8] mt-1">
                      <span className="font-semibold text-white">Notes:</span>{" "}
                      {booking.recipe_notes}
                    </p>
                  )}
                </Section>
              )}

              <Section title="Timeline">
                <ol className="space-y-2 text-xs">
                  {history.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex justify-between gap-4 border-b border-white/5 pb-2 last:border-0"
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
              </Section>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
