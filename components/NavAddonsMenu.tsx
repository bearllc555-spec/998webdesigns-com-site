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
import { GROWTH_PACK_ID, GROWTH_PACK_INCLUDES, NAV_ADDON_MENU_ITEMS } from "@/lib/addons";

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

const ADDON_LINK_CLASS =
  "block rounded-lg px-3 py-2.5 text-sm leading-snug text-ink-soft transition hover:bg-rule-soft hover:text-ink";

const GROWTH_PACK_LINK_CLASS =
  "block rounded-lg border border-accent/25 bg-accent/[0.06] px-3 py-3 text-sm leading-snug transition hover:border-accent/40 hover:bg-accent/[0.1]";

function GrowthPackNavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: (typeof NAV_ADDON_MENU_ITEMS)[number];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={addonNavHref(item.value)}
      onClick={(e) => {
        handleAddonNavClick(item.value, pathname, onNavigate);
        e.currentTarget.blur();
      }}
      className={GROWTH_PACK_LINK_CLASS}
    >
      <span className="font-medium text-ink">{item.label}</span>
      <span className="mt-1 block text-xs font-normal text-ink-soft">
        Includes {GROWTH_PACK_INCLUDES.join(", ")}
      </span>
    </Link>
  );
}

function AddonMenuGrid({
  onNavigate,
  className,
  pathname,
}: {
  onNavigate?: () => void;
  className?: string;
  pathname: string;
}) {
  const standardItems = NAV_ADDON_MENU_ITEMS.filter(
    (item) => item.value !== GROWTH_PACK_ID
  );
  const growthPack = NAV_ADDON_MENU_ITEMS.find(
    (item) => item.value === GROWTH_PACK_ID
  );

  function renderLink(
    item: (typeof NAV_ADDON_MENU_ITEMS)[number],
    linkClass: string
  ) {
    return (
      <Link
        href={addonNavHref(item.value)}
        onClick={(e) => {
          handleAddonNavClick(item.value, pathname, onNavigate);
          e.currentTarget.blur();
        }}
        className={linkClass}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className={className}>
      <ul className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
        {standardItems.map((item) => (
          <li key={item.value}>{renderLink(item, ADDON_LINK_CLASS)}</li>
        ))}
      </ul>
      {growthPack ? (
        <div className="mt-2 border-t border-rule pt-2">
          <GrowthPackNavLink
            item={growthPack}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        </div>
      ) : null}
    </div>
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
        <div className="w-[34rem] max-w-[calc(100vw-2.5rem)] rounded-xl border border-rule bg-bg p-3 shadow-lg">
          <AddonMenuGrid pathname={pathname} onNavigate={closeDropdown} />
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
      {open ? (
        <AddonMenuGrid
          pathname={pathname}
          onNavigate={closeAll}
          className="mb-2 mt-1 rounded-xl border border-rule bg-rule-soft/40 p-2"
        />
      ) : null}
    </li>
  );
}
