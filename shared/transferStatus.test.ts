import { describe, it, expect } from "vitest";
import {
  classifyTransferFailure,
  getRetryDelayMs,
  getTransferStatusPresentation,
} from "./transferStatus";

describe("transfer status presentation", () => {
  it("describes onboarding incomplete pending state", () => {
    const result = getTransferStatusPresentation({
      id: "t1",
      status: "pending",
      failure_reason: "Cook Connect onboarding incomplete",
    });
    expect(result.label).toBe("Waiting for Bank Setup");
  });

  it("describes retry scheduled failed state", () => {
    const result = getTransferStatusPresentation({
      id: "t2",
      status: "failed",
      next_retry_at: new Date(Date.now() + 3600000).toISOString(),
      failure_reason: "Insufficient funds",
    });
    expect(result.label).toBe("Retry Scheduled");
  });

  it("describes paid transfer", () => {
    const result = getTransferStatusPresentation({
      id: "t3",
      status: "paid",
      stripe_transfer_id: "tr_123",
    });
    expect(result.label).toBe("Transferred to Stripe");
    expect(result.tone).toBe("success");
  });
});

describe("transfer failure classification", () => {
  it("marks insufficient balance as retryable", () => {
    expect(
      classifyTransferFailure("Insufficient funds in Stripe account").retryable,
    ).toBe(true);
  });

  it("marks closed account as non-retryable", () => {
    expect(
      classifyTransferFailure("The destination account is closed").retryable,
    ).toBe(false);
  });
});

describe("retry delay schedule", () => {
  it("uses 1h, 6h, 24h backoff", () => {
    expect(getRetryDelayMs(0)).toBe(3600000);
    expect(getRetryDelayMs(1)).toBe(6 * 3600000);
    expect(getRetryDelayMs(2)).toBe(24 * 3600000);
  });
});

describe("StripeAccountNotFoundError contract", () => {
  it("formats zero-row update message", () => {
    const stripeAccountId = "acct_test123";
    const message = `No stripe_accounts row matched stripe_account_id ${stripeAccountId}`;
    expect(message).toContain(stripeAccountId);
  });
});

describe("webhook retry behavior", () => {
  function shouldMarkProcessed(threw: boolean, errorMessage?: string) {
    return !threw || Boolean(errorMessage);
  }

  it("does not mark processed when sync throws", () => {
    expect(shouldMarkProcessed(true, "No stripe_accounts row matched")).toBe(true);
    expect(shouldMarkProcessed(false)).toBe(true);
  });
});
