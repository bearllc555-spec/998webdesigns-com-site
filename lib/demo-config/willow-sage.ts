import type { DemoBrandConfig } from "@/lib/demo-config/types";

export const WILLOW_SAGE_CONFIG: DemoBrandConfig = {
  slug: "wellness",
  vertical: "wellness",
  brandName: "Willow & Sage Medical Aesthetics",
  tagline: "Your glow, looked after.",
  eyebrow: "SKIN · WELLNESS · AESTHETICS · Maplewood, NJ",
  heroHeadline: "Your glow, looked after.",
  heroSub:
    "Facials, skin health, and natural-looking aesthetics in a space that actually feels good to walk into. Come as you are — we'll handle the rest.",
  heroPrimaryCta: "Talk to Jarvis",
  heroSecondaryCta: "Book Your Visit",
  city: "Maplewood, NJ",
  address: "18 Maplewood Ave, Maplewood, NJ 07040",
  phone: "+1 (555) 412-7700",
  phoneTel: "+15554127700",
  hours: "Tue–Sat 10am–7pm · Closed Sun–Mon",
  instagramHandle: "@willowandsage.demo",
  providers: [
    { name: "Grace Okafor", title: "NP" },
    { name: "Bea Cohen", title: "RN" },
  ],
  aboutHeadline: "Real care, real people.",
  aboutBody:
    "Started by Grace Okafor, NP, because skin care should feel personal — warm, unhurried, and never clinical for clinical's sake.",
  trustStrip: [
    "Licensed medical providers",
    "Loved by locals",
    "4.9★ reviews",
    "Memberships from $99/mo",
  ],
  palette: {
    ink: "#4A453E",
    bg: "#F6F1E7",
    accent: "#C77B5B",
    headline: "#A65D3F",
    muted: "#7C8A6E",
    surface: "#FFFFFF",
  },
  fonts: {
    display: "var(--font-fraunces)",
    body: "var(--font-nunito)",
  },
  services: [
    { name: "Signature HydraGlow Facial", fromPrice: "from $165" },
    { name: "Microneedling", fromPrice: "from $350" },
    { name: "Chemical Peels", fromPrice: "from $125" },
    { name: "Botox & Baby Botox", fromPrice: "from $12/unit" },
    { name: "Filler & Lip", fromPrice: "from $695" },
    { name: "IV Drips & Vitamin Shots", fromPrice: "from $99" },
    { name: "Medical Weight Management", fromPrice: "from $199/mo" },
  ],
  membershipProgram: "The Glow Club",
  membershipTiers: [
    { name: "Seedling", price: "$99/mo", perks: ["10% off facials", "Member events"] },
    { name: "Bloom", price: "$179/mo", perks: ["15% off treatments", "Monthly facial"] },
    { name: "Evergreen", price: "$299/mo", perks: ["20% off all services", "Priority booking"] },
  ],
  reviews: [
    {
      quote:
        "I was nervous to try any of this — they put me completely at ease and I left glowing. I'm a member now.",
      author: "Emma H.",
    },
    {
      quote: "The membership pays for itself and my skin's never looked better.",
      author: "Aisha B.",
    },
    {
      quote: "Warm, calm, and never pushy. Exactly what I needed for my first visit.",
      author: "Lucia M.",
    },
  ],
  faq: [
    {
      question: "I've never done this before — is that okay?",
      answer:
        "Absolutely. Most clients start exactly where you are. We go slow, explain everything, and never rush you.",
    },
    {
      question: "Do I have to be a member?",
      answer:
        "Never required. Walk-in pricing is always available — membership just saves regulars money.",
    },
    {
      question: "What should I expect at my first HydraGlow facial?",
      answer:
        "Deep cleanse, hydrate, and glow — about 60 minutes, zero downtime. You'll leave feeling refreshed.",
    },
    {
      question: "What are your hours?",
      answer: "Tue–Sat 10am–7pm. Jarvis answers and books 24/7; visits are scheduled within open hours.",
    },
  ],
  promotions: {
    newPatient: "First HydraGlow facial $99, or complimentary skin consultation",
    membershipNote: "Glow Club saves on monthly care",
  },
  demoRoute: "/demo/wellness",
  crmRoute: "/demo/wellness/crm",
  crmPassword: "t3mp4781",
  tileTargets: {
    leadsCaptured: 24,
    appointmentsBooked: 14,
    afterHoursSaves: 6,
    revenueBooked: 6420,
    membershipsStarted: 4,
    avgJarvisResponseSec: 1.5,
  },
};
