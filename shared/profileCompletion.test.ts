import { describe, it, expect } from "vitest";
import {
  calculateFamilyProfileCompletion,
  calculateChefProfileCompletion,
  profileCompletionLabel,
} from "./profileCompletion";

describe("family profile completion", () => {
  it("returns 0 when empty", () => {
    expect(calculateFamilyProfileCompletion({})).toBe(0);
  });

  it("returns 100 when all fields filled", () => {
    expect(
      calculateFamilyProfileCompletion({
        full_name: "Sarah Johnson",
        phone: "555-1234",
        city: "Columbus",
        state: "Ohio",
        zip: "43215",
        email: "sarah@example.com",
      }),
    ).toBe(100);
  });

  it("returns partial percent for some fields", () => {
    const pct = calculateFamilyProfileCompletion({
      full_name: "Sarah",
      email: "sarah@example.com",
    });
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });
});

describe("chef profile completion", () => {
  it("returns 0 when empty", () => {
    expect(
      calculateChefProfileCompletion({
        availabilityCount: 0,
        documentsSubmittedCount: 0,
      }),
    ).toBe(0);
  });

  it("returns 100 when all criteria met including approval", () => {
    expect(
      calculateChefProfileCompletion({
        full_name: "Cook Maria",
        avatar_url: "https://cdn.example/avatar.jpg",
        city: "Columbus",
        state: "Ohio",
        phone: "555-9999",
        bio: "Passionate cook",
        cuisines: ["Italian"],
        availabilityCount: 2,
        documentsSubmittedCount: 3,
        verification_status: "approved",
      }),
    ).toBe(100);
  });

  it("stays below 100 without verification approval", () => {
    const pct = calculateChefProfileCompletion({
      full_name: "Cook",
      avatar_url: "https://cdn.example/a.jpg",
      city: "Columbus",
      state: "Ohio",
      phone: "555",
      bio: "Bio",
      cuisines: ["Italian"],
      availabilityCount: 1,
      documentsSubmittedCount: 3,
      verification_status: "pending",
    });
    expect(pct).toBeLessThan(100);
  });
});

describe("profileCompletionLabel", () => {
  it("shows complete at 100", () => {
    expect(profileCompletionLabel(100)).toBe("Profile Complete");
  });

  it("shows incomplete below 100", () => {
    expect(profileCompletionLabel(42)).toBe("Complete your profile");
  });
});
