import { describe, expect, it } from "vitest";
import {
  evaluatePassword,
  isPasswordStrongEnough,
} from "@/components/ui/PasswordStrengthMeter";

describe("isPasswordStrongEnough (moderate policy)", () => {
  it("accepts 8+ chars with two character types (no symbol required)", () => {
    const { checks } = evaluatePassword("Password1");
    expect(isPasswordStrongEnough(checks)).toBe(true);
  });

  it("accepts Google-style passwords without special characters", () => {
    const { checks } = evaluatePassword("CorrectHorseBattery99");
    expect(isPasswordStrongEnough(checks)).toBe(true);
  });

  it("rejects passwords shorter than 8 characters", () => {
    const { checks } = evaluatePassword("Pass1");
    expect(isPasswordStrongEnough(checks)).toBe(false);
  });

  it("rejects single-type passwords", () => {
    const { checks } = evaluatePassword("abcdefgh");
    expect(isPasswordStrongEnough(checks)).toBe(false);
  });

  it("accepts passwords with symbol plus one other type", () => {
    const { checks } = evaluatePassword("abcdefgh!");
    expect(isPasswordStrongEnough(checks)).toBe(true);
  });
});
