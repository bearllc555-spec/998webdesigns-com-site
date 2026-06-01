const steps = [
  {
    n: "01",
    title: "Fill out the form",
    body: "Tell us about your business — who you serve, what you do, what you want the site to do for you.",
    cta: true,
  },
  {
    n: "02",
    title: "Pay the $499 deposit",
    body: "An invoice is sent the moment you submit. The clock starts the second it clears.",
  },
  {
    n: "03",
    title: "We design in 5–7 business days",
    body: "Handcrafted, not templated. A real designer working on your site by hand.",
  },
  {
    n: "04",
    title: "Approve and go live",
    body: "You approve the draft, pay the balance, we host it. Live the same day.",
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
                  className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-medium text-bg transition hover:opacity-90"
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
