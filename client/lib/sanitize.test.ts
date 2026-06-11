import { describe, it, expect } from "vitest";
import { sanitizePlainText } from "./sanitize";

describe("sanitizePlainText", () => {
  it("strips HTML tags", () => {
    expect(sanitizePlainText('<script>alert("x")</script>Hello')).toBe(
      "Hello",
    );
  });

  it("normalizes whitespace", () => {
    expect(sanitizePlainText("  hello   world  ")).toBe("hello world");
  });

  it("enforces max length", () => {
    const long = "a".repeat(5000);
    expect(sanitizePlainText(long, 100).length).toBe(100);
  });
});
