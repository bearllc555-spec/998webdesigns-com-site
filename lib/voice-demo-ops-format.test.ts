import { describe, expect, it } from "vitest";
import { formatVoiceDemoOpsTimeline } from "@/lib/voice-demo-ops-format";
import type { VoiceDemoOpsEvent } from "@/lib/voice-demo-ops";

describe("formatVoiceDemoOpsTimeline", () => {
  it("formats events with meta", () => {
    const events: VoiceDemoOpsEvent[] = [
      {
        at: "2026-06-07T16:00:00.000Z",
        kind: "session_anomaly",
        severity: "warn",
        message: "Gemini goAway - reconnecting before disconnect",
        meta: { attempt: 2 },
      },
    ];
    const text = formatVoiceDemoOpsTimeline(events);
    expect(text).toContain("goAway");
    expect(text).toContain("attempt=2");
  });
});
