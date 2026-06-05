import {
  filterHearAboutSources,
  type HearAboutSource,
} from "@/lib/hear-about-sources";
import { isValidEmail } from "@/lib/validate-email";

export type HostingChoice = "ten_year" | "monthly" | "later";
export type PaymentOption = "full";
export type PaymentChannel = "ach" | "card";
export type ContactPref = "email" | "phone" | "text";
export type ProjectType = "new" | "redesign";

export type ValidatedLead = {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  contactPref: ContactPref;
  industry: string;
  yearsInBusiness: string;
  existingUrl: string;
  whatYouDo: string;
  whoYouServe: string;
  projectType: ProjectType;
  visitorActions: string[];
  pages: string[];
  pagesOther: string;
  brandAssets: string[];
  inspirationUrls: string;
  avoidances: string;
  startDate: string;
  hostingChoice: HostingChoice;
  notes: string;
  paymentOption: PaymentOption;
  paymentChannel: PaymentChannel;
  addons: string[];
  promoCode: string;
  hearAboutSources: HearAboutSource[];
  hearAboutOther: string;
};

const ALLOWED_ADDONS = new Set([
  "growth-pack",
  "ai-chatbot",
  "ai-receptionist",
  "social-media",
  "email-sms",
  "blog-writing",
  "hyper-local-seo",
  "google-profile",
  "booking-calendar",
]);

function str(v: unknown): string | null {
  return typeof v === "string" ? v.trim() : null;
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

export function validateLeadPayload(
  body: Record<string, unknown>
): { ok: true; data: ValidatedLead } | { ok: false; error: string } {
  const fullName = str(body.fullName);
  const businessName = str(body.businessName);
  const email = str(body.email);
  const contactPref = str(body.contactPref);
  const industry = str(body.industry);
  const whatYouDo = str(body.whatYouDo);
  const whoYouServe = str(body.whoYouServe);
  const projectType = str(body.projectType);
  const hostingChoice = str(body.hostingChoice);
  const paymentOption = str(body.paymentOption);
  const paymentChannel = str(body.paymentChannel);

  if (!fullName) return { ok: false, error: "Missing required field: fullName" };
  if (!email) return { ok: false, error: "Missing required field: email" };
  if (!isValidEmail(email)) return { ok: false, error: "Invalid email address" };
  if (!contactPref || !["email", "phone", "text"].includes(contactPref)) {
    return { ok: false, error: "Missing or invalid contactPref" };
  }
  if (!industry) return { ok: false, error: "Missing required field: industry" };
  if (!whatYouDo) return { ok: false, error: "Missing required field: whatYouDo" };
  if (!whoYouServe) return { ok: false, error: "Missing required field: whoYouServe" };
  if (!projectType || !["new", "redesign"].includes(projectType)) {
    return { ok: false, error: "Missing or invalid projectType" };
  }
  if (!hostingChoice || !["ten_year", "monthly", "later"].includes(hostingChoice)) {
    return { ok: false, error: "Missing or invalid hostingChoice" };
  }
  if (paymentOption && paymentOption !== "full") {
    return {
      ok: false,
      error: "Invalid paymentOption — $5,998 design fee must be paid in full upfront",
    };
  }
  if (!paymentChannel || !["ach", "card"].includes(paymentChannel)) {
    return { ok: false, error: "Missing or invalid paymentChannel (ach or card)" };
  }

  const hearAboutSources = filterHearAboutSources(body.hearAboutSources);
  const hearAboutOther = str(body.hearAboutOther) ?? "";
  if (hearAboutSources.includes("Other") && !hearAboutOther) {
    return { ok: false, error: "Please specify where you heard about us when Other is selected" };
  }

  return {
    ok: true,
    data: {
      fullName,
      businessName: businessName ?? "",
      email,
      phone: str(body.phone) ?? "",
      contactPref: contactPref as ContactPref,
      industry,
      yearsInBusiness: str(body.yearsInBusiness) ?? "",
      existingUrl: str(body.existingUrl) ?? "",
      whatYouDo,
      whoYouServe,
      projectType: projectType as ProjectType,
      visitorActions: strArray(body.visitorActions),
      pages: strArray(body.pages),
      pagesOther: str(body.pagesOther) ?? "",
      brandAssets: strArray(body.brandAssets),
      inspirationUrls: str(body.inspirationUrls) ?? "",
      avoidances: str(body.avoidances) ?? "",
      startDate: str(body.startDate) ?? "",
      hostingChoice: hostingChoice as HostingChoice,
      notes: str(body.notes) ?? "",
      paymentOption: "full",
      paymentChannel: paymentChannel as PaymentChannel,
      addons: strArray(body.addons).filter((id) => ALLOWED_ADDONS.has(id)),
      promoCode: str(body.promoCode) ?? "",
      hearAboutSources,
      hearAboutOther,
    },
  };
}
