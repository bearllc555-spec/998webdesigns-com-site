"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BANNER_DESIGN_ROUTES } from "@/lib/linkedin-banner-preview";

const LINKEDIN_INSPIRATION_HREF = "/temp/linkedin";

export function BannerDesignNav() {
  const pathname = usePathname();

  return (
    <nav className="temp-switcher" aria-label="Banner designs">
      {BANNER_DESIGN_ROUTES.map((design) => (
        <Link
          key={design.previewHref}
          href={design.previewHref}
          aria-current={pathname === design.previewHref ? "page" : undefined}
        >
          {design.label}
        </Link>
      ))}
      <Link
        href={LINKEDIN_INSPIRATION_HREF}
        className="temp-switcher-linkedin"
        aria-current={pathname === LINKEDIN_INSPIRATION_HREF ? "page" : undefined}
      >
        LinkedIn
      </Link>
    </nav>
  );
}
