// lib/addons.ts

const STORAGE_KEY = "selected_addons";

export const GROWTH_PACK_ID = "growth-pack";

export const GROWTH_PACK_MEMBERS = [
  "hyper-local-seo",
  "google-profile",
  "blog-writing",
] as const;

export type GrowthPackMember = (typeof GROWTH_PACK_MEMBERS)[number];

/** Shared with LeadForm step 4 and CRM discovery close panel. */
export const ADDON_OPTIONS = [
  {
    id: "addon-chatbot",
    value: "ai-chatbot",
    label: "AI Agent Chatbot",
    pricing: "$299 setup · $79/mo",
  },
  {
    id: "addon-jarvis-voice",
    value: "jarvis-voice",
    label: "Jarvis AI Voice Chatbot",
    pricing: "$499 setup · $149/mo",
  },
  {
    id: "addon-receptionist",
    value: "ai-receptionist",
    label: "AI Receptionist",
    pricing: "$399 setup · $149/mo",
  },
  {
    id: "addon-social",
    value: "social-media",
    label: "Social Media Management",
    pricing: "$199 setup · $299/mo",
  },
  { id: "addon-email-sms", value: "email-sms", label: "Email & SMS", pricing: "$149 setup · $149/mo" },
  {
    id: "addon-blog",
    value: "blog-writing",
    label: "Blog Writing & Local Posts",
    pricing: "$199 setup · $199/mo",
  },
  {
    id: "addon-seo",
    value: "hyper-local-seo",
    label: "Hyper-Local SEO",
    pricing: "$299 setup · $249/mo",
  },
  {
    id: "addon-gmb",
    value: "google-profile",
    label: "Google Profile Optimization",
    pricing: "$149 setup · $79/mo",
  },
  {
    id: "addon-booking",
    value: "booking-calendar",
    label: "Booking Calendar",
    pricing: "$99 setup · $29/mo",
  },
] as const;

/** Primary nav Add-ons hover menu (desktop) and expandable list (mobile). */
export const NAV_ADDON_MENU_ITEMS = [
  ...ADDON_OPTIONS.map((addon) => ({ label: addon.label, value: addon.value })),
  { label: "Growth Pack", value: GROWTH_PACK_ID },
] as const;

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

/** Pure toggle for in-memory selection (CRM close panel, tests). */
export function toggleAddonSelection(current: string[], value: string): string[] {
  if (value === GROWTH_PACK_ID) {
    if (current.includes(GROWTH_PACK_ID)) {
      return current.filter((v) => v !== GROWTH_PACK_ID);
    }
    return [...current.filter((v) => !isGrowthPackMember(v)), GROWTH_PACK_ID];
  }

  if (current.includes(value)) {
    return current.filter((v) => v !== value);
  }

  if (isGrowthPackMember(value) && hasGrowthPack(current)) {
    return current.filter((v) => v !== GROWTH_PACK_ID);
  }

  if (isGrowthPackMember(value)) {
    return [...current.filter((v) => v !== GROWTH_PACK_ID), value];
  }

  return [...current, value];
}

export function toggleAddon(value: string): string[] {
  return persist(toggleAddonSelection(getSelectedAddons(), value));
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

export function addonLabelForValue(value: string): string {
  if (value === GROWTH_PACK_ID) return "Growth Pack";
  return ADDON_OPTIONS.find((a) => a.value === value)?.label ?? value;
}

export function formatAddonSummary(addons: string[]): string {
  if (!addons.length) return "None";
  return addons.map(addonLabelForValue).join(", ");
}
