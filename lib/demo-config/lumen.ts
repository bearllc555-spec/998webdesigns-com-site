import type { DemoBrandConfig } from "@/lib/demo-config/types";

export const LUMEN_CONFIG: DemoBrandConfig = {
  slug: "clinical",
  vertical: "clinical",
  brandName: "LUMEN Aesthetics",
  tagline: "Subtle by design.",
  eyebrow: "MEDICAL AESTHETICS · Montclair, NJ",
  heroHeadline: "Subtle by design.",
  heroSub:
    "Expert-injected Botox, filler, and skin treatments that look like you — just more rested. Natural results, never overdone.",
  heroPrimaryCta: "Talk to Jarvis",
  heroSecondaryCta: "Book a Consultation",
  city: "Montclair, NJ",
  address: "42 Bloomfield Ave, Montclair, NJ 07042",
  phone: "+1 (555) 318-4400",
  phoneTel: "+15553184400",
  hours: "Tue–Sat 10am–7pm · Closed Sun–Mon",
  instagramHandle: "@lumen.aesthetics.demo",
  providers: [
    { name: "Dr. Lena Ross", title: "NP, master injector" },
    { name: "Maya Iqbal", title: "RN" },
  ],
  aboutHeadline: "Hands you can trust.",
  aboutBody:
    "Led by Dr. Lena Ross, NP, master injector. Every plan starts with a real consultation. No upsells, no \"done\" look.",
  trustStrip: [
    "Board-certified providers",
    "5,000+ treatments",
    "4.9★ Google",
    "Natural-result focus",
  ],
  palette: {
    ink: "#1C1B1A",
    bg: "#F4EFE9",
    accent: "#C7A98B",
    headline: "#7A5C44",
    muted: "#9A8C7C",
    surface: "#FFFFFF",
  },
  fonts: {
    display: "var(--font-playfair)",
    body: "var(--font-inter)",
  },
  services: [
    { name: "Wrinkle Relaxers", fromPrice: "from $12/unit" },
    { name: "Dermal Filler", fromPrice: "from $750/syringe" },
    { name: "Lip Enhancement", fromPrice: "from $695" },
    { name: "Biostimulators (Sculptra)", fromPrice: "from $850" },
    { name: "Microneedling + PRF", fromPrice: "from $550" },
    { name: "Laser Resurfacing", fromPrice: "from $400" },
    { name: "Medical Facials", fromPrice: "from $175" },
  ],
  membershipProgram: "The LUMEN Circle",
  membershipTiers: [
    { name: "Glow", price: "$99/mo", perks: ["10% off treatments", "Priority booking"] },
    { name: "Signature", price: "$199/mo", perks: ["15% off treatments", "Monthly facial credit"] },
    { name: "Icon", price: "$349/mo", perks: ["20% off treatments", "Quarterly injectable credit"] },
  ],
  reviews: [
    {
      quote: "I finally found an injector who said less. I look rested, not different.",
      author: "Sarah M.",
    },
    {
      quote: "Booked online at 11pm, got a text back by morning, in the chair that week.",
      author: "Marcus W.",
    },
    {
      quote: "The most natural lip filler I've ever seen — subtle and balanced.",
      author: "Priya P.",
    },
  ],
  faq: [
    {
      question: "Will I look overdone?",
      answer:
        "Natural results are our whole philosophy. We do less and build gradually — never a frozen or \"done\" look.",
    },
    {
      question: "Do you offer free consultations?",
      answer: "Yes — complimentary consultations for all new patients.",
    },
    {
      question: "How far in advance should I book before an event?",
      answer:
        "We recommend booking a consult now. Injectables typically need about two weeks to settle before an event.",
    },
    {
      question: "What are your hours?",
      answer: "Tue–Sat 10am–7pm. Jarvis can answer and book 24/7; appointments are scheduled within open hours.",
    },
  ],
  promotions: {
    newPatient: "$50 off first treatment, or complimentary consultation",
    membershipNote: "LUMEN Circle saves on every visit",
  },
  booking: {
    eyebrow: "Reserve",
    headlineLead: "Reserve your",
    headlineAccent: "consultation.",
    sub: "Start with a question or go straight to the calendar — we answer within 4 hours, Tuesday through Saturday.",
  },
  demoRoute: "/demo/clinical",
  crmRoute: "/demo/clinical/crm",
  crmPassword: "t3mp4781",
  tileTargets: {
    leadsCaptured: 28,
    appointmentsBooked: 16,
    afterHoursSaves: 7,
    revenueBooked: 9840,
    membershipsStarted: 3,
    avgJarvisResponseSec: 1.4,
  },
};
