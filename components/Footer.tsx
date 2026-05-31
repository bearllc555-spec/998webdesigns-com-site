import Link from "next/link";
import { SITE_VERSION } from "@/lib/version";

export function Footer() {
  return (
    <footer className="border-t border-rule bg-bg">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-sm text-ink-soft md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <Link href="/" className="flex items-baseline gap-2 text-base font-semibold tracking-tight">
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
          <p className="mt-2 text-sm text-slate">
            A handcrafted website for $998. A Bear LLC digital property.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href="#pricing" className="relative transition hover:text-ink after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-500 after:transition-all hover:after:w-full">Pricing</a>
          <a href="#how" className="relative transition hover:text-ink after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-500 after:transition-all hover:after:w-full">How it works</a>
          <a href="#faq" className="relative transition hover:text-ink after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-500 after:transition-all hover:after:w-full">FAQ</a>
          <Link href="/legal/terms" className="relative transition hover:text-ink after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-500 after:transition-all hover:after:w-full">Terms</Link>
          <Link href="/legal/privacy" className="relative transition hover:text-ink after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-500 after:transition-all hover:after:w-full">Privacy</Link>
          <a href="mailto:hello@998webdesigns.com" className="transition hover:text-ink">
            hello@998webdesigns.com
          </a>
        </nav>
      </div>
      <p className="border-t border-rule px-5 py-5 text-center text-xs text-slate md:px-8">
        &copy; 2026 998 web designs &middot; a bear llc digital property
      </p>
    </footer>
  );
}
