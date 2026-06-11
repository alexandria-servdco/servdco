/** Core booking record shape (Supabase-backed). */
export interface BookingRecord {
  id: string;
  family_name: string;
  chef_name: string;
  service_type: string;
  date: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  price: number;
  created_at: string;
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
}

export function mapDbBookingToUi(row: {
  id: string;
  family_id: string;
  chef_profile_id: string;
  service_type: string;
  booking_date: string;
  guests_count: number;
  price_cents: number;
  status: UiBooking["status"];
  created_at: string;
  chef_name?: string | null;
  family_name?: string | null;
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
