import type { BookingStatus } from "@shared/booking";
import {
  hasContactAccess,
  maskEmail,
  maskPhone,
  maskStreet,
} from "@shared/booking";

export type { BookingStatus };

/** Core booking record shape (Supabase-backed). */
export interface BookingRecord {
  id: string;
  family_name: string;
  chef_name: string;
  service_type: string;
  date: string;
  status: BookingStatus;
  price: number;
  created_at: string;
}

export interface BookingAddress {
  id?: string;
  booking_id?: string;
  street_address: string;
  apartment?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  location_notes?: string | null;
}

export interface BookingContactInfo {
  family_name: string;
  phone: string | null;
  email: string | null;
  masked: boolean;
}

/** UI booking shape — supports snake_case (admin) and camelCase (dashboards). */
export interface UiBooking extends BookingRecord {
  family?: string;
  chefName?: string;
  serviceType?: string;
  mealPlan?: string;
  guests_count?: number;
  chef_profile_id?: string;
  family_id?: string;
  booking_time?: string | null;
  booking_end_time?: string | null;
  special_instructions?: string | null;
  dietary_restrictions?: string[];
  allergies?: string | null;
  parking_instructions?: string | null;
  gate_code?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  family_confirmed_at?: string | null;
  address?: BookingAddress | null;
  address_preview?: { city: string; state: string } | null;
  contact?: BookingContactInfo | null;
  payment_id?: string | null;
}

export interface BookingStatusHistoryEntry {
  id: string;
  booking_id: string;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  changed_by: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function mapDbBookingToUi(row: {
  id: string;
  family_id: string;
  chef_profile_id: string;
  service_type: string;
  booking_date: string;
  booking_time?: string | null;
  booking_end_time?: string | null;
  guests_count: number;
  price_cents: number;
  status: BookingStatus;
  created_at: string;
  chef_name?: string | null;
  family_name?: string | null;
  special_instructions?: string | null;
  dietary_restrictions?: string[] | null;
  allergies?: string | null;
  parking_instructions?: string | null;
  gate_code?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  family_confirmed_at?: string | null;
  payment_id?: string | null;
  address?: BookingAddress | null;
  contact?: { full_name?: string | null; phone?: string | null; email?: string | null } | null;
}): UiBooking {
  const chefName = row.chef_name ?? "Cook";
  const familyName = row.family_name ?? "Family";
  const serviceLabel =
    row.service_type === "mealprep"
      ? "Meal Prep"
      : row.service_type === "breakfast"
        ? "Breakfast"
        : "Dinner";
  const price = Math.round(row.price_cents) / 100;
  const contactAccess = hasContactAccess(row.status);

  let address: BookingAddress | null = row.address ?? null;
  let addressPreview: { city: string; state: string } | null = null;
  if (address) {
    if (contactAccess) {
      addressPreview = { city: address.city, state: address.state };
    } else {
      addressPreview = { city: address.city, state: address.state };
      address = {
        ...address,
        street_address: maskStreet(address.street_address),
        apartment: null,
        zip: "•••••",
        location_notes: null,
      };
    }
  }

  const contact: BookingContactInfo | null = row.contact
    ? {
        family_name: familyName,
        phone: contactAccess
          ? row.contact.phone ?? null
          : maskPhone(row.contact.phone),
        email: contactAccess
          ? row.contact.email ?? null
          : maskEmail(row.contact.email),
        masked: !contactAccess,
      }
    : null;

  return {
    id: row.id,
    family_name: familyName,
    chef_name: chefName,
    family: familyName,
    chefName,
    service_type: serviceLabel,
    serviceType: serviceLabel,
    date: row.booking_date,
    status: row.status,
    price,
    guests_count: row.guests_count,
    mealPlan: `${serviceLabel} for ${row.guests_count}`,
    created_at: row.created_at,
    chef_profile_id: row.chef_profile_id,
    family_id: row.family_id,
    booking_time: row.booking_time ?? null,
    booking_end_time: row.booking_end_time ?? null,
    special_instructions: contactAccess ? row.special_instructions ?? null : null,
    dietary_restrictions: contactAccess ? row.dietary_restrictions ?? [] : [],
    allergies: contactAccess ? row.allergies ?? null : null,
    parking_instructions: contactAccess ? row.parking_instructions ?? null : null,
    gate_code: contactAccess ? row.gate_code ?? null : null,
    emergency_contact_name: contactAccess ? row.emergency_contact_name ?? null : null,
    emergency_contact_phone: contactAccess ? row.emergency_contact_phone ?? null : null,
    family_confirmed_at: row.family_confirmed_at ?? null,
    payment_id: row.payment_id ?? null,
    address,
    address_preview: addressPreview,
    contact,
  };
}

export function normalizeServiceType(
  value: string,
): "breakfast" | "dinner" | "mealprep" {
  const v = value.toLowerCase();
  if (v === "breakfast") return "breakfast";
  if (v === "mealprep" || v.includes("meal")) return "mealprep";
  return "dinner";
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  awaiting_payment: "Awaiting Payment",
  confirmed: "Confirmed",
  en_route: "En Route",
  arrived: "Arrived",
  cooking: "Cooking",
  awaiting_family_confirmation: "Awaiting Confirmation",
  completed: "Completed",
  cancelled: "Cancelled",
};
