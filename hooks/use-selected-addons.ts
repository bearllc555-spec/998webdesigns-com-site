"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "selected_addons";

/** Stable empty snapshot for SSR + getServerSnapshot (must not allocate per call). */
const EMPTY_ADDONS: string[] = [];

let cachedRaw = "";
let cachedAddons: string[] = EMPTY_ADDONS;

function readSelectedAddons(): string[] {
  if (typeof window === "undefined") return EMPTY_ADDONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? "[]";
    if (raw === cachedRaw) return cachedAddons;
    cachedRaw = raw;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || !parsed.every((v) => typeof v === "string")) {
      cachedAddons = EMPTY_ADDONS;
      return cachedAddons;
    }
    cachedAddons = parsed;
    return cachedAddons;
  } catch {
    cachedRaw = "";
    cachedAddons = EMPTY_ADDONS;
    return cachedAddons;
  }
}

function getServerSnapshot(): string[] {
  return EMPTY_ADDONS;
}

function subscribeSelectedAddons(onStoreChange: () => void) {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<string[]>).detail;
    if (Array.isArray(detail)) {
      cachedRaw = JSON.stringify(detail);
      cachedAddons = detail;
    } else {
      cachedRaw = "";
      cachedAddons = EMPTY_ADDONS;
    }
    onStoreChange();
  };
  window.addEventListener("addons-updated", handler);
  return () => window.removeEventListener("addons-updated", handler);
}

/** Client-only selected add-ons from localStorage + addons-updated events. */
export function useSelectedAddons(): string[] {
  return useSyncExternalStore(
    subscribeSelectedAddons,
    readSelectedAddons,
    getServerSnapshot
  );
}
