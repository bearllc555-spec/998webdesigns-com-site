import { describe, expect, it } from "vitest";
import {
  assistantChainedSchedulingAfterPhone,
  buildPlumbingContactPauseNudge,
  buildPlumbingContactReconfirmMessage,
  buildPlumbingGateEmailOfferBlock,
  buildPlumbingPhoneSchedulingRecoveryNudge,
  plumbingIntakeBlockedWithoutLastName,
  plumbingContactFieldChanged,
  plumbingContactFieldSpoken,
  plumbingContactPostReadbackPauseMs,
  plumbingContactReconfirmFocusField,
  userAnsweredPlumbingContactPause,
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
    expect(message).toMatch(/EVERY character individually/i);
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
    expect(message).toContain("Anthony");
    expect(message).toContain("DeMeo");
    expect(message).toContain("d e m e o");
    expect(message).toMatch(/Is that the correct name/i);
    expect(message).not.toContain("a d e m e o @gmail.com");
    expect(message).not.toContain("2 0 1 5 5 5 1 2 3 4");
  });

  it("does not pause for casual first-name-only saves", () => {
    const { message, focusField } = buildPlumbingContactReconfirmMessage({
      name: "Anthony",
    });
    expect(focusField).toBeNull();
    expect(message).toMatch(/Do NOT read it back/i);
    expect(message).not.toMatch(/Is that the correct name/i);
  });

  it("requires last name prompt during booking intake", () => {
    const { message, focusField } = buildPlumbingContactReconfirmMessage({
      name: "Anthony",
      bookingIntake: true,
    });
    expect(focusField).toBeNull();
    expect(message).toMatch(/How do I spell your last name/i);
    expect(message).toMatch(/I have Anthony as your first name/i);
    expect(message).toMatch(/BEFORE address, phone, email/i);
  });

  it("blocks intake fields when only first name is on file", () => {
    expect(
      plumbingIntakeBlockedWithoutLastName({
        nameOnFile: "Anthony",
        saving: { serviceAddress: "42 Oak Drive" },
      })
    ).toMatch(/How do I spell your last name/i);
    expect(
      plumbingIntakeBlockedWithoutLastName({
        nameOnFile: "Anthony DeMeo",
        saving: { serviceAddress: "42 Oak Drive" },
      })
    ).toBeNull();
  });

  it("requires full local-part spelling in email reconfirm", () => {
    const { message } = buildPlumbingContactReconfirmMessage({
      email: "ademeo@gmail.com",
    });
    expect(message).toContain("a d e m e o");
    expect(message).toMatch(/NEVER truncate/i);
    expect(message).toMatch(/meo@gmail.com/i);
  });

  it("focuses phone before email when both are saved", () => {
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
    expect(focusField).toBe("phone");
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
    expect(nudge).toMatch(/scheduling until they confirm this email/i);
  });

  it("builds stronger phone pause nudge and longer wait", () => {
    const nudge = buildPlumbingContactPauseNudge("phone");
    expect(nudge).toMatch(/verify spaced digits/i);
    expect(nudge).toMatch(/email or scheduling/i);
    expect(plumbingContactPostReadbackPauseMs("phone")).toBeGreaterThan(
      plumbingContactPostReadbackPauseMs("email")
    );
  });

  it("builds phone reconfirm without scheduling chain", () => {
    const { message, focusField } = buildPlumbingContactReconfirmMessage({
      phone: "2015551234",
    });
    expect(focusField).toBe("phone");
    expect(message).toMatch(/Is that the best number/i);
    expect(message).toMatch(/scheduling until they clearly confirm/i);
  });

  it("detects scheduling chained after phone read-back", () => {
    expect(
      assistantChainedSchedulingAfterPhone(
        "2 0 1 5 5 5 1 2 3 4 — is that right? What day works for you?"
      )
    ).toBe(true);
    expect(
      assistantChainedSchedulingAfterPhone("Is that the best number to reach you?")
    ).toBe(false);
  });

  it("recognizes caller answers to contact pause", () => {
    expect(userAnsweredPlumbingContactPause("yes")).toBe(true);
    expect(userAnsweredPlumbingContactPause("that's correct")).toBe(true);
    expect(userAnsweredPlumbingContactPause("um")).toBe(false);
  });

  it("builds phone scheduling recovery nudge", () => {
    const nudge = buildPlumbingPhoneSchedulingRecoveryNudge();
    expect(nudge).toMatch(/before the caller confirmed their phone/i);
    expect(nudge).toMatch(/Stay silent/i);
  });
});
