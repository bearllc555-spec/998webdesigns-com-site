import type { DiscoveryIntake } from "@/lib/discovery-types";

function str(v: unknown): string | null {
  return typeof v === "string" ? v.trim() : null;
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

export function validateDiscoveryIntakePayload(
  body: Record<string, unknown>
): { ok: true; data: DiscoveryIntake } | { ok: false; error: string } {
  const businessName = str(body.businessName);
  const industry = str(body.industry);
  const whatYouDo = str(body.whatYouDo);
  const whoYouServe = str(body.whoYouServe);
  const projectType = str(body.projectType);

  if (!businessName) return { ok: false, error: "Missing required field: businessName" };
  if (!industry) return { ok: false, error: "Missing required field: industry" };
  if (!whatYouDo) return { ok: false, error: "Missing required field: whatYouDo" };
  if (!whoYouServe) return { ok: false, error: "Missing required field: whoYouServe" };
  if (!projectType || !["new", "redesign"].includes(projectType)) {
    return { ok: false, error: "Missing or invalid projectType" };
  }

  return {
    ok: true,
    data: {
      businessName,
      industry,
      yearsInBusiness: str(body.yearsInBusiness) ?? "",
      existingUrl: str(body.existingUrl) ?? "",
      whatYouDo,
      whoYouServe,
      projectType: projectType as "new" | "redesign",
      visitorActions: strArray(body.visitorActions),
      pages: strArray(body.pages),
      pagesOther: str(body.pagesOther) ?? "",
      brandAssets: strArray(body.brandAssets),
      inspirationUrls: str(body.inspirationUrls) ?? "",
      avoidances: str(body.avoidances) ?? "",
      startDate: str(body.startDate) ?? "",
      notes: str(body.notes) ?? "",
    },
  };
}
