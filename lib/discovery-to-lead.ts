import type { DiscoveryCloseDraft, DiscoveryIntake, DiscoveryProspectRow } from "@/lib/discovery-types";
import { isValidDesignPromoCode } from "@/lib/design-promo";
import type { ValidatedLead } from "@/lib/validate-lead";

export function discoveryProspectToLead(
  prospect: DiscoveryProspectRow,
  intake: DiscoveryIntake,
  close: DiscoveryCloseDraft
): { ok: true; data: ValidatedLead } | { ok: false; error: string } {
  if (!["lifetime", "monthly"].includes(close.hostingChoice)) {
    return { ok: false, error: "Invalid hostingChoice on close draft" };
  }
  if (!["ach", "card"].includes(close.paymentChannel)) {
    return { ok: false, error: "Invalid paymentChannel on close draft" };
  }

  const promoCode = close.promoCode?.trim() ?? "";
  if (promoCode && !isValidDesignPromoCode(promoCode)) {
    return { ok: false, error: "Invalid promo code on close draft" };
  }

  return {
    ok: true,
    data: {
      fullName: prospect.full_name,
      businessName: intake.businessName,
      email: prospect.email,
      phone: prospect.phone,
      contactPref: "text",
      industry: intake.industry,
      yearsInBusiness: intake.yearsInBusiness,
      existingUrl: intake.existingUrl,
      whatYouDo: intake.whatYouDo,
      whoYouServe: intake.whoYouServe,
      projectType: intake.projectType,
      visitorActions: intake.visitorActions,
      pages: intake.pages,
      pagesOther: intake.pagesOther,
      brandAssets: intake.brandAssets,
      inspirationUrls: intake.inspirationUrls,
      avoidances: intake.avoidances,
      startDate: intake.startDate,
      hostingChoice: close.hostingChoice,
      notes: [prospect.goal, intake.notes].filter(Boolean).join("\n\n"),
      paymentOption: close.paymentOption ?? "deposit",
      paymentChannel: close.paymentChannel,
      addons: close.addons,
      promoCode,
      hearAboutSources: ["Other"],
      hearAboutOther: "Discovery pipeline",
    },
  };
}
