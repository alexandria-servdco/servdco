import { getStripe } from "./server.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { stripeIdempotencyKey } from "./helpers.js";

export async function findStripeCustomer(
  profileId: string,
): Promise<{ stripeCustomerId: string; rowId: string } | null> {
  const client = getServiceRoleClient();
  const { data } = await client
    .from("stripe_customers")
    .select("id, stripe_customer_id")
    .eq("profile_id", profileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data?.stripe_customer_id) return null;
  return { stripeCustomerId: data.stripe_customer_id, rowId: data.id };
}

export async function getOrCreateStripeCustomer(params: {
  profileId: string;
  email: string;
  name?: string;
}): Promise<string> {
  const client = getServiceRoleClient();
  const stripe = getStripe();

  const existing = await findStripeCustomer(params.profileId);
  if (existing) {
    await updateStripeCustomer({
      profileId: params.profileId,
      email: params.email,
      name: params.name,
    });
    return existing.stripeCustomerId;
  }

  const customer = await stripe.customers.create(
    {
      email: params.email,
      name: params.name,
      metadata: { profile_id: params.profileId },
    },
    {
      idempotencyKey: stripeIdempotencyKey("customer", params.profileId),
    },
  );

  await client.from("stripe_customers").insert({
    profile_id: params.profileId,
    stripe_customer_id: customer.id,
    metadata: { source: "servdco_billing" },
  });

  return customer.id;
}

/** @deprecated Use getOrCreateStripeCustomer */
export const ensureStripeCustomer = getOrCreateStripeCustomer;

export async function updateStripeCustomer(params: {
  profileId: string;
  email?: string;
  name?: string;
}): Promise<void> {
  const existing = await findStripeCustomer(params.profileId);
  if (!existing) return;

  const stripe = getStripe();
  const updates: { email?: string; name?: string } = {};
  if (params.email) updates.email = params.email;
  if (params.name) updates.name = params.name;
  if (Object.keys(updates).length === 0) return;

  await stripe.customers.update(existing.stripeCustomerId, updates);

  const client = getServiceRoleClient();
  await client
    .from("stripe_customers")
    .update({
      metadata: {
        last_synced_at: new Date().toISOString(),
        email: params.email ?? null,
        name: params.name ?? null,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.rowId);
}
