import { describe, expect, it } from "vitest";
import {
  mergeUniqueZips,
  normalizeCityName,
  parseCommaList,
  sanitizeZipInput,
  isValidZipCode,
} from "@shared/geoZip";
import {
  parseRecoveryHashFromString,
  recoveryErrorMessage,
  isRecoverySession,
} from "@/lib/auth/passwordRecovery";

describe("passwordRecovery", () => {
  it("detects recovery hash tokens", () => {
    const result = parseRecoveryHashFromString(
      "#type=recovery&access_token=abc",
    );
    expect(result.type).toBe("recovery");
  });

  it("detects expired OTP in hash", () => {
    const result = parseRecoveryHashFromString(
      "#error=access_denied&error_code=otp_expired",
    );
    expect(result.type).toBe("error");
    if (result.type === "error") {
      expect(recoveryErrorMessage(result.errorCode)).toContain("expired");
    }
  });

  it("identifies recovery session from flags", () => {
    expect(isRecoverySession(true, { type: "none" }, null)).toBe(true);
    expect(isRecoverySession(false, { type: "recovery" }, null)).toBe(true);
    expect(isRecoverySession(false, { type: "none" }, "recovery")).toBe(true);
    expect(isRecoverySession(false, { type: "none" }, null)).toBe(false);
  });
});

describe("geoZip utilities", () => {
  it("parses and merges comma lists", () => {
    expect(parseCommaList(" 43201, 43202 ,43201")).toEqual([
      "43201",
      "43202",
      "43201",
    ]);
    expect(mergeUniqueZips(["43201"], ["43202", "43201"])).toEqual([
      "43201",
      "43202",
    ]);
  });

  it("normalizes city names", () => {
    expect(normalizeCityName("  Columbus  ")).toBe("Columbus");
  });

  it("validates and sanitizes ZIP input", () => {
    expect(isValidZipCode("43201")).toBe(true);
    expect(isValidZipCode("4320")).toBe(false);
    expect(sanitizeZipInput("43201, bad, 43202")).toBe("43201, 43202");
  });
});
