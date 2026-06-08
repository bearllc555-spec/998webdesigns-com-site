import { describe, expect, it } from "vitest";
import { summarizeVoiceDemoOpsWarnings } from "@/lib/voice-demo-ops";

describe("voice-demo-ops CRM summary", () => {
  it("summarizes warn events", () => {
    const summary = summarizeVoiceDemoOpsWarnings([
      {
        at: "2026-06-07T12:00:00.000Z",
        kind: "zip_city_drift",
        severity: "warn",
        message: "Jarvis said Paterson for 07512",
      },
    ]);
    expect(summary).toContain("zip_city_drift");
    expect(summary).toContain("Paterson");
  });
});
