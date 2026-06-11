/**
 * ServdCo Stripe client surface.
 *
 * ServdCo uses Stripe Hosted Checkout (server-created sessions + redirect).
 * No publishable key or Stripe.js is required on the frontend.
 */

export const STRIPE_CHECKOUT_MODE = "hosted" as const;

export type StripeCheckoutMode = typeof STRIPE_CHECKOUT_MODE;

/** Documented for operators — not loaded at runtime on the client. */
export const STRIPE_CLIENT_NOTES = {
  checkout: "Redirect to session.url from /api/stripe/* checkout endpoints",
  connect: "Redirect to accountLinks URL from /api/stripe/connect/onboarding",
  publishableKey: "Not required for Hosted Checkout",
} as const;
