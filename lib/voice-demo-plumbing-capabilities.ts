/** Demo-page copy — mirrors docs/jarvis_plumbing_complete.md Q&A knowledge base. */

export type PlumbingDemoCapabilityGroup = {
  id: string;
  title: string;
  questions: string[];
};

export const PLUMBING_DEMO_CAPABILITY_GROUPS: PlumbingDemoCapabilityGroup[] = [
  {
    id: "services-pricing",
    title: "Services & pricing",
    questions: [
      "What services does Metro Plumbing & Drain offer?",
      "How much does a water heater replacement cost?",
      "How much does drain cleaning cost?",
      "How much does leak detection and repair cost?",
      "How much does emergency plumbing service cost? Is there an after-hours fee?",
      "How much does sewer line service cost?",
      "How much does toilet or faucet repair cost?",
      "Do you offer free estimates?",
    ],
  },
  {
    id: "booking",
    title: "Booking & availability",
    questions: [
      "How do I book an appointment?",
      "How quickly can you get someone out?",
      "What information do you need to book an appointment?",
      "How will I receive my appointment confirmation?",
      "Can I reschedule or cancel?",
    ],
  },
  {
    id: "emergency",
    title: "Emergencies",
    questions: [
      "What counts as a plumbing emergency?",
      "How fast do you respond to emergencies?",
      "What should I do while I wait for the technician?",
      "Is emergency service available 24/7?",
    ],
  },
  {
    id: "company",
    title: "Company info",
    questions: [
      "How long has Metro Plumbing & Drain been in business?",
      "Are you licensed and insured?",
      "Do you offer a warranty on your work?",
      "What payment methods do you accept?",
      "What areas do you serve?",
      "Do you handle commercial plumbing as well?",
    ],
  },
  {
    id: "objections",
    title: "Common concerns",
    questions: [
      "That seems expensive.",
      "I need to get other quotes first.",
      "Can I just do it myself / watch a YouTube video?",
      "How do I know you're reliable? I've had bad experiences with plumbers before.",
      "I need to talk to my spouse or partner first.",
    ],
  },
  {
    id: "promo",
    title: "Promotions",
    questions: ["Do you have any current promotions or discounts?"],
  },
];
