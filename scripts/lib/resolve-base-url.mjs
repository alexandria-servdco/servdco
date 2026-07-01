/**
 * Resolve deployment base URL for verification scripts.
 * Never hardcodes production domains — pass URL as argv or env.
 *
 * Priority: argv[2] → SMOKE_BASE_URL → SITE_URL → VERIFY_BASE_URL
 */
export function resolveBaseUrl(argv = process.argv) {
  const fromArg = argv[2];
  if (fromArg && !fromArg.startsWith("-")) {
    return fromArg.replace(/\/$/, "");
  }

  const fromEnv =
    process.env.SMOKE_BASE_URL ??
    process.env.SITE_URL ??
    process.env.VERIFY_BASE_URL ??
    process.env.VITE_SITE_URL;

  if (fromEnv) {
    const raw = fromEnv.trim();
    if (raw.startsWith("http")) return raw.replace(/\/$/, "");
    return `https://${raw.replace(/\/$/, "")}`;
  }

  console.error(
    "Missing base URL. Usage: node <script>.mjs https://your-deployment.example.com",
  );
  console.error("Or set SITE_URL, SMOKE_BASE_URL, or VERIFY_BASE_URL.");
  process.exit(1);
}
