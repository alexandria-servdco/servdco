/**
 * Verify family platform fee integrity in production DB + payment rows.
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadDbUrl() {
  const envPath = path.join(root, ".env.local");
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (line.startsWith("SUPABASE_DB_URL=")) {
      const raw = line.slice("SUPABASE_DB_URL=".length).trim();
      try {
        return new URL(raw).toString();
      } catch {
        const m = raw.match(/^postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)$/);
        if (m) {
          const [, user, pass, host, db] = m;
          return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${db}`;
        }
      }
    }
  }
  throw new Error("SUPABASE_DB_URL missing");
}

const client = new pg.Client({
  connectionString: loadDbUrl(),
  ssl: { rejectUnauthorized: false },
});

const report = {
  timestamp: new Date().toISOString(),
  platformSetting: null,
  bookingsSample: [],
  paymentsSample: [],
  mismatches: [],
  cookOverpayRisk: [],
  status: "PASS",
};

function splitPayment(sessionCents, feePct = 13) {
  const platformFeeCents = Math.round((sessionCents * feePct) / 100);
  return {
    platformFeeCents,
    cookPayoutCents: sessionCents - platformFeeCents,
  };
}

await client.connect();

const { rows: setting } = await client.query(
  `SELECT value FROM platform_settings WHERE key = 'family_platform_fee_dollars'`,
);
report.platformSetting = setting[0]?.value ?? null;

const { rows: bookings } = await client.query(`
  SELECT id, price_cents, family_platform_fee_cents, platform_fee_cents, cook_payout_cents, status, created_at
  FROM bookings
  WHERE deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT 20
`);

report.bookingsSample = bookings;

for (const b of bookings) {
  const sessionCents = b.price_cents;
  const familyFee = b.family_platform_fee_cents ?? 0;
  const expectedCharge = sessionCents + familyFee;
  const expected = splitPayment(sessionCents);

  if (familyFee > 0) {
    report.familyFeeBookings = report.familyFeeBookings ?? [];
    report.familyFeeBookings.push({
      bookingId: b.id,
      sessionCents,
      familyFee,
      expectedCharge,
    });
  }

  // Cook payout must always be based on session price only
  if (b.cook_payout_cents > sessionCents) {
    report.cookOverpayRisk.push({
      bookingId: b.id,
      cookPayoutCents: b.cook_payout_cents,
      sessionCents,
      issue: "cook_payout exceeds session price",
    });
  }

  if (familyFee > 0 && b.cook_payout_cents !== expected.cookPayoutCents) {
    report.cookOverpayRisk.push({
      bookingId: b.id,
      cookPayoutCents: b.cook_payout_cents,
      expectedCookPayout: expected.cookPayoutCents,
      familyFeeExcluded: false,
    });
  }

  const { rows: pays } = await client.query(
    `SELECT id, amount_cents, platform_fee_cents, cook_payout_cents, status
     FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [b.id],
  );
  if (pays[0]) {
    report.paymentsSample.push({ bookingId: b.id, ...pays[0], expectedCharge });
    const p = pays[0];
    if (familyFee > 0 && p.amount_cents !== expectedCharge) {
      report.mismatches.push({
        bookingId: b.id,
        field: "payment.amount_cents vs session+family",
        expected: expectedCharge,
        actual: p.amount_cents,
      });
    }
    if (familyFee > 0 && p.cook_payout_cents !== expected.cookPayoutCents) {
      report.cookOverpayRisk.push({
        bookingId: b.id,
        paymentId: p.id,
        cookPayoutCents: p.cook_payout_cents,
        expectedCookPayout: expected.cookPayoutCents,
        familyFeeExcluded: p.cook_payout_cents <= expected.cookPayoutCents,
      });
    }
  }
}

if (report.cookOverpayRisk.length > 0) {
  report.status = "FAIL";
} else if (!(report.familyFeeBookings?.length > 0)) {
  report.status = "WARN";
  report.note =
    "No post-migration bookings with family_platform_fee_cents > 0 yet. Code + unit tests verify $5 fee path.";
} else if (report.mismatches.length > 0) {
  report.status = "FAIL";
}

const out = path.join(__dirname, "family-platform-fee-audit.json");
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await client.end();
process.exit(report.status === "FAIL" ? 1 : 0);
