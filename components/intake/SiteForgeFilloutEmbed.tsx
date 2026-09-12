"use client";

import { useEffect, useId, useRef } from "react";

/** SiteForge free-mockup Fillout form (email marketing → Hermes). */
export const SITEFORGE_INTAKE_FILLOUT_ID = "vcrTjtTLRtus";

const EMBED_SCRIPT_SRC = "https://server.fillout.com/embed/v1/";

type Props = {
  filloutId?: string;
};

/**
 * Official Fillout standard embed (script creates an allowlisted iframe).
 * Direct forms.fillout.com/t/… URLs send frame-ancestors none and will not load in an iframe.
 */
export function SiteForgeFilloutEmbed({
  filloutId = SITEFORGE_INTAKE_FILLOUT_ID,
}: Props) {
  const reactId = useId().replace(/:/g, "");
  const mountId = `fillout-mount-${reactId}`;
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    host.innerHTML = "";
    const mount = document.createElement("div");
    mount.id = mountId;
    mount.style.width = "100%";
    mount.style.minHeight = "640px";
    mount.setAttribute("data-fillout-id", filloutId);
    mount.setAttribute("data-fillout-embed-type", "standard");
    mount.setAttribute("data-fillout-inherit-parameters", "true");
    mount.setAttribute("data-fillout-dynamic-resize", "true");
    host.appendChild(mount);

    // Always inject a fresh script so Fillout re-scans after client mount.
    const prev = document.querySelectorAll(`script[src="${EMBED_SCRIPT_SRC}"]`);
    prev.forEach((el) => el.remove());

    const script = document.createElement("script");
    script.src = EMBED_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      host.innerHTML = "";
    };
  }, [filloutId, mountId]);

  return <div ref={hostRef} className="w-full min-h-[640px]" />;
}
