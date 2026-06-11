import Stripe from "stripe";
import {
  assertStripeConfigured,
  getStripeEnv,
  validateStripeEnvOnStartup,
} from "./env";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  validateStripeEnvOnStartup();
  assertStripeConfigured();
  if (!stripeClient) {
    const env = getStripeEnv();
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY!);
  }
  return stripeClient;
}
