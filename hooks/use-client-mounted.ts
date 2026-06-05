"use client";

import { useSyncExternalStore } from "react";

let mounted = false;
let listenerCount = 0;

function subscribe(onStoreChange: () => void) {
  listenerCount += 1;
  if (!mounted) {
    mounted = true;
    onStoreChange();
  }
  return () => {
    listenerCount -= 1;
    if (listenerCount === 0) mounted = false;
  };
}

function getSnapshot(): boolean {
  return mounted;
}

function getServerSnapshot(): boolean {
  return false;
}

/** True only after the client has mounted (safe for theme / browser-only UI). */
export function useClientMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
