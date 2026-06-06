import type { HostingChoice, PaymentChannel, PaymentOption } from "@/lib/validate-lead";

export type DiscoveryStatus =
  | "started"
  | "phone_verified"
  | "email_verified"
  | "intake_complete"
  | "call_booked"
  | "close_sent"
  | "deposit_paid"
  | "paid";

export type DiscoveryIntake = {
  businessName: string;
  industry: string;
  yearsInBusiness: string;
  existingUrl: string;
  whatYouDo: string;
  whoYouServe: string;
  projectType: "new" | "redesign";
  visitorActions: string[];
  pages: string[];
  pagesOther: string;
  brandAssets: string[];
  inspirationUrls: string;
  avoidances: string;
  startDate: string;
  notes: string;
};

export type DiscoveryCloseDraft = {
  hostingChoice: HostingChoice;
  paymentChannel: PaymentChannel;
  paymentOption: PaymentOption;
  addons: string[];
  promoCode: string;
};

export type DiscoveryProspectRow = {
  id: string;
  created_at: string;
  updated_at: string;
  status: DiscoveryStatus;
  full_name: string;
  email: string;
  phone: string;
  goal: string | null;
  sms_consent_at: string | null;
  phone_verified_at: string | null;
  email_verified_at: string | null;
  intake: DiscoveryIntake | null;
  intake_submitted_at: string | null;
  call_booked_at: string | null;
  close_draft: DiscoveryCloseDraft | null;
  close_sent_at: string | null;
  wd_lead_id: string | null;
  ip: string | null;
  read_at: string | null;
  inbox_flag: string | null;
  crm_notes: string | null;
};
