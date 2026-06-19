import { describe, expect, it } from "vitest";
import { instantlyEventToProspectStatus } from "@/lib/instantly";

describe("instantlyEventToProspectStatus", () => {
  it("maps reply and meeting events", () => {
    expect(instantlyEventToProspectStatus("reply_received")).toBe("instantly_replied");
    expect(instantlyEventToProspectStatus("lead_meeting_booked")).toBe("meeting_booked");
    expect(instantlyEventToProspectStatus("email_bounced")).toBe("bounced");
  });

  it("returns null for unknown events", () => {
    expect(instantlyEventToProspectStatus("email_sent")).toBeNull();
  });
});
