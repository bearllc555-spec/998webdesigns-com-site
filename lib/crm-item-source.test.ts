import { describe, expect, it } from "vitest";
import {
  crmVoiceDemoLeadsTable,
  isCrmVoiceDemoFeedSource,
} from "@/lib/crm-item-source";

describe("crm-item-source", () => {
  it("maps Jarvis demo sources to voice_demo_leads", () => {
    expect(isCrmVoiceDemoFeedSource("voice_demo")).toBe(true);
    expect(isCrmVoiceDemoFeedSource("plumbing_demo")).toBe(true);
    expect(isCrmVoiceDemoFeedSource("lead")).toBe(false);
    expect(crmVoiceDemoLeadsTable("plumbing_demo")).toBe("voice_demo_leads");
    expect(crmVoiceDemoLeadsTable("voice_demo")).toBe("voice_demo_leads");
    expect(crmVoiceDemoLeadsTable("contact")).toBeNull();
  });
});
