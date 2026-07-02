export interface AvailabilitySlotLike {
  day: string;
  timeSlots: string[];
  recurring?: boolean;
}

export class AvailabilityValidationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AvailabilityValidationError";
    this.code = code;
  }
}

const MAX_SLOTS_PER_DAY = 6;
const MAX_DAYS_PER_WEEK = 7;

function parseSlotRange(slot: string): { start: number; end: number } | null {
  const match = slot.match(
    /(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i,
  );
  if (!match) return null;

  const toMinutes = (h: number, m: number, meridiem: string) => {
    let hour = h % 12;
    if (meridiem.toUpperCase() === "PM") hour += 12;
    return hour * 60 + m;
  };

  const start = toMinutes(Number(match[1]), Number(match[2]), match[3]);
  let end = toMinutes(Number(match[4]), Number(match[5]), match[6]);
  if (end <= start) end += 24 * 60;
  return { start, end };
}

function rangesOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number },
): boolean {
  return a.start < b.end && b.start < a.end;
}

export function validateAvailabilitySlots(
  slots: AvailabilitySlotLike[],
): void {
  if (slots.length > MAX_DAYS_PER_WEEK) {
    throw new AvailabilityValidationError(
      "MAX_DAYS",
      `Cannot exceed ${MAX_DAYS_PER_WEEK} days per week.`,
    );
  }

  const seenDays = new Set<string>();

  for (const slot of slots) {
    const dayKey = slot.day.toLowerCase();
    if (seenDays.has(dayKey)) {
      throw new AvailabilityValidationError(
        "DUPLICATE_DAY",
        `Duplicate day entry for ${slot.day}.`,
      );
    }
    seenDays.add(dayKey);

    if (slot.timeSlots.length > MAX_SLOTS_PER_DAY) {
      throw new AvailabilityValidationError(
        "MAX_SLOTS",
        `Cannot exceed ${MAX_SLOTS_PER_DAY} slots per day on ${slot.day}.`,
      );
    }

    const unique = new Set<string>();
    const parsed: Array<{ start: number; end: number; label: string }> = [];

    for (const time of slot.timeSlots) {
      const normalized = time.trim();
      if (!normalized) {
        throw new AvailabilityValidationError(
          "INVALID_RANGE",
          `Invalid time slot on ${slot.day}.`,
        );
      }
      if (unique.has(normalized)) {
        throw new AvailabilityValidationError(
          "DUPLICATE_SLOT",
          `${normalized} already exists on ${slot.day}.`,
        );
      }
      unique.add(normalized);

      const range = parseSlotRange(normalized);
      if (!range) {
        throw new AvailabilityValidationError(
          "INVALID_RANGE",
          `Invalid time range "${time}" on ${slot.day}.`,
        );
      }

      for (const existing of parsed) {
        if (rangesOverlap(range, existing)) {
          throw new AvailabilityValidationError(
            "OVERLAP",
            `${normalized} overlaps with ${existing.label} on ${slot.day}.`,
          );
        }
      }
      parsed.push({ ...range, label: normalized });
    }
  }
}

export function canAddAvailabilitySlot(
  slots: AvailabilitySlotLike[],
  day: string,
  timeSlot: string,
): { ok: true } | { ok: false; message: string; code: string } {
  const exist = slots.find((s) => s.day.toLowerCase() === day.toLowerCase());
  const next: AvailabilitySlotLike[] = exist
    ? slots.map((s) =>
        s.day.toLowerCase() === day.toLowerCase()
          ? { ...s, timeSlots: [...s.timeSlots, timeSlot] }
          : s,
      )
    : [...slots, { day, timeSlots: [timeSlot], recurring: true }];

  try {
    validateAvailabilitySlots(next);
    return { ok: true };
  } catch (err) {
    if (err instanceof AvailabilityValidationError) {
      return { ok: false, message: err.message, code: err.code };
    }
    return { ok: false, message: "Invalid availability slot.", code: "INVALID" };
  }
}
