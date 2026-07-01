/**
 * Apply scorecard internal_intel migration to Supabase helmet (local — not via production API).
 *
 * Usage:
 *   npm run scorecard:migrate-intel
 *
 * Credentials (first match wins):
 *   DATABASE_URL or SUPABASE_DB_URL env
 *   slatepress/.local/supabase-helmet-db-password.txt  (password or postgresql:// URI)
 *   slatepress/.local/supabase-998-helmet-notes.txt
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const REF = "xwldbxburzqryxlzocck";
const SQL_EDITOR = `https://supabase.com/dashboard/project/${REF}/sql/new`;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const workspaceLocal = path.resolve(repoRoot, "..", "..", ".local");
const migrationPath = path.join(
  repoRoot,
  "supabase",
  "migrations",
  "20260701180000_scorecard_internal_intel.sql"
);

function readPasswordFile() {
  const candidates = [
    path.join(workspaceLocal, "supabase-helmet-db-password.txt"),
    path.join(workspaceLocal, "supabase-998-helmet-notes.txt"),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, "utf8");
    const uri = text.match(/postgres(?:ql)?:\/\/[^\s#]+/i)?.[0];
    if (uri) return { mode: "uri", value: uri, from: p };
    const line = text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#") && !l.startsWith("http") && !l.startsWith("sb_"));
    if (line) return { mode: "password", value: line, from: p };
  }
  return null;
}

const POOLER_HOSTS = ["aws-1-us-east-1.pooler.supabase.com"];

function buildConfigs(cred) {
  if (cred.mode === "uri") {
    const connectionString = cred.value
      .replace(/[?&]sslmode=[^&]*/gi, "")
      .replace(/\?$/, "");
    return [{ connectionString, ssl: { rejectUnauthorized: false } }];
  }
  const password = cred.value;
  const configs = [
    {
      host: `db.${REF}.supabase.co`,
      port: 5432,
      database: "postgres",
      user: "postgres",
      password,
      ssl: { rejectUnauthorized: false },
    },
  ];
  for (const host of POOLER_HOSTS) {
    configs.push({
      host,
      port: 5432,
      database: "postgres",
      user: `postgres.${REF}`,
      password,
      ssl: { rejectUnauthorized: false },
    });
  }
  return configs;
}

function printSqlEditorFallback() {
  console.error(
    "\nPassword auth failed or DB unreachable. Fastest fix — paste SQL in Supabase:\n" +
      `  ${SQL_EDITOR}\n\n` +
      `  File: supabase/migrations/20260701180000_scorecard_internal_intel.sql\n\n` +
      "Or refresh the DB password:\n" +
      "  Supabase -> helmet (998) -> Project Settings -> Database -> Database password\n" +
      "  Save the Session pooler URI (postgresql://...) to:\n" +
      `  ${path.join(workspaceLocal, "supabase-helmet-db-password.txt")}\n` +
      "  Then re-run: npm run scorecard:migrate-intel\n"
  );
}

async function main() {
  const cred =
    process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
      ? {
          mode: "uri",
          value: (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL).trim(),
          from: "env",
        }
      : readPasswordFile();

  if (!cred) {
    console.error("Missing DB credentials in .local/ or DATABASE_URL");
    printSqlEditorFallback();
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, "utf8");
  const configs = buildConfigs(cred);
  let lastErr;
  for (const config of configs) {
    const client = new pg.Client(config);
    try {
      await client.connect();
      await client.query(sql);
      const col = await client.query(`
        select column_name from information_schema.columns
        where table_schema = 'public'
          and table_name = 'scorecard_reports'
          and column_name = 'internal_intel'`);
      console.log("OK internal_intel column:", col.rows.length > 0 ? "present" : "missing");
      console.log("via", config.host ?? "uri", `(cred: ${path.basename(cred.from ?? "")})`);
      await client.end();
      return;
    } catch (err) {
      lastErr = err;
      await client.end().catch(() => undefined);
    }
  }
  console.error(lastErr?.message ?? "Migration failed");
  printSqlEditorFallback();
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message || err);
  printSqlEditorFallback();
  process.exit(1);
});
