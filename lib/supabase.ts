import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  resolveSupabaseAnonKey,
  resolveSupabaseServiceRoleKey,
  resolveSupabaseUrl,
} from "@/lib/supabase-env";

// Server-side client used by API routes. Uses the secret key.
// Never import this from a Client Component.
export function supabaseAdmin(): SupabaseClient | null {
  const url = resolveSupabaseUrl();
  const key = resolveSupabaseServiceRoleKey();

  if (!url || !key) {
    console.warn(
      "[supabase] Missing project URL or service role key (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY or Vercel integration vars)"
    );
    return null;
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

// Public client (anon) for any future Client Component reads.
// Returns null if env vars are not configured.
export function supabasePublic(): SupabaseClient | null {
  const url = resolveSupabaseUrl();
  const key = resolveSupabaseAnonKey();

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}
