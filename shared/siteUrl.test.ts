import { describe, expect, it } from "vitest";
import { normalizeSiteUrl, siteDisplayHost } from "./siteUrl";

describe("normalizeSiteUrl", () => {
  it("strips trailing slash and preserves scheme", () => {
    expect(normalizeSiteUrl("https://servdco.com/")).toBe("https://servdco.com");
  });

  it("adds https when scheme omitted", () => {
    expect(normalizeSiteUrl("servdco.com")).toBe("https://servdco.com");
  });

  it("returns null for empty input", () => {
    expect(normalizeSiteUrl("")).toBeNull();
    expect(normalizeSiteUrl(undefined)).toBeNull();
  });
});

describe("siteDisplayHost", () => {
  it("extracts hostname from URL", () => {
    expect(siteDisplayHost("https://servdco.com/path")).toBe("servdco.com");
  });
});
