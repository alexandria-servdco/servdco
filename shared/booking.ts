/** Canonical booking status values — must match public.booking_status enum. */
export const BOOKING_STATUSES = [
  "pending",
  "accepted",
  "awaiting_payment",
  "confirmed",
  "en_route",
  "arrived",
  "cooking",
  "awaiting_family_confirmation",
  "completed",
  "cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Statuses at or after cook acceptance — contact/address may be revealed. */
export const CONTACT_ACCESS_STATUSES: BookingStatus[] = [
  "accepted",
  "awaiting_payment",
  "confirmed",
  "en_route",
  "arrived",
  "cooking",
  "awaiting_family_confirmation",
  "completed",
];

export function hasContactAccess(status: BookingStatus): boolean {
  return CONTACT_ACCESS_STATUSES.includes(status);
}

/** Allowed transitions keyed by current status. */
export const BOOKING_STATUS_TRANSITIONS: Record<
  BookingStatus,
  readonly BookingStatus[]
> = {
  pending: ["accepted", "awaiting_payment", "cancelled"],
  accepted: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["confirmed", "cancelled"],
  confirmed: ["en_route", "cancelled"],
  en_route: ["arrived", "cancelled"],
  arrived: ["cooking", "cancelled"],
  cooking: ["awaiting_family_confirmation", "cancelled"],
  awaiting_family_confirmation: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransition(
  from: BookingStatus,
  to: BookingStatus,
): boolean {
  return BOOKING_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Cook accept — family pays while status is accepted or awaiting_payment. */
export const COOK_ACCEPT_TARGET: BookingStatus = "accepted";

/** Timeline steps for family progress UI. */
export const BOOKING_TIMELINE_STEPS = [
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "paid", label: "Paid" },
  { key: "en_route", label: "En Route" },
  { key: "arrived", label: "Arrived" },
  { key: "cooking", label: "Cooking" },
  { key: "awaiting_family_confirmation", label: "Awaiting Confirmation" },
  { key: "completed", label: "Completed" },
] as const;

export function timelineStepIndex(status: BookingStatus): number {
  switch (status) {
    case "pending":
      return 0;
    case "accepted":
    case "awaiting_payment":
      return 1;
    case "confirmed":
      return 2;
    case "en_route":
      return 3;
    case "arrived":
      return 4;
    case "cooking":
      return 5;
    case "awaiting_family_confirmation":
      return 6;
    case "completed":
      return 7;
    default:
      return -1;
  }
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone?.trim()) return "•••-•••-••••";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "•••-•••-••••";
  return `•••-•••-${digits.slice(-4)}`;
}

export function maskEmail(email: string | null | undefined): string {
  if (!email?.trim()) return "•••@•••.com";
  const [local, domain] = email.split("@");
  if (!domain) return "•••@•••.com";
  const maskedLocal =
    local.length <= 1 ? "•" : `${local[0]}${"•".repeat(Math.min(local.length - 1, 5))}`;
  return `${maskedLocal}@${domain}`;
}

export function maskStreet(street: string | null | undefined): string {
  if (!street?.trim()) return "Address hidden until accepted";
  return "••• ••• •••";
}

/** Completed bookings use booking status only — payment/refund state is reflected via status. */
export function isCompletedBookingStatus(status: string): boolean {
  return status === "completed";
}

export function countCompletedBookings<
  T extends { status: string; chef_profile_id?: string | null },
>(bookings: readonly T[], chefProfileId?: string): number {
  return bookings.filter(
    (b) =>
      isCompletedBookingStatus(b.status) &&
      (chefProfileId == null || b.chef_profile_id === chefProfileId),
  ).length;
}

export function completedBookingsCountByChef<
  T extends { status: string; chef_profile_id?: string | null },
>(bookings: readonly T[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const booking of bookings) {
    if (!isCompletedBookingStatus(booking.status) || !booking.chef_profile_id) {
      continue;
    }
    const chefId = booking.chef_profile_id;
    counts.set(chefId, (counts.get(chefId) ?? 0) + 1);
  }
  return counts;
}
