import { describe, expect, it } from "vitest";
import {
  buildPlumbingContactReconfirmMessage,
  buildPlumbingGateEmailOfferBlock,
  plumbingContactFieldSpoken,
} from "@/lib/voice-demo-plumbing-contact-confirm";

describe("voice-demo-plumbing-contact-confirm", () => {
  it("spells email local part for reconfirm read-back", () => {
    expect(plumbingContactFieldSpoken("email", "ademeo@gmail.com")).toBe(
      "a d e m e o @gmail.com"
    );
  });

  it("spells phone digits for reconfirm read-back", () => {
    expect(plumbingContactFieldSpoken("phone", "201-555-1234")).toBe(
      "2 0 1 5 5 5 1 2 3 4"
    );
  });

  it("builds reconfirm message for email with spelling instruction", () => {
    const msg = buildPlumbingContactReconfirmMessage({ email: "ademeo@gmail.com" });
    expect(msg).toContain("a d e m e o @gmail.com");
    expect(msg).toMatch(/letter-by-letter/i);
    expect(msg).toMatch(/Wait for yes/i);
  });

  it("builds reconfirm lines for each saved field", () => {
    const msg = buildPlumbingContactReconfirmMessage({
      name: "Anthony DeMeo",
      serviceAddress: "123 Main St, Newark NJ",
      email: "ademeo@gmail.com",
      phone: "2015551234",
    });
    expect(msg).toContain("Anthony DeMeo");
    expect(msg).toContain("123 Main St");
    expect(msg).toContain("a d e m e o @gmail.com");
    expect(msg).toContain("2 0 1 5 5 5 1 2 3 4");
  });

  it("builds gate email offer block for demo login email", () => {
    const block = buildPlumbingGateEmailOfferBlock("ademeo@gmail.com");
    expect(block).toContain("ademeo@gmail.com");
    expect(block).toMatch(/ask FIRST/i);
    expect(block).toContain("a d e m e o @gmail.com");
    expect(block).toMatch(/do NOT ask them to say or spell/i);
  });

  it("returns null for invalid gate email", () => {
    expect(buildPlumbingGateEmailOfferBlock("not yet")).toBeNull();
  });

  it("flags demo login email in reconfirm message", () => {
    const msg = buildPlumbingContactReconfirmMessage({
      email: "ademeo@gmail.com",
      emailFromDemoLogin: true,
    });
    expect(msg).toMatch(/demo login accepted/i);
  });
});
