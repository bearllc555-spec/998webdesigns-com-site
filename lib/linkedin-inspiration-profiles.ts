import {
  LINKEDIN_INSPIRATION_PROFILES,
  type LinkedInInspirationProfile as LinkedInInspirationProfileSeed,
} from "@/data/linkedin-inspiration";

export type LinkedInInspirationProfile = LinkedInInspirationProfileSeed & {
  id: string;
};

export const LINKEDIN_INSPIRATION_STORAGE_KEY = "998-linkedin-inspiration-profiles-v1";

export function defaultLinkedInInspirationProfiles(): LinkedInInspirationProfile[] {
  return LINKEDIN_INSPIRATION_PROFILES.map((profile) => ({
    ...profile,
    id: profileIdFromHref(profile.href),
  }));
}

export function profileIdFromHref(href: string): string {
  const match = href.trim().match(/linkedin\.com\/in\/([^/?#]+)/i);
  if (match?.[1]) return match[1].toLowerCase();
  return `profile-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeLinkedInHref(href: string): string {
  const trimmed = href.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("linkedin.com/")) return `https://www.${trimmed}`;
  if (trimmed.startsWith("www.linkedin.com/")) return `https://${trimmed}`;
  if (trimmed.startsWith("/in/")) return `https://www.linkedin.com${trimmed}`;
  return `https://www.linkedin.com/in/${trimmed.replace(/^\/+/, "")}`;
}

export type ProfileFormValues = {
  name: string;
  href: string;
  summary: string;
};

export function validateProfileForm(
  values: ProfileFormValues
): { ok: true; data: ProfileFormValues } | { ok: false; error: string } {
  const name = values.name.trim();
  const href = normalizeLinkedInHref(values.href);
  const summary = values.summary.trim();

  if (!name) return { ok: false, error: "Name is required." };
  if (!href) return { ok: false, error: "LinkedIn URL is required." };
  if (!/linkedin\.com\/in\//i.test(href)) {
    return { ok: false, error: "Use a LinkedIn profile URL (linkedin.com/in/…)." };
  }
  if (!summary) return { ok: false, error: "Summary is required." };

  return { ok: true, data: { name, href, summary } };
}

function withIds(profiles: LinkedInInspirationProfile[]): LinkedInInspirationProfile[] {
  const seen = new Set<string>();
  return profiles.map((profile) => {
    let id = profile.id?.trim() || profileIdFromHref(profile.href);
    while (seen.has(id)) id = `${id}-${seen.size}`;
    seen.add(id);
    return { ...profile, id };
  });
}

export function parseStoredProfiles(raw: unknown): LinkedInInspirationProfile[] | null {
  if (!Array.isArray(raw)) return null;
  const parsed: LinkedInInspirationProfile[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const href =
      typeof row.href === "string" ? normalizeLinkedInHref(row.href) : "";
    const summary = typeof row.summary === "string" ? row.summary.trim() : "";
    if (!name || !href || !summary) continue;
    parsed.push({
      id: typeof row.id === "string" ? row.id : profileIdFromHref(href),
      name,
      href,
      summary,
    });
  }
  return parsed.length ? withIds(parsed) : null;
}

export function loadLinkedInInspirationProfiles(): LinkedInInspirationProfile[] {
  if (typeof window === "undefined") return defaultLinkedInInspirationProfiles();
  try {
    const raw = window.localStorage.getItem(LINKEDIN_INSPIRATION_STORAGE_KEY);
    if (!raw) return defaultLinkedInInspirationProfiles();
    const parsed = parseStoredProfiles(JSON.parse(raw) as unknown);
    return parsed ?? defaultLinkedInInspirationProfiles();
  } catch {
    return defaultLinkedInInspirationProfiles();
  }
}

export function saveLinkedInInspirationProfiles(
  profiles: LinkedInInspirationProfile[]
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LINKEDIN_INSPIRATION_STORAGE_KEY,
    JSON.stringify(withIds(profiles))
  );
}

export function clearLinkedInInspirationProfiles(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LINKEDIN_INSPIRATION_STORAGE_KEY);
}
