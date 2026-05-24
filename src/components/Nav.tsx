"use client";

import Link from "next/link";
import { useState } from "react";
import { SITE_VERSION } from "@/lib/version";

const NAV_LINKS = [
  { href: "/#work", label: "Our work" },
  { href: "/#how", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
] as const;

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-bg/80 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto max-w-6xl px-5 py-4 md:px-8"
      >
        <div className="flex items-center justify-between gap-4">
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
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="transition hover:text-ink">
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/#start"
              className="hidden items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg transition hover:bg-ink-soft sm:inline-flex"
            >
              Get a preview
            </Link>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-rule p-2 text-ink-soft transition hover:border-ink hover:text-ink md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
              {menuOpen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div
            id="mobile-nav"
            className="mt-4 flex flex-col gap-1 border-t border-rule pt-4 md:hidden"
          >
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-2.5 text-sm text-ink-soft transition hover:bg-rule-soft hover:text-ink"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/#start"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-bg transition hover:bg-ink-soft"
              onClick={() => setMenuOpen(false)}
            >
              Get a preview
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
