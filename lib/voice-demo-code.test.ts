import { describe, expect, it } from "vitest";
import { normalizeVerificationCode } from "@/lib/voice-demo-code";
import { codesMatch, hashVerificationCode } from "@/lib/voice-demo-otp";

describe("voice demo verification code", () => {
  it("normalizes spoken digits", () => {
    expect(normalizeVerificationCode("4 7 9 8 2 1")).toBe("479821");
    expect(normalizeVerificationCode("four seven nine eight two one")).toBe("479821");
  });

  it("matches hashed email OTP", () => {
    const code = "123456";
    const hash = hashVerificationCode(code);
    expect(codesMatch(hash, "123456")).toBe(true);
    expect(codesMatch(hash, "123457")).toBe(false);
  });
});
