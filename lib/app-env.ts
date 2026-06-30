/** Platform-agnostic deploy environment (Vercel, Cloudflare Pages, local). */

export type AppEnvLabel = "production" | "preview" | "development" | "local";

function appEnvFromCustom(): AppEnvLabel | null {
  const custom = process.env.APP_ENV?.trim().toLowerCase();
  if (custom === "production" || custom === "preview" || custom === "development") {
    return custom;
  }
  return null;
}

/** Resolved runtime environment for auth, Stripe origins, and ops warnings. */
export function appEnv(): AppEnvLabel {
  const custom = appEnvFromCustom();
  if (custom) return custom;

  if (process.env.CF_PAGES === "1") {
    const branch = process.env.CF_PAGES_BRANCH?.trim() || "";
    return branch === "main" ? "production" : "preview";
  }

  const vercel = process.env.VERCEL_ENV?.trim();
  if (vercel === "production") return "production";
  if (vercel === "preview") return "preview";
  if (vercel === "development") return "development";

  if (process.env.NODE_ENV === "production") return "production";
  return "local";
}

export function isProductionApp(): boolean {
  return appEnv() === "production";
}

export function isPreviewApp(): boolean {
  return appEnv() === "preview";
}

/** Label for env-status and ops dashboards. */
export function hostPlatformLabel(): string {
  if (process.env.CF_PAGES === "1") return "cloudflare-pages";
  if (process.env.VERCEL_ENV) return "vercel";
  return "local";
}
