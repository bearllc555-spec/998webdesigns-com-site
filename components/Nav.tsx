"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onHomeLogoClick } from "@/lib/home-link";
import { SITE_VERSION } from "@/lib/version";
import { ContactModal } from "./ContactModal";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/#addons", label: "Add\u2011ons" },
  { href: "/portfolio", label: "Work" },
  { href: "/blog", label: "Blog" },
  { href: "/#how", label: "Process" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
] as const;

export function Nav() {
  const pathname = usePathname();
  const [contactOpen, setContactOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-rule bg-bg/80 backdrop-blur transition-colors duration-300">
        <nav
          aria-label="Primary"
          className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8"
        >
          <Link
            href="/"
            onClick={(e) => onHomeLogoClick(e, pathname)}
            aria-label={`998 webdesigns home, ${SITE_VERSION}`}
            className="flex items-baseline gap-2 text-lg font-semibold tracking-tight"
          >
            <span className="flex items-baseline gap-1">
              <span className="text-accent font-bold">998</span>
              <span className="text-ink">webdesigns</span>
            </span>
            <span className="rounded-full bg-rule-soft px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-ink-soft">
              {SITE_VERSION}
            </span>
          </Link>

          <div className="hidden items-center gap-5 text-sm text-ink-soft md:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="nav-link transition hover:text-ink">
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rule text-ink transition hover:bg-rule-soft md:hidden"
            >
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
              {menuOpen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              aria-label="Contact us"
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rule text-ink-soft transition hover:border-accent/50 hover:bg-rule-soft hover:text-accent sm:inline-flex"
            >
              <Mail className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
            </button>
            <Link
              href="/book"
              className="hidden items-center justify-center rounded-full border border-rule px-4 py-2 text-sm font-medium text-ink transition hover:bg-rule-soft sm:inline-flex"
            >
              Book
            </Link>
            <Link
              href="/start"
              className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:bg-accent-deep"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-30 bg-ink/20 md:hidden"
              onClick={closeMenu}
            />
            <div
              id="mobile-nav-menu"
              className="relative z-40 border-t border-rule bg-bg px-5 py-4 md:hidden"
            >
              <ul className="flex flex-col gap-1 text-sm">
                {NAV_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={closeMenu}
                      className="nav-link block rounded-lg px-3 py-2.5 font-medium text-ink-soft transition hover:bg-rule-soft hover:text-ink"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/book"
                    onClick={closeMenu}
                    className="nav-link block rounded-lg px-3 py-2.5 font-medium text-ink-soft transition hover:bg-rule-soft hover:text-ink"
                  >
                    Book
                  </Link>
                </li>
                <li className="border-t border-rule pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      setContactOpen(true);
                    }}
                    className="nav-link block w-full rounded-lg px-3 py-2.5 text-left font-medium text-ink-soft transition hover:bg-rule-soft hover:text-ink"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
      </header>
      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
}
