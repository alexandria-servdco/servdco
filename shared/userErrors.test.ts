import { describe, expect, it } from "vitest";
import { getUserError, mapToUserFacingError, mapThrownError } from "./userErrors";

describe("userErrors", () => {
  it("maps 401 auth invalid credentials", () => {
    const err = mapToUserFacingError(401, {
      code: "AUTH_INVALID_CREDENTIALS",
      message: "We couldn't sign you in with those details.",
    });
    expect(err.title).toBe("Incorrect email or password");
  });

  it("maps email not confirmed", () => {
    const err = mapToUserFacingError(401, { code: "AUTH_EMAIL_NOT_CONFIRMED" });
    expect(err.primaryAction?.action).toBe("resend_confirmation");
  });

  it("maps network failures", () => {
    const err = mapThrownError(new TypeError("Failed to fetch"));
    expect(err.code).toBe("NETWORK_OFFLINE");
  });

  it("never returns raw request failed text from catalog", () => {
    const err = getUserError("SERVER_ERROR");
    expect(err.message.toLowerCase()).not.toContain("request failed");
  });

  it("keeps catalog text when 500 body fields are missing", () => {
    const err = mapToUserFacingError(500, {});
    expect(err.title).toBe("Something unexpected happened");
    expect(err.message).toContain("logged this issue");
  });
});
