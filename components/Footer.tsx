"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onHomeLogoClick } from "@/lib/home-link";
import { ContactModal } from "./ContactModal";
import { SiteVersionPill } from "./SiteVersionPill";

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
              aria-label="998 webdesigns home"
              className="flex items-baseline gap-2 text-xl font-semibold tracking-tight"
            >
              <span className="flex items-baseline gap-1">
                <span className="text-accent text-[22px] font-bold">998</span>
                <span className="text-ink">webdesigns</span>
              </span>
            </Link>
            <p className="mt-2 text-sm text-slate">
              A handcrafted website for $5,998.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/#addons" className="nav-link transition hover:text-ink">
              Add‑ons
            </Link>
            <Link href="/portfolio" className="nav-link transition hover:text-ink">
              Recent Work
            </Link>
            <Link href="/blog" className="nav-link transition hover:text-ink">
              Field notes
            </Link>
            <Link href="/#how" className="nav-link transition hover:text-ink">
              How it works
            </Link>
            <Link href="/pricing" className="nav-link transition hover:text-ink">
              Pricing
            </Link>
            <Link href="/start" className="nav-link transition hover:text-ink">
              Get started
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
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-rule px-5 py-5 text-center text-xs text-slate md:px-8">
          <span>
            &copy; 2026 998webdesigns.com &middot; A Bear LLC digital property
          </span>
          <SiteVersionPill />
        </p>
      </footer>
      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
}
