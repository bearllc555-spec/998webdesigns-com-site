// lib/addons.ts

const STORAGE_KEY = "selected_addons";

export const GROWTH_PACK_ID = "growth-pack";

export const GROWTH_PACK_MEMBERS = [
  "hyper-local-seo",
  "google-profile",
  "blog-writing",
] as const;

export type GrowthPackMember = (typeof GROWTH_PACK_MEMBERS)[number];

export function getSelectedAddons(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function persist(updated: string[]): string[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("addons-updated", { detail: updated })
    );
  }
  return updated;
}

export function hasGrowthPack(selected: string[]): boolean {
  return selected.includes(GROWTH_PACK_ID);
}

export function isGrowthPackMember(value: string): value is GrowthPackMember {
  return (GROWTH_PACK_MEMBERS as readonly string[]).includes(value);
}

/** Card / checkbox highlight: direct selection or included via Growth Pack. */
export function isAddonVisuallySelected(
  value: string,
  selected: string[]
): boolean {
  if (selected.includes(value)) return true;
  return hasGrowthPack(selected) && isGrowthPackMember(value);
}

export function toggleAddon(value: string): string[] {
  const current = getSelectedAddons();

  if (value === GROWTH_PACK_ID) {
    if (current.includes(GROWTH_PACK_ID)) {
      return persist(current.filter((v) => v !== GROWTH_PACK_ID));
    }
    const updated = [
      ...current.filter((v) => !isGrowthPackMember(v)),
      GROWTH_PACK_ID,
    ];
    return persist(updated);
  }

  if (current.includes(value)) {
    return persist(current.filter((v) => v !== value));
  }

  if (isGrowthPackMember(value) && hasGrowthPack(current)) {
    return persist(current.filter((v) => v !== GROWTH_PACK_ID));
  }

  if (isGrowthPackMember(value)) {
    return persist([
      ...current.filter((v) => v !== GROWTH_PACK_ID),
      value,
    ]);
  }

  return persist([...current, value]);
}

export function setSelectedAddons(addons: string[]): string[] {
  return persist([...addons]);
}

export function clearAddons(): void {
  localStorage.removeItem(STORAGE_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("addons-updated", { detail: [] }));
  }
}
