import { describe, expect, it } from "vitest";
import { normalizeVerificationCode } from "@/lib/voice-demo-code";
import { codesMatch, hashVerificationCode } from "@/lib/voice-demo-otp";
import { spellEmailForVoice } from "@/lib/voice-demo-spell-email";

describe("voice demo verification code", () => {
  it("normalizes spoken digits", () => {
    expect(normalizeVerificationCode("4 7 9 8 2 1")).toBe("479821");
    expect(normalizeVerificationCode("four seven nine eight two one")).toBe("479821");
  });

  it("spells email for voice read-back", () => {
    expect(spellEmailForVoice("ademeo@gmail.com")).toBe("a d e m e o @gmail.com");
    expect(spellEmailForVoice("bear@gmail.com")).toBe("b e a r @gmail.com");
    expect(spellEmailForVoice("a.b+9@co.uk")).toBe("a . b + 9 @co.uk");
  });

  it("matches hashed email OTP", () => {
    const code = "123456";
    const hash = hashVerificationCode(code);
    expect(codesMatch(hash, "123456")).toBe(true);
    expect(codesMatch(hash, "123457")).toBe(false);
  });
});
