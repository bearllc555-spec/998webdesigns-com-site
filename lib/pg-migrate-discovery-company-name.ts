import fs from "fs";
import path from "path";
import pg from "pg";

const MIGRATION_SQL = fs.readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260619120000_discovery_prospects_company_name.sql",
  ),
  "utf8",
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

export async function runDiscoveryCompanyNameMigration(): Promise<
  { ok: true; via: string } | { ok: false; detail: string }
> {
  const configs = postgresConfigs();
  if (!configs.length) {
    return { ok: false, detail: "POSTGRES_URL_NON_POOLING or POSTGRES_HOST+PASSWORD required" };
  }

  let lastError = "unknown";
  for (const config of configs) {
    const client = new pg.Client(config);
    try {
      await client.connect();
      await client.query(MIGRATION_SQL);
      const probe = await client.query(
        `select column_name from information_schema.columns
         where table_schema = 'public' and table_name = 'discovery_prospects' and column_name = 'company_name'`,
      );
      await client.end();
      if (probe.rowCount === 0) {
        return {
          ok: false,
          detail: `Migration ran on ${config.host ?? "pooler"} but discovery_prospects.company_name not found`,
        };
      }
      return { ok: true, via: config.host ?? "POSTGRES_URL_NON_POOLING" };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }

  return { ok: false, detail: lastError };
}
