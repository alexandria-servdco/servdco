import { afterEach, describe, expect, it, vi } from "vitest";

const PROD_SECRET = "whsec_production_secret";
const LOCAL_SECRET = "whsec_local_cli_secret";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("getStripeWebhookSecret", () => {
  it("uses STRIPE_WEBHOOK_SECRET_LOCAL when not in Vercel production", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", PROD_SECRET);
    vi.stubEnv("STRIPE_WEBHOOK_SECRET_LOCAL", LOCAL_SECRET);
    vi.stubEnv("VERCEL_ENV", "development");

    const { getStripeWebhookSecret } = await import("./env");
    expect(getStripeWebhookSecret()).toBe(LOCAL_SECRET);
  });

  it("uses STRIPE_WEBHOOK_SECRET_LOCAL when VERCEL_ENV is unset (local dev)", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", PROD_SECRET);
    vi.stubEnv("STRIPE_WEBHOOK_SECRET_LOCAL", LOCAL_SECRET);
    delete process.env.VERCEL_ENV;

    const { getStripeWebhookSecret } = await import("./env");
    expect(getStripeWebhookSecret()).toBe(LOCAL_SECRET);
  });

  it("ignores STRIPE_WEBHOOK_SECRET_LOCAL when VERCEL_ENV is production", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", PROD_SECRET);
    vi.stubEnv("STRIPE_WEBHOOK_SECRET_LOCAL", LOCAL_SECRET);
    vi.stubEnv("VERCEL_ENV", "production");

    const { getStripeWebhookSecret } = await import("./env");
    expect(getStripeWebhookSecret()).toBe(PROD_SECRET);
  });
});

describe("getStripeWebhookSecretSource", () => {
  it("reports local when LOCAL override is active outside production", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", PROD_SECRET);
    vi.stubEnv("STRIPE_WEBHOOK_SECRET_LOCAL", LOCAL_SECRET);
    vi.stubEnv("VERCEL_ENV", "preview");

    const { getStripeWebhookSecretSource } = await import("./env");
    expect(getStripeWebhookSecretSource()).toBe("local");
  });

  it("reports production when LOCAL is set but VERCEL_ENV is production", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", PROD_SECRET);
    vi.stubEnv("STRIPE_WEBHOOK_SECRET_LOCAL", LOCAL_SECRET);
    vi.stubEnv("VERCEL_ENV", "production");

    const { getStripeWebhookSecretSource } = await import("./env");
    expect(getStripeWebhookSecretSource()).toBe("production");
  });
});
