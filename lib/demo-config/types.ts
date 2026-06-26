import type { AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";

export type DemoBrandSlug = "clinical" | "wellness";

export type DemoServiceItem = {
  name: string;
  fromPrice: string;
};

export type DemoMembershipTier = {
  name: string;
  price: string;
  perks: string[];
};

export type DemoReview = {
  quote: string;
  author: string;
};

export type DemoFaqItem = {
  question: string;
  answer: string;
};

export type DemoProvider = {
  name: string;
  title: string;
};

export type DemoBrandConfig = {
  slug: DemoBrandSlug;
  vertical: AestheticsDemoBrand;
  brandName: string;
  tagline: string;
  eyebrow: string;
  heroHeadline: string;
  heroSub: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  city: string;
  address: string;
  phone: string;
  phoneTel: string;
  hours: string;
  instagramHandle: string;
  providers: DemoProvider[];
  aboutHeadline: string;
  aboutBody: string;
  trustStrip: string[];
  palette: {
    ink: string;
    bg: string;
    accent: string;
    /** Hero + tagline — darker than accent so copy reads on cream backgrounds */
    headline: string;
    muted: string;
    surface: string;
  };
  fonts: {
    display: string;
    body: string;
  };
  services: DemoServiceItem[];
  membershipProgram: string;
  membershipTiers: DemoMembershipTier[];
  reviews: DemoReview[];
  faq: DemoFaqItem[];
  promotions: {
    newPatient: string;
    membershipNote: string;
  };
  booking: {
    eyebrow: string;
    headlineLead: string;
    headlineAccent: string;
    sub: string;
  };
  demoRoute: string;
  crmRoute: string;
  crmPassword: string;
  tileTargets: {
    leadsCaptured: number;
    appointmentsBooked: number;
    afterHoursSaves: number;
    revenueBooked: number;
    membershipsStarted: number;
    avgJarvisResponseSec: number;
  };
};
