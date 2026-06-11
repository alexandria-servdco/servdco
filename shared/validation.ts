import { z } from "zod";

/** Shared Zod schemas — client forms, API payloads, admin actions. */

export const emailSchema = z.string().trim().email("Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const passwordResetSchema = z.object({
  email: emailSchema,
});

export const familyRegisterCoreSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(120),
  email: emailSchema,
  state: z.string().trim().min(2).max(64),
  city: z.string().trim().min(2).max(120),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code."),
  phone: z.string().trim().min(7, "Phone number is required.").max(20),
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

export const bookingCreateSchema = z.object({
  cook_id: z.string().uuid("Invalid cook profile."),
  family_name: z.string().trim().min(2).max(120),
  service_type: z.string().trim().min(2).max(80),
  date: z.string().trim().min(4).max(32),
  guests_count: z.number().int().min(1).max(50),
  price: z.number().positive().max(100_000),
});

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

/** Map Zod errors to a single user-facing string. */
export function formatZodError(error: z.ZodError): string {
  return error.errors[0]?.message ?? "Invalid input.";
}

export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function safeParse<D>(
  schema: z.ZodSchema<D>,
  data: unknown,
): SafeParseResult<D> {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: formatZodError(result.error) };
}
