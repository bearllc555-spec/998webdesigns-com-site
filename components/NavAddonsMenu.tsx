"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  addonDomId,
  addonNavHref,
  dispatchAddonFocus,
  dispatchAddonSelect,
  dispatchNavClose,
} from "@/lib/addon-nav";
import { NAV_ADDON_MENU_ITEMS } from "@/lib/addons";

function handleAddonNavClick(
  value: string,
  pathname: string,
  onNavigate?: () => void
) {
  onNavigate?.();
  dispatchNavClose();
  const onHome = pathname === "/";
  const hash = `#${addonDomId(value)}`;
  if (onHome && window.location.hash === hash) {
    dispatchAddonFocus(value);
  } else {
    dispatchAddonSelect(value);
  }
}

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
  pathname,
}: {
  onNavigate?: () => void;
  className?: string;
  pathname: string;
}) {
  return (
    <ul className={className}>
      {NAV_ADDON_MENU_ITEMS.map((item) => (
        <li key={item.value}>
          <Link
            href={addonNavHref(item.value)}
            onClick={(e) => {
              handleAddonNavClick(item.value, pathname, onNavigate);
              e.currentTarget.blur();
            }}
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
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  const closeDropdown = () => {
    setDismissed(true);
    (document.activeElement as HTMLElement | null)?.blur();
  };

  return (
    <div
      className="group relative"
      onMouseLeave={() => setDismissed(false)}
    >
      <Link
        href="/#addons"
        className="nav-link inline-flex items-center gap-1 transition hover:text-ink"
      >
        Add&#8209;ons
        <Chevron className="group-hover:rotate-180 group-focus-within:rotate-180" />
      </Link>
      <div
        className={`absolute left-0 top-full z-50 pt-2 transition duration-200 ${
          dismissed
            ? "pointer-events-none translate-y-1 opacity-0"
            : "pointer-events-none translate-y-1 opacity-0 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100"
        }`}
      >
        <div className="max-h-[min(70vh,24rem)] overflow-y-auto rounded-xl border border-rule bg-bg py-1 shadow-lg">
          <AddonMenuLinks
            pathname={pathname}
            onNavigate={closeDropdown}
          />
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
  const pathname = usePathname();

  const closeAll = () => {
    setOpen(false);
    onNavigate();
  };

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
          pathname={pathname}
          onNavigate={closeAll}
          className="mb-1 ml-2 border-l border-rule pl-2"
        />
      )}
    </li>
  );
}
