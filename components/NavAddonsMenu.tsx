"use client";

import Link from "next/link";
import { useState } from "react";
import { NAV_ADDON_MENU_ITEMS } from "@/lib/addons";

const ADDONS_HREF = "/#addons";

function Chevron({ open, className = "" }: { open?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${className}`}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AddonMenuLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <ul className={className}>
      {NAV_ADDON_MENU_ITEMS.map((item) => (
        <li key={item.label}>
          <Link
            href={ADDONS_HREF}
            onClick={onNavigate}
            className="block px-4 py-2 text-sm text-ink-soft transition hover:bg-rule-soft hover:text-ink"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Desktop: hover/focus dropdown. */
export function NavAddonsDropdown() {
  return (
    <div className="group relative">
      <Link
        href={ADDONS_HREF}
        className="nav-link inline-flex items-center gap-1 transition hover:text-ink"
      >
        Add&#8209;ons
        <Chevron className="group-hover:rotate-180 group-focus-within:rotate-180" />
      </Link>
      <div className="pointer-events-none absolute left-0 top-full z-50 pt-2 opacity-0 translate-y-1 transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0">
        <div className="max-h-[min(70vh,24rem)] overflow-y-auto rounded-xl border border-rule bg-bg py-1 shadow-lg">
          <AddonMenuLinks />
        </div>
      </div>
    </div>
  );
}

/** Mobile: tap to expand add-on list. */
export function NavAddonsMobile({
  onNavigate,
}: {
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        className="nav-link flex w-full items-center justify-between rounded-lg px-3 py-2.5 font-medium text-ink-soft transition hover:bg-rule-soft hover:text-ink"
      >
        Add&#8209;ons
        <Chevron open={open} />
      </button>
      {open && (
        <AddonMenuLinks
          onNavigate={onNavigate}
          className="mb-1 ml-2 border-l border-rule pl-2"
        />
      )}
    </li>
  );
}
