"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ADDON_FOCUS_EVENT,
  addonDomId,
  addonValueFromHash,
} from "@/lib/addon-nav";

const HIGHLIGHT_MS = 4500;

export function useAddonNavHighlight() {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const pathname = usePathname();

  const focusAddon = useCallback((value: string) => {
    const id = addonDomId(value);
    setHighlighted(value);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  useEffect(() => {
    let clearTimer: ReturnType<typeof setTimeout> | undefined;

    const armHighlight = (value: string) => {
      if (clearTimer) clearTimeout(clearTimer);
      focusAddon(value);
      clearTimer = setTimeout(() => setHighlighted(null), HIGHLIGHT_MS);
    };

    const fromHash = () => {
      const value = addonValueFromHash(window.location.hash);
      if (value) armHighlight(value);
    };

    const onFocusEvent = (e: Event) => {
      const value = (e as CustomEvent<{ value: string }>).detail?.value;
      if (value) armHighlight(value);
    };

    fromHash();
    window.addEventListener("hashchange", fromHash);
    window.addEventListener(ADDON_FOCUS_EVENT, onFocusEvent);
    return () => {
      if (clearTimer) clearTimeout(clearTimer);
      window.removeEventListener("hashchange", fromHash);
      window.removeEventListener(ADDON_FOCUS_EVENT, onFocusEvent);
    };
  }, [focusAddon, pathname]);

  return { highlighted, focusAddon };
}
