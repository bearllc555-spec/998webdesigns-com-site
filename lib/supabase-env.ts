/** Resolve Supabase env (Vercel integration + legacy names). */

function trim(v: string | undefined): string {
  return v?.trim() ?? "";
}

function urlFromPostgresHost(host: string): string | null {
  const m = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
  if (!m) return null;
  return `https://${m[1]}.supabase.co`;
}

export function resolveSupabaseUrl(): string {
  const direct = trim(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  );
  if (direct) return direct;

  const host = trim(process.env.POSTGRES_HOST);
  if (host) {
    const derived = urlFromPostgresHost(host);
    if (derived) return derived;
  }

  return "";
}

export function resolveSupabaseAnonKey(): string {
  return trim(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_ANON_KEY
  );
}

export function resolveSupabaseServiceRoleKey(): string {
  return trim(
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  );
}
