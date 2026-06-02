"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onHomeLogoClick } from "@/lib/home-link";
import { SITE_VERSION } from "@/lib/version";
import { ContactModal } from "./ContactModal";

export function Footer() {
  const pathname = usePathname();
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-rule bg-bg">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-sm text-ink-soft md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <Link
              href="/"
              onClick={(e) => onHomeLogoClick(e, pathname)}
              aria-label={`998 webdesigns home, ${SITE_VERSION}`}
              className="flex items-baseline gap-2 text-base font-semibold tracking-tight"
            >
              <span className="flex items-baseline gap-1">
                <span className="text-accent font-bold">998</span>
                <span className="text-ink">webdesigns</span>
              </span>
              <span className="rounded-full bg-rule-soft px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-slate">
                {SITE_VERSION}
              </span>
            </Link>
            <p className="mt-2 text-sm text-slate">
              A handcrafted website for $998.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2">
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
            <Link href="/legal/terms" className="nav-link transition hover:text-ink">
              Terms
            </Link>
            <Link href="/legal/privacy" className="nav-link transition hover:text-ink">
              Privacy
            </Link>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="nav-link transition hover:text-ink"
            >
              Contact
            </button>
          </nav>
        </div>
        <p className="border-t border-rule px-5 py-5 text-center text-xs text-slate md:px-8">
          &copy; 2026 998webdesigns.com &middot; A Bear LLC digital property
        </p>
      </footer>
      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
}
