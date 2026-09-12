"use client";

import { FilloutStandardEmbed } from "@/components/fillout/FilloutStandardEmbed";

/** SiteForge free-mockup Fillout form (email marketing → Hermes). */
export const SITEFORGE_INTAKE_FILLOUT_ID = "vcrTjtTLRtus";

type Props = {
  filloutId?: string;
};

export function SiteForgeFilloutEmbed({
  filloutId = SITEFORGE_INTAKE_FILLOUT_ID,
}: Props) {
  return (
    <FilloutStandardEmbed
      filloutId={filloutId}
      title="Free website mockup intake"
    />
  );
}
