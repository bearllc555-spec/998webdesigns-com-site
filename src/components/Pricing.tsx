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
            $998. Once.
          </h2>
          <p className="mt-5 max-w-prose text-lg leading-relaxed text-ink-soft">
            Every site starts at a flat $998 design fee. The pricing below is the whole list — no
            tiers, no add-ons we don't tell you about, no &ldquo;starting at.&rdquo;
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Design */}
          <article className="rounded-2xl border border-rule bg-bg p-8 shadow-sm md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">
              Design fee
            </p>
            <p className="mt-2 font-display text-5xl font-medium tracking-tight">
              $998 <span className="text-2xl text-ink-soft">once</span>
            </p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
              A handcrafted custom site, designed around your business. Delivered in 5&ndash;7
              business days from the moment your deposit clears. Yours to keep.
            </p>
          </article>

          <article className="rounded-2xl border border-rule bg-bg p-8 shadow-sm md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">
              Hosting
            </p>
            <p className="mt-2 font-display text-5xl font-medium tracking-tight">
              $0 <span className="text-2xl text-ink-soft">free first month</span>
            </p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
              First month hosting free with handcrafted custom site.
            </p>
          </article>

          {/* Hosting choice */}
          <article className="rounded-2xl border border-rule bg-bg p-8 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">
              Hosting Option A Month-to-month lease
            </p>
            <p className="mt-2 font-display text-4xl font-medium tracking-tight">
              $98 <span className="text-xl text-ink-soft">/ month</span>
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              Cancel anytime. Upgrade to lifetime hosting whenever you want for $998.
            </p>
          </article>

          <article className="rounded-2xl border border-rule bg-bg p-8 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">
              Hosting Option B Lifetime hosting
            </p>
            <p className="mt-2 font-display text-4xl font-medium tracking-tight">
              $998 <span className="text-xl text-ink-soft">one-time</span>
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              Pay once. We host your site forever. Never billed again.
            </p>
          </article>

          {/* Edits */}
          <article className="rounded-2xl border border-rule bg-bg p-8 shadow-sm md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">
              Edits
            </p>
            <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-baseline md:gap-10">
              <div>
                <p className="font-display text-3xl font-medium tracking-tight">
                  Free for the first month
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  While we get your site dialed in.
                </p>
              </div>
              <div className="hidden h-12 w-px bg-rule md:block" />
              <div>
                <p className="font-display text-3xl font-medium tracking-tight">
                  $10 each &middot; $50 minimum
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  After month one, submit edits via form. $10 deducted per edit from a $50 minimum
                  top-up on your account.
                </p>
              </div>
            </div>
          </article>
        </div>

        {/* Upgrade + what-we-don't-do */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <aside className="rounded-2xl border border-accent-soft bg-accent-soft p-7">
            <p className="text-xs font-medium uppercase tracking-wider text-accent">
              Upgrading hosting
            </p>
            <p className="mt-3 text-base leading-relaxed text-ink">
              Start month-to-month, switch to lifetime hosting whenever you want for $998. Past
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
