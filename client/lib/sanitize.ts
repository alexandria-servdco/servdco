import DOMPurify from "dompurify";

function stripHtml(input: string): string {
  if (typeof window !== "undefined" && typeof DOMPurify.sanitize === "function") {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }
  return input
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "");
}

/** Strip HTML and normalize whitespace for user-generated plain text. */
export function sanitizePlainText(input: string, maxLength = 4000): string {
  const stripped = stripHtml(input);
  return stripped.replace(/\s+/g, " ").trim().slice(0, maxLength);
}
