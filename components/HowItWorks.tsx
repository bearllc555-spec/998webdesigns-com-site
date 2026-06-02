const steps = [
  {
    n: "01",
    title: "Fill out the form",
    body: "Tell us about your business — who you serve, what you do, what you want the site to do for you.",
    cta: true,
  },
  {
    n: "02",
    title: "Pay through Stripe",
    body: "On the last form step, choose a $499 deposit or $998 pay-in-full. Secure Stripe checkout — the design clock starts when payment clears.",
  },
  {
    n: "03",
    title: "We design in 5–7 business days",
    body: "Handcrafted, not templated. A real designer working on your site by hand.",
  },
  {
    n: "04",
    title: "Approve and go live",
    body: "You approve the draft and we launch the same day. Paid a deposit? We capture the $499 balance from your card on approval. Paid in full? You are already settled.",
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
      </div>
    </section>
  );
}
