/** Geo ZIP helpers for API launch control (mirrors shared/geoZip.ts). */

export function normalizeCityName(city: string): string {
  return city.trim().replace(/\s+/g, " ");
}

export function parseCommaList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isValidZipCode(zip: string): boolean {
  return /^\d{5}$/.test(zip.trim());
}
