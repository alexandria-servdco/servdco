/**
 * Single source of truth for booking pricing (shared client + server validation).
 *
 * Breakfast / Dinner: base includes 4 guests, +$5 each above 4.
 * Meal Prep: base includes 1 guest, +$10 each above 1.
 */
export type BookingServiceType = "breakfast" | "dinner" | "mealprep";

/** Default platform economics — overridden at runtime by platform_settings. */
export const DEFAULT_PLATFORM_FEE_PERCENTAGE = 13;
export const DEFAULT_FAMILY_PLATFORM_FEE_DOLLARS = 5;

export const BASE_RATES: Record<BookingServiceType, number> = {
  breakfast: 40,
  dinner: 60,
  mealprep: 70,
};

export const INCLUDED_GUESTS: Record<BookingServiceType, number> = {
  breakfast: 4,
  dinner: 4,
  mealprep: 1,
};

export const EXTRA_GUEST_FEE: Record<BookingServiceType, number> = {
  breakfast: 5,
  dinner: 5,
  mealprep: 10,
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

  const includedGuests = INCLUDED_GUESTS[type];
  const extraFeePerGuest = EXTRA_GUEST_FEE[type];
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

export function splitSessionAmounts(
  sessionTotal: number,
  platformFeePercentage: number = DEFAULT_PLATFORM_FEE_PERCENTAGE,
): { platformFee: number; cookPayout: number } {
  const platformFee = parseFloat(
    ((sessionTotal * platformFeePercentage) / 100).toFixed(2),
  );
  const cookPayout = parseFloat((sessionTotal - platformFee).toFixed(2));
  return { platformFee, cookPayout };
}

export interface EstimateBookingFinancialsInput {
  mealType: string;
  guests: number;
  platformFeePercentage?: number;
  familyPlatformFeeDollars?: number;
  tipDollars?: number;
  travelFeeDollars?: number;
}

export interface BookingFinancialEstimate {
  basePrice: number;
  guestFees: number;
  subtotal: number;
  familyPlatformFee: number;
  familyTotal: number;
  platformFee: number;
  cookPayout: number;
  tipDollars: number;
  travelFeeDollars: number;
  breakdown: SessionPriceBreakdown;
}

/** Unified pricing estimator — used by checkout previews, calculators, and invoices. */
export function estimateBookingFinancials(
  input: EstimateBookingFinancialsInput,
): BookingFinancialEstimate {
  const breakdown = calculateSessionPrice(input.mealType, input.guests);
  const familyPlatformFee =
    input.familyPlatformFeeDollars ?? DEFAULT_FAMILY_PLATFORM_FEE_DOLLARS;
  const tipDollars = Math.max(0, input.tipDollars ?? 0);
  const travelFeeDollars = Math.max(0, input.travelFeeDollars ?? 0);
  const { platformFee, cookPayout } = splitSessionAmounts(
    breakdown.sessionTotal,
    input.platformFeePercentage ?? DEFAULT_PLATFORM_FEE_PERCENTAGE,
  );

  return {
    basePrice: breakdown.baseRate,
    guestFees: breakdown.guestFee,
    subtotal: breakdown.sessionTotal,
    familyPlatformFee,
    familyTotal: calculateFamilyTotalCharged(breakdown.sessionTotal, familyPlatformFee),
    platformFee,
    cookPayout,
    tipDollars,
    travelFeeDollars,
    breakdown,
  };
}

export interface SessionTypeEstimateInput {
  sessionsPerWeek: number;
  avgGuests: number;
}

export interface WeeklyCookEarningsInput {
  breakfast: SessionTypeEstimateInput;
  dinner: SessionTypeEstimateInput;
  mealprep: SessionTypeEstimateInput;
  platformFeePercentage?: number;
}

export interface WeeklyCookEarningsBreakdown {
  breakfastEarnings: number;
  dinnerEarnings: number;
  mealPrepEarnings: number;
  totalPlatformFee: number;
  weeklyPayout: number;
  monthlyEstimate: number;
  yearlyEstimate: number;
  perSession: {
    breakfast: BookingFinancialEstimate;
    dinner: BookingFinancialEstimate;
    mealprep: BookingFinancialEstimate;
  };
}

export function estimateWeeklyCookEarnings(
  input: WeeklyCookEarningsInput,
): WeeklyCookEarningsBreakdown {
  const feePct = input.platformFeePercentage ?? DEFAULT_PLATFORM_FEE_PERCENTAGE;

  const perSession = {
    breakfast: estimateBookingFinancials({
      mealType: "breakfast",
      guests: input.breakfast.avgGuests,
      platformFeePercentage: feePct,
    }),
    dinner: estimateBookingFinancials({
      mealType: "dinner",
      guests: input.dinner.avgGuests,
      platformFeePercentage: feePct,
    }),
    mealprep: estimateBookingFinancials({
      mealType: "mealprep",
      guests: input.mealprep.avgGuests,
      platformFeePercentage: feePct,
    }),
  };

  const breakfastEarnings =
    input.breakfast.sessionsPerWeek * perSession.breakfast.cookPayout;
  const dinnerEarnings =
    input.dinner.sessionsPerWeek * perSession.dinner.cookPayout;
  const mealPrepEarnings =
    input.mealprep.sessionsPerWeek * perSession.mealprep.cookPayout;

  const totalPlatformFee =
    input.breakfast.sessionsPerWeek * perSession.breakfast.platformFee +
    input.dinner.sessionsPerWeek * perSession.dinner.platformFee +
    input.mealprep.sessionsPerWeek * perSession.mealprep.platformFee;

  const weeklyPayout = breakfastEarnings + dinnerEarnings + mealPrepEarnings;

  return {
    breakfastEarnings: parseFloat(breakfastEarnings.toFixed(2)),
    dinnerEarnings: parseFloat(dinnerEarnings.toFixed(2)),
    mealPrepEarnings: parseFloat(mealPrepEarnings.toFixed(2)),
    totalPlatformFee: parseFloat(totalPlatformFee.toFixed(2)),
    weeklyPayout: parseFloat(weeklyPayout.toFixed(2)),
    monthlyEstimate: parseFloat((weeklyPayout * 4).toFixed(2)),
    yearlyEstimate: parseFloat((weeklyPayout * 52).toFixed(2)),
    perSession,
  };
}
