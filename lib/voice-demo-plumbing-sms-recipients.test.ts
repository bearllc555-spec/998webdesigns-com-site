import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PLUMBING_BOOKING_SMS_MAX_RECIPIENTS,
  parsePlumbingDemoSmsCcNumbers,
  resolvePlumbingBookingSmsRecipients,
} from "@/lib/voice-demo-plumbing-sms-recipients";

describe("voice-demo-plumbing-sms-recipients", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns caller only when no CC env is set", () => {
    expect(resolvePlumbingBookingSmsRecipients("9734496700")).toEqual(["+19734496700"]);
  });

  it("parses comma-separated CC numbers", () => {
    vi.stubEnv("PLUMBING_DEMO_SMS_CC", "9735551111, 2015552222");
    expect(parsePlumbingDemoSmsCcNumbers()).toEqual(["9735551111", "2015552222"]);
    expect(resolvePlumbingBookingSmsRecipients("9734496700")).toEqual([
      "+19734496700",
      "+19735551111",
      "+12015552222",
    ]);
  });

  it("dedupes caller when also listed in CC env", () => {
    vi.stubEnv("PLUMBING_DEMO_SMS_CC", "9734496700,9735551111");
    expect(resolvePlumbingBookingSmsRecipients("9734496700")).toEqual([
      "+19734496700",
      "+19735551111",
    ]);
  });

  it("caps total recipients at four", () => {
    vi.stubEnv(
      "PLUMBING_DEMO_SMS_CC",
      "9735551111,9735552222,9735553333,9735554444,9735555555"
    );
    const recipients = resolvePlumbingBookingSmsRecipients("9734496700");
    expect(recipients).toHaveLength(PLUMBING_BOOKING_SMS_MAX_RECIPIENTS);
    expect(recipients[0]).toBe("+19734496700");
  });
});
