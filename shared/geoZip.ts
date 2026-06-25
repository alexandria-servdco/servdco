/** Shared comma-list helpers for region ZIP / city fields. */

export function normalizeCityName(city: string): string {
  return city.trim().replace(/\s+/g, " ");
}

export function parseCommaList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function mergeUniqueZips(existing: string[], additions: string[]): string[] {
  const set = new Set(existing.map((z) => z.trim()).filter(Boolean));
  for (const zip of additions) {
    const normalized = zip.trim();
    if (/^\d{5}$/.test(normalized)) set.add(normalized);
  }
  return Array.from(set).sort();
}

export function formatCommaList(items: string[]): string {
  return items.join(", ");
}

export function isValidZipCode(zip: string): boolean {
  return /^\d{5}$/.test(zip.trim());
}

export function sanitizeZipInput(value: string): string {
  return parseCommaList(value)
    .filter(isValidZipCode)
    .join(", ");
}
