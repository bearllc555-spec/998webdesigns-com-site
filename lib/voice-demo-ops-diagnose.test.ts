import { describe, expect, it } from "vitest";
import { diagnoseVoiceDemoOpsSession } from "@/lib/voice-demo-ops-diagnose";
import type { VoiceDemoOpsEvent } from "@/lib/voice-demo-ops";

describe("diagnoseVoiceDemoOpsSession", () => {
  it("detects goAway reconnect storm", () => {
    const events: VoiceDemoOpsEvent[] = [
      {
        at: "2026-06-07T12:00:00.000Z",
        kind: "session_anomaly",
        severity: "warn",
        message: "Gemini goAway - reconnecting before disconnect",
      },
      {
        at: "2026-06-07T12:00:02.000Z",
        kind: "session_anomaly",
        severity: "warn",
        message: "Scheduling live reconnect: goAway",
      },
      {
        at: "2026-06-07T12:00:10.000Z",
        kind: "client_hangup_scheduled",
        severity: "warn",
        message: "Live reconnect paused - waiting for user tap",
      },
    ];
    const d = diagnoseVoiceDemoOpsSession(events);
    expect(d.goAwayCount).toBeGreaterThan(0);
    expect(d.exhaustedPause).toBe(true);
    expect(d.summary).toContain("reconnect limit");
  });
});
