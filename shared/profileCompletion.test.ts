import { describe, it, expect } from "vitest";
import {
  calculateFamilyProfileCompletion,
  calculateChefProfileCompletion,
  getFamilyProfileCompletionDetail,
  getChefProfileCompletionDetail,
  profileCompletionLabel,
} from "./profileCompletion";

describe("family profile completion", () => {
  it("returns 0 when empty", () => {
    expect(calculateFamilyProfileCompletion({})).toBe(0);
  });

  it("returns 100 when all form fields are filled", () => {
    expect(
      calculateFamilyProfileCompletion({
        phone: "555-1234",
        city: "Columbus",
        state: "Ohio",
        zip: "43215",
        email_verified: true,
        dietary_preferences: ["Vegan"],
      }),
    ).toBe(100);
  });

  it("returns partial percent for some fields", () => {
    const detail = getFamilyProfileCompletionDetail({
      phone: "555-1234",
      city: "Columbus",
      state: "Ohio",
      zip: "43215",
    });
    expect(detail.completed).toBe(4);
    expect(detail.total).toBe(6);
    expect(detail.percent).toBe(67);
    expect(detail.missing).toContain("Dietary preferences");
    expect(detail.missing).toContain("Email verification");
  });

  it("lists dietary preferences as missing when empty", () => {
    const detail = getFamilyProfileCompletionDetail({
      phone: "555-1234",
      city: "Columbus",
      state: "Ohio",
      zip: "43215",
      email_verified: true,
      dietary_preferences: [],
    });
    expect(detail.percent).toBe(83);
    expect(detail.missing).toEqual(["Dietary preferences"]);
  });
});

describe("chef profile completion", () => {
  it("returns 0 when empty", () => {
    expect(
      calculateChefProfileCompletion({
        availabilityCount: 0,
      }),
    ).toBe(0);
  });

  it("returns 100 when all criteria met including approval", () => {
    expect(
      calculateChefProfileCompletion({
        avatar_url: "https://cdn.example/avatar.jpg",
        city: "Columbus",
        state: "Ohio",
        bio: "Passionate cook",
        cuisines: ["Italian"],
        availabilityCount: 2,
        servSafeSubmitted: true,
        insuranceSubmitted: true,
        backgroundCheckSubmitted: true,
        verification_status: "approved",
      }),
    ).toBe(100);
  });

  it("stays below 100 without verification approval", () => {
    const pct = calculateChefProfileCompletion({
      avatar_url: "https://cdn.example/a.jpg",
      city: "Columbus",
      state: "Ohio",
      bio: "Bio",
      cuisines: ["Italian"],
      availabilityCount: 1,
      servSafeSubmitted: true,
      insuranceSubmitted: true,
      backgroundCheckSubmitted: true,
      verification_status: "pending",
    });
    expect(pct).toBeLessThan(100);
  });

  it("tracks per-document submission", () => {
    const detail = getChefProfileCompletionDetail({
      avatar_url: "https://cdn.example/a.jpg",
      bio: "Bio",
      cuisines: ["Indian"],
      availabilityCount: 1,
      city: "Columbus",
      state: "Ohio",
      servSafeSubmitted: true,
      insuranceSubmitted: false,
      backgroundCheckSubmitted: false,
      verification_status: "pending",
    });
    expect(detail.completed).toBe(6);
    expect(detail.total).toBe(9);
  });
});

describe("profileCompletionLabel", () => {
  it('returns "Profile Complete" at 100', () => {
    expect(profileCompletionLabel(100)).toBe("Profile Complete");
  });

  it('returns "Complete your profile" below 100', () => {
    expect(profileCompletionLabel(67)).toBe("Complete your profile");
  });
});
