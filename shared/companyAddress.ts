/** Canonical Servd Co. mailing address — use everywhere legal/contact copy appears. */
export const COMPANY_ADDRESS = {
  street: "106 Spring Street",
  city: "Mechanicsburg",
  state: "OH",
  zip: "43044",
  country: "United States",
} as const;

export const COMPANY_ADDRESS_LINES = [
  COMPANY_ADDRESS.street,
  `${COMPANY_ADDRESS.city}, ${COMPANY_ADDRESS.state} ${COMPANY_ADDRESS.zip}`,
  COMPANY_ADDRESS.country,
] as const;

export const COMPANY_ADDRESS_MAP_QUERY = encodeURIComponent(
  `${COMPANY_ADDRESS.street}, ${COMPANY_ADDRESS.city}, ${COMPANY_ADDRESS.state} ${COMPANY_ADDRESS.zip}, ${COMPANY_ADDRESS.country}`,
);

export const COMPANY_ADDRESS_MAP_URL = `https://www.bing.com/maps?q=${COMPANY_ADDRESS_MAP_QUERY}`;

export const COMPANY_ADDRESS_SHORT = `${COMPANY_ADDRESS.city}, ${COMPANY_ADDRESS.state}`;

export const COMPANY_LEGAL_EMAIL = "alexandria@servdco.com";
