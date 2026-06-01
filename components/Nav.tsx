"use client";

import { useState } from "react";
import Link from "next/link";
import { SITE_VERSION } from "@/lib/version";
import { ContactModal } from "./ContactModal";

export function Nav() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
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
            <Link href="/#addons" className="nav-link transition hover:text-ink">
              Add‑ons
            </Link>
            <Link href="/#work" className="nav-link transition hover:text-ink">
              Recent Work
            </Link>
            <Link href="/#how" className="nav-link transition hover:text-ink">
              How it works
            </Link>
            <Link href="/#pricing" className="nav-link transition hover:text-ink">
              Pricing
            </Link>
            <Link href="/#faq" className="nav-link transition hover:text-ink">
              FAQ
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setContactOpen(true)}
              className="inline-flex items-center justify-center rounded-full border border-rule px-4 py-2 text-sm font-medium text-ink transition hover:bg-bg-soft"
            >
              Contact
            </button>
            <Link
              href="/#start"
              className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-medium text-bg transition hover:bg-accent-deep"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>
      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
}
