/**
 * Force-sync all Stripe Connect accounts from Stripe → Supabase (production).
 * Uses ONLY .env.production.
 *
 * Usage: node scripts/force-sync-connect-production.mjs
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

function loadProductionEnv() {
  const env = {};
  for (const line of readFileSync(".env.production", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

function mapOnboardingStatus(account) {
  if (account.payouts_enabled && account.charges_enabled) return "complete";
  if (account.details_submitted) return "pending";
  return "not_started";
}

const env = loadProductionEnv();
const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const { data: accounts, error } = await client
  .from("stripe_accounts")
  .select("chef_profile_id, stripe_account_id, payouts_enabled")
  .order("created_at", { ascending: false });

if (error) {
  console.error("Supabase error:", error.message);
  process.exit(1);
}

console.log(`Syncing ${accounts?.length ?? 0} Connect account(s)...\n`);

let synced = 0;
let mismatches = 0;

for (const row of accounts ?? []) {
  try {
    const account = await stripe.accounts.retrieve(row.stripe_account_id);
    const onboardingStatus = mapOnboardingStatus({
      details_submitted: account.details_submitted ?? false,
      charges_enabled: account.charges_enabled ?? false,
      payouts_enabled: account.payouts_enabled ?? false,
    });

    const { data, error: updateError } = await client
      .from("stripe_accounts")
      .update({
        charges_enabled: account.charges_enabled ?? false,
        payouts_enabled: account.payouts_enabled ?? false,
        onboarding_status: onboardingStatus,
        capabilities: account.capabilities ?? {},
        requirements_due: account.requirements?.currently_due ?? [],
        metadata: { details_submitted: account.details_submitted ?? false },
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_account_id", row.stripe_account_id)
      .select("chef_profile_id, payouts_enabled");

    if (updateError) throw updateError;

    const dbPayouts = data?.[0]?.payouts_enabled ?? false;
    const stripePayouts = account.payouts_enabled ?? false;
    const match = dbPayouts === stripePayouts;

    console.log(`Chef ${row.chef_profile_id}`);
    console.log(`  Stripe payouts_enabled: ${stripePayouts}`);
    console.log(`  DB payouts_enabled:     ${dbPayouts}`);
    console.log(`  onboarding_status:      ${onboardingStatus}`);
    console.log(`  Match: ${match ? "YES" : "NO"}\n`);

    synced++;
    if (!match) mismatches++;
  } catch (err) {
    console.error(`  FAILED: ${err instanceof Error ? err.message : err}\n`);
    mismatches++;
  }
}

console.log(`Done. Synced ${synced}, mismatches/failures ${mismatches}.`);
process.exit(mismatches > 0 ? 1 : 0);
