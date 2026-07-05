import Link from "next/link";

const LAUNCHPAD_PROMO = "LAUNCHPADJUNE26";

type PlumbingDemoPostCtaProps = {
  /** Stronger styling after the visitor finishes a Jarvis call. */
  emphasized?: boolean;
};

export function PlumbingDemoPostCta({ emphasized = false }: PlumbingDemoPostCtaProps) {
  return (
    <aside
      className={`mt-6 rounded-2xl border p-6 text-center shadow-sm transition ${
        emphasized
          ? "border-accent bg-accent-soft ring-2 ring-accent/25"
          : "border-accent/30 bg-accent/[0.06]"
      }`}
    >
      <p className="text-base font-medium leading-relaxed text-ink">
        Want Jarvis answering your calls?
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        The Launchpad starts at <strong className="text-ink">$5,998</strong> - code{" "}
        <strong className="font-mono text-ink">{LAUNCHPAD_PROMO}</strong> expires June 30.
      </p>
      <Link
        href={`/start?promo=${LAUNCHPAD_PROMO}`}
        className="mt-5 inline-flex rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-on-accent transition hover:bg-accent-deep"
      >
        Start your site
      </Link>
    </aside>
  );
}
