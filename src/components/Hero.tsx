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
          Custom site design
          <br />
          for <span className="text-accent">$998.</span>{" "}
          <span className="text-ink-soft">Delivered in 5&ndash;7 business days.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft md:text-xl">
          Small businesses that want a real designer, not a DIY page builder. $998 covers the design
          &mdash; hosting is separate after a free first month.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a
            href="#start"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-base font-medium text-bg shadow-sm transition hover:bg-ink-soft"
          >
            Start your site brief
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href="#work"
            className="inline-flex items-center gap-2 rounded-full border border-rule bg-bg px-6 py-3 text-base font-medium text-ink transition hover:border-ink-soft"
          >
            See our work
          </a>
        </div>

        <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate">
          Submit the brief — we reply with next steps and your $499 deposit invoice. No charge until
          you pay the invoice. The site design is yours to keep; hosting is separate after a free
          first month.
        </p>
      </div>

      <div id="work">
        <Carousel />
      </div>
    </section>
  );
}
