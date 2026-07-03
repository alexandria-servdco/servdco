import { describe, it, expect } from "vitest";
import {
  cookTransferIdempotencyKey,
  isProcessingStale,
  assertSupabaseWrite,
  TRANSFER_CLAIMABLE_STATUSES,
} from "./transferIntegrity.js";

describe("cookTransferIdempotencyKey", () => {
  it("generates deterministic servdco cook_transfer key", () => {
    const transferId = "11111111-1111-4111-8111-111111111111";
    expect(cookTransferIdempotencyKey(transferId)).toBe(
      `servdco_cook_transfer_${transferId}`,
    );
    expect(cookTransferIdempotencyKey(transferId).length).toBeLessThanOrEqual(
      255,
    );
  });

  it("prevents duplicate Stripe requests for the same transfer id", () => {
    const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    expect(cookTransferIdempotencyKey(id)).toBe(cookTransferIdempotencyKey(id));
  });
});

describe("atomic claim statuses", () => {
  it("allows scheduled, pending, failed, and retry_scheduled", () => {
    expect(TRANSFER_CLAIMABLE_STATUSES).toEqual([
      "scheduled",
      "pending",
      "failed",
      "retry_scheduled",
    ]);
    expect(TRANSFER_CLAIMABLE_STATUSES).not.toContain("processing");
    expect(TRANSFER_CLAIMABLE_STATUSES).not.toContain("paid");
    expect(TRANSFER_CLAIMABLE_STATUSES).not.toContain("action_required");
  });
});

describe("isProcessingStale", () => {
  it("returns false before timeout elapses", () => {
    const now = Date.now();
    const updatedAt = new Date(now - 10 * 60 * 1000).toISOString();
    expect(isProcessingStale(updatedAt, 30 * 60 * 1000, now)).toBe(false);
  });

  it("returns true after timeout elapses", () => {
    const now = Date.now();
    const updatedAt = new Date(now - 31 * 60 * 1000).toISOString();
    expect(isProcessingStale(updatedAt, 30 * 60 * 1000, now)).toBe(true);
  });
});

describe("assertSupabaseWrite", () => {
  it("throws on Supabase error", () => {
    expect(() =>
      assertSupabaseWrite(
        {
          data: null,
          error: {
            message: "boom",
            name: "PostgrestError",
            details: "",
            hint: "",
            code: "500",
          } as import("@supabase/supabase-js").PostgrestError,
        },
        "test update",
      ),
    ).toThrow(/boom/);
  });

  it("throws when zero rows updated", () => {
    expect(() =>
      assertSupabaseWrite({ data: [], error: null }, "test update"),
    ).toThrow(/expected at least 1 row/);
  });

  it("returns data when write succeeds", () => {
    const row = { id: "x" };
    expect(
      assertSupabaseWrite({ data: [row], error: null }, "test update"),
    ).toEqual([row]);
  });
});

describe("concurrent execution simulation", () => {
  it("second claim loses when first claim succeeds", () => {
    const rows = new Map<string, string>();
    const transferId = "t1";

    function claim(status: string): boolean {
      if (!TRANSFER_CLAIMABLE_STATUSES.includes(status as never)) {
        return false;
      }
      if (rows.has(transferId)) return false;
      rows.set(transferId, "processing");
      return true;
    }

    expect(claim("scheduled")).toBe(true);
    expect(claim("scheduled")).toBe(false);
    expect(rows.get(transferId)).toBe("processing");
  });

  it("admin retry loses while cron holds processing claim", () => {
    const status = "processing";
    expect(TRANSFER_CLAIMABLE_STATUSES.includes(status as never)).toBe(false);
  });

  it("concurrent cron workers — only first claim wins", () => {
    let dbStatus = "scheduled";
    function atomicClaim(): boolean {
      if (!TRANSFER_CLAIMABLE_STATUSES.includes(dbStatus as never)) return false;
      dbStatus = "processing";
      return true;
    }
    expect(atomicClaim()).toBe(true);
    expect(atomicClaim()).toBe(false);
    expect(dbStatus).toBe("processing");
  });
});
