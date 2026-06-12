/**
 * ServdCo booking pricing (client estimate; server stores booking.price_cents).
 *
 * Model: flat session base rate by service type (covers 1–4 guests).
 * Additional guests above 4: +$10 per guest.
 */
export type BookingServiceType = "breakfast" | "dinner" | "mealprep";

const BASE_RATES: Record<BookingServiceType, number> = {
  breakfast: 40,
  dinner: 60,
  mealprep: 70,
};

const INCLUDED_GUESTS = 4;
const EXTRA_GUEST_FEE = 10;

export function getBaseRate(serviceType: string): number {
  if (serviceType === "breakfast" || serviceType === "mealprep") {
    return BASE_RATES[serviceType];
  }
  return BASE_RATES.dinner;
}

export function calculateBookingPrice(
  serviceType: string,
  guestsCount: number,
): {
  baseRate: number;
  extraGuests: number;
  guestFee: number;
  totalCost: number;
  pricingNote: string;
} {
  const safeGuests = Math.max(1, Math.floor(guestsCount));
  const baseRate = getBaseRate(serviceType);
  const extraGuests = Math.max(0, safeGuests - INCLUDED_GUESTS);
  const guestFee = extraGuests * EXTRA_GUEST_FEE;
  const totalCost = baseRate + guestFee;

  const pricingNote =
    safeGuests <= INCLUDED_GUESTS
      ? `Session rate includes up to ${INCLUDED_GUESTS} guests.`
      : `+$${EXTRA_GUEST_FEE} per guest above ${INCLUDED_GUESTS}.`;

  return { baseRate, extraGuests, guestFee, totalCost, pricingNote };
}
