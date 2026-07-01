import fs from "fs";
import path from "path";
import pg from "pg";

const MIGRATION_SQL = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260630120000_scorecard.sql"),
  "utf8"
);

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

export async function runScorecardMigration(): Promise<
  { ok: true; via: string; tables: string[]; functions: string[] } | { ok: false; detail: string }
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
      const tables = await client.query(`
        select table_name from information_schema.tables
        where table_schema = 'public'
          and table_name in ('leads','scorecard_reports','scorecard_signals','scorecard_jobs')
        order by 1`);
      const funcs = await client.query(`
        select proname from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and proname in ('get_report_by_token','claim_scorecard_job','set_scorecard_email_status')
        order by 1`);
      await client.end();
      const tableNames = tables.rows.map((r) => r.table_name as string);
      if (tableNames.length < 4) {
        return {
          ok: false,
          detail: `Migration ran on ${via} but expected 4 tables, got: ${tableNames.join(", ")}`,
        };
      }
      return {
        ok: true,
        via,
        tables: tableNames,
        functions: funcs.rows.map((r) => r.proname as string),
      };
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      await client.end().catch(() => undefined);
    }
  }

  return { ok: false, detail: lastErr };
}
