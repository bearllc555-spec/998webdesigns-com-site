import { Carousel } from "./Carousel";

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
          Strategy, design, blogging strategies, hyper‑local SEO, automation, and high‑value add‑ons in one affordable package, delivered fast for local service businesses.
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
              Every build includes options for blogging strategies, hyper‑local SEO, Google Profile Optimization, review generation, email/SMS follow‑ups, social media strategies, booking calendar, and an on‑site AI chatbot so you get more calls, more bookings, and more repeat clients.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="card-lift rounded-xl border border-rule bg-bg p-6 shadow-sm">
              <h3 className="font-display text-lg font-medium text-ink">AI chatbot</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-soft">
                <li>Answer visitor questions around the clock</li>
                <li>Process orders and quote requests</li>
                <li>Send brochures, pricing, and documentation</li>
                <li>Schedule appointments and callbacks</li>
                <li>Capture leads after hours and route urgent requests</li>
              </ul>
            </div>
            <div className="card-lift rounded-xl border border-rule bg-bg p-6 shadow-sm">
              <h3 className="font-display text-lg font-medium text-ink">Social media strategies</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-soft">
                <li>Post photos, product clips, and service videos to your accounts</li>
                <li>Image carousels, Stories, Reels, and short‑form clips</li>
                <li>UGC and before/after job‑site content</li>
                <li>Scheduled publishing across Facebook, Instagram, and more</li>
                <li>Captions, hashtags, and repurposed blog posts</li>
              </ul>
            </div>
            <div className="card-lift rounded-xl border border-rule bg-bg p-6 shadow-sm">
              <h3 className="font-display text-lg font-medium text-ink">Email & SMS</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-soft">
                <li>Nurture past clients so you stay top of mind for the next job</li>
                <li>Confirm appointments, send reminders, and cut no‑shows</li>
                <li>Follow up on quotes, invoices, and completed work automatically</li>
                <li>Win‑back sequences when a customer hasn&apos;t booked in a while</li>
                <li>Two‑way SMS for quick replies when you&apos;re on the truck or job site</li>
              </ul>
            </div>
            <div className="card-lift rounded-xl border border-rule bg-bg p-6 shadow-sm">
              <h3 className="font-display text-lg font-medium text-ink">Blogging strategies</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-soft">
                <li>Dominate your territory with posts about every service you offer locally</li>
                <li>Target city, neighborhood, and &ldquo;near me&rdquo; searches competitors skip</li>
                <li>Answer the questions homeowners ask before they pick up the phone</li>
                <li>Turn finished jobs into case studies, photos, and proof you can trust</li>
                <li>Build authority so search engines and AI tools recommend you first</li>
              </ul>
            </div>
            <div className="card-lift rounded-xl border border-rule bg-bg p-6 shadow-sm">
              <h3 className="font-display text-lg font-medium text-ink">Hyper‑local SEO</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-soft">
                <li>Tune your site to pull traffic from your exact service area—not generic national keywords</li>
                <li>Pages for each city, town, or ZIP you want to own</li>
                <li>On‑page copy, headings, and structure aligned with how locals search</li>
                <li>Technical basics: speed, mobile UX, and crawlability that affect local rankings</li>
                <li>Track what ranks, what drives calls, and where to publish next</li>
              </ul>
            </div>
            <div className="card-lift rounded-xl border border-rule bg-bg p-6 shadow-sm">
              <h3 className="font-display text-lg font-medium text-ink">Google Profile Optimization</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-soft">
                <li>Complete, accurate Google Business Profile—photos, hours, services, and attributes</li>
                <li>One of the most underused levers local businesses ignore</li>
                <li>Review requests, replies, and reputation workflows that build trust</li>
                <li>Profile posts, offers, and Q&amp;A so you look active on Maps</li>
                <li>Map pack visibility when someone searches your trade nearby</li>
              </ul>
            </div>
            <div className="card-lift rounded-xl border border-rule bg-bg p-6 shadow-sm">
              <h3 className="font-display text-lg font-medium text-ink">Booking calendar</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-soft">
                <li>Let customers book online 24/7 straight from your website</li>
                <li>Integrates with Google Calendar, Calendly, and tools you already use</li>
                <li>See new bookings and manage availability from your phone</li>
                <li>Automatic confirmations and reminders by email or SMS</li>
                <li>Less phone tag, fewer gaps, and a schedule that fills itself</li>
              </ul>
            </div>
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
