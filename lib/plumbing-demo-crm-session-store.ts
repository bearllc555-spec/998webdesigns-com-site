import type { CrmFeedItem } from "@/lib/crm-feed";
import type { CrmInboxFlag } from "@/lib/crm-inbox-flag";

/** sessionStorage — cleared on demo CRM logout and login so inbox resets to seed defaults. */
export const PLUMBING_DEMO_CRM_SESSION_STORE_KEY = "plumbing-demo-crm-session-v1";
export const PLUMBING_DEMO_CRM_HIDDEN_STORE_KEY = "plumbing-demo-crm-hidden-v1";

export type PlumbingDemoCrmItemPatch = {
  readAt?: string | null;
  inboxFlag?: CrmInboxFlag | null;
  notes?: string | null;
};

export function plumbingDemoCrmItemKey(item: Pick<CrmFeedItem, "source" | "id">): string {
  return `${item.source}:${item.id}`;
}

function hasDemoCrmSessionStorage(): boolean {
  return typeof sessionStorage !== "undefined";
}

function readStore(): Record<string, PlumbingDemoCrmItemPatch> {
  if (!hasDemoCrmSessionStorage()) return {};
  try {
    const raw = sessionStorage.getItem(PLUMBING_DEMO_CRM_SESSION_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, PlumbingDemoCrmItemPatch>;
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, PlumbingDemoCrmItemPatch>): void {
  if (!hasDemoCrmSessionStorage()) return;
  if (Object.keys(store).length === 0) {
    sessionStorage.removeItem(PLUMBING_DEMO_CRM_SESSION_STORE_KEY);
    return;
  }
  sessionStorage.setItem(PLUMBING_DEMO_CRM_SESSION_STORE_KEY, JSON.stringify(store));
}

function readHiddenKeys(): Set<string> {
  if (!hasDemoCrmSessionStorage()) return new Set();
  try {
    const raw = sessionStorage.getItem(PLUMBING_DEMO_CRM_HIDDEN_STORE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((k): k is string => typeof k === "string"));
  } catch {
    return new Set();
  }
}

function writeHiddenKeys(keys: Set<string>): void {
  if (!hasDemoCrmSessionStorage()) return;
  if (keys.size === 0) {
    sessionStorage.removeItem(PLUMBING_DEMO_CRM_HIDDEN_STORE_KEY);
    return;
  }
  sessionStorage.setItem(PLUMBING_DEMO_CRM_HIDDEN_STORE_KEY, JSON.stringify([...keys]));
}

export function hidePlumbingDemoCrmItem(item: Pick<CrmFeedItem, "source" | "id">): void {
  const key = plumbingDemoCrmItemKey(item);
  const hidden = readHiddenKeys();
  hidden.add(key);
  writeHiddenKeys(hidden);
}

export function clearPlumbingDemoCrmSessionStore(): void {
  if (!hasDemoCrmSessionStorage()) return;
  sessionStorage.removeItem(PLUMBING_DEMO_CRM_SESSION_STORE_KEY);
  sessionStorage.removeItem(PLUMBING_DEMO_CRM_HIDDEN_STORE_KEY);
}

export function applyPlumbingDemoCrmSessionPatches(items: CrmFeedItem[]): CrmFeedItem[] {
  const hidden = readHiddenKeys();
  const filtered =
    hidden.size === 0
      ? items
      : items.filter((item) => !hidden.has(plumbingDemoCrmItemKey(item)));
  const store = readStore();
  if (Object.keys(store).length === 0) return filtered;
  return filtered.map((item) => {
    const patch = store[plumbingDemoCrmItemKey(item)];
    if (!patch) return item;
    return {
      ...item,
      ...(patch.readAt !== undefined ? { readAt: patch.readAt } : {}),
      ...(patch.inboxFlag !== undefined ? { inboxFlag: patch.inboxFlag } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
    };
  });
}

export function savePlumbingDemoCrmItemPatch(
  item: Pick<CrmFeedItem, "source" | "id">,
  patch: PlumbingDemoCrmItemPatch
): void {
  const key = plumbingDemoCrmItemKey(item);
  const store = readStore();
  store[key] = { ...store[key], ...patch };
  writeStore(store);
}
