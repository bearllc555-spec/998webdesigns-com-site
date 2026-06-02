import { Carousel } from "./Carousel";

const ADDONS = [
  {
    title: "AI Chatbot",
    setup: "$299",
    monthly: "$79",
    bullets: [
      "Answer visitor questions around the clock",
      "Process orders and quote requests",
      "Send brochures, pricing, and documentation",
      "Schedule appointments and callbacks",
      "Capture leads after hours and route urgent requests",
    ],
  },
  {
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

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-rule">
      <div className="mx-auto max-w-6xl px-5 pb-14 pt-16 md:px-8 md:pb-20 md:pt-24">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-rule bg-rule-soft px-3 py-1 text-xs font-medium uppercase tracking-wider text-ink-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Now booking small-business websites
        </p>

        <h1
          className="font-display text-5xl font-bold leading-[1.04] tracking-[-0.035em] text-ink md:text-7xl"
          aria-label="we don't just build sites. we build systems that bring you more business."
        >
          <span className="block">we don&apos;t just build sites.</span>
          <span className="block">
            we build <span className="text-accent">systems</span> that bring you{" "}
            <span className="text-accent">more</span> business.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft md:text-xl">
          Strategy, design, blogging, hyper‑local SEO, automation, and high‑value add‑ons in one affordable package, delivered fast for local service businesses.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a
            href="#start"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-medium text-on-accent transition hover:bg-accent-deep"
          >
            Get started with a new design
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      <div id="addons" className="border-t border-rule">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
            High‑value add‑ons
          </p>
          <div className="max-w-2xl">
            <p className="mt-4 text-base leading-relaxed text-ink">
              Every build includes options for blog writing & local posts, hyper‑local SEO, Google Profile Optimization, review generation, email/SMS follow‑ups, social media management, booking calendar, and an on‑site AI chatbot so you get more calls, more bookings, and more repeat clients.
            </p>
          </div>

          <div className="mt-8 mb-8 rounded-xl border border-accent/20 bg-accent/[0.08] px-6 py-4">
            <p className="font-semibold text-ink">
              Agencies charge $500–$2,000/month for local SEO alone.
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              We don&apos;t. Every add-on below is priced for real small businesses — not agency retainers.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ADDONS.map((addon) => (
              <div
                key={addon.title}
                className="card-lift rounded-xl border border-rule bg-bg p-6 shadow-sm"
              >
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
                <a
                  href="#start"
                  className="mt-4 inline-flex items-center text-sm font-medium text-accent hover:underline"
                >
                  Add to your build →
                </a>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-xl bg-accent p-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
              Most Popular Bundle
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-white">
              Growth Pack
            </h3>
            <p className="mt-1 text-sm text-white/80">
              The three add-ons that move the needle fastest for local service businesses — bundled at a discount.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-white/90">
              <li className="flex items-center gap-2">
                <span className="font-semibold text-white">✓</span> Hyper-Local SEO
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold text-white">✓</span> Google Profile Optimization
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold text-white">✓</span> Blog Writing &amp; Local Posts
              </li>
            </ul>

            <div className="mt-4">
              <p className="text-sm text-white/70">$647 setup</p>
              <p className="mt-0.5 text-lg font-semibold text-white">
                <span className="mr-2 line-through opacity-60">$527/mo</span>
                $399/mo
              </p>
            </div>

            <a
              href="#start"
              className="mt-6 inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-accent hover:bg-white/90"
            >
              Get the Growth Pack →
            </a>
          </div>
        </div>
      </div>

      <div id="work" className="scroll-mt-16 border-t border-rule">
        <div className="mx-auto max-w-6xl px-5 pt-6 pb-3 md:px-8 md:pt-8 md:pb-4">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
              Recent work
            </p>
          </div>
        </div>
        <Carousel />
      </div>
    </section>
  );
}
