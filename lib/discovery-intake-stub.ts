import type { DiscoveryIntake } from "@/lib/discovery-types";

/** Minimal intake saved from CRM when closing on a call before the client brief is in. */
export function buildMinimalDiscoveryIntake(
  businessName: string,
  callNotes?: string | null
): DiscoveryIntake {
  return {
    businessName,
    industry: "To be confirmed",
    yearsInBusiness: "",
    existingUrl: "",
    whatYouDo: "To be confirmed on discovery call",
    whoYouServe: "To be confirmed on discovery call",
    projectType: "new",
    visitorActions: [],
    pages: [],
    pagesOther: "",
    brandAssets: [],
    inspirationUrls: "",
    avoidances: "",
    startDate: "",
    notes: callNotes?.trim() ?? "",
  };
}
