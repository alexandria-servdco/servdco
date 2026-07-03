/** Safe date formatting — rejects invalid / far-future years from bad DB data. */

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

function isValidYear(year: number): boolean {
  return year >= MIN_YEAR && year <= MAX_YEAR;
}

/** Parse booking_date (YYYY-MM-DD, ISO, or legacy strings) for display. */
export function formatBookingDisplayDate(
  dateInput: string | null | undefined,
  fallbackIso?: string | null,
): string {
  if (!dateInput?.trim()) {
    return fallbackIso ? formatIsoDate(fallbackIso) : "—";
  }

  const raw = dateInput.trim();

  // ISO date YYYY-MM-DD
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    if (isValidYear(year)) {
      return new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T12:00:00`).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric", year: "numeric" },
      );
    }
  }

  // Already human-readable (contains letters)
  if (/[a-zA-Z]/.test(raw) && !raw.includes("5588")) {
    return raw;
  }

  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    if (isValidYear(d.getFullYear())) {
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  return fallbackIso ? formatIsoDate(fallbackIso) : raw;
}

export function formatBookingDateTime(
  dateInput: string | null | undefined,
  timeInput?: string | null,
  fallbackIso?: string | null,
): string {
  const datePart = formatBookingDisplayDate(dateInput, fallbackIso);
  const timePart = formatBookingTime(timeInput);
  if (timePart === "—") return datePart;
  return `${datePart}, ${timePart}`;
}

export function formatIsoDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || !isValidYear(d.getFullYear())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format HH:MM:SS or HH:MM to 12-hour display. */
export function formatBookingTime(time: string | null | undefined): string {
  if (!time?.trim()) return "—";
  const parts = time.trim().split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1] ?? 0);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatBookingTimeRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start) return "—";
  if (!end) return formatBookingTime(start);
  return `${formatBookingTime(start)} – ${formatBookingTime(end)}`;
}
