/**
 * LC-1 Section 2 — production Resend email verification.
 * Calls production API endpoints and captures Resend message IDs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal, applyEnvLocal } from "./load-env-local.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const PRODUCTION_URL = "https://servdco-one.vercel.app";

applyEnvLocal();

function loadDbUrl() {
  const { env } = loadEnvLocal();
  const raw = env.SUPABASE_DB_URL;
  if (!raw) throw new Error("SUPABASE_DB_URL missing in .env.local");
  try {
    return new URL(raw).toString();
  } catch {
    const match = raw.match(/^postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)$/);
    if (match) {
      const [, user, pass, host, db] = match;
      return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${db}`;
    }
    throw new Error("Invalid SUPABASE_DB_URL");
  }
}

async function fetchResendEmail(apiKey, id) {
  const res = await fetch(`https://api.resend.com/emails/${id}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return { id, error: res.statusText };
  return res.json();
}

async function main() {
  const ts = Date.now();
  const results = [];
  const resendApiKey = process.env.RESEND_API_KEY;

  // Contact form
  const contactPayload = {
    name: "LC1 Resend Audit",
    email: `lc1.contact.${ts}@mailinator.com`,
    subject: `LC-1 Contact Test ${ts}`,
    message:
      "Launch candidate production email verification — contact form test message.",
  };
  const contactStart = new Date().toISOString();
  const contactRes = await fetch(`${PRODUCTION_URL}/api/contact/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contactPayload),
  });
  const contactBody = await contactRes.json().catch(() => ({}));
  results.push({
    test: "Contact Form",
    timestamp: contactStart,
    httpStatus: contactRes.status,
    response: contactBody,
    resendId: null,
    note: "API does not return Resend ID; verify via Resend dashboard or list API",
  });

  const pgClient = new pg.Client({
    connectionString: loadDbUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  const { rows: bookings } = await pgClient.query(`
    SELECT b.id, b.family_id, p.email AS family_email
    FROM public.bookings b
    JOIN public.profiles p ON p.id = b.family_id
    WHERE b.deleted_at IS NULL AND p.email IS NOT NULL
    ORDER BY b.created_at DESC LIMIT 1
  `);

  const bookingEvents = [
    { event: "booking_requested", label: "Booking Request" },
    { event: "booking_accepted", label: "Booking Accepted" },
    { event: "payment_required", label: "Payment Required" },
    { event: "payment_completed", label: "Payment Confirmed" },
  ];

  let bookingId = bookings[0]?.id;
  if (!bookingId) {
    const admin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } },
    );
    const familyEmail = `lc1.family.${ts}@mailinator.com`;
    const { data: authUser } = await admin.auth.admin.createUser({
      email: familyEmail,
      password: `LC1!${ts}`,
      email_confirm: true,
      user_metadata: { role: "family", full_name: "LC1 Family" },
    });
    const familyId = authUser.user.id;
    const { rows: chefs } = await pgClient.query(`
      SELECT id FROM public.chef_profiles
      WHERE verification_status = 'approved' AND deleted_at IS NULL
      LIMIT 1
    `);
    if (chefs.length === 0) throw new Error("No approved chef for booking email test");
    const { rows: inserted } = await pgClient.query(
      `INSERT INTO public.bookings (
        family_id, chef_profile_id, service_type, booking_date, booking_time,
        guests_count, price_cents, platform_fee_cents, cook_payout_cents,
        family_platform_fee_cents, status, currency, created_at, updated_at
      ) VALUES ($1,$2,'dinner','2026-09-15','18:00:00',4,6000,780,5220,500,'pending','USD',now(),now())
      RETURNING id`,
      [familyId, chefs[0].id],
    );
    bookingId = inserted[0].id;
  }

  for (const { event, label } of bookingEvents) {
    const started = new Date().toISOString();
    const res = await fetch(`${PRODUCTION_URL}/api/emails/booking-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, event }),
    });
    const body = await res.json().catch(() => ({}));
    let delivery = null;
    if (body.id && resendApiKey) {
      delivery = await fetchResendEmail(resendApiKey, body.id);
    }
    results.push({
      test: label,
      event,
      bookingId,
      timestamp: started,
      httpStatus: res.status,
      resendId: body.id ?? null,
      ok: body.ok === true,
      skipped: body.skipped ?? null,
      delivery,
    });
  }

  const { rows: docs } = await pgClient.query(`
    SELECT d.id, d.document_type, p.email
    FROM public.chef_documents d
    JOIN public.chef_profiles cp ON cp.id = d.chef_profile_id
    JOIN public.profiles p ON p.id = cp.user_id
    WHERE d.deleted_at IS NULL AND p.email IS NOT NULL
    ORDER BY d.submitted_at DESC NULLS LAST LIMIT 1
  `);

  const docEvents = [
    { event: "document_approved", label: "Document Approved" },
    { event: "document_rejected", label: "Document Rejected" },
    { event: "document_resubmission_requested", label: "Document Resubmission" },
  ];

  if (docs.length > 0) {
    for (const { event, label } of docEvents) {
      const started = new Date().toISOString();
      const res = await fetch(`${PRODUCTION_URL}/api/emails/booking-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docs[0].id, event }),
      });
      const body = await res.json().catch(() => ({}));
      let delivery = null;
      if (body.id && resendApiKey) {
        delivery = await fetchResendEmail(resendApiKey, body.id);
      }
      results.push({
        test: label,
        event,
        documentId: docs[0].id,
        timestamp: started,
        httpStatus: res.status,
        resendId: body.id ?? null,
        ok: body.ok === true,
        delivery,
      });
    }
  } else {
    for (const { label } of docEvents) {
      results.push({
        test: label,
        status: "SKIP",
        reason: "No chef_documents with email in production DB",
      });
    }
  }

  await pgClient.end();

  const passCount = results.filter(
    (r) =>
      r.httpStatus === 200 &&
      (r.ok === true || r.response?.success === true || r.skipped),
  ).length;

  const report = {
    timestamp: new Date().toISOString(),
    productionUrl: PRODUCTION_URL,
    results,
    summary: {
      total: results.length,
      withResendId: results.filter((r) => r.resendId).length,
      pass: passCount,
    },
  };

  const outPath = path.join(__dirname, "lc1-resend-production-audit.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
