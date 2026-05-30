import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazy-init the public (anon) Supabase client so undefined env vars at build time
// don't throw during static prerender. The .insert() call at form-submit time
// will fail loudly if env is missing — at which point we get a clear runtime error
// instead of a confusing module-load crash during `next build`.
let _public: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (_public) return _public;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[supabase] Missing env vars - NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return null;
  }
  _public = createClient(url, key);
  return _public;
}

// Legacy export for backwards compatibility - will throw if env vars missing
export const supabasePublic = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error("Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)");
    }
    const value = client[prop as keyof SupabaseClient];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
