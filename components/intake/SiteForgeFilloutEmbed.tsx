"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

/** SiteForge free-mockup Fillout form (email marketing → Hermes). */
export const SITEFORGE_INTAKE_FILLOUT_ID = "vcrTjtTLRtus";

type Props = {
  filloutId?: string;
  /** Initial iframe height; Fillout pages scroll inside. */
  height?: number;
};

/**
 * Fillout standard iframe embed.
 * Uses iframe (not the Fillout JS loader) so CSP only needs frame-src.
 * Parent URL query params are forwarded for UTM / campaign tracking.
 */
export function SiteForgeFilloutEmbed({
  filloutId = SITEFORGE_INTAKE_FILLOUT_ID,
  height = 820,
}: Props) {
  const searchParams = useSearchParams();

  const src = useMemo(() => {
    const url = new URL(`https://forms.fillout.com/t/${filloutId}`);
    searchParams.forEach((value, key) => {
      if (!url.searchParams.has(key)) url.searchParams.set(key, value);
    });
    return url.toString();
  }, [filloutId, searchParams]);

  return (
    <iframe
      title="Free website mockup intake"
      src={src}
      className="w-full border-0 bg-bg"
      style={{ minHeight: height, height }}
      loading="eager"
      referrerPolicy="no-referrer-when-downgrade"
      allow="clipboard-write"
    />
  );
}
