"use client";

import { useEffect, useRef } from "react";

/** SiteForge free-mockup Fillout form (email marketing → Hermes). */
export const SITEFORGE_INTAKE_FILLOUT_ID = "vcrTjtTLRtus";

const EMBED_SCRIPT_SRC = "https://server.fillout.com/embed/v1/";
const EMBED_SCRIPT_ID = "fillout-embed-v1";

type Props = {
  filloutId?: string;
};

/**
 * Standard Fillout embed with dynamic resize + parent URL params (UTM, etc.).
 */
export function SiteForgeFilloutEmbed({
  filloutId = SITEFORGE_INTAKE_FILLOUT_ID,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    host.innerHTML = "";
    const mount = document.createElement("div");
    mount.style.width = "100%";
    mount.style.minHeight = "640px";
    mount.setAttribute("data-fillout-id", filloutId);
    mount.setAttribute("data-fillout-embed-type", "standard");
    mount.setAttribute("data-fillout-inherit-parameters", "");
    mount.setAttribute("data-fillout-dynamic-resize", "");
    host.appendChild(mount);

    const existing = document.getElementById(EMBED_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.remove();
    }
    const script = document.createElement("script");
    script.id = EMBED_SCRIPT_ID;
    script.src = EMBED_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      host.innerHTML = "";
    };
  }, [filloutId]);

  return <div ref={hostRef} className="w-full" />;
}
