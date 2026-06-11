import type Stripe from "stripe";
import { getServiceRoleClient } from "../supabase/serviceRole.js";

export interface StripeEventClaim {
  shouldProcess: boolean;
  duplicate: boolean;
  alreadyProcessed: boolean;
  rowId: string | null;
}

/** Persist raw webhook event and determine if business logic should run. */
export async function claimStripeEvent(
  event: Stripe.Event,
): Promise<StripeEventClaim> {
  const client = getServiceRoleClient();

  const { data: existing } = await client
    .from("stripe_events")
    .select("id, processed, processing_error")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing) {
    const alreadyProcessed = existing.processed === true;
    const shouldRetry =
      !alreadyProcessed && Boolean(existing.processing_error);
    return {
      shouldProcess: shouldRetry,
      duplicate: !shouldRetry,
      alreadyProcessed,
      rowId: existing.id,
    };
  }

  const { data, error } = await client
    .from("stripe_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      api_version: event.api_version ?? null,
      payload: event as unknown as Record<string, unknown>,
      processed: false,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("duplicate")) {
      return {
        shouldProcess: false,
        duplicate: true,
        alreadyProcessed: true,
        rowId: null,
      };
    }
    throw error;
  }

  return {
    shouldProcess: true,
    duplicate: false,
    alreadyProcessed: false,
    rowId: data.id,
  };
}

/** @deprecated Use claimStripeEvent */
export async function persistStripeEvent(event: Stripe.Event): Promise<{
  inserted: boolean;
  rowId: string | null;
}> {
  const claim = await claimStripeEvent(event);
  return {
    inserted: claim.shouldProcess,
    rowId: claim.rowId,
  };
}

export async function markStripeEventProcessed(
  stripeEventId: string,
  errorMessage?: string,
): Promise<void> {
  const client = getServiceRoleClient();
  await client
    .from("stripe_events")
    .update({
      processed: !errorMessage,
      processed_at: new Date().toISOString(),
      processing_error: errorMessage ?? null,
    })
    .eq("stripe_event_id", stripeEventId);
}
