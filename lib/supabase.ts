import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side client used by API routes. Uses the secret key.
// Never import this from a Client Component.
export function supabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    console.warn("[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return null;
  }
  
  return createClient(url, key, { auth: { persistSession: false } });
}

// Public client (anon) for any future Client Component reads.
// Returns null if env vars are not configured.
export function supabasePublic(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    return null;
  }
  
  return createClient(url, key);
}
