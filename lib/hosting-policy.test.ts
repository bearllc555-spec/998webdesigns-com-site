import { describe, expect, it } from "vitest";
import { hostingBillingStartsAt, HOSTING_TRIAL_DAYS } from "@/lib/hosting-policy";

describe("hosting policy", () => {
  it("billing starts 90 days after payment cleared", () => {
    const paid = new Date("2026-06-01T12:00:00.000Z");
    const starts = hostingBillingStartsAt(paid);
    expect(starts.toISOString()).toBe("2026-08-30T12:00:00.000Z");
    expect(HOSTING_TRIAL_DAYS).toBe(90);
  });
});
