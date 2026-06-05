/* Pricing copy is the product. Do not change wording without explicit approval. */

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-rule bg-rule-soft/60">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <div className="max-w-2xl">
          <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
            Pricing
          </h2>
          <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink-soft">
            Every site starts at a flat $5,998 design fee. Your first 30 days of hosting are free —
            monthly or lifetime billing starts on day 31. The pricing below is the whole list — no
            tiers, no add-ons we don&apos;t tell you about, no &ldquo;starting at.&rdquo;
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Design */}
          <article className="card-lift rounded-2xl border border-rule bg-bg p-8 shadow-sm md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">
              Design fee
            </p>
            <p className="mt-2 font-display text-5xl font-medium tracking-tight">
              $5,998 <span className="text-2xl text-ink-soft">— paid in full to start</span>
            </p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
              A handcrafted custom site, designed around your business. Delivered in 7
              business days from the moment payment clears. Yours to keep.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
              We collect full payment before your project enters the queue. This keeps things simple
              for both sides — no holds, no follow-up invoices. Promo codes (e.g.{" "}
              <span className="font-medium text-ink">LINKEDIN20</span>) take a percentage off the
              design fee only — not hosting or other services. Enter yours on the lead form.
            </p>
          </article>

          {/* Hosting choice */}
          <article className="card-lift rounded-2xl border border-rule bg-bg p-8 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">
              Lifetime hosting
            </p>
            <p className="mt-2 font-display text-4xl font-medium tracking-tight">
              $2,996 <span className="text-xl text-ink-soft">/one-time</span>
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              Pay once after your first 30 days of free hosting. We host your site for life,
              including domain registration (com, net, org). Lifetime hosting begins when that
              payment clears.
            </p>
          </article>

          <article className="card-lift rounded-2xl border border-rule bg-bg p-8 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">
              Month-to-month lease
            </p>
            <p className="mt-2 font-display text-4xl font-medium tracking-tight">
              $198 <span className="text-xl text-ink-soft">/month</span>
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              First 30 days free, then $198/mo. Cancel anytime before day 31 and you will not be
              charged for hosting. Upgrade to lifetime hosting whenever you want for $2,996.
            </p>
          </article>

          <p className="text-sm leading-relaxed text-ink-soft md:col-span-2">
            Standard package: 6 pages · ~500 MB storage · unmetered business traffic · domain
            included
          </p>

          {/* Edits */}
          <article className="card-lift rounded-2xl border border-rule bg-bg p-8 shadow-sm md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">
              Edits
            </p>
            <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-baseline md:gap-10">
              <div>
                <p className="font-display text-3xl font-medium tracking-tight">
                  free for the first three months
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
                  After month three, submit edits via form. $10 deducted per edit from a $50 minimum
                  top-up on your account.
                </p>
              </div>
            </div>
          </article>
        </div>

        {/* Upgrade + what-we-don't-do */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <aside className="card-lift rounded-2xl border border-accent-soft bg-accent-soft p-7">
            <p className="text-xs font-medium uppercase tracking-wider text-accent">
              Upgrading hosting
            </p>
            <p className="mt-3 text-base leading-relaxed text-ink">
              Start month-to-month, switch to lifetime hosting whenever you want for $2,996. Past
              monthly payments don&rsquo;t apply toward the lifetime price &mdash; we say this up
              front so it&rsquo;s never a surprise.
            </p>
          </aside>

          <aside className="card-lift rounded-2xl border border-rule bg-bg p-7">
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
