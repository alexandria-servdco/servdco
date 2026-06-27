import { describe, it, expect } from "vitest";
import { evaluateMessageModeration } from "./messagingModeration";

describe("evaluateMessageModeration", () => {
  it("flags obvious off-platform payment language", () => {
    const result = evaluateMessageModeration("Just Venmo me instead");
    expect(result.flag).toBe("off_platform_payment");
    expect(result.hint).toBeTruthy();
  });

  it("allows normal booking messages", () => {
    expect(evaluateMessageModeration("See you Tuesday at 5pm").flag).toBe("none");
  });
});
