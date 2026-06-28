/**
 * Phase 4 Connect completion — read-only + transfer process only.
 * Uses existing account acct_1ThOh8PMaZP2oyIt (no new Stripe accounts).
 */
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { loadEnvLocal, applyEnvLocal } from "./load-env-local.mjs";

const ACCOUNT_ID = "acct_1ThOh8PMaZP2oyIt";
const API = process.env.CONNECT_API_BASE ?? "http://localhost:3000";

applyEnvLocal();
const { env } = loadEnvLocal();

const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const mode = process.argv[2] ?? "precheck";

async function precheck() {
  const { data: saRow, error } = await admin
    .from("stripe_accounts")
    .select("*")
    .eq("stripe_account_id", ACCOUNT_ID)
    .maybeSingle();

  const account = await stripe.accounts.retrieve(ACCOUNT_ID);

  let onboardingUrl = null;
  if (!account.charges_enabled || !account.payouts_enabled) {
    const link = await stripe.accountLinks.create({
      account: ACCOUNT_ID,
      type: "account_onboarding",
      return_url: "http://localhost:8080/chef-dashboard?stripe=return",
      refresh_url: "http://localhost:8080/chef-dashboard?stripe=refresh",
    });
    onboardingUrl = link.url;
  }

  const { data: transfers } = await admin
    .from("transfers")
    .select("*")
    .eq("chef_profile_id", saRow?.chef_profile_id ?? "00000000-0000-0000-0000-000000000000")
    .order("created_at", { ascending: false })
    .limit(5);

  console.log(
    JSON.stringify(
      {
        mode: "precheck",
        stripe_account_id: ACCOUNT_ID,
        db: saRow,
        dbError: error?.message ?? null,
        stripe: {
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
        },
        onboarding_url: onboardingUrl,
        pending_transfers: transfers,
      },
      null,
      2,
    ),
  );
}

async function verify() {
  const { data: saRow } = await admin
    .from("stripe_accounts")
    .select("*")
    .eq("stripe_account_id", ACCOUNT_ID)
    .maybeSingle();

  const account = await stripe.accounts.retrieve(ACCOUNT_ID);

  const transferRun = await fetch(`${API}/api/stripe/transfers/process`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
  });
  const transferBody = await transferRun.json().catch(() => ({}));

  const { data: transfersAfter } = await admin
    .from("transfers")
    .select("*")
    .eq("chef_profile_id", saRow?.chef_profile_id ?? "00000000-0000-0000-0000-000000000000")
    .order("updated_at", { ascending: false })
    .limit(5);

  const paidTransfer = transfersAfter?.find((t) => t.status === "paid");

  console.log(
    JSON.stringify(
      {
        mode: "verify",
        stripe: {
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
        },
        db_stripe_account: saRow,
        transfer_processor: {
          status: transferRun.status,
          body: transferBody,
        },
        transfers: transfersAfter,
        paid_transfer: paidTransfer ?? null,
      },
      null,
      2,
    ),
  );
}

if (mode === "verify") await verify();
else await precheck();
