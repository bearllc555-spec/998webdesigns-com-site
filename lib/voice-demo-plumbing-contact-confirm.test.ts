import { describe, expect, it } from "vitest";
import {
  buildPlumbingContactPauseNudge,
  buildPlumbingContactReconfirmMessage,
  buildPlumbingGateEmailOfferBlock,
  plumbingContactFieldChanged,
  plumbingContactFieldSpoken,
  plumbingContactReconfirmFocusField,
} from "@/lib/voice-demo-plumbing-contact-confirm";

describe("voice-demo-plumbing-contact-confirm", () => {
  it("pronounces email naturally for spoken read-back", () => {
    expect(plumbingContactFieldSpoken("email", "ademeo@gmail.com")).toBe(
      "ademeo at gmail dot com"
    );
  });

  it("spells phone digits for reconfirm read-back", () => {
    expect(plumbingContactFieldSpoken("phone", "201-555-1234")).toBe(
      "2 0 1 5 5 5 1 2 3 4"
    );
  });

  it("builds reconfirm message with pronounce, spell, domain, confirm", () => {
    const { message, focusField } = buildPlumbingContactReconfirmMessage({
      email: "ademeo@gmail.com",
    });
    expect(focusField).toBe("email");
    expect(message).toContain("ademeo at gmail dot com");
    expect(message).toContain("a d e m e o");
    expect(message).toContain("at gmail dot com");
    expect(message).toMatch(/letter-by-letter/i);
    expect(message).toMatch(/Is that the correct email/i);
    expect(message).toMatch(/THIS TURN ONLY/i);
  });

  it("reconfirms only the earliest field when multiple are saved at once", () => {
    const { message, focusField } = buildPlumbingContactReconfirmMessage({
      name: "Anthony DeMeo",
      serviceAddress: "123 Main St, Newark NJ",
      email: "ademeo@gmail.com",
      phone: "2015551234",
    });
    expect(focusField).toBe("name");
    expect(message).toContain("Anthony DeMeo");
    expect(message).not.toContain("a d e m e o @gmail.com");
    expect(message).not.toContain("2 0 1 5 5 5 1 2 3 4");
  });

  it("focuses email when only email is saved", () => {
    expect(
      plumbingContactReconfirmFocusField({
        email: "ademeo@gmail.com",
        phone: "2015551234",
        focusField: "email",
      })
    ).toBe("email");
    const { focusField } = buildPlumbingContactReconfirmMessage({
      email: "ademeo@gmail.com",
      phone: "2015551234",
    });
    expect(focusField).toBe("email");
  });

  it("builds gate email offer with sign-in question and three-step read-back", () => {
    const block = buildPlumbingGateEmailOfferBlock("ademeo@gmail.com");
    expect(block).toContain("ademeo@gmail.com");
    expect(block).toMatch(/Should I use the email that you signed in with/i);
    expect(block).toContain("ademeo at gmail dot com");
    expect(block).toContain("a d e m e o");
    expect(block).toContain("at gmail dot com");
    expect(block).toMatch(/do NOT ask them to spell/i);
    expect(block).toMatch(/Is that the correct email/i);
  });

  it("returns null for invalid gate email", () => {
    expect(buildPlumbingGateEmailOfferBlock("not yet")).toBeNull();
  });

  it("flags demo login email in reconfirm message", () => {
    const { message } = buildPlumbingContactReconfirmMessage({
      email: "ademeo@gmail.com",
      emailFromDemoLogin: true,
    });
    expect(message).toMatch(/demo login/i);
    expect(message).toContain("ademeo at gmail dot com");
  });

  it("skips reconfirm when name unchanged on file", () => {
    expect(plumbingContactFieldChanged("name", "Anthony", { name: "Anthony" })).toBe(
      false
    );
    expect(plumbingContactFieldChanged("name", "Anthony", { name: "anthony" })).toBe(
      false
    );
    expect(plumbingContactFieldChanged("name", "Tony", { name: "Anthony" })).toBe(true);
    expect(
      buildPlumbingContactReconfirmMessage({
        name: plumbingContactFieldChanged("name", "Anthony", { name: "Anthony" })
          ? "Anthony"
          : undefined,
      }).focusField
    ).toBeNull();
  });

  it("builds post-read-back pause nudge for email", () => {
    const nudge = buildPlumbingContactPauseNudge("email");
    expect(nudge).toMatch(/\[plumbing-contact-pause\]/);
    expect(nudge).toMatch(/Stay completely silent/i);
    expect(nudge).toMatch(/Do NOT ask for phone/i);
  });
});
