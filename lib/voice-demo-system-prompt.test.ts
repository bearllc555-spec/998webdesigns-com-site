import { describe, expect, it } from "vitest";
import { VOICE_DEMO_CLOSING } from "@/lib/voice-demo-system-prompt";

describe("voice-demo-system-prompt closing", () => {
  it("asks anything else first and waits before concerns", () => {
    expect(VOICE_DEMO_CLOSING).toContain(
      "Is there anything else I can help you with today?"
    );
    expect(VOICE_DEMO_CLOSING).toContain("Did I address all your concerns today?");
    expect(VOICE_DEMO_CLOSING).toContain("Skip the concerns question entirely");
    expect(VOICE_DEMO_CLOSING).toMatch(/STOP and wait/i);
  });

  it("requires thank-you sign-off before end_conversation", () => {
    expect(VOICE_DEMO_CLOSING).toContain("Thank you for contacting 998 web designs");
    expect(VOICE_DEMO_CLOSING).toContain("end_conversation");
  });
});
