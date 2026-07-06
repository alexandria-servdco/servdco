import { describe, it, expect } from "vitest";
import {
  bookingTransferGroup,
  buildCookTransferCreateParams,
  cookTransferIdempotencyKey,
  tipTransferGroup,
  tipTransferIdempotencyKey,
} from "./transferFunding.js";

describe("transferFunding", () => {
  const transferId = "2e078a27-487d-4093-b6a9-29f8eaca7e78";
  const bookingId = "eb68c768-ad88-43a4-af46-63775ba98594";
  const chargeId = "ch_3TneJiA4ZMjGNuZk0example";

  it("uses distinct idempotency namespace when charge-linked", () => {
    expect(cookTransferIdempotencyKey(transferId, false)).toBe(
      `servdco_cook_transfer_${transferId}`,
    );
    expect(cookTransferIdempotencyKey(transferId, true)).toBe(
      `servdco_cook_transfer_st_${transferId}`,
    );
    expect(cookTransferIdempotencyKey(transferId, false)).not.toBe(
      cookTransferIdempotencyKey(transferId, true),
    );
  });

  it("builds Stripe transfer params with source_transaction only (no transfer_group)", () => {
    const params = buildCookTransferCreateParams({
      amountCents: 3480,
      stripeAccountId: "acct_1TneBCADnz2Uvqsw",
      transferId,
      paymentId: "892e08e7-6c29-4f1a-8c24-0d18e8c126ba",
      bookingId,
      chefProfileId: "3da4b4c1-d7de-443b-9d43-dc574107413b",
      sourceChargeId: chargeId,
    });

    expect(params).toEqual({
      amount: 3480,
      currency: "usd",
      destination: "acct_1TneBCADnz2Uvqsw",
      source_transaction: chargeId,
      metadata: {
        transfer_id: transferId,
        payment_id: "892e08e7-6c29-4f1a-8c24-0d18e8c126ba",
        booking_id: bookingId,
        chef_profile_id: "3da4b4c1-d7de-443b-9d43-dc574107413b",
      },
    });
    expect(params.transfer_group).toBeUndefined();
  });

  it("uses transfer_group when transfer is not charge-linked", () => {
    const params = buildCookTransferCreateParams({
      amountCents: 3480,
      stripeAccountId: "acct_1TneBCADnz2Uvqsw",
      transferId,
      paymentId: "892e08e7-6c29-4f1a-8c24-0d18e8c126ba",
      bookingId,
      chefProfileId: "3da4b4c1-d7de-443b-9d43-dc574107413b",
      sourceChargeId: null,
    });

    expect(params.transfer_group).toBe(bookingTransferGroup(bookingId));
    expect(params.source_transaction).toBeUndefined();
  });

  it("uses stable transfer group helpers", () => {
    expect(bookingTransferGroup(bookingId)).toBe(`booking_${bookingId}`);
    expect(tipTransferGroup(bookingId)).toBe(`tip_${bookingId}`);
  });

  it("uses distinct tip idempotency namespace when charge-linked", () => {
    const tipId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    expect(tipTransferIdempotencyKey(tipId, true)).toBe(
      `servdco_tip_transfer_st_${tipId}`,
    );
  });
});
