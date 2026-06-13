export const ADDON_FOCUS_EVENT = "addon-focus";
export const NAV_CLOSE_EVENT = "nav-close";

export function dispatchNavClose(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NAV_CLOSE_EVENT));
}

export function addonDomId(value: string): string {
  return `addon-${value}`;
}

export function addonNavHref(value: string): string {
  return `/#${addonDomId(value)}`;
}

/** Parse location hash into an add-on value, or null. */
export function addonValueFromHash(hash: string): string | null {
  const id = hash.replace(/^#/, "");
  if (!id.startsWith("addon-")) return null;
  const value = id.slice("addon-".length);
  if (!value) return null;
  return value;
}

export function dispatchAddonFocus(value: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADDON_FOCUS_EVENT, { detail: { value } }));
}
