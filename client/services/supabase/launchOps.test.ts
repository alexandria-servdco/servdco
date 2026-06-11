import { describe, it, expect } from "vitest";

const DOC_TYPE_LABELS: Record<string, string> = {
  servsafe_certificate: "ServSafe Certificate",
  insurance: "Insurance",
  background_check: "Background Check",
  id_verification: "ID Verification",
};

const LABEL_TO_ENUM: Record<string, string> = {
  "ServSafe Certificate": "servsafe_certificate",
  Insurance: "insurance",
  "Background Check": "background_check",
  "ID Verification": "id_verification",
};

describe("launch ops document type mapping", () => {
  it("maps UI labels to DB enums", () => {
    expect(LABEL_TO_ENUM["ServSafe Certificate"]).toBe("servsafe_certificate");
    expect(LABEL_TO_ENUM["Background Check"]).toBe("background_check");
  });

  it("maps DB enums to display labels", () => {
    expect(DOC_TYPE_LABELS.servsafe_certificate).toBe("ServSafe Certificate");
    expect(DOC_TYPE_LABELS.insurance).toBe("Insurance");
  });
});

describe("apiConfig Phase 10", () => {
  it("has no mock API toggle", async () => {
    const { apiConfig } = await import("@/lib/apiConfig");
    expect(apiConfig).not.toHaveProperty("USE_MOCK_API");
    expect(apiConfig.API_BASE_URL).toBe("/api");
  });
});
