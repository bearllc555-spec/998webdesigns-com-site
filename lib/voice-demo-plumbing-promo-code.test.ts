import { describe, expect, it } from "vitest";
import {
  generatePlumbingPromoCode,
  isPlumbingPromoCode,
  PLUMBING_PROMO_CODE_PREFIX,
} from "@/lib/voice-demo-plumbing-promo-code";

describe("voice-demo-plumbing-promo-code", () => {
  it("generates MPD- codes without ambiguous characters", () => {
    const code = generatePlumbingPromoCode();
    expect(code.startsWith(PLUMBING_PROMO_CODE_PREFIX)).toBe(true);
    expect(isPlumbingPromoCode(code)).toBe(true);
    expect(code).not.toMatch(/[01OI]/);
  });

  it("validates promo code shape", () => {
    expect(isPlumbingPromoCode("MPD-K7N2P4")).toBe(true);
    expect(isPlumbingPromoCode("mpd-k7n2p4")).toBe(true);
    expect(isPlumbingPromoCode("VOICE20")).toBe(false);
  });
});
