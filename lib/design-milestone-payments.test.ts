import { describe, expect, it } from "vitest";
import {
  canSendMilestoneInvoice,
  mergeMilestonePaid,
  mergeMilestoneSent,
  milestoneCheckoutTotalCents,
  parseDesignMilestones,
} from "@/lib/design-milestone-payments";
import { buildMilestoneCheckoutSessionParams } from "@/lib/milestone-checkout-session";

describe("design milestone payments", () => {
  it("allows 40% invoice after deposit_paid", () => {
    const payload = { paymentOption: "deposit" };
    expect(canSendMilestoneInvoice("deposit_paid", payload, "milestone2")).toEqual({ ok: true });
  });

  it("blocks 10% invoice until 40% is paid", () => {
    const payload = { paymentOption: "deposit" };
    expect(canSendMilestoneInvoice("deposit_paid", payload, "milestone3").ok).toBe(false);
    expect(canSendMilestoneInvoice("milestone2_paid", payload, "milestone3")).toEqual({ ok: true });
  });

  it("tracks sent and paid state in payload", () => {
    const payload = { paymentOption: "deposit" };
    const sent = mergeMilestoneSent(payload, "milestone2", "cs_test_123");
    const milestones = parseDesignMilestones(sent);
    expect(milestones.milestone2?.checkoutSessionId).toBe("cs_test_123");
    expect(milestones.milestone2?.sentAt).toBeTruthy();

    const paid = mergeMilestonePaid(sent, "milestone2", "cs_test_123");
    expect(parseDesignMilestones(paid).milestone2?.paidAt).toBeTruthy();
  });

  it("adds 3% card fee on milestone checkout totals", () => {
    expect(milestoneCheckoutTotalCents("milestone2", "ach")).toBe(319920);
    expect(milestoneCheckoutTotalCents("milestone2", "card")).toBe(329518);
  });
});

describe("buildMilestoneCheckoutSessionParams", () => {
  it("creates payment-mode checkout with milestone metadata", () => {
    const params = buildMilestoneCheckoutSessionParams(
      {
        fullName: "Jane Doe",
        email: "jane@example.com",
        businessName: "Jane Plumbing",
        promoCode: "",
        paymentChannel: "ach",
      },
      "milestone2",
      { origin: "https://998webdesigns.com", wdLeadId: "lead-1" }
    );

    expect(params.mode).toBe("payment");
    expect(params.metadata?.paymentType).toBe("milestone_2");
    expect(params.metadata?.wdLeadId).toBe("lead-1");
    expect(params.line_items?.[0].price_data?.unit_amount).toBe(319920);
  });
});
