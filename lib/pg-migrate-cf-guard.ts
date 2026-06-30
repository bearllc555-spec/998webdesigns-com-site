import { hostPlatformLabel } from "@/lib/app-env";

/** Postgres DDL migrate helpers are local/Vercel ops only — not on Cloudflare Workers. */
export function pgMigrateSupported(): boolean {
  return hostPlatformLabel() !== "cloudflare-pages";
}

export function pgMigrateUnsupportedResponse(): Response {
  return Response.json(
    {
      ok: false,
      error:
        "Postgres migrate routes are disabled on Cloudflare Workers. Run scripts/apply-*.mjs locally or use Supabase SQL editor.",
    },
    { status: 503 }
  );
}
