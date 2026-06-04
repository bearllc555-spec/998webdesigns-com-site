const steps = [
  {
    n: "01",
    title: "Fill out the form",
    body: "Tell us about your business — who you serve, what you do, what you want the site to do for you. If you'd like add-ons at launch — SEO, chatbot, booking calendar, and more — select them here and we'll scope everything into one timeline.",
    cta: true,
  },
  {
    n: "02",
    title: "Pay through Stripe",
    body: "On the last form step, pay by card (default) or switch to bank transfer to avoid the 3% processing fee on your design fee. Pay in full through secure Stripe checkout — month-to-month hosting ($198/mo) starts in the same session if you select it. The design clock starts when payment clears (bank transfers may take a few business days).",
  },
  {
    n: "03",
    title: "We build your site",
    body: "We build your site in 7 business days. If you selected add-ons, setup runs in parallel — most add-ons go live within 1–3 business days of site delivery. Full-stack builds (3 or more add-ons) are delivered within 14 business days.",
  },
  {
    n: "04",
    title: "Approve and go live",
    body: "You approve the draft and we launch the same day. You're already paid in full — no follow-up invoice at approval.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-b border-rule">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
            How it works
          </p>
          <h2 className="mt-4 font-display text-3xl font-medium leading-tight md:text-5xl">
            four steps. no surprises in between.
          </h2>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li
              key={s.n}
              className="card-lift rounded-2xl border border-rule bg-bg p-7 shadow-sm"
            >
              <span className="font-display text-3xl font-medium text-accent">
                {s.n}
              </span>
              <h3 className="mt-4 font-display text-lg font-medium">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {s.body}
              </p>
              {"cta" in s && s.cta && (
                <a
                  href="#start"
                  className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-medium text-on-accent transition hover:opacity-90"
                >
                  Get Started
                </a>
              )}
            </li>
          ))}
        </ol>

        {/* What Comes Next — post-steps fork */}
        <div className="mt-10">
          <p className="mb-4 text-xs font-medium uppercase tracking-widest text-accent">
            What Comes Next
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="card-lift rounded-xl border border-rule bg-bg p-6 shadow-sm">
              <p className="mb-2 font-display text-base font-medium text-ink">
                Launch &amp; done
              </p>
              <p className="text-sm text-ink-soft">
                Your site is live, hosted, and yours. Edits are $10 each. Nothing else required.
              </p>
            </div>
            <div className="card-lift rounded-xl border border-rule bg-bg p-6 shadow-sm">
              <p className="mb-2 font-display text-base font-medium text-ink">
                Keep growing
              </p>
              <p className="text-sm text-ink-soft">
                Add-ons you selected go live within 1–3 days of your site. New ones can be added any time — each one compounds the last.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
