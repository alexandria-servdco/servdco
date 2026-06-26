/** US states + major cities for signup/booking address validation. */

import { citiesAvailableForState } from "@/lib/zip-codes-by-city";

export const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

/** Major cities per state code — expandable over time. */
export const US_CITIES_BY_STATE: Record<string, string[]> = {
  OH: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton"],
  FL: ["Miami", "Orlando", "Tampa", "Jacksonville", "Winter Haven", "Fort Lauderdale"],
  CA: ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento"],
  TX: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"],
  NY: ["New York", "Buffalo", "Rochester", "Albany", "Syracuse"],
  GA: ["Atlanta", "Savannah", "Augusta", "Columbus", "Macon"],
  WA: ["Seattle", "Spokane", "Tacoma", "Bellevue"],
  PA: ["Philadelphia", "Pittsburgh", "Harrisburg", "Allentown"],
  IL: ["Chicago", "Springfield", "Naperville", "Peoria"],
  MI: ["Detroit", "Grand Rapids", "Ann Arbor", "Lansing"],
  NC: ["Charlotte", "Raleigh", "Durham", "Asheville"],
  AZ: ["Phoenix", "Tucson", "Scottsdale", "Mesa"],
  CO: ["Denver", "Colorado Springs", "Boulder", "Aurora"],
  MA: ["Boston", "Cambridge", "Worcester", "Springfield"],
  VA: ["Virginia Beach", "Richmond", "Norfolk", "Arlington"],
  TN: ["Nashville", "Memphis", "Knoxville", "Chattanooga"],
  IN: ["Indianapolis", "Fort Wayne", "Bloomington", "Evansville"],
  MO: ["Kansas City", "St. Louis", "Springfield", "Columbia"],
  MD: ["Baltimore", "Annapolis", "Rockville", "Bethesda"],
  WI: ["Milwaukee", "Madison", "Green Bay", "Kenosha"],
  MN: ["Minneapolis", "St. Paul", "Rochester", "Duluth"],
  SC: ["Charleston", "Columbia", "Greenville", "Myrtle Beach"],
  AL: ["Birmingham", "Montgomery", "Mobile", "Huntsville"],
  LA: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette"],
  KY: ["Louisville", "Lexington", "Bowling Green", "Frankfort"],
  OR: ["Portland", "Eugene", "Salem", "Bend"],
  OK: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow"],
  CT: ["Hartford", "New Haven", "Stamford", "Bridgeport"],
  UT: ["Salt Lake City", "Provo", "Ogden", "Park City"],
  IA: ["Des Moines", "Cedar Rapids", "Davenport", "Iowa City"],
  NV: ["Las Vegas", "Reno", "Henderson", "Carson City"],
  AR: ["Little Rock", "Fayetteville", "Fort Smith", "Bentonville"],
  MS: ["Jackson", "Gulfport", "Hattiesburg", "Biloxi"],
  KS: ["Wichita", "Overland Park", "Kansas City", "Topeka"],
  NM: ["Albuquerque", "Santa Fe", "Las Cruces", "Roswell"],
  NE: ["Omaha", "Lincoln", "Bellevue", "Grand Island"],
  WV: ["Charleston", "Huntington", "Morgantown", "Parkersburg"],
  ID: ["Boise", "Meridian", "Nampa", "Idaho Falls"],
  HI: ["Honolulu", "Hilo", "Kailua", "Pearl City"],
  NH: ["Manchester", "Nashua", "Concord", "Portsmouth"],
  ME: ["Portland", "Bangor", "Augusta", "Lewiston"],
  RI: ["Providence", "Warwick", "Cranston", "Newport"],
  MT: ["Billings", "Missoula", "Bozeman", "Helena"],
  DE: ["Wilmington", "Dover", "Newark", "Rehoboth Beach"],
  SD: ["Sioux Falls", "Rapid City", "Aberdeen", "Pierre"],
  ND: ["Fargo", "Bismarck", "Grand Forks", "Minot"],
  AK: ["Anchorage", "Fairbanks", "Juneau", "Sitka"],
  VT: ["Burlington", "Montpelier", "Rutland", "Stowe"],
  WY: ["Cheyenne", "Casper", "Laramie", "Jackson"],
};

export function resolveStateCode(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  const byCode = US_STATES.find((s) => s.code === upper);
  if (byCode) return byCode.code;
  const byName = US_STATES.find(
    (s) => s.name.toLowerCase() === trimmed.toLowerCase(),
  );
  return byName?.code ?? null;
}

export function citiesForState(stateInput: string): string[] {
  const code = resolveStateCode(stateInput);
  if (!code) return [];
  const bundled = citiesAvailableForState(code);
  if (bundled.length > 0) return bundled;
  return US_CITIES_BY_STATE[code] ?? [];
}

export function isValidCityForState(city: string, stateInput: string): boolean {
  const trimmed = city.trim();
  if (trimmed.length < 2 || trimmed.length > 120) return false;
  if (!/^[\p{L}\s.'-]+$/u.test(trimmed)) return false;
  return true;
}

export function isValidZip(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip.trim());
}
