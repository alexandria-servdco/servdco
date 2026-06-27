import { describe, it, expect } from "vitest";
import { resolveStateCode, stateCodeToName } from "./location";

describe("location helpers", () => {
  it("resolves state names and codes", () => {
    expect(resolveStateCode("Ohio")).toBe("OH");
    expect(resolveStateCode("oh")).toBe("OH");
    expect(stateCodeToName("OH")).toBe("Ohio");
  });

  it("rejects invalid states", () => {
    expect(resolveStateCode("Not A State")).toBeNull();
  });
});
