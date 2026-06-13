import Link from "next/link";
import { HOSTING_TRIAL_DAYS } from "@/lib/hosting-policy";

export function BlogCta() {
  return (
    <aside className="mt-14 rounded-2xl border border-rule bg-rule-soft/60 p-6 md:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
        Next step
      </p>
      <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
        Need a site built for local leads?
      </h2>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-soft">
        Flat $5,998 design fee. First {HOSTING_TRIAL_DAYS} days of hosting free. Delivered in about 7
        business days after payment clears.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/start"
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition hover:bg-accent-deep"
        >
          Get started
        </Link>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center rounded-full border border-rule px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-bg"
        >
          See pricing
        </Link>
      </div>
    </aside>
  );
}
