"use client";

import { useSelectedAddons } from "@/hooks/use-selected-addons";
import { useAddonNavHighlight } from "@/hooks/use-addon-nav-highlight";
import { addonDomId } from "@/lib/addon-nav";
import {
  GROWTH_PACK_ID,
  hasGrowthPack,
  isAddonVisuallySelected,
  isGrowthPackMember,
  toggleAddon,
} from "@/lib/addons";

const ADDONS = [
  {
    value: "ai-chatbot",
    title: "AI Agent Chatbot",
    setup: "$299",
    monthly: "$79",
    bullets: [
      "Answer visitor questions around the clock — typed chat on your site",
      "Process orders and quote requests",
      "Send brochures, pricing, and documentation",
      "Schedule appointments and callbacks",
      "Capture leads after hours and route urgent requests",
    ],
  },
  {
    value: "jarvis-voice",
    title: "Jarvis AI Voice Chatbot",
    setup: "$499",
    monthly: "$149",
    bullets: [
      "Talk to your site — the same voice assistant visitors can try on our home page",
      "Visitors speak or type; Jarvis answers in a natural, on-brand voice",
      "Captures name, email, and phone; sends promo codes when visitors are ready",
      "Handles after-hours questions so you do not miss serious inquiries",
      "Hosted on our cloud edge service only — low latency for real-time voice",
    ],
  },
  {
    value: "ai-receptionist",
    title: "AI Receptionist",
    setup: "$399",
    monthly: "$149",
    bullets: [
      "Answer your business line 24/7 — nights, weekends, and when you're on a job",
      "Greet callers by name, capture name, number, and what they need",
      "Book appointments and route urgent calls to your cell",
      "Answer FAQs about hours, service area, pricing ranges, and availability",
      "Every call logged and summarized so you never miss a lead",
    ],
  },
  {
    value: "social-media",
    title: "Social Media Management",
    setup: "$199",
    monthly: "$299",
    bullets: [
      "Post photos, product clips, and service videos to your accounts",
      "Image carousels, Stories, Reels, and short‑form clips",
      "UGC and before/after job‑site content",
      "Scheduled publishing across Facebook, Instagram, and more",
      "Captions, hashtags, and repurposed blog posts",
    ],
  },
  {
    value: "email-sms",
    title: "Email & SMS",
    setup: "$149",
    monthly: "$149",
    bullets: [
      "Nurture past clients so you stay top of mind for the next job",
      "Confirm appointments, send reminders, and cut no‑shows",
      "Follow up on quotes, invoices, and completed work automatically",
      "Win‑back sequences when a customer hasn't booked in a while",
      "Two‑way SMS for quick replies when you're on the truck or job site",
    ],
  },
  {
    value: "blog-writing",
    title: "Blog Writing & Local Posts",
    setup: "$199",
    monthly: "$199",
    bullets: [
      "Dominate your territory with posts about every service you offer locally",
      'Target city, neighborhood, and "near me" searches competitors skip',
      "Answer the questions homeowners ask before they pick up the phone",
      "Turn finished jobs into case studies, photos, and proof you can trust",
      "Build authority so search engines and AI tools recommend you first",
    ],
  },
  {
    value: "hyper-local-seo",
    title: "Hyper-Local SEO",
    setup: "$299",
    monthly: "$249",
    bullets: [
      "Tune your site to pull traffic from your exact service area—not generic national keywords",
      "Pages for each city, town, or ZIP you want to own",
      "On‑page copy, headings, and structure aligned with how locals search",
      "Technical basics: speed, mobile UX, and crawlability that affect local rankings",
      "Track what ranks, what drives calls, and where to publish next",
    ],
  },
  {
    value: "google-profile",
    title: "Google Profile Optimization",
    setup: "$149",
    monthly: "$79",
    bullets: [
      "Complete, accurate Google Business Profile—photos, hours, services, and attributes",
      "One of the most underused levers local businesses ignore",
      "Review requests, replies, and reputation workflows that build trust",
      "Profile posts, offers, and Q&A so you look active on Maps",
      "Map pack visibility when someone searches your trade nearby",
    ],
  },
  {
    value: "booking-calendar",
    title: "Booking Calendar",
    setup: "$99",
    monthly: "$29",
    footnote: "*Client pays booking tool subscription separately.",
    bullets: [
      "Let customers book online 24/7 straight from your website",
      "Integrates with Google Calendar, Calendly, and tools you already use",
      "See new bookings and manage availability from your phone",
      "Automatic confirmations and reminders by email or SMS",
      "Less phone tag, fewer gaps, and a schedule that fills itself",
    ],
  },
] as const;

type AddonItem = (typeof ADDONS)[number];

const OTHER_ADDONS = ADDONS.filter((a) => !isGrowthPackMember(a.value));
const GROWTH_MEMBER_ADDONS = ADDONS.filter((a) => isGrowthPackMember(a.value));

function GrowthPackBanner({
  growthSelected,
  highlighted,
  onToggle,
  onCardClick,
}: {
  growthSelected: boolean;
  highlighted: boolean;
  onToggle: (value: string) => void;
  onCardClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      id={addonDomId(GROWTH_PACK_ID)}
      onClick={onCardClick}
      className={
        highlighted
          ? "relative mt-8 scroll-mt-24 rounded-xl border-2 border-accent bg-accent/[0.06] px-4 py-3 shadow-md ring-2 ring-accent/25 transition-colors duration-200"
          : growthSelected
            ? "relative mt-8 scroll-mt-24 rounded-xl border border-green-500 bg-green-50 px-4 py-3 shadow-sm transition-colors duration-200 dark:bg-green-950/20"
            : "mt-8 scroll-mt-24 rounded-xl bg-accent px-4 py-3 text-white"
      }
    >
      {growthSelected && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs text-white">
          ✓
        </span>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 pr-6 sm:pr-0">
          <p
            className={`text-[10px] font-semibold uppercase tracking-widest ${
              growthSelected ? "text-accent" : "text-white/90"
            }`}
          >
            Most Popular Bundle
          </p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3
              className={`font-display text-lg font-semibold leading-tight ${
                growthSelected ? "text-ink" : "text-white"
              }`}
            >
              Growth Pack
            </h3>
            <p
              className={`text-sm ${
                growthSelected ? "text-ink-soft" : "text-white/90"
              }`}
            >
              <span className="font-medium">$647</span> setup
              <span className="mx-1.5 opacity-50">·</span>
              <span className="line-through text-white/80">$527/mo</span>{" "}
              <span className={growthSelected ? "font-semibold text-accent" : "font-semibold"}>
                $399/mo
              </span>
            </p>
          </div>
          <p
            className={`mt-0.5 text-xs leading-snug ${
              growthSelected ? "text-ink-soft" : "text-white/85"
            }`}
          >
            Hyper-Local SEO, Google Profile Optimization, and Blog Writing — bundled at a
            discount.
          </p>
        </div>
        <div className="shrink-0">
          {!growthSelected ? (
            <button
              type="button"
              onClick={() => onToggle(GROWTH_PACK_ID)}
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-accent hover:bg-white/90"
            >
              Get the Growth Pack →
            </button>
          ) : (
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              <button
                type="button"
                onClick={() => onToggle(GROWTH_PACK_ID)}
                className="inline-flex items-center rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
              >
                Growth Pack Added ✓
              </button>
              <button
                type="button"
                onClick={() => onToggle(GROWTH_PACK_ID)}
                className={`text-xs hover:text-red-500 ${
                  growthSelected ? "text-ink-soft" : "text-white/70 hover:text-white"
                }`}
              >
                Remove growth package
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddonCardCta({
  value,
  selected,
  viaGrowthPack,
  onToggle,
}: {
  value: string;
  selected: boolean;
  viaGrowthPack: boolean;
  onToggle: (value: string) => void;
}) {
  if (!selected) {
    return (
      <button
        type="button"
        onClick={() => onToggle(value)}
        className="inline-flex items-center text-sm font-medium text-accent hover:underline"
      >
        Add to your build →
      </button>
    );
  }

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <button
        type="button"
        onClick={() => onToggle(viaGrowthPack ? GROWTH_PACK_ID : value)}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-green-600"
      >
        <span>✓</span> Added
      </button>
      <button
        type="button"
        onClick={() => onToggle(viaGrowthPack ? GROWTH_PACK_ID : value)}
        className="shrink-0 text-right text-xs text-ink-soft hover:text-red-500"
      >
        {viaGrowthPack ? "Remove growth package" : "Remove"}
      </button>
    </div>
  );
}

export function AddonsSection() {
  const selectedAddons = useSelectedAddons();
  const { highlighted, toggleHighlight } = useAddonNavHighlight();

  function handleCardClick(e: React.MouseEvent, value: string) {
    if ((e.target as HTMLElement).closest("button, a, label, input")) return;
    toggleHighlight(value);
  }

  function handleToggle(value: string) {
    toggleAddon(value);
  }

  const growthSelected = hasGrowthPack(selectedAddons);
  const isSelected = (value: string) =>
    isAddonVisuallySelected(value, selectedAddons);
  const isViaGrowthPack = (value: string) =>
    growthSelected &&
    isGrowthPackMember(value) &&
    !selectedAddons.includes(value);

  function renderAddonCard(addon: AddonItem) {
    const selected = isSelected(addon.value);
    const navHighlighted = highlighted === addon.value;
    return (
      <div
        key={addon.value}
        id={addonDomId(addon.value)}
        onClick={(e) => handleCardClick(e, addon.value)}
        className={
          navHighlighted
            ? "relative flex h-full scroll-mt-24 flex-col rounded-xl border-2 border-accent bg-accent/[0.06] p-6 shadow-md ring-2 ring-accent/25 transition-colors duration-200"
            : selected
              ? "relative flex h-full scroll-mt-24 flex-col rounded-xl border border-green-500 bg-green-50 p-6 shadow-sm transition-colors duration-200 dark:bg-green-950/20"
              : "relative flex h-full scroll-mt-24 flex-col rounded-xl border border-rule bg-bg p-6 shadow-sm transition-colors duration-200 hover:border-accent"
        }
      >
        {selected && (
          <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs text-white">
            ✓
          </span>
        )}
        <div className="min-h-0 flex-1">
          <h3 className="font-display text-lg font-medium text-ink">{addon.title}</h3>
          <p className="mt-1 text-sm text-ink-soft">
            {addon.setup} setup &middot;{" "}
            <span className="font-semibold text-accent">{addon.monthly}/mo</span>
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-soft">
            {addon.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          {"footnote" in addon && addon.footnote ? (
            <p className="mt-2 text-xs text-ink-soft">{addon.footnote}</p>
          ) : null}
        </div>
        <div className="mt-auto pt-4">
          <AddonCardCta
            value={addon.value}
            selected={selected}
            viaGrowthPack={isViaGrowthPack(addon.value)}
            onToggle={handleToggle}
          />
        </div>
      </div>
    );
  }

  return (
    <div id="addons" className="border-t border-rule">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
          Add-ons
        </p>
        <div className="max-w-2xl">
          <h2 className="mt-4 font-display text-3xl font-medium leading-tight md:text-5xl">
            more calls. more bookings. more repeat clients.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            Every build includes options for blog writing & local posts, hyper‑local SEO, Google
            Profile Optimization (including review requests), email/SMS follow‑ups, social media management,
            booking calendar, an AI receptionist, a typed AI agent chatbot, and Jarvis — our voice
            chatbot.
          </p>
        </div>

        <div className="mb-8 mt-8 rounded-xl border border-accent/20 bg-accent/[0.08] px-6 py-4">
          <p className="font-semibold text-ink">
            Agencies charge $500–$2,000/month for local SEO alone.
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            We don&apos;t. Every add-on below is priced for real small businesses — not agency
            retainers.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {OTHER_ADDONS.map(renderAddonCard)}
        </div>

        <GrowthPackBanner
          growthSelected={growthSelected}
          highlighted={highlighted === GROWTH_PACK_ID}
          onToggle={handleToggle}
          onCardClick={(e) => handleCardClick(e, GROWTH_PACK_ID)}
        />

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {GROWTH_MEMBER_ADDONS.map(renderAddonCard)}
        </div>
      </div>
    </div>
  );
}
