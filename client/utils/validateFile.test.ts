import { describe, it, expect } from "vitest";
import { validateImage, validateDocument } from "./validateFile";

function mockFile(name: string, type: string, size: number): File {
  return new File([new ArrayBuffer(size)], name, { type });
}

describe("validateImage", () => {
  it("accepts valid jpeg with matching extension", () => {
    const result = validateImage(mockFile("photo.jpg", "image/jpeg", 1024));
    expect(result.isValid).toBe(true);
  });

  it("rejects mime/extension mismatch", () => {
    const result = validateImage(mockFile("photo.jpg", "image/png", 1024));
    expect(result.isValid).toBe(false);
  });

  it("rejects oversized images", () => {
    const result = validateImage(
      mockFile("big.jpg", "image/jpeg", 6 * 1024 * 1024),
    );
    expect(result.isValid).toBe(false);
  });
});

describe("validateDocument", () => {
  it("accepts pdf documents", () => {
    const result = validateDocument(mockFile("cert.pdf", "application/pdf", 1024));
    expect(result.isValid).toBe(true);
  });

  it("rejects unsupported mime types", () => {
    const result = validateDocument(mockFile("doc.exe", "application/x-msdownload", 1024));
    expect(result.isValid).toBe(false);
  });
});
