import { z } from "zod";
import { BOOKING_STATUSES } from "./booking";

/** Shared Zod schemas — client forms, API payloads, admin actions. */

/** Maps schema field keys to labels shown in form errors. */
export const FIELD_LABELS: Record<string, string> = {
  name: "Full name",
  email: "Email address",
  phone: "Phone number",
  password: "Password",
  confirmPassword: "Confirm password",
  state: "State",
  city: "City",
  zip: "ZIP code",
  subject: "Subject",
  message: "Message",
  yearsExperience: "Years of experience",
  primaryCuisine: "Primary cuisine",
  bio: "Cook bio",
};

export const emailSchema = z.string().trim().email("Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.");

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

export const passwordResetSchema = z.object({
  email: emailSchema,
});

export const familyRegisterCoreSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(120, "Name is too long — use 120 characters or fewer."),
  email: emailSchema,
  state: z.string().trim().min(2, "Please select your state.").max(64),
  city: z.string().trim().min(2, "Please select your city.").max(120),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a valid 5-digit ZIP code."),
  phone: phoneSchema,
});

export const familyRegisterSchema = familyRegisterCoreSchema.extend({
  password: passwordSchema,
});

export const chefRegisterCoreSchema = familyRegisterCoreSchema;

export const chefRegisterSchema = familyRegisterCoreSchema.extend({
  yearsExperience: z.string().trim().max(40).optional(),
  primaryCuisine: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(2000).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(120),
  email: emailSchema,
  subject: z.string().trim().min(2, "Subject is required.").max(200),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters.")
    .max(5000, "Message is too long."),
});

export const waitlistSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(64),
  role: z.enum(["family", "chef", "both"]),
});

export const interestSchema = waitlistSchema;

/** Minimal waitlist capture (email-only landing form). */
export const waitlistEmailSchema = z.object({
  email: emailSchema,
});

export const bookingAddressSchema = z.object({
  street_address: z.string().trim().min(3, "Street address is required.").max(200),
  apartment: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required.").max(120),
  state: z.string().trim().min(2, "State is required.").max(64),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code."),
  country: z.string().trim().max(64).default("US"),
  location_notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const bookingCreateSchema = z.object({
  cook_id: z.string().uuid("Invalid cook profile."),
  family_name: z.string().trim().min(2).max(120),
  service_type: z.string().trim().min(2).max(80),
  date: z.string().trim().min(4).max(32),
  booking_time: z.string().trim().max(16).optional(),
  booking_end_time: z.string().trim().max(16).optional(),
  guests_count: z.number().int().min(1).max(50),
  price: z.number().positive().max(100_000),
  meal_request: z
    .string()
    .trim()
    .min(3, "Please describe what meal you would like prepared.")
    .max(2000),
  ingredients_available: z.string().trim().max(2000).optional(),
  recipe_notes: z.string().trim().max(2000).optional(),
  special_instructions: z.string().trim().max(2000).optional(),
  dietary_restrictions: z.array(z.string().trim().max(80)).max(20).optional(),
  allergies: z.string().trim().max(500).optional(),
  parking_instructions: z.string().trim().max(500).optional(),
  gate_code: z.string().trim().max(80).optional(),
  emergency_contact_name: z.string().trim().max(120).optional(),
  emergency_contact_phone: z.string().trim().max(20).optional(),
  address: bookingAddressSchema,
});

export const bookingStatusSchema = z.enum(BOOKING_STATUSES);

export const messageBodySchema = z
  .string()
  .trim()
  .min(1, "Message cannot be empty.")
  .max(4000, "Message is too long.");

export const adminModerationStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "suspended",
  "active",
]);

/** Chef verification actions (excludes legacy `active` label). */
export const chefVerificationStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

export const adminDocumentStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
]);

export const stripeCheckoutRequestSchema = z.object({
  bookingId: z.string().uuid(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const stripeRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amountCents: z.number().int().positive().optional(),
  reason: z.string().trim().max(500).optional(),
});

/** Turn a Zod issue into plain-language guidance with the field name when possible. */
export function humanizeZodIssue(issue: z.ZodIssue): string {
  const fieldKey = issue.path[0]?.toString() ?? "";
  const label = FIELD_LABELS[fieldKey] ?? (fieldKey ? fieldKey : "This field");

  if (issue.message && !issue.message.startsWith("String must") && !issue.message.startsWith("Invalid")) {
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

/** Map Zod errors to a single user-facing string. */
export function formatZodError(error: z.ZodError): string {
  const issue = error.errors[0];
  if (!issue) return "Please fix the highlighted fields below.";
  return humanizeZodIssue(issue);
}

/** Map Zod errors to per-field messages (first error per field). */
export function formatZodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.errors) {
    const key = issue.path[0]?.toString();
    if (key && !out[key]) {
      out[key] = humanizeZodIssue(issue);
    }
  }
  return out;
}

export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors: Record<string, string> };

export function safeParse<D>(
  schema: z.ZodSchema<D>,
  data: unknown,
): SafeParseResult<D> {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    error: formatZodError(result.error),
    fieldErrors: formatZodFieldErrors(result.error),
  };
}
