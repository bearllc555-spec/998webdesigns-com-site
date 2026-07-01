/**
 * Apply supabase/migrations/20260702120000_scorecard_crm.sql to helmet.
 * Password: slatepress/.local/supabase-helmet-db-password.txt
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const REF = "xwldbxburzqryxlzocck";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const workspaceLocal = path.resolve(repoRoot, "..", "..", ".local");
const migrationPath = path.join(
  repoRoot,
  "supabase",
  "migrations",
  "20260702120000_scorecard_crm.sql"
);

function readPassword() {
  const p = path.join(workspaceLocal, "supabase-helmet-db-password.txt");
  if (!fs.existsSync(p)) return null;
  const text = fs.readFileSync(p, "utf8");
  const uri = text.match(/postgres(?:ql)?:\/\/[^\s#]+/i)?.[0];
  if (uri) return { mode: "uri", value: uri };
  const line = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#") && !l.startsWith("http"));
  return line ? { mode: "password", value: line } : null;
}

function buildConfigs(cred) {
  if (cred.mode === "uri") {
    return [
      {
        connectionString: cred.value.replace(/[?&]sslmode=[^&]*/gi, "").replace(/\?$/, ""),
        ssl: { rejectUnauthorized: false },
      },
    ];
  }
  const password = cred.value;
  return [
    {
      host: `db.${REF}.supabase.co`,
      port: 5432,
      database: "postgres",
      user: "postgres",
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
}

async function main() {
  const cred = readPassword();
  if (!cred) {
    console.error("Missing supabase-helmet-db-password.txt");
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, "utf8");
  let lastErr;
  for (const config of buildConfigs(cred)) {
    const client = new pg.Client(config);
    try {
      await client.connect();
      await client.query(sql);
      const cols = await client.query(`
        select table_name, column_name from information_schema.columns
        where table_schema = 'public'
          and (
            (table_name = 'leads' and column_name = 'full_name')
            or (table_name = 'scorecard_reports' and column_name in ('read_at', 'inbox_flag'))
          )
        order by 1, 2`);
      console.log(
        "OK columns:",
        cols.rows.map((r) => `${r.table_name}.${r.column_name}`).join(", ")
      );
      console.log("via", config.host ?? "uri");
      await client.end();
      return;
    } catch (err) {
      lastErr = err;
      await client.end().catch(() => undefined);
    }
  }
  console.error(lastErr?.message ?? "Migration failed");
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
