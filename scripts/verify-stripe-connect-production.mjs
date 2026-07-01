/**
 * Production-only Stripe Connect verification.
 * Uses ONLY .env.production — never .env.local.
 *
 * Usage: node scripts/verify-stripe-connect-production.mjs
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

const env = loadProductionEnv();
const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "STRIPE_SECRET_KEY"];
for (const key of required) {
  if (!env[key]) {
    console.error(`Missing ${key} in .env.production`);
    process.exit(1);
  }
}

const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const { data: accounts, error } = await client
  .from("stripe_accounts")
  .select("*")
  .order("created_at", { ascending: false });

if (error) {
  console.error("Supabase error:", error.message);
  process.exit(1);
}

console.log(`Found ${accounts?.length ?? 0} stripe_accounts row(s)\n`);

let mismatchCount = 0;

for (const row of accounts ?? []) {
  console.log(`Chef: ${row.chef_profile_id}`);
  console.log(`  DB stripe_account_id: ${row.stripe_account_id}`);
  console.log(`  DB payouts_enabled: ${row.payouts_enabled}`);
  console.log(`  DB onboarding_status: ${row.onboarding_status}`);

  try {
    const acct = await stripe.accounts.retrieve(row.stripe_account_id);
    const stripeMatch = acct.id === row.stripe_account_id;
    const payoutsMatch = (acct.payouts_enabled ?? false) === row.payouts_enabled;

    console.log(`  Stripe id match: ${stripeMatch ? "YES" : "NO — CRITICAL"}`);
    console.log(`  Stripe payouts_enabled: ${acct.payouts_enabled}`);
    console.log(`  Stripe details_submitted: ${acct.details_submitted}`);
    console.log(`  payouts_enabled match: ${payoutsMatch ? "YES" : "NO — NEEDS SYNC"}`);

    if (!stripeMatch || !payoutsMatch) mismatchCount++;
  } catch (err) {
    console.log(`  Stripe retrieve FAILED: ${err.message}`);
    mismatchCount++;
  }
  console.log("");
}

const { data: stuckTransfers } = await client
  .from("transfers")
  .select("id, status, failure_reason, chef_profile_id")
  .eq("status", "pending")
  .ilike("failure_reason", "%onboarding incomplete%");

if (stuckTransfers?.length) {
  console.log(`Stuck transfers (onboarding incomplete): ${stuckTransfers.length}`);
  for (const t of stuckTransfers) {
    console.log(`  ${t.id} chef=${t.chef_profile_id}`);
  }
}

console.log(mismatchCount === 0 ? "\n✅ All accounts aligned" : `\n⚠️  ${mismatchCount} mismatch(es) — run sync`);
process.exit(mismatchCount > 0 ? 1 : 0);
