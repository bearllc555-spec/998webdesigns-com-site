const steps = [
  {
    n: "01",
    title: "Fill out the form",
    body: "Tell us about your business — who you serve, what you do, what you want the site to do for you.",
  },
  {
    n: "02",
    title: "Pay the $499 deposit",
    body: "An invoice is sent the moment you submit. The design clock starts the second it clears — half of the $998 total.",
  },
  {
    n: "03",
    title: "Design in 5–7 days",
    body: "Handcrafted for your business. A real designer working on your site by hand.",
  },
  {
    n: "04",
    title: "Approve and go live",
    body: "You approve the draft, pay the $499 balance, and we host it. Live the same day.",
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
            Four steps. No surprises in between.
          </h2>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule md:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className="bg-bg p-7">
              <h3 className="font-display text-3xl font-medium leading-tight">
                <span className="text-accent">{s.n}</span> {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
