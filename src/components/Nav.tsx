import Link from "next/link";
import { SITE_VERSION } from "@/lib/version";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-bg/80 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8"
      >
        <Link href="/" className="flex items-baseline gap-2 text-lg font-semibold tracking-tight">
          <span className="flex items-baseline gap-1">
            <span className="text-accent font-bold">998</span>
            <span className="text-ink">webdesigns</span>
          </span>
          <span
            aria-hidden="true"
            className="rounded-full bg-rule-soft px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-slate"
          >
            {SITE_VERSION}
          </span>
        </Link>

        <div className="hidden items-center gap-7 text-sm text-ink-soft md:flex">
          <a href="#work" className="transition hover:text-ink">Our work</a>
          <a href="#how" className="transition hover:text-ink">How it works</a>
          <a href="#pricing" className="transition hover:text-ink">Pricing</a>
          <a href="#faq" className="transition hover:text-ink">FAQ</a>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#start"
            className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg transition hover:bg-ink-soft"
          >
            Get a preview
          </a>
        </div>
      </nav>
    </header>
  );
}
