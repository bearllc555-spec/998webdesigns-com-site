import fs from "fs";
import path from "path";
import pg from "pg";

const MIGRATION_SQL = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260606240000_inbound_sms_wd_lead_id.sql"),
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

export async function runInboundSmsWdLeadMigration(): Promise<
  { ok: true; via: string } | { ok: false; detail: string }
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
        `select column_name from information_schema.columns where table_schema = 'public' and table_name = 'inbound_sms' and column_name = 'wd_lead_id'`
      );
      await client.end();
      if (!check.rowCount) {
        return { ok: false, detail: `Migration ran on ${via} but inbound_sms.wd_lead_id not found` };
      }
      return { ok: true, via };
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      await client.end().catch(() => undefined);
    }
  }

  return { ok: false, detail: lastErr };
}
