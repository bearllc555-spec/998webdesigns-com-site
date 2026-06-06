"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BANNER_DESIGN_ROUTES } from "@/lib/linkedin-banner-preview";
import { LINKEDIN_BANNER_VERSION } from "@/lib/linkedin-banner-version";

const LINKEDIN_INSPIRATION_HREF = "/temp/linkedin";

export function BannerDesignNav() {
  const pathname = usePathname();

  return (
    <nav className="temp-switcher" aria-label="Banner designs">
      <div className="temp-switcher-edge temp-switcher-edge--start">
        <span className="temp-switcher-version" aria-label={`Banner workspace ${LINKEDIN_BANNER_VERSION}`}>
          {LINKEDIN_BANNER_VERSION}
        </span>
      </div>

      <div className="temp-switcher-center">
        <Link
          href={LINKEDIN_INSPIRATION_HREF}
          className="temp-switcher-linkedin"
          aria-current={pathname === LINKEDIN_INSPIRATION_HREF ? "page" : undefined}
        >
          LinkedIn
        </Link>
        {BANNER_DESIGN_ROUTES.map((design) => (
          <Link
            key={design.previewHref}
            href={design.previewHref}
            aria-current={pathname === design.previewHref ? "page" : undefined}
          >
            {design.label}
          </Link>
        ))}
      </div>

      <div className="temp-switcher-edge temp-switcher-edge--end">
        <Link href="/crm" className="temp-switcher-crm">
          CRM
        </Link>
      </div>
    </nav>
  );
}
