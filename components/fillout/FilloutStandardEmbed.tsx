"use client";

import { useEffect, useId, useRef } from "react";

/** Official Fillout standard embed (script creates an allowlisted iframe). */
const EMBED_SCRIPT_SRC = "https://server.fillout.com/embed/v1/";

type Props = {
  filloutId: string;
  title?: string;
  minHeight?: number;
};

export function FilloutStandardEmbed({
  filloutId,
  title = "Form",
  minHeight = 640,
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
    mount.style.minHeight = `${minHeight}px`;
    mount.setAttribute("data-fillout-id", filloutId);
    mount.setAttribute("data-fillout-embed-type", "standard");
    mount.setAttribute("data-fillout-inherit-parameters", "true");
    mount.setAttribute("data-fillout-dynamic-resize", "true");
    host.appendChild(mount);

    const prev = document.querySelectorAll(`script[src="${EMBED_SCRIPT_SRC}"]`);
    prev.forEach((el) => el.remove());

    const script = document.createElement("script");
    script.src = EMBED_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      host.innerHTML = "";
    };
  }, [filloutId, mountId, minHeight]);

  return (
    <div
      ref={hostRef}
      className="w-full"
      style={{ minHeight }}
      aria-label={title}
    />
  );
}
