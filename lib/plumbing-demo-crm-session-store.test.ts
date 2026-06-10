import { describe, expect, it, beforeEach, vi } from "vitest";
import { getPlumbingDemoCrmSeedItems } from "@/lib/plumbing-demo-crm-seed";
import {
  applyPlumbingDemoCrmSessionPatches,
  clearPlumbingDemoCrmSessionStore,
  PLUMBING_DEMO_CRM_SESSION_STORE_KEY,
  savePlumbingDemoCrmItemPatch,
} from "@/lib/plumbing-demo-crm-session-store";
import { isCrmFeedItemUnread } from "@/lib/crm-feed";

function mockSessionStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });
}

describe("plumbing-demo-crm-seed", () => {
  it("starts every card unread", () => {
    const items = getPlumbingDemoCrmSeedItems();
    expect(items.length).toBeGreaterThan(0);
    expect(items.every(isCrmFeedItemUnread)).toBe(true);
  });
});

describe("plumbing-demo-crm-session-store", () => {
  beforeEach(() => {
    mockSessionStorage();
  });

  it("applies read patches until store is cleared", () => {
    const item = getPlumbingDemoCrmSeedItems()[0]!;
    savePlumbingDemoCrmItemPatch(item, { readAt: "2026-06-08T12:00:00.000Z" });
    const patched = applyPlumbingDemoCrmSessionPatches(getPlumbingDemoCrmSeedItems());
    const row = patched.find((i) => i.id === item.id && i.source === item.source);
    expect(row?.readAt).toBe("2026-06-08T12:00:00.000Z");
    clearPlumbingDemoCrmSessionStore();
    expect(sessionStorage.getItem(PLUMBING_DEMO_CRM_SESSION_STORE_KEY)).toBeNull();
    const reset = applyPlumbingDemoCrmSessionPatches(getPlumbingDemoCrmSeedItems());
    expect(reset.every(isCrmFeedItemUnread)).toBe(true);
  });
});
