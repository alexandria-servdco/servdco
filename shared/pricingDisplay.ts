/**
 * Marketing / UI display helpers — derived from shared pricing constants only.
 */
import {
  BASE_RATES,
  INCLUDED_GUESTS,
  EXTRA_GUEST_FEE,
  type BookingServiceType,
} from "./pricing";

export function formatUsd(amount: number): string {
  return `$${amount}`;
}

export function getServiceDisplayName(type: BookingServiceType): string {
  const names: Record<BookingServiceType, string> = {
    breakfast: "Breakfast",
    dinner: "Dinner",
    mealprep: "Meal Prep",
  };
  return names[type];
}

export function getSessionSelectLabel(type: BookingServiceType): string {
  const labels: Record<BookingServiceType, string> = {
    breakfast: "Breakfast Cooking",
    dinner: "Dinner Dining",
    mealprep: "Weekly Meal Prep",
  };
  return `${labels[type]} (${formatUsd(BASE_RATES[type])})`;
}

export function getIncludedGuestsLabel(type: BookingServiceType): string {
  const n = INCLUDED_GUESTS[type];
  return n === 1 ? "1 person" : `Up to ${n} family members`;
}

export function getExtraGuestPricingSentence(): string {
  return `Breakfast and dinner include up to ${INCLUDED_GUESTS.breakfast} guests (+${formatUsd(EXTRA_GUEST_FEE.breakfast)} per additional guest). Meal prep includes ${INCLUDED_GUESTS.mealprep} guest (+${formatUsd(EXTRA_GUEST_FEE.mealprep)} per additional guest).`;
}

export interface PricingCardDisplay {
  type: BookingServiceType;
  title: string;
  price: string;
  duration: string;
  desc: string;
  features: string[];
  cta: string;
  popular: boolean;
}

export const PRICING_PAGE_CARDS: PricingCardDisplay[] = [
  {
    type: "breakfast",
    title: "Breakfast Booking",
    price: formatUsd(BASE_RATES.breakfast),
    duration: "per session",
    desc: "Wake up to fresh aromas. The cook handles custom breakfast preparation and complete kitchen reset.",
    features: [
      "Professional home cooking",
      "Travel to your home included",
      "Custom recipe planning",
      "Full basic kitchen cleanup",
      getIncludedGuestsLabel("breakfast"),
    ],
    cta: "Book Breakfast",
    popular: false,
  },
  {
    type: "dinner",
    title: "Dinner Dining",
    price: formatUsd(BASE_RATES.dinner),
    duration: "per session",
    desc: "Elevate your family evenings. Gourmet fresh cooking prepared and served directly at your dining table.",
    features: [
      "Professional home cooking",
      "Travel to your home included",
      "Gourmet customized menus",
      "Full basic kitchen cleanup",
      getIncludedGuestsLabel("dinner"),
      "Multi-course plating option",
    ],
    cta: "Book Dinner",
    popular: true,
  },
  {
    type: "mealprep",
    title: "Weekly Meal Prep",
    price: formatUsd(BASE_RATES.mealprep),
    duration: "per session",
    desc: "Get ahead of a busy week. Bulk custom meal preparation portioned and ready in your refrigerator.",
    features: [
      "Professional home cooking",
      "Travel to your home included",
      "Up to 5 custom recipe meals",
      "Tupperware portion pack support",
      "Full basic kitchen cleanup",
      "Ideal for performance diets",
    ],
    cta: "Book Meal Prep",
    popular: false,
  },
];

export const BOOKING_SERVICE_OPTIONS: { value: BookingServiceType; label: string }[] = (
  ["breakfast", "dinner", "mealprep"] as BookingServiceType[]
).map((type) => ({
  value: type,
  label: getSessionSelectLabel(type),
}));
