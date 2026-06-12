import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { IncomingMessage } from "node:http";
import { buffer } from "node:stream/consumers";
import { getStripe } from "../_lib/stripe/server.js";
import {
  getStripeWebhookSecret,
  getStripeWebhookSecretSource,
  validateStripeEnvOnStartup,
} from "../_lib/stripe/env.js";
import { claimStripeEvent } from "../_lib/stripe/events.js";
import { processStripeWebhookEvent } from "../_lib/stripe/webhooks.js";
import { json } from "../_lib/http.js";
import { apiLogger } from "../_lib/logger.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

/** Stripe signature verification requires the unmodified request bytes. */
async function readRawBody(req: VercelRequest): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body, "utf8");

  const incoming = req as unknown as IncomingMessage;
  if (incoming.readable) {
    return buffer(incoming);
  }

  if (req.body && typeof req.body === "object") {
    return Buffer.from(JSON.stringify(req.body));
  }

  return Buffer.from("");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  validateStripeEnvOnStartup();

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    json(res, 400, { error: "Missing stripe-signature header" });
    return;
  }

  try {
    const stripe = getStripe();
    const webhookSecret = getStripeWebhookSecret();
    if (!webhookSecret) {
      json(res, 500, { error: "STRIPE_WEBHOOK_SECRET is not configured." });
      return;
    }
    const rawBody = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );

    apiLogger.info("Stripe webhook received", {
      route: "/api/stripe/webhook",
      eventId: event.id,
      type: event.type,
      secretSource: getStripeWebhookSecretSource(),
    });

    const claim = await claimStripeEvent(event);
    if (claim.shouldProcess) {
      await processStripeWebhookEvent(event);
      apiLogger.info("Stripe webhook processed", {
        route: "/api/stripe/webhook",
        eventId: event.id,
        type: event.type,
      });
    } else {
      apiLogger.info("Stripe webhook skipped", {
        route: "/api/stripe/webhook",
        eventId: event.id,
        duplicate: claim.duplicate,
        alreadyProcessed: claim.alreadyProcessed,
      });
    }

    json(res, 200, {
      received: true,
      duplicate: claim.duplicate,
      skipped: !claim.shouldProcess,
      alreadyProcessed: claim.alreadyProcessed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    apiLogger.error("Stripe webhook failed", {
      route: "/api/stripe/webhook",
      message,
      secretSource: getStripeWebhookSecretSource(),
    });
    json(res, 400, {
      error: message,
      secretSource: getStripeWebhookSecretSource(),
    });
  }
}
