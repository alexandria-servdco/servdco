/**
 * Alexandria-approved booking pricing (shared client + server validation).
 *
 * Breakfast / Dinner: base includes 4 guests, +$5 each above 4.
 * Meal Prep: base includes 1 guest, +$10 each above 1.
 */
export type BookingServiceType = "breakfast" | "dinner" | "mealprep";

const BASE_RATES: Record<BookingServiceType, number> = {
  breakfast: 40,
  dinner: 60,
  mealprep: 70,
};

export function normalizeBookingServiceType(value: string): BookingServiceType {
  const v = value.toLowerCase();
  if (v === "breakfast") return "breakfast";
  if (v === "mealprep" || v.includes("meal")) return "mealprep";
  return "dinner";
}

export function getBaseRate(serviceType: string): number {
  return BASE_RATES[normalizeBookingServiceType(serviceType)];
}

export interface SessionPriceBreakdown {
  serviceType: BookingServiceType;
  baseRate: number;
  includedGuests: number;
  extraGuests: number;
  extraFeePerGuest: number;
  guestFee: number;
  sessionTotal: number;
  pricingNote: string;
}

export function calculateSessionPrice(
  serviceType: string,
  guestsCount: number,
): SessionPriceBreakdown {
  const type = normalizeBookingServiceType(serviceType);
  const safeGuests = Math.max(1, Math.floor(guestsCount));
  const baseRate = BASE_RATES[type];

  const includedGuests = type === "mealprep" ? 1 : 4;
  const extraFeePerGuest = type === "mealprep" ? 10 : 5;
  const extraGuests = Math.max(0, safeGuests - includedGuests);
  const guestFee = extraGuests * extraFeePerGuest;
  const sessionTotal = baseRate + guestFee;

  const pricingNote =
    extraGuests === 0
      ? `Session rate includes up to ${includedGuests} guest${includedGuests === 1 ? "" : "s"}.`
      : `+$${extraFeePerGuest} per guest above ${includedGuests}.`;

  return {
    serviceType: type,
    baseRate,
    includedGuests,
    extraGuests,
    extraFeePerGuest,
    guestFee,
    sessionTotal,
    pricingNote,
  };
}

export function calculateFamilyTotalCharged(
  sessionTotal: number,
  familyPlatformFeeDollars: number,
): number {
  const fee = Math.max(0, familyPlatformFeeDollars);
  return Math.round((sessionTotal + fee) * 100) / 100;
}

export function sessionTotalToCents(sessionTotal: number): number {
  return Math.round(sessionTotal * 100);
}

export function familyFeeToCents(familyPlatformFeeDollars: number): number {
  return Math.round(Math.max(0, familyPlatformFeeDollars) * 100);
}

export function totalChargedCents(
  sessionTotal: number,
  familyPlatformFeeDollars: number,
): number {
  return sessionTotalToCents(sessionTotal) + familyFeeToCents(familyPlatformFeeDollars);
}

/** @deprecated Use calculateSessionPrice — kept for gradual migration */
export function calculateBookingPrice(serviceType: string, guestsCount: number) {
  const b = calculateSessionPrice(serviceType, guestsCount);
  return {
    baseRate: b.baseRate,
    extraGuests: b.extraGuests,
    guestFee: b.guestFee,
    totalCost: b.sessionTotal,
    pricingNote: b.pricingNote,
  };
}
