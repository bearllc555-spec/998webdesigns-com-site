"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Add { href: "/temp/N", label: "Design N" } for each new iteration. */
export const BANNER_DESIGNS = [
  { href: "/temp", label: "Design 1" },
  { href: "/temp/2", label: "Design 2" },
  { href: "/temp/3", label: "Design 3" },
] as const;

export function BannerDesignNav() {
  const pathname = usePathname();

  return (
    <nav className="temp-switcher" aria-label="Banner designs">
      {BANNER_DESIGNS.map((design) => (
        <Link
          key={design.href}
          href={design.href}
          aria-current={pathname === design.href ? "page" : undefined}
        >
          {design.label}
        </Link>
      ))}
    </nav>
  );
}
