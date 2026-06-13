"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ADDON_FOCUS_EVENT,
  ADDON_SELECT_EVENT,
  addonDomId,
  addonValueFromHash,
} from "@/lib/addon-nav";
import { GROWTH_PACK_ID, GROWTH_PACK_MEMBERS } from "@/lib/addons";

function scrollTargetId(value: string): string {
  if (value === GROWTH_PACK_ID) {
    return addonDomId(GROWTH_PACK_MEMBERS[0]);
  }
  return addonDomId(value);
}

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
      document.getElementById(scrollTargetId(value))?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, []);

  const selectHighlight = useCallback(
    (value: string) => {
      setHighlighted(value);
      scrollToAddon(value);
    },
    [scrollToAddon]
  );

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

    const onSelectEvent = (e: Event) => {
      const value = (e as CustomEvent<{ value: string }>).detail?.value;
      if (value) selectHighlight(value);
    };

    applyFromHash();
    const retry = requestAnimationFrame(applyFromHash);

    window.addEventListener("hashchange", applyFromHash);
    window.addEventListener("popstate", applyFromHash);
    window.addEventListener(ADDON_FOCUS_EVENT, onFocusEvent);
    window.addEventListener(ADDON_SELECT_EVENT, onSelectEvent);
    return () => {
      cancelAnimationFrame(retry);
      window.removeEventListener("hashchange", applyFromHash);
      window.removeEventListener("popstate", applyFromHash);
      window.removeEventListener(ADDON_FOCUS_EVENT, onFocusEvent);
      window.removeEventListener(ADDON_SELECT_EVENT, onSelectEvent);
    };
  }, [toggleHighlight, selectHighlight, scrollToAddon, pathname]);

  return { highlighted, toggleHighlight };
}
