/* Pricing copy is the product. Do not change wording without explicit approval. */

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-rule bg-rule-soft/60">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
            Pricing
          </p>
          <h2 className="mt-4 font-display text-3xl font-medium leading-tight md:text-5xl">
            $998 total for the site.
          </h2>
          <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink-soft">
            Every site starts at a flat $998 design fee. The pricing below is the whole list — no
            tiers, no add-ons we don&apos;t tell you about, no &ldquo;starting at.&rdquo;
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-rule bg-bg p-8 shadow-sm md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">
              Design fee
            </p>
            <p className="mt-2 font-display text-5xl font-medium tracking-tight">
              $998 <span className="text-2xl text-ink-soft">/ once</span>
            </p>
            <p className="mt-3 text-base font-medium text-ink">
              $499 deposit to start &middot; $499 balance at approval &middot; $998 total
            </p>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
              A handcrafted custom site, designed around your business. Delivered in 5&ndash;7
              business days from the moment your deposit clears. You own the design — files and
              content are yours.
            </p>
          </article>

          <article className="rounded-2xl border border-rule bg-bg p-8 shadow-sm md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">
              First month hosting
            </p>
            <p className="mt-2 font-display text-5xl font-medium tracking-tight">
              $0 <span className="text-2xl text-ink-soft">/ first month</span>
            </p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
              Included with every custom site. Starting month two, choose month-to-month or lifetime
              hosting below — or decide later when you submit the brief.
            </p>
          </article>

          <article className="rounded-2xl border border-rule bg-bg p-8 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">
              Month-to-month hosting
            </p>
            <p className="mt-2 font-display text-5xl font-medium tracking-tight">
              $98 <span className="text-2xl text-ink-soft">/ month</span>
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              Cancel anytime. Upgrade to lifetime hosting whenever you want for $1,799.
            </p>
          </article>

          <article className="rounded-2xl border border-rule bg-bg p-8 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">
              Lifetime hosting
            </p>
            <p className="mt-2 font-display text-5xl font-medium tracking-tight">
              $1,799 <span className="text-2xl text-ink-soft">/ one-time</span>
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              Pay once. We host your site forever &mdash; never billed again for hosting. Includes
              one standard domain (.com, .net, etc.) registered in your name for 10 years;
              renewals after that are yours to manage. Edits after month one are billed separately.
            </p>
          </article>

          <article className="rounded-2xl border border-rule bg-bg p-8 shadow-sm md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">
              Edits
            </p>
            <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-baseline md:gap-10">
              <div>
                <p className="font-display text-5xl font-medium tracking-tight">
                  Free <span className="text-2xl text-ink-soft">/ first month</span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  While we get your site dialed in.
                </p>
              </div>
              <div className="hidden h-12 w-px bg-rule md:block" />
              <div>
                <p className="font-display text-5xl font-medium tracking-tight">
                  $10 <span className="text-2xl text-ink-soft">/ edit</span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  After month one, submit edits via form. $50 minimum top-up on your account; $10
                  deducted per edit.
                </p>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <aside className="rounded-2xl border border-accent-soft bg-accent-soft p-7">
            <p className="text-xs font-medium uppercase tracking-wider text-accent">
              Upgrading hosting
            </p>
            <p className="mt-3 text-base leading-relaxed text-ink">
              Start month-to-month, switch to lifetime hosting whenever you want for $1,799. Past
              monthly payments don&rsquo;t apply toward the lifetime price &mdash; we say this up
              front so it&rsquo;s never a surprise.
            </p>
          </aside>

          <aside className="rounded-2xl border border-rule bg-bg p-7">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">
              What we don&rsquo;t do
            </p>
            <p className="mt-3 text-base leading-relaxed text-ink-soft">
              Agencies. Retainers. Hidden fees. Lock-in.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
