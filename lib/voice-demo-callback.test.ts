import { describe, expect, it } from "vitest";
import {
  formatVoiceDemoCallbackSummary,
  isVoiceDemoCallbackSummary,
  VOICE_DEMO_CALLBACK_SUMMARY_PREFIX,
} from "@/lib/voice-demo-callback";

describe("voice-demo-callback", () => {
  it("formats callback session summary", () => {
    expect(formatVoiceDemoCallbackSummary("Custom ERP integration timeline")).toBe(
      `${VOICE_DEMO_CALLBACK_SUMMARY_PREFIX} Custom ERP integration timeline`
    );
  });

  it("detects callback summaries", () => {
    expect(isVoiceDemoCallbackSummary("Callback requested: pricing for 50 locations")).toBe(
      true
    );
    expect(isVoiceDemoCallbackSummary("Promo sent")).toBe(false);
    expect(isVoiceDemoCallbackSummary(null)).toBe(false);
  });
});
