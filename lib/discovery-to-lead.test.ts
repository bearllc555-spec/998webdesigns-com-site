import { describe, expect, it } from "vitest";
import { discoveryProspectToLead } from "@/lib/discovery-to-lead";
import type { DiscoveryProspectRow } from "@/lib/discovery-types";

const baseProspect: DiscoveryProspectRow = {
  id: "p1",
  created_at: "2026-06-06T00:00:00Z",
  updated_at: "2026-06-06T00:00:00Z",
  status: "intake_complete",
  full_name: "Jane Doe",
  company_name: "Acme Co",
  email: "jane@example.com",
  phone: "+15551234567",
  goal: "Need a new site",
  sms_consent_at: "2026-06-06T00:00:00Z",
  phone_verified_at: "2026-06-06T00:00:00Z",
  email_verified_at: "2026-06-06T00:00:00Z",
  intake: {
    businessName: "Acme Co",
    industry: "Plumbing",
    yearsInBusiness: "5",
    existingUrl: "",
    whatYouDo: "Residential plumbing",
    whoYouServe: "Homeowners",
    projectType: "new",
    visitorActions: [],
    pages: [],
    pagesOther: "",
    brandAssets: [],
    inspirationUrls: "",
    avoidances: "",
    startDate: "",
    notes: "ASAP",
  },
  intake_submitted_at: "2026-06-06T00:00:00Z",
  call_booked_at: null,
  close_draft: null,
  close_sent_at: null,
  wd_lead_id: null,
  ip: null,
  read_at: null,
  inbox_flag: null,
};

describe("discoveryProspectToLead", () => {
  it("maps prospect + close draft to validated lead", () => {
    const result = discoveryProspectToLead(baseProspect, baseProspect.intake!, {
      hostingChoice: "ten_year",
      paymentChannel: "card",
      addons: ["ai-chatbot"],
      promoCode: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.businessName).toBe("Acme Co");
    expect(result.data.hearAboutOther).toBe("Discovery pipeline");
    expect(result.data.addons).toEqual(["ai-chatbot"]);
  });
});
