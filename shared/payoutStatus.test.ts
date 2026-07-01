import { describe, it, expect } from "vitest";
import {
  resolveCookPayoutState,
  resolveTransferPresentation,
  buildTransferTimeline,
  isBankConnected,
  isStaleOnboardingNotification,
  IN_PIPELINE_TRANSFER_STATUSES,
} from "./payoutStatus";

const connectedAccount = {
  onboarding_status: "complete" as const,
  charges_enabled: true,
  payouts_enabled: true,
  stripe_account_id: "acct_123",
};

const incompleteAccount = {
  onboarding_status: "not_started" as const,
  charges_enabled: false,
  payouts_enabled: false,
  stripe_account_id: null,
};

describe("resolveTransferPresentation", () => {
  it("shows Waiting for Bank Setup only when onboarding is incomplete", () => {
    const result = resolveTransferPresentation(
      {
        id: "t1",
        status: "pending",
        failure_reason: "Cook Connect onboarding incomplete",
      },
      incompleteAccount,
    );
    expect(result.label).toBe("Waiting for Bank Setup");
  });

  it("connected account + old onboarding failure shows Pending Transfer", () => {
    const result = resolveTransferPresentation(
      {
        id: "t1",
        status: "pending",
        failure_reason: "Cook Connect onboarding incomplete",
      },
      connectedAccount,
    );
    expect(result.label).toBe("Pending Transfer");
    expect(result.label).not.toBe("Waiting for Bank Setup");
  });

  it("connected account + pending transfer never mentions bank setup", () => {
    const result = resolveTransferPresentation(
      { id: "t2", status: "pending" },
      connectedAccount,
    );
    expect(result.label).toBe("Pending Transfer");
    expect(result.description.toLowerCase()).not.toContain("connect");
  });

  it("connected account + retry scheduled shows platform delay copy", () => {
    const result = resolveTransferPresentation(
      {
        id: "t3",
        status: "retry_scheduled",
        failure_reason: "Insufficient funds in Stripe account",
        next_retry_at: new Date(Date.now() + 86400000).toISOString(),
      },
      connectedAccount,
    );
    expect(result.label).toBe("Retry Scheduled");
    expect(result.description.toLowerCase()).toContain("automatic retry");
    expect(result.description.toLowerCase()).not.toContain("connect");
  });

  it("connected account + paid transfer", () => {
    const result = resolveTransferPresentation(
      {
        id: "t4",
        status: "paid",
        stripe_transfer_id: "tr_abc123",
      },
      connectedAccount,
    );
    expect(result.label).toBe("Paid");
    expect(result.tone).toBe("success");
  });

  it("processing transfer shows spinner-friendly copy", () => {
    const result = resolveTransferPresentation(
      { id: "t5", status: "processing" },
      connectedAccount,
    );
    expect(result.label).toBe("Processing Transfer");
  });

  it("scheduled transfer before hold date", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const result = resolveTransferPresentation(
      { id: "t6", status: "scheduled", scheduled_at: future },
      connectedAccount,
    );
    expect(result.label).toBe("Scheduled");
  });
});

describe("resolveCookPayoutState", () => {
  it("connected account never shows connect bank warning", () => {
    const state = resolveCookPayoutState(connectedAccount, [
      {
        id: "t1",
        status: "pending",
        failure_reason: "Cook Connect onboarding incomplete",
        net_amount_cents: 5000,
      },
    ]);
    expect(state.bankConnected).toBe(true);
    expect(state.verificationComplete).toBe(true);
    expect(state.showGlobalWarning).toBe(false);
    expect(state.showConnectButton).toBe(false);
    expect(state.globalWarningMessage).toBeNull();
  });

  it("connected + pending transfer shows scheduled status not bank setup", () => {
    const state = resolveCookPayoutState(connectedAccount, [
      {
        id: "t1",
        status: "pending",
        net_amount_cents: 7500,
        scheduled_at: new Date().toISOString(),
      },
    ]);
    expect(state.currentTransferStatus).toBe("Pending Transfer");
    expect(state.pendingEarningsCents).toBe(7500);
  });

  it("connected + retry scheduled — no admin contact, no connect button", () => {
    const state = resolveCookPayoutState(connectedAccount, [
      {
        id: "t1",
        status: "retry_scheduled",
        failure_reason: "Insufficient funds",
        net_amount_cents: 10000,
        next_retry_at: new Date(Date.now() + 86400000).toISOString(),
      },
    ]);
    expect(state.badge).toBe("Retry Scheduled");
    expect(state.showConnectButton).toBe(false);
    expect(state.description.toLowerCase()).not.toContain("connect");
  });

  it("incomplete onboarding shows connect actions only", () => {
    const state = resolveCookPayoutState(incompleteAccount, []);
    expect(state.onboardingIncomplete).toBe(true);
    expect(state.showConnectButton).toBe(true);
    expect(state.showGlobalWarning).toBe(true);
    expect(state.actionButtons.some((b) => b.id === "connect")).toBe(true);
  });

  it("never shows bank connected AND connect bank simultaneously", () => {
    const state = resolveCookPayoutState(connectedAccount, [
      {
        id: "t1",
        status: "scheduled",
        net_amount_cents: 5000,
        scheduled_at: new Date().toISOString(),
      },
    ]);
    expect(state.bankConnected).toBe(true);
    expect(state.showConnectButton).toBe(false);
    const healthBank = state.healthLines.find((l) => l.key === "bank");
    expect(healthBank?.ok).toBe(true);
  });

  it("includes retry_scheduled in pipeline earnings", () => {
    expect(IN_PIPELINE_TRANSFER_STATUSES).toContain("retry_scheduled");
    const state = resolveCookPayoutState(connectedAccount, [
      {
        id: "t1",
        status: "retry_scheduled",
        net_amount_cents: 4200,
      },
    ]);
    expect(state.pendingEarningsCents).toBe(4200);
  });
});

describe("buildTransferTimeline", () => {
  it("connected account timeline has no onboarding stage", () => {
    const stages = buildTransferTimeline(
      {
        id: "t1",
        status: "scheduled",
        failure_reason: "Cook Connect onboarding incomplete",
        scheduled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      connectedAccount,
    );
    const labels = stages.map((s) => s.label.toLowerCase()).join(" ");
    expect(labels).not.toContain("onboarding");
    expect(labels).not.toContain("bank setup");
    expect(stages.some((s) => s.label === "Family Paid")).toBe(true);
    expect(stages.some((s) => s.label === "Bank Deposit")).toBe(true);
  });
});

describe("isStaleOnboardingNotification", () => {
  it("hides onboarding prompts when bank is connected", () => {
    expect(
      isStaleOnboardingNotification(
        "Stripe setup incomplete",
        "Please finish connecting your bank account in Stripe.",
        connectedAccount,
      ),
    ).toBe(true);
  });

  it("keeps notifications when bank not connected", () => {
    expect(
      isStaleOnboardingNotification(
        "Stripe setup incomplete",
        "Please finish connecting your bank account.",
        incompleteAccount,
      ),
    ).toBe(false);
  });
});

describe("isBankConnected", () => {
  it("requires both payouts and charges enabled", () => {
    expect(
      isBankConnected({
        payouts_enabled: true,
        charges_enabled: true,
        onboarding_status: "complete",
      }),
    ).toBe(true);
    expect(
      isBankConnected({
        payouts_enabled: true,
        charges_enabled: false,
        onboarding_status: "pending",
      }),
    ).toBe(false);
  });
});
