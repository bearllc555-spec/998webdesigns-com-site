import fs from "fs";
import path from "path";
import pg from "pg";

const MIGRATION_SQL = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260612120000_public_rls_security_hardening.sql"),
  "utf8"
);

const TABLES = [
  "wd_leads",
  "api_rate_limits",
  "contact_submissions",
  "crm_telegram_settings",
  "processed_stripe_events",
  "discovery_prospects",
  "inbound_sms",
  "blog_posts",
  "voice_demo_leads",
  "jarvis_plumbing_jobs",
] as const;

function postgresConfigs(): pg.ClientConfig[] {
  const configs: pg.ClientConfig[] = [];
  const nonPooling = process.env.POSTGRES_URL_NON_POOLING?.trim();
  if (nonPooling) {
    const connectionString = nonPooling
      .replace(/[?&]sslmode=[^&]*/gi, "")
      .replace(/\?$/, "");
    configs.push({ connectionString, ssl: { rejectUnauthorized: false } });
  }

  const host = process.env.POSTGRES_HOST?.trim();
  const password = process.env.POSTGRES_PASSWORD?.trim();
  if (host && password) {
    configs.push({
      host,
      port: Number(process.env.POSTGRES_PORT ?? "5432"),
      database: process.env.POSTGRES_DATABASE?.trim() || "postgres",
      user: process.env.POSTGRES_USER?.trim() || "postgres",
      password,
      ssl: { rejectUnauthorized: false },
    });
  }

  return configs;
}

export async function runRlsSecurityMigration(): Promise<
  { ok: true; via: string; tables: string[] } | { ok: false; detail: string }
> {
  const configs = postgresConfigs();
  if (!configs.length) {
    return {
      ok: false,
      detail: "POSTGRES_URL_NON_POOLING or POSTGRES_HOST not configured on server",
    };
  }

  let lastErr = "unknown";
  for (const config of configs) {
    const client = new pg.Client(config);
    const via = config.host ?? "connection-string";
    try {
      await client.connect();
      await client.query(MIGRATION_SQL);
      const check = await client.query(
        `select c.relname as table_name, c.relrowsecurity as rls_enabled,
                (select count(*)::int from pg_policies p
                 where p.tablename = c.relname and p.schemaname = 'public'
                   and p.policyname = 'block_anon_authenticated') as has_deny_policy
         from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public'
           and c.relkind = 'r'
           and c.relname = any($1::text[])
         order by 1`,
        [TABLES]
      );
      await client.end();

      const rows = check.rows as { table_name: string; rls_enabled: boolean; has_deny_policy: number }[];
      const missing = rows.filter((r) => !r.rls_enabled || r.has_deny_policy === 0);
      if (missing.length) {
        return {
          ok: false,
          detail: `Migration ran on ${via} but incomplete: ${missing.map((r) => r.table_name).join(", ")}`,
        };
      }

      return { ok: true, via, tables: rows.map((r) => r.table_name) };
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      await client.end().catch(() => undefined);
    }
  }

  return { ok: false, detail: lastErr };
}
