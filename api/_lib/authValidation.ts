import { z } from "zod";

/** Auth-only Zod schemas — kept inside api/ so Vercel serverless bundles without shared/. */

const FIELD_LABELS: Record<string, string> = {
  name: "Full name",
  email: "Email address",
  phone: "Phone number",
  password: "Password",
};

export const emailSchema = z.string().trim().email("Enter a valid email address.");

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required.")
  .superRefine((value, ctx) => {
    if (value.includes("@")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "This looks like an email address. Enter your phone number instead (for example, 614-555-0100).",
      });
      return;
    }
    const digits = value.replace(/\D/g, "");
    if (digits.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid phone number with at least 10 digits.",
      });
      return;
    }
    if (digits.length > 15) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number is too long. Use at most 15 digits.",
      });
    }
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

function humanizeZodIssue(issue: z.ZodIssue): string {
  const fieldKey = issue.path[0]?.toString() ?? "";
  const label = FIELD_LABELS[fieldKey] ?? (fieldKey ? fieldKey : "This field");

  if (
    issue.message &&
    !issue.message.startsWith("String must") &&
    !issue.message.startsWith("Invalid")
  ) {
    if (fieldKey && !issue.message.toLowerCase().includes(label.toLowerCase())) {
      return `${label}: ${issue.message}`;
    }
    return issue.message;
  }

  switch (issue.code) {
    case "too_small":
      if (issue.type === "string") {
        return `${label}: Please enter at least ${issue.minimum} character${issue.minimum === 1 ? "" : "s"}.`;
      }
      break;
    case "too_big":
      if (issue.type === "string") {
        return `${label}: Please use ${issue.maximum} characters or fewer.`;
      }
      break;
    case "invalid_string":
      if (issue.validation === "email") {
        return `${label}: Enter a valid email address (for example, name@example.com).`;
      }
      break;
    case "invalid_type":
      if (issue.received === "undefined" || issue.received === "null") {
        return `${label}: This field is required.`;
      }
      break;
    case "custom":
      return issue.message || `${label}: Please check this value.`;
  }

  return issue.message || `${label}: Please check this value.`;
}

export function formatZodError(error: z.ZodError): string {
  const issue = error.errors[0];
  if (!issue) return "Please fix the highlighted fields below.";
  return humanizeZodIssue(issue);
}
