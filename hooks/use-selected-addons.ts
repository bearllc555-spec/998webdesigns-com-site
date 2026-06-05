"use client";

import { useSyncExternalStore } from "react";
import { getSelectedAddons } from "@/lib/addons";

function subscribeSelectedAddons(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener("addons-updated", handler);
  return () => window.removeEventListener("addons-updated", handler);
}

/** Client-only selected add-ons from localStorage + addons-updated events. */
export function useSelectedAddons(): string[] {
  return useSyncExternalStore(subscribeSelectedAddons, getSelectedAddons, () => []);
}
