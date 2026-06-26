import { describe, expect, it } from "vitest";
import {
  evaluateGeography,
  resolveRegionAccess,
  computePermissions,
  mapRowToLaunchRegionConfig,
} from "./launchControl";

describe("evaluateGeography", () => {
  it("requires city and zip when both lists configured", () => {
    const result = evaluateGeography(
      { city: "Dayton", zip: "45402" },
      ["Columbus", "Cleveland", "Cincinnati"],
      ["43201", "44101", "45201"],
    );
    expect(result.geographyAllowed).toBe(false);
  });

  it("allows Columbus with matching zip", () => {
    const result = evaluateGeography(
      { city: "Columbus", zip: "43201" },
      ["Columbus", "Cleveland", "Cincinnati"],
      ["43201", "44101", "45201"],
    );
    expect(result.geographyAllowed).toBe(true);
  });

  it("allows entire state when no city or zip lists", () => {
    const result = evaluateGeography(
      { city: "Dayton", zip: "45402" },
      [],
      [],
    );
    expect(result.geographyAllowed).toBe(true);
  });
});

describe("resolveRegionAccess", () => {
  const ohioConfig = mapRowToLaunchRegionConfig({
    id: "OH",
    state: "Ohio",
    city: "Columbus, Cleveland, Cincinnati",
    zip_codes: "43201, 44101, 45201",
    is_active: true,
    is_waitlist: false,
    status: "active",
    chef_count: 10,
    family_count: 20,
  });

  it("grants active access statewide when region is live", () => {
    const result = resolveRegionAccess(
      "OH",
      ohioConfig,
      { state: "Ohio", city: "Dayton", zip: "45402", role: "family" },
    );
    expect(result.effectiveStatus).toBe("active");
    expect(result.canAccessDashboard).toBe(true);
    expect(result.permissions.booking_create).toBe(true);
  });

  it("waitlists user outside covered cities when region is not live", () => {
    const waitlistConfig = {
      ...ohioConfig,
      status: "waitlist" as const,
      is_active: false,
      is_waitlist: true,
    };
    const result = resolveRegionAccess(
      "OH",
      waitlistConfig,
      { state: "Ohio", city: "Dayton", zip: "45402", role: "family" },
    );
    expect(result.effectiveStatus).toBe("waitlist");
    expect(result.canAccessDashboard).toBe(false);
    expect(result.reason).toBe("city_not_launched");
  });

  it("grants active access for Columbus suburb ZIP when region is live", () => {
    const result = resolveRegionAccess(
      "OH",
      ohioConfig,
      { state: "Ohio", city: "Columbus", zip: "43004", role: "family" },
    );
    expect(result.effectiveStatus).toBe("active");
    expect(result.canAccessDashboard).toBe(true);
    expect(result.permissions.booking_create).toBe(true);
  });

  it("blocks bookings when region paused", () => {
    const paused = { ...ohioConfig, status: "paused" as const };
    const result = resolveRegionAccess(
      "OH",
      paused,
      { state: "Ohio", city: "Columbus", zip: "43201", role: "family" },
    );
    expect(result.effectiveStatus).toBe("paused");
    expect(result.permissions.booking_create).toBe(false);
    expect(result.permissions.booking_view_existing).toBe(true);
  });
});

describe("computePermissions", () => {
  it("allows waitlist join for unknown geography in active state", () => {
    const config = mapRowToLaunchRegionConfig({
      id: "OH",
      state: "Ohio",
      city: "Columbus",
      zip_codes: "43201",
      is_active: true,
      is_waitlist: false,
      status: "active",
    });
    const perms = computePermissions(config, "waitlist", false, "family");
    expect(perms.waitlist_join).toBe(true);
    expect(perms.booking_create).toBe(false);
  });
});
