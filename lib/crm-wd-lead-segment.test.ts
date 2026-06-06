import { describe, expect, it } from "vitest";
import { isWdLeadClientStatus, wdLeadCrmFeedSource } from "@/lib/crm-wd-lead-segment";

describe("crm wd_leads segment", () => {
  it("treats deposit and later as clients", () => {
    expect(isWdLeadClientStatus("deposit_paid")).toBe(true);
    expect(isWdLeadClientStatus("milestone2_paid")).toBe(true);
    expect(isWdLeadClientStatus("paid_in_full")).toBe(true);
    expect(wdLeadCrmFeedSource("deposit_paid")).toBe("client");
  });

  it("keeps pre-payment rows as leads", () => {
    expect(isWdLeadClientStatus("awaiting_payment")).toBe(false);
    expect(isWdLeadClientStatus("awaiting_bank_settlement")).toBe(false);
    expect(wdLeadCrmFeedSource("new")).toBe("lead");
    expect(wdLeadCrmFeedSource("awaiting_payment")).toBe("lead");
  });
});
