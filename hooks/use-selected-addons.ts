"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "selected_addons";

/** Stable empty snapshot for SSR + initial hydration (must not allocate per call). */
const EMPTY_ADDONS: string[] = [];

let snapshot: string[] = EMPTY_ADDONS;

function parseStorage(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || !parsed.every((v) => typeof v === "string")) {
      return EMPTY_ADDONS;
    }
    return parsed.length === 0 ? EMPTY_ADDONS : parsed;
  } catch {
    return EMPTY_ADDONS;
  }
}

function addonsEqual(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function readFromStorage(): string[] {
  if (typeof window === "undefined") return EMPTY_ADDONS;
  return parseStorage(localStorage.getItem(STORAGE_KEY) ?? "[]");
}

function updateSnapshot(next: string[]): boolean {
  const normalized = next.length === 0 ? EMPTY_ADDONS : next;
  if (addonsEqual(normalized, snapshot)) return false;
  snapshot = normalized;
  return true;
}

function getSnapshot(): string[] {
  return snapshot;
}

function getServerSnapshot(): string[] {
  return EMPTY_ADDONS;
}

function subscribeSelectedAddons(onStoreChange: () => void) {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<string[]>).detail;
    if (Array.isArray(detail)) {
      if (updateSnapshot(detail)) onStoreChange();
      return;
    }
    if (updateSnapshot(readFromStorage())) onStoreChange();
  };

  window.addEventListener("addons-updated", handler);
  if (updateSnapshot(readFromStorage())) onStoreChange();

  return () => window.removeEventListener("addons-updated", handler);
}

/** Client-only selected add-ons; hydrates from localStorage after mount. */
export function useSelectedAddons(): string[] {
  return useSyncExternalStore(
    subscribeSelectedAddons,
    getSnapshot,
    getServerSnapshot
  );
}
