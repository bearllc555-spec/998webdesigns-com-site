import { Carousel } from "./Carousel";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-rule">
      <div className="mx-auto max-w-6xl px-5 pb-14 pt-16 md:px-8 md:pb-20 md:pt-24">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-rule bg-rule-soft px-3 py-1 text-xs font-medium uppercase tracking-wider text-ink-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Now booking small-business websites
        </p>

        <h1 className="font-display text-5xl font-bold leading-[1.04] tracking-[-0.035em] text-ink md:text-7xl">
          We don&apos;t just build sites.
          <br />
          We build <span className="text-accent">systems</span> that bring you more business.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft md:text-xl">
          Strategy, design, blogging, hyper‑local SEO, and automation in one affordable package, delivered fast for local service businesses.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a
            href="#start"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-medium text-bg shadow-sm transition hover:bg-accent-deep"
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
              Every build includes options for blogging, hyper‑local SEO, Google Business optimization, review generation, and email/SMS follow‑ups so you get more calls, more bookings, and more repeat clients.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-rule bg-bg p-6">
              <h3 className="font-display text-lg font-medium text-ink">Blogging</h3>
              <p className="mt-2 text-sm text-ink-soft">Content that attracts organic traffic and keeps customers engaged.</p>
            </div>
            <div className="rounded-xl border border-rule bg-bg p-6">
              <h3 className="font-display text-lg font-medium text-ink">SEO</h3>
              <p className="mt-2 text-sm text-ink-soft">Hyper‑local optimization to help customers find you in search results.</p>
            </div>
            <div className="rounded-xl border border-rule bg-bg p-6">
              <h3 className="font-display text-lg font-medium text-ink">Google</h3>
              <p className="mt-2 text-sm text-ink-soft">Google Business Profile optimization and review management tools.</p>
            </div>
            <div className="rounded-xl border border-rule bg-bg p-6">
              <h3 className="font-display text-lg font-medium text-ink">Calendar</h3>
              <p className="mt-2 text-sm text-ink-soft">Integrated booking calendar to streamline customer appointments.</p>
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
