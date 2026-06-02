// lib/addons.ts

const STORAGE_KEY = "selected_addons";

export function getSelectedAddons(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function toggleAddon(value: string): string[] {
  const current = getSelectedAddons();
  const updated = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("addons-updated", { detail: updated })
    );
  }
  return updated;
}

export function clearAddons(): void {
  localStorage.removeItem(STORAGE_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("addons-updated", { detail: [] }));
  }
}
