"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ADDON_FOCUS_EVENT,
  addonDomId,
  addonValueFromHash,
} from "@/lib/addon-nav";

function clearAddonHash() {
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}`);
}

function setAddonHash(value: string) {
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}#${addonDomId(value)}`);
}

export function useAddonNavHighlight() {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const pathname = usePathname();

  const scrollToAddon = useCallback((value: string) => {
    requestAnimationFrame(() => {
      document.getElementById(addonDomId(value))?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, []);

  const toggleHighlight = useCallback(
    (value: string) => {
      setHighlighted((current) => {
        if (current === value) {
          clearAddonHash();
          return null;
        }
        setAddonHash(value);
        scrollToAddon(value);
        return value;
      });
    },
    [scrollToAddon]
  );

  useEffect(() => {
    const applyFromHash = () => {
      const value = addonValueFromHash(window.location.hash);
      if (value) {
        setHighlighted(value);
        scrollToAddon(value);
      } else {
        setHighlighted(null);
      }
    };

    const onFocusEvent = (e: Event) => {
      const value = (e as CustomEvent<{ value: string }>).detail?.value;
      if (value) toggleHighlight(value);
    };

    applyFromHash();
    window.addEventListener("hashchange", applyFromHash);
    window.addEventListener(ADDON_FOCUS_EVENT, onFocusEvent);
    return () => {
      window.removeEventListener("hashchange", applyFromHash);
      window.removeEventListener(ADDON_FOCUS_EVENT, onFocusEvent);
    };
  }, [toggleHighlight, scrollToAddon, pathname]);

  return { highlighted, toggleHighlight };
}
