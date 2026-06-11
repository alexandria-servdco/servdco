/**
 * Phase 4 auth verification (cloud). Requires env:
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_DB_URL
 * Do not commit credentials.
 */
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;

if (!url || !anonKey || !dbUrl) {
  console.error("Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_DB_URL");
  process.exit(1);
}

const stamp = Date.now();
const familyEmail = `phase4-family-${stamp}@example.com`;
const chefEmail = `phase4-chef-${stamp}@example.com`;
const password = "TestPass123!";

const supabase = createClient(url, anonKey);
const pgClient = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

const results = [];

function pass(name, detail) {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}: ${detail}`);
}

function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}: ${detail}`);
}

try {
  await pgClient.connect();

  // Family signup
  const familySignUp = await supabase.auth.signUp({
    email: familyEmail,
    password,
    options: {
      data: {
        role: "family",
        full_name: "Phase4 Family",
        city: "Columbus",
        state: "Ohio",
        zip: "43215",
        phone: "555-0100",
      },
    },
  });

  if (familySignUp.error) {
    fail("family signup", familySignUp.error.message);
  } else {
    const familyId = familySignUp.data.user?.id;
    await new Promise((r) => setTimeout(r, 800));
    const { rows: familyRows } = await pgClient.query(
      "SELECT id, role, full_name FROM public.profiles WHERE email = $1",
      [familyEmail],
    );
    if (familyRows[0]?.role === "family") {
      pass("family profile bootstrap", `id=${familyId}, role=family`);
    } else {
      fail("family profile bootstrap", JSON.stringify(familyRows));
    }

    if (familySignUp.data.session) {
      const { data: ownProfile, error: rlsErr } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", familyId)
        .single();
      if (rlsErr) fail("family RLS select own", rlsErr.message);
      else pass("family RLS select own", `role=${ownProfile?.role}`);
    } else {
      pass("family signup", "email confirmation required (no session)");
    }
  }

  await supabase.auth.signOut();

  // Chef signup
  const chefSignUp = await supabase.auth.signUp({
    email: chefEmail,
    password,
    options: {
      data: {
        role: "chef",
        full_name: "Phase4 Cook",
        city: "Austin",
        state: "Texas",
        zip: "78701",
        phone: "555-0200",
        primary_cuisine: "Italian",
        years_experience: "5",
        bio: "Test chef bio",
      },
    },
  });

  if (chefSignUp.error) {
    fail("chef signup", chefSignUp.error.message);
  } else {
    const chefId = chefSignUp.data.user?.id;
    await new Promise((r) => setTimeout(r, 800));
    const { rows: chefProfileRows } = await pgClient.query(
      `SELECT p.role, cp.user_id, cp.verification_status, cp.cuisines
       FROM public.profiles p
       LEFT JOIN public.chef_profiles cp ON cp.user_id = p.id
       WHERE p.email = $1`,
      [chefEmail],
    );
    const row = chefProfileRows[0];
    if (row?.role === "chef" && row?.user_id) {
      pass(
        "chef profile bootstrap",
        `role=chef, chef_profiles=yes, verification=${row.verification_status}`,
      );
    } else {
      fail("chef profile bootstrap", JSON.stringify(chefProfileRows));
    }

    if (chefSignUp.data.session) {
      const { error: chefRlsErr } = await supabase
        .from("chef_profiles")
        .select("user_id")
        .eq("user_id", chefId)
        .single();
      if (chefRlsErr) fail("chef RLS select own", chefRlsErr.message);
      else pass("chef RLS select own", "ok");
    }
  }

  // Feature flag default
  const { rows: flagRows } = await pgClient.query(
    "SELECT enabled FROM public.feature_flags WHERE key = 'use_supabase_auth'",
  );
  if (flagRows[0]?.enabled === false) {
    pass("feature flag default", "use_supabase_auth=false");
  } else {
    fail("feature flag default", `enabled=${flagRows[0]?.enabled}`);
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length) process.exit(1);
  console.log("\nAll auth migration checks passed.");
} catch (err) {
  console.error("Verification failed:", err.message);
  process.exit(1);
} finally {
  await pgClient.end();
}
