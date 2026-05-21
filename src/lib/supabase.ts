import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazy-init the public (anon) Supabase client so undefined env vars at build time
// don't throw during static prerender. The .insert() call at form-submit time
// will fail loudly if env is missing — at which point we get a clear runtime error
// instead of a confusing module-load crash during `next build`.
let _public: SupabaseClient | null = null;
function getPublic(): SupabaseClient {
  if (_public) return _public;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  }
  _public = createClient(url, key);
  return _public;
}

// Proxy defers init until first method access. Lets `import { supabasePublic } from ...`
// happen at module load with no env-var requirement.
export const supabasePublic = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getPublic();
    const value = client[prop as keyof SupabaseClient];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
