/**
 * Mark baseline migration as applied on helmet (brownfield DB).
 * Uses slatepress/.local/supabase-helmet-db-password.txt
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const REF = "xwldbxburzqryxlzocck";
const VERSION = "20260604140000";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceLocal = path.resolve(__dirname, "..", "..", "..", ".local");

function readPassword() {
  const p = path.join(workspaceLocal, "supabase-helmet-db-password.txt");
  const text = fs.readFileSync(p, "utf8");
  const line = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#"));
  if (!line) throw new Error("No password in supabase-helmet-db-password.txt");
  return line;
}

const configs = (password) => [
  {
    host: "aws-1-us-east-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    user: `postgres.${REF}`,
    password,
    ssl: { rejectUnauthorized: false },
  },
  {
    host: "aws-1-us-east-1.pooler.supabase.com",
    port: 5432,
    database: "postgres",
    user: `postgres.${REF}`,
    password,
    ssl: { rejectUnauthorized: false },
  },
];

const sql = `
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text
);
insert into supabase_migrations.schema_migrations (version, name)
values ($1, 'baseline_998_schema')
on conflict (version) do nothing;
`;

async function main() {
  const password = readPassword();
  let lastErr;
  for (const config of configs(password)) {
    const client = new pg.Client(config);
    try {
      await client.connect();
      await client.query(sql, [VERSION]);
      const check = await client.query(
        "select version from supabase_migrations.schema_migrations where version = $1",
        [VERSION]
      );
      console.log(
        check.rowCount
          ? `OK — migration ${VERSION} recorded (via ${config.host})`
          : "FAIL — row not found after insert"
      );
      await client.end();
      process.exit(check.rowCount ? 0 : 1);
    } catch (err) {
      lastErr = err;
      await client.end().catch(() => undefined);
    }
  }
  console.error(lastErr?.message ?? "connect failed");
  process.exit(1);
}

main();
